// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;

import "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {IUniqueRoyaltyHelper, RoyaltyAmount} from "./royalty/interfaces.sol";
import {ICollectionHelpers, IUniqueNFT, IUniqueFungible, IERC721, CrossAddress, Order, Currency, TokenForOrder} from "./interfaces.sol";
import {IMarket} from "./IMarket.sol";

contract Market is IMarket, Initializable, OwnableUpgradeable {
    using ERC165Checker for address;

    uint32 public constant version = 0;
    uint32 public constant buildVersion = 8;
    bytes4 private constant InterfaceId_ERC721 = 0x80ac58cd;
    bytes4 private constant InterfaceId_ERC165 = 0x5755c3f2;
    ICollectionHelpers private constant collectionHelpers =
        ICollectionHelpers(0x6C4E9fE1AE37a41E93CEE429e8E1881aBdcbb54F);

    mapping(uint32 => bool) blacklist;
    mapping(uint32 => mapping(uint32 => Order)) orders;
    uint32 private idCount;
    uint32 public marketFee;
    mapping(address => bool) public admins;
    mapping(uint256 => Currency) private availableCurrencies;
    IUniqueRoyaltyHelper private royaltyHelpers;

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

    function validApprove(uint32 collectionId, uint32 tokenId, CrossAddress memory seller) private view {
        IERC721 erc721 = getErc721(collectionId);

        address ethAddress;
        if (seller.eth != address(0)) {
            ethAddress = seller.eth;
        } else {
            ethAddress = payable(address(uint160(seller.sub >> 96)));
        }

        if ((erc721.getApproved(tokenId) != address(this)) && !erc721.isApprovedForAll(ethAddress, address(this))) {
            revert TokenIsNotApproved();
        }
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * Receive also allows this contract to receive native token.
     * We need this for self-sponsoring
     */
    receive() external payable {}

    /**
     * Fallback that allows this contract to receive native token.
     * We need this for self-sponsoring
     */
    fallback() external payable {}

    function initialize(uint32 fee) public initializer {
        if (fee > 100) revert InvalidMarketFee();

        marketFee = fee;
        royaltyHelpers = IUniqueRoyaltyHelper(0x69470426d9618a23EA1cf91ffD6A115E4D8dC8be);

        idCount = 1;
        availableCurrencies[0] = Currency(true, 0, 0);

        __Ownable_init(msg.sender);
    }

    /**
     * Add new admin. Only owner or an existing admin can add admins.
     *
     * @param admin: Address of a new admin to add
     */
    function addAdmin(address admin) external onlyAdmin {
        admins[admin] = true;
    }

    /**
     * Remove an admin. Only owner or an existing admin can remove admins.
     *
     * @param admin: Address of a new admin to add
     */
    function removeAdmin(address admin) external onlyAdmin {
        delete admins[admin];
    }

    /**
     * Add new currency. Only owner or an existing admin can add currency.
     *
     * @param collectionId: Fungible collection id
     * @param fee: Fee value for this collection
     */
    function addCurrency(uint32 collectionId, uint32 fee) external onlyAdmin {
        if (fee > 100) revert InvalidMarketFee();
        availableCurrencies[collectionId] = Currency(true, collectionId, fee);
    }

    /**
     * Remove currency. Only owner or an existing admin can remove currency.
     *
     * @param collectionId: Fungible collection id
     */
    function removeCurrency(uint32 collectionId) external onlyAdmin {
        delete availableCurrencies[collectionId];
    }

    /**
     * Add collection to blacklist. Only owner or an existing admin can this.
     *
     * @param collectionId: ID of collection
     */
    function addToBlacklist(uint32 collectionId) external onlyAdmin {
        blacklist[collectionId] = true;
    }

    /**
     * Remove collection from blacklist. Only owner or an existing admin can this.
     *
     * @param collectionId: ID of collection
     */
    function removeFromBlacklist(uint32 collectionId) external onlyAdmin {
        delete blacklist[collectionId];
    }

    function setMarketFee(uint32 fee) external onlyAdmin {
        if (fee > 100) revert InvalidMarketFee();
        marketFee = fee;
    }

    function _put(
        TokenForOrder memory orderData
    ) internal validCrossAddress(orderData.seller.eth, orderData.seller.sub) {
        validOwner(orderData.collectionId, orderData.tokenId, orderData.seller);

        if (orderData.price == 0) revert InvalidArgument("price must not be zero");

        if (!availableCurrencies[orderData.currency].isAvailable) revert InvalidArgument("currency is not available");

        if (orderData.amount == 0) revert InvalidArgument("amount must not be zero");

        if (blacklist[orderData.collectionId]) revert CollectionInBlacklist();

        if (orders[orderData.collectionId][orderData.tokenId].price > 0) revert TokenIsAlreadyOnSale();

        validApprove(orderData.collectionId, orderData.tokenId, orderData.seller);

        Order memory order = Order(
            idCount++,
            orderData.collectionId,
            orderData.tokenId,
            orderData.amount,
            orderData.price,
            orderData.currency,
            orderData.seller
        );

        orders[orderData.collectionId][orderData.tokenId] = order;

        emit TokenIsUpForSale(version, order);
    }

    /**
     * Place an NFT or RFT token for sale. It must be pre-approved for transfers by this contract address.
     *
     * @param orderData: data for create single token, including collectionId, tokenId, price, amount, currency, and seller.
     */
    function put(TokenForOrder memory orderData) external {
        _put(orderData);
    }

    /**
     * Place multiple NFTs or RFT tokens for sale. Each must be pre-approved for transfers by this contract address.
     *
     * @param ordersData: Array of order data for multiple tokens, including collectionId, tokenId, price, amount, currency, and seller.
     */
    function putBatch(TokenForOrder[] memory ordersData) external {
        // MAX limit 50 tokens
        if (ordersData.length > 50) {
            revert InvalidArgument("Cannot process more than 50 tokens in a single batch");
        }

        uint256 ordersDataLength = ordersData.length;

        for (uint256 i = 0; i < ordersDataLength; ) {
            TokenForOrder memory order = ordersData[i];

            _put(order);

            unchecked {
                i++;
            }
        }
    }

    /**
     * Change NFT price
     *
     * @param collectionId: ID of the token collection
     * @param tokenId: ID of the token
     * @param price: New Price (with proper network currency decimals)
     */
    function changePrice(uint32 collectionId, uint32 tokenId, uint256 price, uint32 currency) external {
        if (price == 0) {
            revert InvalidArgument("price must not be zero");
        }

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

    // /**
    //  * Buy a token (partially for an RFT).
    //  *
    //  * @param collectionId: ID of the token collection
    //  * @param tokenId: ID of the token
    //  * @param amount: Number of token fractions to buy (must always be 1 for NFT)
    //  * @param buyer: Cross-address of the buyer, eth part must be equal to the transaction signer address
    //  */
    function buy(
        uint32 collectionId,
        uint32 tokenId,
        uint32 amount,
        CrossAddress memory buyer
    ) external payable validCrossAddress(buyer.eth, buyer.sub) {
        if (amount == 0) revert InvalidArgument("amount must not be zero");
        if (blacklist[collectionId]) revert CollectionInBlacklist();

        Order memory order = orders[collectionId][tokenId];
        if (order.price == 0) revert OrderNotFound();

        if (!availableCurrencies[order.currency].isAvailable) {
            revert InvalidArgument("currency in not available");
        }

        if (amount > order.amount) revert TooManyAmountRequested();

        uint256 fee = availableCurrencies[order.currency].fee != 0
            ? availableCurrencies[order.currency].fee
            : marketFee;
        uint256 totalValue = order.price * amount;
        uint256 marketFeeValue = (totalValue * fee) / 100;

        if (order.currency == 0 && msg.value < totalValue) revert NotEnoughMoneyError();

        if (getErc721(order.collectionId).getApproved(tokenId) != address(this)) {
            revert TokenIsNotApproved();
        }

        order.amount -= amount;
        if (order.amount == 0) {
            delete orders[collectionId][tokenId];
        } else {
            orders[collectionId][tokenId] = order;
        }

        IUniqueNFT nft = IUniqueNFT(collectionHelpers.collectionAddress(collectionId));

        nft.transferFromCross(order.seller, buyer, order.tokenId);

        CrossAddress memory from;
        if (order.currency == 0) {
            from = CrossAddress(address(this), 0);
        } else {
            from = buyer;
        }

        address currency = collectionHelpers.collectionAddress(order.currency);
        (uint256 totalRoyalty, RoyaltyAmount[] memory royalties) = sendRoyalties(
            collectionId,
            tokenId,
            currency,
            order.price - marketFeeValue,
            from
        );

        if (totalRoyalty >= totalValue - marketFeeValue) revert InvalidRoyaltiesError(totalRoyalty);

        sendMoney(currency, from, order.seller, totalValue - marketFeeValue - totalRoyalty);
        if (order.currency != 0) sendMoney(currency, from, CrossAddress(address(this), 0), marketFeeValue);

        emit TokenIsPurchased(version, order, amount, buyer, royalties);
    }

    /**
     * Revoke the token from the sale. Only the original lister can use this method.
     *
     * @param collectionId: ID of the token collection
     * @param tokenId: ID of the token
     * @param amount: Number of token fractions to de-list (must always be 1 for NFT)
     */
    function revoke(uint32 collectionId, uint32 tokenId, uint32 amount) external {
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
     * Set new royalty helper contract address
     *
     * @param royaltyHelpersAddress: royalty helper contract address
     */
    function setRoyaltyHelpers(address royaltyHelpersAddress) external onlyAdmin {
        royaltyHelpers = IUniqueRoyaltyHelper(royaltyHelpersAddress);
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
     * Get information about the listed token order
     *
     * @param collectionId: ID of the token collection
     * @param tokenId: ID of the token
     * @return The order information
     */
    function getOrder(uint32 collectionId, uint32 tokenId) external view returns (Order memory) {
        return orders[collectionId][tokenId];
    }

    function withdraw(CrossAddress memory to, uint32 currency, uint256 balance) public onlyOwner {
        address fungible = collectionHelpers.collectionAddress(currency);
        CrossAddress memory from = CrossAddress(address(this), 0);
        sendMoney(fungible, from, to, balance);
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

        if (
            erc721.getApproved(tokenId) != address(this) ||
            erc721.ownerOf(tokenId) != getAddressFromCrossAccount(order.seller)
        ) {
            uint32 amount = order.amount;
            order.amount = 0;
            emit TokenRevoke(version, order, amount);

            delete orders[collectionId][tokenId];
        } else {
            emit TokenIsApproved(version, order);
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
        for (uint256 i = 0; i < tokenIdList.length; i += 1) {
            revokeAdmin(collectionId, tokenIdList[i]);
        }
    }

    function sendMoney(address fungible, CrossAddress memory from, CrossAddress memory to, uint256 amount) private {
        IUniqueFungible(fungible).transferFromCross(from, to, amount);
    }

    function sendRoyalties(
        uint32 collectionId,
        uint256 tokenId,
        address currency,
        uint256 sellPrice,
        CrossAddress memory from
    ) private returns (uint256, RoyaltyAmount[] memory) {
        RoyaltyAmount[] memory royalties = royaltyHelpers.calculate(
            collectionHelpers.collectionAddress(collectionId),
            tokenId,
            sellPrice
        );

        uint256 totalRoyalty = 0;

        for (uint256 i = 0; i < royalties.length; i++) {
            RoyaltyAmount memory royalty = royalties[i];

            totalRoyalty += royalty.amount;

            sendMoney(currency, from, royalty.crossAddress, royalty.amount);
        }

        return (totalRoyalty, royalties);
    }

    function getErc721(uint32 collectionId) private view returns (IERC721) {
        address collectionAddress = collectionHelpers.collectionAddress(collectionId);

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

    function getAddressFromCrossAccount(CrossAddress memory account) private pure returns (address) {
        if (account.eth != address(0)) {
            return account.eth;
        } else {
            return address(uint160(account.sub >> 96));
        }
    }
}
