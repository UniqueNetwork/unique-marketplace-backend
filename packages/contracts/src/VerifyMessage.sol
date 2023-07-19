// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Verify {

  // https://docs.ethers.org/v4/cookbook-signing.html
  function VerifyString(string memory message, uint8 v, bytes32 r,
    bytes32 s) public pure returns (address) {

    string memory header = "\x19Ethereum Signed Message:\n000000";

    uint256 lengthOffset;
    uint256 length;
    assembly {
      length := mload(message)
      lengthOffset := add(header, 57)
    }

    require(length <= 999999);

    uint256 lengthLength = 0;

    uint256 divisor = 100000;

    while (divisor != 0) {

      uint256 digit = length / divisor;
      if (digit == 0) {
        if (lengthLength == 0) {
          divisor /= 10;
          continue;
        }
      }

      lengthLength++;

      length -= digit * divisor;

      divisor /= 10;

      digit += 0x30;
      lengthOffset++;

      assembly {
        mstore8(lengthOffset, digit)
      }
    }

    if (lengthLength == 0) {
      lengthLength = 1 + 0x19 + 1;
    } else {
      lengthLength += 1 + 0x19;
    }

    assembly {
      mstore(header, lengthLength)
    }

    bytes32 check = keccak256(abi.encodePacked(header, message));

    return ecrecover(check, v, r, s);
  }

  function VerifyMessage(bytes32 _hashedMessage, uint8 _v, bytes32 _r, bytes32 _s) public pure returns (address) {
    bytes memory prefix = "\x19Ethereum Signed Message:\n32";
    bytes32 prefixedHashMessage = keccak256(abi.encodePacked(prefix, _hashedMessage));

    return ecrecover(prefixedHashMessage, _v, _r, _s);
  }

}
