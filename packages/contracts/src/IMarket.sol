// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;

import "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {IUniqueRoyaltyHelper, RoyaltyAmount} from "./royalty/interfaces.sol";
import {ICollectionHelpers, IUniqueNFT, IUniqueFungible, IERC721, CrossAddress} from "./interfaces.sol";
import {Order, TokenForOrder, Currency} from "./interfaces.sol";

interface IMarket {
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
    error CollectionInBlacklist();

    function initialize(uint32 fee) external;

    function addAdmin(address admin) external;

    function removeAdmin(address admin) external;

    function addCurrency(uint32 collectionId, uint32 fee) external;

    function removeCurrency(uint32 collectionId) external;

    function addToBlacklist(uint32 collectionId) external;

    function removeFromBlacklist(uint32 collectionId) external;

    function setMarketFee(uint32 fee) external;

    function put(TokenForOrder memory orderData) external;

    function putBatch(TokenForOrder[] memory ordersData) external;

    function changePrice(uint32 collectionId, uint32 tokenId, uint256 price, uint32 currency) external;

    function buy(uint32 collectionId, uint32 tokenId, uint32 amount, CrossAddress memory buyer) external payable;

    function revoke(uint32 collectionId, uint32 tokenId, uint32 amount) external;

    function setRoyaltyHelpers(address royaltyHelpersAddress) external;

    function getCurrency(uint32 collectionId) external view returns (Currency memory);

    function getOrder(uint32 collectionId, uint32 tokenId) external view returns (Order memory);

    function withdraw(CrossAddress memory to, uint32 currency, uint256 balance) external;

    function checkApproved(uint32 collectionId, uint32 tokenId) external;

    function revokeAdmin(uint32 collectionId, uint32 tokenId) external;

    function revokeListAdmin(uint32 collectionId, uint32[] calldata tokenIdList) external;
}
