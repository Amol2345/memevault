// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MemeVault
 * @notice Daily gasless meme NFT drops on Base.
 *         Each day = one token ID. Unlimited supply per drop.
 *         Gasless via Coinbase Paymaster (ERC-4337).
 *
 *  +---------+     +---------+     +---------+
 *  | Drop #1 |     | Drop #2 |     | Drop #N |
 *  | tokenId |     | tokenId |     | tokenId |
 *  |    1    |     |    2    |     |    N    |
 *  +---------+     +---------+     +---------+
 *       ↓               ↓               ↓
 *   Unlimited        Unlimited       Unlimited
 *    free mints       free mints      free mints
 */
contract MemeVault is ERC1155, Ownable, Pausable, ReentrancyGuard {

    // ─────────────────────────────────────────────
    //  ERRORS
    // ─────────────────────────────────────────────
    error DropNotActive();
    error DropAlreadyExists();
    error DropDoesNotExist();
    error AlreadyMintedToday();
    error InvalidMetadata();
    error PaymasterOnly();

    // ─────────────────────────────────────────────
    //  STRUCTS
    // ─────────────────────────────────────────────
    struct Drop {
        string  metadataURI;  // IPFS URI e.g. ipfs://Qm.../metadata.json
        string  title;        // Meme title e.g. "This is fine. 🔥"
        string  submittedBy;  // ENS / address of submitter
        uint256 mintedAt;     // Unix timestamp of drop creation
        uint256 totalMints;   // Running mint counter
        bool    active;       // Can users mint this drop?
    }

    // ─────────────────────────────────────────────
    //  STATE
    // ─────────────────────────────────────────────

    /// @notice Current drop token ID (increments with each new drop)
    uint256 public currentDropId;

    /// @notice tokenId → Drop metadata
    mapping(uint256 => Drop) public drops;

    /// @notice tokenId → wallet → has minted (1 mint per wallet per drop)
    mapping(uint256 => mapping(address => bool)) public hasMinted;

    /// @notice Authorized Paymaster address (Coinbase Paymaster on Base)
    address public paymaster;

    /// @notice Whether to enforce 1-mint-per-wallet limit
    bool public mintLimitEnabled = true;

    // ─────────────────────────────────────────────
    //  EVENTS
    // ─────────────────────────────────────────────
    event DropCreated(uint256 indexed tokenId, string title, string metadataURI, string submittedBy);
    event MemeMinted(uint256 indexed tokenId, address indexed minter, uint256 totalMints);
    event DropActivated(uint256 indexed tokenId);
    event DropDeactivated(uint256 indexed tokenId);
    event PaymasterUpdated(address indexed newPaymaster);

    // ─────────────────────────────────────────────
    //  CONSTRUCTOR
    // ─────────────────────────────────────────────
    constructor(address _paymaster)
        ERC1155("")
        Ownable(msg.sender)
    {
        paymaster = _paymaster;
    }

    // ─────────────────────────────────────────────
    //  ADMIN: DROP MANAGEMENT
    // ─────────────────────────────────────────────

    /**
     * @notice Create a new daily drop (owner only)
     * @param _metadataURI  IPFS URI pointing to NFT metadata JSON
     * @param _title        Display title for the meme
     * @param _submittedBy  ENS name or address string of community submitter
     */
    function createDrop(
        string calldata _metadataURI,
        string calldata _title,
        string calldata _submittedBy
    ) external onlyOwner {
        if (bytes(_metadataURI).length == 0 || bytes(_title).length == 0)
            revert InvalidMetadata();

        currentDropId++;
        uint256 newId = currentDropId;

        drops[newId] = Drop({
            metadataURI:  _metadataURI,
            title:        _title,
            submittedBy:  _submittedBy,
            mintedAt:     block.timestamp,
            totalMints:   0,
            active:       true
        });

        emit DropCreated(newId, _title, _metadataURI, _submittedBy);
    }

    /// @notice Deactivate a drop (emergency stop for bad content)
    function deactivateDrop(uint256 tokenId) external onlyOwner {
        if (!drops[tokenId].active) revert DropDoesNotExist();
        drops[tokenId].active = false;
        emit DropDeactivated(tokenId);
    }

    /// @notice Reactivate a drop
    function activateDrop(uint256 tokenId) external onlyOwner {
        drops[tokenId].active = true;
        emit DropActivated(tokenId);
    }

    /// @notice Update Paymaster address (if Coinbase changes it)
    function setPaymaster(address _paymaster) external onlyOwner {
        paymaster = _paymaster;
        emit PaymasterUpdated(_paymaster);
    }

    /// @notice Toggle the 1-mint-per-wallet limit
    function setMintLimitEnabled(bool _enabled) external onlyOwner {
        mintLimitEnabled = _enabled;
    }

    /// @notice Emergency pause all minting
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // ─────────────────────────────────────────────
    //  MINT
    // ─────────────────────────────────────────────

    /**
     * @notice Mint today's drop — gasless via Coinbase Paymaster
     * @dev    The actual gas is sponsored by Paymaster (ERC-4337).
     *         This function has zero ETH cost to the caller.
     * @param  tokenId  The drop token ID to mint
     */
    function mint(uint256 tokenId) external nonReentrant whenNotPaused {
        Drop storage drop = drops[tokenId];

        if (!drop.active) revert DropNotActive();
        if (mintLimitEnabled && hasMinted[tokenId][msg.sender]) revert AlreadyMintedToday();

        hasMinted[tokenId][msg.sender] = true;
        drop.totalMints++;

        _mint(msg.sender, tokenId, 1, "");

        emit MemeMinted(tokenId, msg.sender, drop.totalMints);
    }

    /**
     * @notice Batch mint multiple drops at once (for retroactive collection)
     * @param  tokenIds  Array of drop IDs to mint
     */
    function mintBatch(uint256[] calldata tokenIds) external nonReentrant whenNotPaused {
        uint256 len = tokenIds.length;
        uint256[] memory amounts = new uint256[](len);

        for (uint256 i = 0; i < len; i++) {
            uint256 tid = tokenIds[i];
            Drop storage drop = drops[tid];

            if (!drop.active) revert DropNotActive();
            if (mintLimitEnabled && hasMinted[tid][msg.sender]) revert AlreadyMintedToday();

            hasMinted[tid][msg.sender] = true;
            drop.totalMints++;
            amounts[i] = 1;

            emit MemeMinted(tid, msg.sender, drop.totalMints);
        }

        _mintBatch(msg.sender, tokenIds, amounts, "");
    }

    // ─────────────────────────────────────────────
    //  METADATA
    // ─────────────────────────────────────────────

    /**
     * @notice Returns per-token URI (IPFS metadata JSON)
     * @dev    Overrides ERC1155 uri() to return per-drop metadata
     */
    function uri(uint256 tokenId) public view override returns (string memory) {
        if (!drops[tokenId].active && drops[tokenId].mintedAt == 0)
            revert DropDoesNotExist();
        return drops[tokenId].metadataURI;
    }

    // ─────────────────────────────────────────────
    //  VIEWS
    // ─────────────────────────────────────────────

    /// @notice Get full Drop struct for a given tokenId
    function getDrop(uint256 tokenId) external view returns (Drop memory) {
        return drops[tokenId];
    }

    /// @notice Get the current active drop (latest)
    function getCurrentDrop() external view returns (uint256 tokenId, Drop memory drop) {
        tokenId = currentDropId;
        drop = drops[currentDropId];
    }

    /// @notice Check if a wallet has minted a specific drop
    function hasMintedDrop(uint256 tokenId, address wallet) external view returns (bool) {
        return hasMinted[tokenId][wallet];
    }

    /// @notice Get total mints for a drop
    function getTotalMints(uint256 tokenId) external view returns (uint256) {
        return drops[tokenId].totalMints;
    }

    /// @notice Get multiple drops at once (for archive page)
    function getDrops(uint256[] calldata tokenIds) external view returns (Drop[] memory) {
        Drop[] memory result = new Drop[](tokenIds.length);
        for (uint256 i = 0; i < tokenIds.length; i++) {
            result[i] = drops[tokenIds[i]];
        }
        return result;
    }
}
