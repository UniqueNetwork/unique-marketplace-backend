// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

struct CrossAddress {
    address eth;
    uint256 sub;
}

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

struct TokenForOrder {
    uint32 collectionId;
    uint32 tokenId;
    uint32 amount;
    uint32 currency;
    uint256 price;
    CrossAddress seller;
}

interface IERC721 {
    function ownerOf(uint256 tokenId) external view returns (address owner);

    function getApproved(uint256 tokenId) external view returns (address operator);

    function isApprovedForAll(address owner, address operator) external view returns (bool);
}

interface IERC20 {
    function balanceOf(address account) external view returns (uint256 balance);

    function allowance(address owner, address spender) external view returns (bool result);
}

interface ICollectionHelpers {
    function collectionAddress(uint32 collectionId) external view returns (address);
}

interface IUniqueFungible {
    function transferFromCross(
        CrossAddress memory from,
        CrossAddress memory to,
        uint256 amount
    ) external returns (bool);
}

interface IUniqueNFT {
    function transferFromCross(CrossAddress memory from, CrossAddress memory to, uint256 tokenId) external;
}
