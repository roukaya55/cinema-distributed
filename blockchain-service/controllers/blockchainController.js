// controllers/blockchainController.js
const Block = require('../models/blockModel');
const { broadcastBlock } = require("../p2p/p2p");
const { signData, getPublicKey } = require("../utils/cryptoKeys");
const pbft = require("../pbft/pbft");
const p2p = require("../p2p/p2p");

exports.addBlock = async (req, res) => {
  try {
    const { type, refId, data } = req.body;
    const nodeId = process.env.NODE_ID;

    // One canonical timestamp used everywhere
    const timestamp = new Date().toISOString();

    // Signature payload MUST match what p2p verifies:
    //   { ...block.data, timestamp: block.timestamp }
    const payloadToSign = {
      ...data,
      timestamp,
    };

    const signature = signData(payloadToSign);
    const publicKey = getPublicKey();

    // Store block in local DB (data + signature + signer)
    // NOTE: data is stored WITHOUT signature/signer_id inside it.
    const block = await Block.addBlockAtomic(
      type,
      refId,
      data,
      signature,
      nodeId,
      timestamp
    );

    // Attach public key for other nodes to verify the block
    const blockToBroadcast = {
      ...block,
      signer_public_key: publicKey,
    };

    // Broadcast full block to peers (so they can verify)
    broadcastBlock(blockToBroadcast);

    // Start PBFT consensus using the block.hash
    await pbft.startConsensus(blockToBroadcast, p2p);

    return res.status(201).json({
      message: "Signed, stored locally, broadcasted & PBFT started",
      block: blockToBroadcast,
    });

  } catch (err) {
    console.error("Error in addBlock:", err);
    return res.status(500).json({ error: err.message });
  }
};

exports.getChain = async (req, res) => {
  const blocks = await Block.getAllBlocks();
  return res.json(blocks);
};

exports.verifyChain = async (req, res) => {
  const result = await Block.verifyChain();
  return res.json(result);
};
