// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;

import "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./interfaces.sol";

struct RoyaltyAmount {
  CrossAddress crossAddress;
  uint amount;
}

interface IUniqueRoyaltyHelper {
  function calculate(address collection, uint tokenId, uint sellPrice) external view returns (RoyaltyAmount[] memory);
}


contract Market is OwnableUpgradeable {
    using ERC165Checker for address;

    struct Order {
      uint32 id;
      uint32 collectionId;
      uint32 tokenId;
      uint32 amount;
      uint256 price;
      uint32 currency;
      CrossAddress seller;
    }

    struct Currency {
      bool isAvailable;
      uint32 collectionId;
      uint32 fee;
    }

    uint32 public constant version = 0;
    uint32 public constant buildVersion = 8;
    bytes4 private constant InterfaceId_ERC721 = 0x80ac58cd;
    bytes4 private constant InterfaceId_ERC165 = 0x5755c3f2;
    ICollectionHelpers private constant collectionHelpers = ICollectionHelpers(0x6C4E9fE1AE37a41E93CEE429e8E1881aBdcbb54F);

    mapping(uint32 => bool) blacklist;
    mapping(uint32 => mapping(uint32 => Order)) orders;
    uint32 private idCount;
    uint32 public marketFee;
    uint64 public ctime;
    address public ownerAddress;
    mapping(address => bool) public admins;
    mapping(uint256 => Currency) public availableCurrencies;
    IUniqueRoyaltyHelper private royaltyHelpers;

    event TokenIsUpForSale(uint32 version, Order item);
    event TokenPriceChanged(uint32 version, Order item);
    event TokenRevoke(uint32 version, Order item, uint32 amount);
    event TokenIsApproved(uint32 version, Order item);
    event TokenIsPurchased(
      uint32 version,
      Order item,
      uint32 salesAmount,
      CrossAddress buyer,
      RoyaltyAmount[] royalties
    );

    error InvalidArgument(string info);
    error InvalidMarketFee();
    error SellerIsNotOwner();
    error TokenIsAlreadyOnSale();
    error TokenIsNotApproved();
    error CollectionNotFound();
    error CollectionNotSupportedERC721();
    error OrderNotFound();
    error TooManyAmountRequested();
    error NotEnoughMoneyError();
    error InvalidRoyaltiesError(uint256 totalRoyalty);
    error FailTransferToken(string reason);
    error CollectionInBlacklist();

    modifier onlyAdmin() {
      require(msg.sender == this.owner() || admins[msg.sender], "Only admin can");
      _;
    }

    modifier validCrossAddress(address eth, uint256 sub) {
      if (eth == address(0) && sub == 0) {
        revert InvalidArgument("Ethereum and Substrate addresses cannot be null at the same time");
      }

      if (eth != address(0) && sub != 0) {
        revert InvalidArgument("Ethereum and Substrate addresses cannot be not null at the same time");
      }
      _;
    }

    function validOwner(uint32 collectionId, uint32 tokenId, CrossAddress memory seller) private view {
      IERC721 erc721 = getErc721(collectionId);

      address ethAddress;
      if (seller.eth != address(0)) {
        ethAddress = seller.eth;
      } else {
        ethAddress = payable(address(uint160(seller.sub >> 96)));
      }

      if (erc721.ownerOf(tokenId) != ethAddress || ethAddress != msg.sender) {
        revert SellerIsNotOwner();
      }
    }

    constructor() {}

    function initialize(uint32 fee) public initializer {
      marketFee = fee;
      royaltyHelpers = IUniqueRoyaltyHelper(0x69470426d9618a23EA1cf91ffD6A115E4D8dC8be);

      if (marketFee >= 100) {
        revert InvalidMarketFee();
      }

      idCount = 1;
      availableCurrencies[0] = Currency(true, 0, 0);

      __Ownable_init(msg.sender);
    }

    /**
     * Fallback that allows this contract to receive native token.
     * We need this for self-sponsoring
     */
    fallback() external payable {}

    /**
     * Receive also allows this contract to receive native token.
     * We need this for self-sponsoring
     */
    receive() external payable {}

    function getErc721(uint32 collectionId) private view returns (IERC721) {
        address collectionAddress = collectionHelpers.collectionAddress(
            collectionId
        );

        uint size;
        assembly {
            size := extcodesize(collectionAddress)
        }

        if (size == 0) {
            revert CollectionNotFound();
        }

        if (!collectionAddress.supportsInterface(InterfaceId_ERC721)) {
            revert CollectionNotSupportedERC721();
        }

        return IERC721(collectionAddress);
    }

    /**
     * Set new royalty helper contract address
     *
     * @param royaltyHelpersAddress: royalty helper contract address
     */
    function setRoyaltyHelpers(address royaltyHelpersAddress) public onlyAdmin {
      royaltyHelpers = IUniqueRoyaltyHelper(royaltyHelpersAddress);
    }

    /**
       * Add new currency. Only owner or an existing admin can add currency.
       *
       * @param collectionId: Fungible collection id
       * @param fee: Fee value for this collection
       */
    function addCurrency(uint32 collectionId, uint32 fee) public onlyAdmin {
      availableCurrencies[collectionId] = Currency(true, collectionId, fee);
    }

    /**
     * Remove currency. Only owner or an existing admin can remove currency.
     *
     * @param collectionId: Fungible collection id
     */
    function removeCurrency(uint32 collectionId) public onlyAdmin {
      delete availableCurrencies[collectionId];
    }

    /**
     * Get currency
     *
     * @param collectionId: Fungible collection id
     */
    function getCurrency(uint32 collectionId) external view returns (Currency memory) {
      return availableCurrencies[collectionId];
    }


    /**
     * Add new admin. Only owner or an existing admin can add admins.
     *
     * @param admin: Address of a new admin to add
     */
    function addAdmin(address admin) public onlyAdmin {
      admins[admin] = true;
    }

    /**
     * Remove an admin. Only owner or an existing admin can remove admins.
     *
     * @param admin: Address of a new admin to add
     */
    function removeAdmin(address admin) public onlyAdmin {
      delete admins[admin];
    }

    /**
     * Add collection to blacklist. Only owner or an existing admin can this.
     *
     * @param collectionId: ID of collection
     */
    function addToBlacklist(uint32 collectionId) public onlyAdmin {
      blacklist[collectionId] = true;
    }

    /**
     * Remove collection from blacklist. Only owner or an existing admin can this.
     *
     * @param collectionId: ID of collection
     */
    function removeFromBlacklist(uint32 collectionId) public onlyAdmin {
        delete blacklist[collectionId];
    }

    /**
     * Place an NFT or RFT token for sale. It must be pre-approved for transfers by this contract address.
     *
     * @param collectionId: ID of the token collection
     * @param tokenId: ID of the token
     * @param price: Price (with proper network currency decimals)
     * @param amount: Number of token fractions to list (must always be 1 for NFT)
     * @param seller: The seller cross-address (the beneficiary account to receive payment, may be different from transaction sender)
     */
    function put(
        uint32 collectionId,
        uint32 tokenId,
        uint256 price,
        uint32 currency,
        uint32 amount,
        CrossAddress memory seller
    ) public validCrossAddress(seller.eth, seller.sub) {
        validOwner(collectionId, tokenId, seller);

        if (price == 0) {
          revert InvalidArgument("price must not be zero");
        }
        if (!availableCurrencies[currency].isAvailable) {
          revert InvalidArgument("currency in not available");
        }

        if (amount == 0) {
          revert InvalidArgument("amount must not be zero");
        }

        if (blacklist[collectionId]) {
          revert CollectionInBlacklist();
        }

        if (orders[collectionId][tokenId].price > 0) {
            revert TokenIsAlreadyOnSale();
        }

        IERC721 erc721 = getErc721(collectionId);

        if (erc721.ownerOf(tokenId) != msg.sender) {
          revert SellerIsNotOwner();
        }

        if (erc721.getApproved(tokenId) != address(this)) {
          revert TokenIsNotApproved();
        }

        Order memory order = Order(
            idCount++,
            collectionId,
            tokenId,
            amount,
            price,
            currency,
            seller
        );

        orders[collectionId][tokenId] = order;

        emit TokenIsUpForSale(version, order);
    }

    /**
     * Change NFT price
     *
     * @param collectionId: ID of the token collection
     * @param tokenId: ID of the token
     * @param price: New Price (with proper network currency decimals)
     */
    function changePrice(
      uint32 collectionId,
      uint32 tokenId,
      uint256 price,
      uint32 currency
    ) external {
      Order storage order = orders[collectionId][tokenId];

      if (order.price == 0) {
        revert OrderNotFound();
      }

      if (!availableCurrencies[currency].isAvailable) {
        revert InvalidArgument("currency in not available");
      }

      validOwner(collectionId, tokenId, order.seller);

      order.price = price;
      order.currency = currency;

      emit TokenPriceChanged(version, order);
    }

    /**
     * Get information about the listed token order
     *
     * @param collectionId: ID of the token collection
     * @param tokenId: ID of the token
     * @return The order information
     */
    function getOrder(
        uint32 collectionId,
        uint32 tokenId
    ) external view returns (Order memory) {
        return orders[collectionId][tokenId];
    }

    /**
     * Revoke the token from the sale. Only the original lister can use this method.
     *
     * @param collectionId: ID of the token collection
     * @param tokenId: ID of the token
     * @param amount: Number of token fractions to de-list (must always be 1 for NFT)
     */
    function revoke(
        uint32 collectionId,
        uint32 tokenId,
        uint32 amount
    ) external {
        if (amount == 0) {
          revert InvalidArgument("amount must not be zero");
        }

        Order memory order = orders[collectionId][tokenId];

        if (order.price == 0) {
          revert OrderNotFound();
        }

        if (amount > order.amount) {
          revert TooManyAmountRequested();
        }

        validOwner(collectionId, tokenId, order.seller);

        order.amount -= amount;
        if (order.amount == 0) {
            delete orders[collectionId][tokenId];
        } else {
            orders[collectionId][tokenId] = order;
        }

        emit TokenRevoke(version, order, amount);
    }

    /**
     * Test if the token is still approved to be transferred by this contract and delete the order if not.
     *
     * @param collectionId: ID of the token collection
     * @param tokenId: ID of the token
     */
    function checkApproved(uint32 collectionId, uint32 tokenId) public onlyAdmin {
        Order memory order = orders[collectionId][tokenId];
        if (order.price == 0) {
            revert OrderNotFound();
        }

        IERC721 erc721 = getErc721(collectionId);

        if (erc721.getApproved(tokenId) != address(this) || erc721.ownerOf(tokenId) != getAddressFromCrossAccount(order.seller)) {
          uint32 amount = order.amount;
          order.amount = 0;
          emit TokenRevoke(version, order, amount);

          delete orders[collectionId][tokenId];
        } else {
          emit TokenIsApproved(version, order);
        }
    }

    function getAddressFromCrossAccount(CrossAddress memory account) private pure returns (address) {
        if (account.eth != address(0)) {
            return account.eth;
        } else {
            return address(uint160(account.sub >> 96));
        }
    }

    /**
     * Revoke the token from the sale. Only the contract admin can use this method.
     *
     * @param collectionId: ID of the token collection
     * @param tokenId: ID of the token
     */
    function revokeAdmin(uint32 collectionId, uint32 tokenId) public onlyAdmin {
        Order memory order = orders[collectionId][tokenId];
        if (order.price == 0) {
          revert OrderNotFound();
        }

        uint32 amount = order.amount;
        order.amount = 0;
        emit TokenRevoke(version, order, amount);

        delete orders[collectionId][tokenId];
    }

    /**
     * Revoke the token from the sale. Only the contract admin can use this method.
     *
     * @param collectionId: ID of the token collection
     * @param tokenIdList: List ID of the token
     */
    function revokeListAdmin(uint32 collectionId, uint32[] calldata tokenIdList) public onlyAdmin {
      for (uint256 i=0; i<tokenIdList.length; i += 1) {
        revokeAdmin(collectionId, tokenIdList[i]);
      }
    }

    /**
     * This structure is needed because is thrown an error:
     * CompilerError: Stack too deep.
     * Try compiling with --via-ir (cli) or the equivalent viaIR: true (standard JSON) while enabling the optimizer.
     * Otherwise, try removing local variables.
     */
    struct BuyLocalVariables {
      Order order;
      uint256 totalValue;
      uint256 feeValue;
      IERC721 erc721;
      address collectionAddress;
      IUniqueNFT nft;
      CrossAddress from;
    }

    /**
     * Buy a token (partially for an RFT).
     *
     * @param collectionId: ID of the token collection
     * @param tokenId: ID of the token
     * @param amount: Number of token fractions to buy (must always be 1 for NFT)
     * @param buyer: Cross-address of the buyer, eth part must be equal to the transaction signer address
     */
    function buy(
        uint32 collectionId,
        uint32 tokenId,
        uint32 amount,
        CrossAddress memory buyer
    ) public payable validCrossAddress(buyer.eth, buyer.sub) {
        if (msg.value == 0) {
          revert InvalidArgument("msg.value must not be zero");
        }
        if (amount == 0) {
          revert InvalidArgument("amount must not be zero");
        }

        if (blacklist[collectionId]) {
          revert CollectionInBlacklist();
        }

        BuyLocalVariables memory lv;

        lv.order = orders[collectionId][tokenId];
        if (lv.order.price == 0) {
            revert OrderNotFound();
        }

        if (amount > lv.order.amount) {
            revert TooManyAmountRequested();
        }

        lv.totalValue = lv.order.price * amount;
        lv.feeValue = (lv.totalValue * marketFee) / 100;

        if (msg.value < lv.totalValue) {
            revert NotEnoughMoneyError();
        }

        lv.erc721 = getErc721(lv.order.collectionId);
        if (lv.erc721.getApproved(tokenId) != address(this)) {
          revert TokenIsNotApproved();
        }

        lv.order.amount -= amount;
        if (lv.order.amount == 0) {
            delete orders[collectionId][tokenId];
        } else {
            orders[collectionId][tokenId] = lv.order;
        }

        lv.collectionAddress = collectionHelpers.collectionAddress(collectionId);
        lv.nft = IUniqueNFT(lv.collectionAddress);

        lv.nft.transferFromCross(
          lv.order.seller,
          buyer,
          lv.order.tokenId
        );

        if (lv.order.currency == 0) {
          lv.from = CrossAddress(address(this), 0);
        } else {
          lv.from = buyer;
        }

        (uint256 totalRoyalty, RoyaltyAmount[] memory royalties) = sendRoyalties(lv, tokenId);

        if (totalRoyalty >= lv.totalValue - lv.feeValue) {
          revert InvalidRoyaltiesError(totalRoyalty);
        }

        sendMoney(lv.from, lv.order.seller, lv.totalValue - lv.feeValue - totalRoyalty, lv.order.currency);

        if (msg.value > lv.totalValue) {
            sendMoney(CrossAddress(address(this), 0), buyer, msg.value - lv.totalValue, lv.order.currency);
        }

        emit TokenIsPurchased(version, lv.order, amount, buyer, royalties);
    }

    function sendMoney(CrossAddress memory from, CrossAddress memory to, uint256 money, uint32 currency) private {
      address collectionAddress = collectionHelpers.collectionAddress(currency);

      IUniqueFungible fungible = IUniqueFungible(collectionAddress);

      fungible.transferFromCross(from, to, money);
    }

    function sendRoyalties(BuyLocalVariables memory lv, uint tokenId) private returns (uint256, RoyaltyAmount[] memory) {
      RoyaltyAmount[] memory royalties = royaltyHelpers.calculate(lv.collectionAddress, tokenId, lv.totalValue - lv.feeValue);

      uint256 totalRoyalty = 0;

      for (uint256 i=0; i<royalties.length; i++) {
        RoyaltyAmount memory royalty = royalties[i];

        totalRoyalty += royalty.amount;

        sendMoney(lv.from, royalty.crossAddress, royalty.amount, lv.order.currency);
      }

      return (totalRoyalty, royalties);
    }

    function withdraw(CrossAddress memory to, uint32 currency, uint256 balance) public onlyOwner {
      sendMoney(CrossAddress(address(this), 0), to, balance, currency);
    }
}
