// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

struct CrossAddress {
    address eth;
    uint256 sub;
}

interface IERC721 {
    function ownerOf(uint256 tokenId) external view returns (address owner);

    function getApproved(uint256 tokenId) external view returns (address operator);
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
