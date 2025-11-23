// p2p/p2p.js
const axios = require("axios");
const { verifySignature } = require("../utils/cryptoKeys");

const nodeId = process.env.NODE_ID || "node-unknown";
const Block = require("../models/blockModel");

const peers = process.env.PEERS
  ? process.env.PEERS.split(",").map(p => p.trim()).filter(Boolean)
  : [];

console.log(`🔗 [${nodeId}] Peers loaded:`, peers);

// Broadcast a signed block to all peers
async function broadcastBlock(block) {
  console.log(`📡 [${nodeId}] Broadcasting block ${block && block.block_id}`);

  for (const peer of peers) {
    try {
      await axios.post(`${peer}/api/blockchain/p2p/receive-block`, block);
      console.log(`   ➜ Sent to ${peer}`);
    } catch (err) {
      console.log(`   ⚠️ Failed to send to ${peer} : ${err.message}`);
    }
  }
}

async function receiveBlock(block) {
  console.log(`📥 [${nodeId}] Received block ${block && block.block_id}`);

  if (!block || !block.data || !block.timestamp || !block.signature) {
    console.log(`❌ [${nodeId}] Invalid block payload`);
    return false;
  }

  const dataToVerify = {
    ...block.data,
    timestamp: block.timestamp,
  };

  const pubKey = block.signer_public_key || block.signer_id;
  if (!pubKey) {
    console.log(`❌ [${nodeId}] Missing public key for signature verification`);
    return false;
  }

  let ok;
  try {
    ok = verifySignature(dataToVerify, block.signature, pubKey);
  } catch (err) {
    console.log(`❌ [${nodeId}] Error during signature verification: ${err.message}`);
    return false;
  }

  if (!ok) {
    console.log(`❌ [${nodeId}] Block signature INVALID`);
    return false;
  }

  console.log(`✅ [${nodeId}] Signature verified`);

  // 💾 Insert the block into this node's DB as a replica
  try {
    await Block.insertReplicaBlock(block);
    console.log(`💾 [${nodeId}] Stored replica of block ${block.block_id} in local DB`);
  } catch (err) {
    console.error(`⚠️ [${nodeId}] Failed to store replica block:`, err.message);
    // We still return true so PBFT can continue; for the course, this is fine
  }

  return true;
}
async function broadcastPrepare(blockHash) {
  console.log(`📡 [${nodeId}] Broadcasting PREPARE for hash=${blockHash}`);

  for (const peer of peers) {
    try {
      await axios.post(`${peer}/api/blockchain/pbft/prepare`, {
        blockHash,
        from: nodeId,
      });
    } catch (err) {
      console.error(`   ⚠️ Failed PREPARE to ${peer}:`, err.message);
    }
  }
}

async function broadcastCommit(blockHash) {
  console.log(`📡 [${nodeId}] Broadcasting COMMIT for hash=${blockHash}`);

  for (const peer of peers) {
    try {
      await axios.post(`${peer}/api/blockchain/pbft/commit`, {
        blockHash,
        from: nodeId,
      });
    } catch (err) {
      console.error(`   ⚠️ Failed COMMIT to ${peer}:`, err.message);
    }
  }
}

module.exports = {
  broadcastBlock,
  receiveBlock,
  broadcastPrepare,
  broadcastCommit,
};
