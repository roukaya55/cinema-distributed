const express = require('express');
const router = express.Router();

const { receiveBlock } = require("../p2p/p2p");
const blockchainController = require("../controllers/blockchainController");
const pbft = require("../pbft/pbft");


// P2P: Receive full block from peer
router.post("/p2p/receive-block", async (req, res) => {
  try {
    const ok = await receiveBlock(req.body);
    if (ok) return res.json({ accepted: true });
    return res.status(400).json({ accepted: false });
  } catch (err) {
    return res.status(500).json({ accepted: false, error: err.message });
  }
});

// PBFT: PREPARE
router.post("/pbft/prepare", async (req, res) => {
  try {
    await pbft.handlePrepareMessage(req.body, require("../p2p/p2p"));
    return res.json({ ok: true });
  } catch (err) {
    console.error("PBFT prepare error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// PBFT: COMMIT
router.post("/pbft/commit", async (req, res) => {
  try {
    await pbft.handleCommitMessage(req.body);
    return res.json({ ok: true });
  } catch (err) {
    console.error("PBFT commit error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// Optional: inspect PBFT state
router.get("/pbft/status", (req, res) => {
  return res.json(pbft.getStatus());
});



router.post("/add", blockchainController.addBlock);
router.get("/chain", blockchainController.getChain);
router.get("/verify", blockchainController.verifyChain);

module.exports = router;
