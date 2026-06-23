// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AeonINFT
 * @notice ERC-7857-style Intelligent NFT for the Aeon AI companion.
 *
 *  Each token is an AI companion you truly own. The companion's *memory* is an
 *  encrypted blob stored on 0G Storage; the on-chain `memoryRoot` is the content
 *  hash (root hash) pointer to that blob. As you talk to your companion, the memory
 *  grows: each conversation re-uploads the encrypted memory to 0G Storage and updates
 *  `memoryRoot` here, so the companion's life is provably anchored on-chain.
 *
 *  Transfer carries the soul: on `transferFrom`, the off-chain re-encryption oracle
 *  (a 0G Compute TEE) re-encrypts the memory for the new owner, re-uploads it to 0G
 *  Storage, and calls `updateMemoryRoot` with the new pointer. Until then the new owner
 *  sees a verifiable "sealed memory" state (the root hash exists on-chain but is
 *  encrypted to the previous owner).
 *
 *  This is impossible without the full 0G stack: INFT (this contract) + 0G Storage
 *  (the memory) + 0G Compute TEE (private inference + the re-encryption oracle).
 */
contract AeonINFT is ERC721, ERC2981, Ownable {
    uint256 private _nextId = 1;

    /// @dev tokenId => 0G Storage root hash of the encrypted memory blob
    mapping(uint256 => bytes32) public memoryRoot;

    /// @dev tokenId => human persona seed (used as the system prompt seed)
    mapping(uint256 => string) public personaSeed;

    /// @dev trusted re-encryption oracle (a 0G Compute TEE) authorized to move memory on transfer
    address public oracle;

    event CompanionMinted(uint256 indexed tokenId, address indexed owner, bytes32 initialRoot);
    event MemoryEvolved(uint256 indexed tokenId, bytes32 newRoot, address indexed updatedBy);
    event OracleUpdated(address indexed oracle);

    constructor(address royaltyReceiver, uint96 royaltyFeeBips)
        ERC721("Aeon Companion", "AEON")
        Ownable(msg.sender)
    {
        // EIP-2981 default royalty for the secondary-market narrative (e.g. 500 = 5%).
        _setDefaultRoyalty(royaltyReceiver, royaltyFeeBips);
    }

    /// @notice Owner sets/rotates the trusted re-encryption oracle (the July-8 build).
    function setOracle(address newOracle) external onlyOwner {
        oracle = newOracle;
        emit OracleUpdated(newOracle);
    }

    /// @notice Mint a new companion. `initialRoot` is the 0G Storage root hash of the
    ///         (empty) encrypted memory blob created at mint time.
    function mint(string calldata seed, bytes32 initialRoot) external returns (uint256 tokenId) {
        tokenId = _nextId++;
        _safeMint(msg.sender, tokenId);
        personaSeed[tokenId] = seed;
        memoryRoot[tokenId] = initialRoot;
        emit CompanionMinted(tokenId, msg.sender, initialRoot);
    }

    /// @notice Update the memory pointer after a conversation (owner) or after a
    ///         transfer re-encryption (oracle). Restricted — this is the key access guard.
    function updateMemoryRoot(uint256 tokenId, bytes32 newRoot) external {
        address holder = ownerOf(tokenId); // reverts if token does not exist
        require(msg.sender == holder || msg.sender == oracle, "Aeon: not owner or oracle");
        memoryRoot[tokenId] = newRoot;
        emit MemoryEvolved(tokenId, newRoot, msg.sender);
    }

    /// @notice The companion's on-chain memory pointer (0G Storage root hash).
    function getMemoryRoot(uint256 tokenId) external view returns (bytes32) {
        ownerOf(tokenId); // existence check
        return memoryRoot[tokenId];
    }

    // ----- required overrides -----
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
