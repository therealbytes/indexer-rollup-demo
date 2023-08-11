// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract L2GasUsed {
    // state root => indexer contract storage root
    mapping(bytes32 => bytes32) public storageRoots;
    // storage root => (address => gas used)
    mapping(bytes32 => mapping(address => uint256)) public gasUsed;
    // address => storage root
    mapping(address => bytes32) public lastValue;

    event NewValue(address addr, bytes32 storageRoot, bytes32 value);

    function getLastValue(address addr) public view returns (bytes32) {
        return lastValue[addr];
    }

    function verifyAndSetStorageRoot(
        bytes32 stateRoot,
        bytes32 storageRoot,
        bytes32[] memory proof
    ) public {
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
        // Verify the Merkle proof
        // require(verifyMerkleProof(_addr, value, proof, stateRoot), "Invalid Merkle proof");

        // If proof is valid, set the value in the mapping
        gasUsed[storageRoot][addr] = value;
    }
}
