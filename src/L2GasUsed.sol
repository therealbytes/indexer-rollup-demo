// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {SecureMerkleTrie} from "./trie/SecureMerkleTrie.sol";
import {RLPWriter} from "./rlp/RLPWriter.sol";

contract L2GasUsed {
    event NewValue(address addr, bytes32 storageRoot, uint256 value);

    // storage root => (address => gas used)
    mapping(bytes32 => mapping(address => uint256)) public gasUsed;
    // address => storage root
    mapping(address => bytes32) public lastStorageRoot;
    // storage root => total proven gas
    mapping(bytes32 => uint256) public totalProvenGas;

    function getGasUsed(
        bytes32 storageRoot,
        address addr
    ) public view returns (uint256) {
        return gasUsed[storageRoot][addr];
    }

    function getLastStorageRoot(address addr) public view returns (bytes32) {
        return lastStorageRoot[addr];
    }

    function getTotalProvenGas(
        bytes32 storageRoot
    ) public view returns (uint256) {
        return totalProvenGas[storageRoot];
    }

    function getLastGasUsed(address addr) public view returns (uint256) {
        return getGasUsed(getLastStorageRoot(addr), addr);
    }

    function verifyAndSetGasUsed(
        bytes32 storageRoot,
        address addr,
        uint256 value,
        bytes32[] memory proof
    ) public {
        if (getGasUsed(storageRoot, addr) > 0) {
            revert("Gas used already set");
        }

        bytes32 storageKey = keccak256(abi.encode(addr, 0));

        // Verify the Merkle proof
        require(
            SecureMerkleTrie.verifyInclusionProof(
                abi.encode(storageKey),
                RLPWriter.writeUint(value),
                proof,
                storageRoot
            ),
            "Invalid inclusion proof"
        );

        // If proof is valid, set the value in the mappings
        gasUsed[storageRoot][addr] = value;
        totalProvenGas[storageRoot] += value;

        if (value > getLastGasUsed(addr)) {
            lastStorageRoot[addr] = storageRoot;
        }

        emit NewValue(addr, storageRoot, value);
    }
}
