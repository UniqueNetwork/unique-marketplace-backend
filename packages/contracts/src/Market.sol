// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@unique-nft/solidity-interfaces/contracts/CollectionHelpers.sol";
import "./utils.sol";

contract Market {
    using ERC165Checker for address;

    uint32 public version = 1;

    bytes4 private InterfaceId_ERC721 = 0x80ac58cd;
    bytes4 private InterfaceId_ERC165 = 0x5755c3f2;

    CollectionHelpers collectionHelpers =
        CollectionHelpers(0x6C4E9fE1AE37a41E93CEE429e8E1881aBdcbb54F);
    Utils utils = new Utils();

    struct Order {
        uint32 collectionId;
        uint32 tokenId;
        uint256 price;
        uint32 amount;
        address payable seller;
    }

    error InvalidMarketFee();
    error SellerIsNotOwner();
    error TokenIsAlreadyOnSale();
    error TokenIsNotApproved();
    error CollectionNotFound();
    error CollectionNotSupportedERC721();
    error OrderNotFound();
    error TooManyAmountRequested();
    error NotEnoughError();
    error FailTransformToken(string reason);

    event TokenIsUpForSale(uint32 version, Order item);
    event TokenRevoke(uint32 version, Order item);
    event TokenIsApproved(uint32 version, Order item);
    event TokenIsPurchased(uint32 version, Order item, uint256 salesAmount);
    event Log(string message);

    mapping(uint32 => mapping(uint32 => Order)) orders;

    uint32 public marketFee;
    address selfAddress;
    address ownerAddress;
    bool marketPause;

    constructor(uint32 fee) {
        marketFee = fee;
        if (marketFee == 0 || marketFee >= 100) {
            revert InvalidMarketFee();
        }

        ownerAddress = msg.sender;
        selfAddress = address(this);
    }

    modifier onlyOwner() {
        require(msg.sender == ownerAddress, "Only owner can");
        _;
    }

    modifier onlyNonPause() {
        require(!marketPause, "Market on hold");
        _;
    }

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

    function onlyTokenOwner(
        IERC721 erc721,
        uint32 tokenId,
        address seller
    ) private view {
        address realOwner = erc721.ownerOf(tokenId);

        if (realOwner != seller) {
            revert SellerIsNotOwner();
        }
    }

    function isApproved(IERC721 erc721, Order memory item) private {
        // todo not implementable in chain
        try erc721.getApproved(item.tokenId) returns (address approved) {
            emit Log(
                string.concat(
                    "getApproved approved: ",
                    utils.toString(approved)
                )
            );
            if (approved != selfAddress) {
                revert TokenIsNotApproved();
            }
        } catch Error(string memory reason) {
            emit Log(string.concat("getApproved error: ", reason));
        } catch {
            emit Log(string.concat("getApproved error without reason"));
        }
    }

    // ################################################################
    // Set new contract owner                                         #
    // ################################################################

    function setOwner() public onlyOwner {
        ownerAddress = msg.sender;
    }

    // ################################################################
    // Set market pause                                               #
    // ################################################################

    function setPause(bool pause) public onlyOwner {
        marketPause = pause;
    }

    // ################################################################
    // Place a token for sale                                         #
    // ################################################################

    function put(
        uint32 collectionId,
        uint32 tokenId,
        uint256 price,
        uint32 amount
    ) public onlyNonPause {
        IERC721 erc721 = getErc721(collectionId);
        onlyTokenOwner(erc721, tokenId, msg.sender);

        if (orders[collectionId][tokenId].price > 0) {
            revert TokenIsAlreadyOnSale();
        }

        Order memory order = Order(
            collectionId,
            tokenId,
            price,
            amount,
            payable(msg.sender)
        );

        isApproved(erc721, order);

        orders[collectionId][tokenId] = order;

        emit TokenIsUpForSale(version, order);
    }

    // ################################################################
    // Get order                                                      #
    // ################################################################

    function getOrder(
        uint32 collectionId,
        uint32 tokenId
    ) external view returns (Order memory) {
        if (orders[collectionId][tokenId].price == 0) {
            revert OrderNotFound();
        }

        return orders[collectionId][tokenId];
    }

    // ################################################################
    // Revoke the token from the sale                                 #
    // ################################################################

    function revoke(
        uint32 collectionId,
        uint32 tokenId,
        uint32 amount
    ) external {
        IERC721 erc721 = getErc721(collectionId);
        onlyTokenOwner(erc721, tokenId, msg.sender);

        Order memory order = orders[collectionId][tokenId];

        if (order.price == 0) {
            revert OrderNotFound();
        }

        if (amount > order.amount) {
            revert TooManyAmountRequested();
        }

        order.amount -= amount;
        if (order.amount == 0) {
            delete orders[collectionId][tokenId];
        } else {
            orders[collectionId][tokenId] = order;
        }

        emit TokenRevoke(version, order);
    }

    // ################################################################
    // Check approved                                                 #
    // ################################################################

    function checkApproved(uint32 collectionId, uint32 tokenId) public {
        Order memory order = orders[collectionId][tokenId];
        if (order.price == 0) {
            revert OrderNotFound();
        }

        IERC721 erc721 = getErc721(collectionId);

        onlyTokenOwner(erc721, tokenId, order.seller);

        isApproved(erc721, order);

        emit TokenIsApproved(version, order);
    }

    // ################################################################
    // Buy a token                                                    #
    // ################################################################

    function buy(
        uint32 collectionId,
        uint32 tokenId,
        uint32 amount
    ) public payable onlyNonPause {
        Order memory order = orders[collectionId][tokenId];
        if (order.price == 0) {
            revert OrderNotFound();
        }

        if (amount > order.amount) {
            revert TooManyAmountRequested();
        }

        uint256 totalValue = order.price * amount;
        uint256 feeValue = (totalValue * marketFee) / 100;
        uint256 totalValueWithFee = totalValue + feeValue;
        if (msg.value < totalValueWithFee) {
            revert NotEnoughError();
        }

        IERC721 erc721 = getErc721(order.collectionId);

        isApproved(erc721, order);

        order.amount -= amount;
        if (order.amount == 0) {
            delete orders[collectionId][tokenId];
        } else {
            orders[collectionId][tokenId] = order;
        }

        try
            erc721.transferFrom(order.seller, msg.sender, order.tokenId)
        {} catch Error(string memory reason) {
            revert FailTransformToken(reason);
        } catch {
            revert FailTransformToken("without reason");
        }

        order.seller.transfer(totalValue);

        if (msg.value > totalValueWithFee) {
            payable(msg.sender).transfer(msg.value - totalValueWithFee);
        }

        emit TokenIsPurchased(version, order, amount);
    }

    function withdraw(address transferTo) public onlyOwner {
        uint256 balance = selfAddress.balance;

        if (balance > 0) {
            payable(transferTo).transfer(balance);
        }
    }
}
