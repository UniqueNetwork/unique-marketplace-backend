// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "../interfaces.sol";

struct RoyaltyAmount {
    CrossAddress crossAddress;
    uint amount;
}

interface IUniqueRoyaltyHelper {
    function calculate(address collection, uint tokenId, uint sellPrice) external view returns (RoyaltyAmount[] memory);
}
