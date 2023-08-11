// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract L2GasUsed {
    // state root => indexer contract storage root
    mapping(bytes32 => bytes32) public storageRoots;
    // storage root => (address => gas used)
    mapping(bytes32 => mapping(address => uint256)) public gasUsed;
    // address => storage root
    mapping(address => bytes32) public lastStorageRoot;
    // storage root => total proven gas
    mapping(bytes32 => uint256) public totalProvenGas;

    event NewValue(address addr, bytes32 storageRoot, uint256 value);

    function getStorageRoot(bytes32 stateRoot) public view returns (bytes32) {
        return storageRoots[stateRoot];
    }

    function getGasUsed(
        bytes32 storageRoot,
        address addr
    ) public view returns (uint256) {
        return gasUsed[storageRoot][addr];
    }

    function getLastStorageRoot(address addr) public view returns (bytes32) {
        return lastStorageRoot[addr];
    }

    function getLastValue(address addr) public view returns (uint256) {
        return getGasUsed(getLastStorageRoot(addr), addr);
    }

    function getTotalProvenGas(
        bytes32 storageRoot
    ) public view returns (uint256) {
        return totalProvenGas[storageRoot];
    }

    function verifyAndSetStorageRoot(
        bytes32 stateRoot,
        bytes32 storageRoot,
        bytes32[] memory proof
    ) public {
        if (storageRoots[stateRoot] != 0) {
            revert("Storage root already set");
        }

        // Verify the Merkle proof
        // require(verifyMerkleProof(storageRoot, proof, stateRoot), "Invalid Merkle proof");

        // If proof is valid, set the value in the mapping
        storageRoots[stateRoot] = storageRoot;
    }

    function verifyAndSetGasUsed(
        bytes32 storageRoot,
        address addr,
        uint256 value,
        bytes32[] memory proof
    ) public {
        if (gasUsed[storageRoot][addr] != 0) {
            revert("Gas used already set");
        }

        bytes32 storageKey = keccak256(abi.encode(addr, 0));

        // Verify the Merkle proof
        // require(verifyMerkleProof(_addr, value, proof, stateRoot), "Invalid Merkle proof");

        // If proof is valid, set the value in the mapping
        gasUsed[storageRoot][addr] = value;
        totalProvenGas[storageRoot] += value;

        if (value > getLastValue(addr)) {
            lastStorageRoot[addr] = storageRoot;
        }

        emit NewValue(addr, storageRoot, value);
    }
}
