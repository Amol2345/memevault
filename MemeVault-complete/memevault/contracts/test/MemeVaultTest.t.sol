// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/MemeVault.sol";

contract MemeVaultTest is Test {

    MemeVault public vault;
    address public owner  = address(0x1);
    address public alice  = address(0x2);
    address public bob    = address(0x3);
    address public paymaster = address(0x4);

    string constant URI   = "ipfs://QmTest123/metadata.json";
    string constant TITLE = "This is fine. \xF0\x9F\x94\xA5";
    string constant SUB   = "vitalik.eth";

    // ─────────────────────────────────────────────
    //  SETUP
    // ─────────────────────────────────────────────
    function setUp() public {
        vm.prank(owner);
        vault = new MemeVault(paymaster);
    }

    // ─────────────────────────────────────────────
    //  CREATE DROP
    // ─────────────────────────────────────────────
    function test_createDrop_success() public {
        vm.prank(owner);
        vault.createDrop(URI, TITLE, SUB);

        (uint256 id, MemeVault.Drop memory drop) = vault.getCurrentDrop();
        assertEq(id, 1);
        assertEq(drop.title, TITLE);
        assertEq(drop.metadataURI, URI);
        assertEq(drop.submittedBy, SUB);
        assertEq(drop.totalMints, 0);
        assertTrue(drop.active);
    }

    function test_createDrop_onlyOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        vault.createDrop(URI, TITLE, SUB);
    }

    function test_createDrop_emptyMetadata_reverts() public {
        vm.prank(owner);
        vm.expectRevert(MemeVault.InvalidMetadata.selector);
        vault.createDrop("", TITLE, SUB);
    }

    function test_createDrop_emptyTitle_reverts() public {
        vm.prank(owner);
        vm.expectRevert(MemeVault.InvalidMetadata.selector);
        vault.createDrop(URI, "", SUB);
    }

    function test_createMultipleDrops() public {
        vm.startPrank(owner);
        vault.createDrop(URI, "Drop 1", SUB);
        vault.createDrop(URI, "Drop 2", SUB);
        vault.createDrop(URI, "Drop 3", SUB);
        vm.stopPrank();

        assertEq(vault.currentDropId(), 3);
    }

    // ─────────────────────────────────────────────
    //  MINT
    // ─────────────────────────────────────────────
    function test_mint_success() public {
        vm.prank(owner);
        vault.createDrop(URI, TITLE, SUB);

        vm.prank(alice);
        vault.mint(1);

        assertEq(vault.balanceOf(alice, 1), 1);
        assertEq(vault.getTotalMints(1), 1);
        assertTrue(vault.hasMintedDrop(1, alice));
    }

    function test_mint_multipleUsers() public {
        vm.prank(owner);
        vault.createDrop(URI, TITLE, SUB);

        vm.prank(alice);
        vault.mint(1);

        vm.prank(bob);
        vault.mint(1);

        assertEq(vault.balanceOf(alice, 1), 1);
        assertEq(vault.balanceOf(bob, 1), 1);
        assertEq(vault.getTotalMints(1), 2);
    }

    function test_mint_duplicateSameUser_reverts() public {
        vm.prank(owner);
        vault.createDrop(URI, TITLE, SUB);

        vm.startPrank(alice);
        vault.mint(1);
        vm.expectRevert(MemeVault.AlreadyMintedToday.selector);
        vault.mint(1);
        vm.stopPrank();
    }

    function test_mint_inactiveDrop_reverts() public {
        vm.prank(owner);
        vault.createDrop(URI, TITLE, SUB);

        vm.prank(owner);
        vault.deactivateDrop(1);

        vm.prank(alice);
        vm.expectRevert(MemeVault.DropNotActive.selector);
        vault.mint(1);
    }

    function test_mint_nonexistentDrop_reverts() public {
        vm.prank(alice);
        vm.expectRevert(MemeVault.DropNotActive.selector);
        vault.mint(99);
    }

    function test_mint_whenPaused_reverts() public {
        vm.prank(owner);
        vault.createDrop(URI, TITLE, SUB);

        vm.prank(owner);
        vault.pause();

        vm.prank(alice);
        vm.expectRevert();
        vault.mint(1);
    }

    function test_mint_limitDisabled_allowsMultiple() public {
        vm.prank(owner);
        vault.createDrop(URI, TITLE, SUB);

        vm.prank(owner);
        vault.setMintLimitEnabled(false);

        vm.startPrank(alice);
        vault.mint(1);
        vault.mint(1); // Should not revert when limit is off
        vm.stopPrank();

        assertEq(vault.balanceOf(alice, 1), 2);
    }

    // ─────────────────────────────────────────────
    //  BATCH MINT
    // ─────────────────────────────────────────────
    function test_mintBatch_success() public {
        vm.startPrank(owner);
        vault.createDrop(URI, "Drop 1", SUB);
        vault.createDrop(URI, "Drop 2", SUB);
        vault.createDrop(URI, "Drop 3", SUB);
        vm.stopPrank();

        uint256[] memory ids = new uint256[](3);
        ids[0] = 1; ids[1] = 2; ids[2] = 3;

        vm.prank(alice);
        vault.mintBatch(ids);

        assertEq(vault.balanceOf(alice, 1), 1);
        assertEq(vault.balanceOf(alice, 2), 1);
        assertEq(vault.balanceOf(alice, 3), 1);
    }

    function test_mintBatch_duplicateReverts() public {
        vm.startPrank(owner);
        vault.createDrop(URI, "Drop 1", SUB);
        vault.createDrop(URI, "Drop 2", SUB);
        vm.stopPrank();

        // Alice mints drop 1 first
        vm.prank(alice);
        vault.mint(1);

        // Batch includes drop 1 again → should revert
        uint256[] memory ids = new uint256[](2);
        ids[0] = 1; ids[1] = 2;

        vm.prank(alice);
        vm.expectRevert(MemeVault.AlreadyMintedToday.selector);
        vault.mintBatch(ids);
    }

    // ─────────────────────────────────────────────
    //  METADATA
    // ─────────────────────────────────────────────
    function test_uri_returnsCorrectURI() public {
        vm.prank(owner);
        vault.createDrop(URI, TITLE, SUB);
        assertEq(vault.uri(1), URI);
    }

    function test_uri_nonexistentDrop_reverts() public {
        vm.expectRevert(MemeVault.DropDoesNotExist.selector);
        vault.uri(99);
    }

    // ─────────────────────────────────────────────
    //  VIEWS
    // ─────────────────────────────────────────────
    function test_getDrops_batch() public {
        vm.startPrank(owner);
        vault.createDrop(URI, "Drop 1", SUB);
        vault.createDrop(URI, "Drop 2", "farcaster.eth");
        vm.stopPrank();

        uint256[] memory ids = new uint256[](2);
        ids[0] = 1; ids[1] = 2;

        MemeVault.Drop[] memory result = vault.getDrops(ids);
        assertEq(result[0].title, "Drop 1");
        assertEq(result[1].submittedBy, "farcaster.eth");
    }

    // ─────────────────────────────────────────────
    //  ADMIN
    // ─────────────────────────────────────────────
    function test_setPaymaster_onlyOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        vault.setPaymaster(address(0x999));
    }

    function test_setPaymaster_success() public {
        address newPM = address(0x999);
        vm.prank(owner);
        vault.setPaymaster(newPM);
        assertEq(vault.paymaster(), newPM);
    }

    function test_pauseUnpause() public {
        vm.prank(owner);
        vault.createDrop(URI, TITLE, SUB);

        vm.prank(owner);
        vault.pause();

        vm.prank(alice);
        vm.expectRevert();
        vault.mint(1);

        vm.prank(owner);
        vault.unpause();

        vm.prank(alice);
        vault.mint(1); // Should succeed now
        assertEq(vault.balanceOf(alice, 1), 1);
    }

    function test_deactivateAndReactivate() public {
        vm.startPrank(owner);
        vault.createDrop(URI, TITLE, SUB);
        vault.deactivateDrop(1);
        vm.stopPrank();

        vm.prank(alice);
        vm.expectRevert(MemeVault.DropNotActive.selector);
        vault.mint(1);

        vm.prank(owner);
        vault.activateDrop(1);

        vm.prank(alice);
        vault.mint(1);
        assertEq(vault.balanceOf(alice, 1), 1);
    }

    // ─────────────────────────────────────────────
    //  FUZZ
    // ─────────────────────────────────────────────
    function testFuzz_mint_uniqueUsers(address user) public {
        vm.assume(user != address(0));
        vm.assume(user.code.length == 0); // EOA only

        vm.prank(owner);
        vault.createDrop(URI, TITLE, SUB);

        vm.prank(user);
        vault.mint(1);

        assertEq(vault.balanceOf(user, 1), 1);
        assertTrue(vault.hasMintedDrop(1, user));
    }
}
