// blockchain-service/pbft/pbft.js
const pool = require('../config/db');

const nodeId = process.env.NODE_ID || "node-unknown";
const N = parseInt(process.env.PBFT_N || "3", 10);
const F = Math.floor((N - 1) / 3);
const QUORUM = 2 * F + 1; // for 3 nodes → 2

// PBFT state in memory: hash → { blockId, prepares:Set, commits:Set, committed:boolean }
const consensusState = new Map();

/**
 * Called locally after we create a new block in addBlock.
 * Starts the PBFT round by counting our own PREPARE and broadcasting it.
 */
async function startConsensus(block, p2p) {
  const { block_id, hash } = block;

  if (!consensusState.has(hash)) {
    consensusState.set(hash, {
      blockId: block_id,
      prepares: new Set(),
      commits: new Set(),
      committed: false,
    });
  }

  const state = consensusState.get(hash);
  state.prepares.add(nodeId);

  console.log(`🧩 [${nodeId}] PBFT start for block ${block_id} (hash=${hash})`);

  // Broadcast PREPARE to peers
  await p2p.broadcastPrepare(hash);
  await checkPrepareQuorum(hash, p2p);
}

/**
 * Handle incoming PREPARE message from a peer.
 * body: { blockHash, from }
 */
async function handlePrepareMessage({ blockHash, from }, p2p) {
  if (!blockHash || !from) return;

  if (!consensusState.has(blockHash)) {
    // Node didn't see the block yet; create placeholder state
    consensusState.set(blockHash, {
      blockId: null,
      prepares: new Set(),
      commits: new Set(),
      committed: false,
    });
  }

  const state = consensusState.get(blockHash);
  state.prepares.add(from);

  console.log(`📥 [${nodeId}] PREPARE from ${from} for hash=${blockHash}`);

  await checkPrepareQuorum(blockHash, p2p);
}

/**
 * After enough PREPARE votes → broadcast COMMIT.
 */
async function checkPrepareQuorum(blockHash, p2p) {
  const state = consensusState.get(blockHash);
  if (!state || state.committed) return;

  if (state.prepares.size >= QUORUM && state.commits.size === 0) {
    console.log(`✅ [${nodeId}] PREPARE quorum reached for hash=${blockHash}, broadcasting COMMIT`);
    state.commits.add(nodeId); // we commit ourselves
    await p2p.broadcastCommit(blockHash);
    await checkCommitQuorum(blockHash);
  }
}

/**
 * Handle incoming COMMIT message.
 * body: { blockHash, from }
 */
async function handleCommitMessage({ blockHash, from }) {
  if (!blockHash || !from) return;

  if (!consensusState.has(blockHash)) {
    consensusState.set(blockHash, {
      blockId: null,
      prepares: new Set(),
      commits: new Set(),
      committed: false,
    });
  }

  const state = consensusState.get(blockHash);
  state.commits.add(from);

  console.log(`📥 [${nodeId}] COMMIT from ${from} for hash=${blockHash}`);

  await checkCommitQuorum(blockHash);
}

/**
 * When COMMIT quorum is reached → mark block as committed in DB.
 */
async function checkCommitQuorum(blockHash) {
  const state = consensusState.get(blockHash);
  if (!state || state.committed) return;

  if (state.commits.size >= QUORUM) {
    console.log(`🎉 [${nodeId}] COMMIT quorum reached for hash=${blockHash}, marking committed in DB`);

    // Mark block as consensus_state = 'committed'
    await pool.query(
      `UPDATE blocks SET consensus_state = 'committed' WHERE hash = $1`,
      [blockHash]
    );

    state.committed = true;
  }
}

/**
 * Optional: to inspect PBFT status from an endpoint.
 */
function getStatus() {
  const result = [];
  for (const [hash, st] of consensusState.entries()) {
    result.push({
      hash,
      prepares: Array.from(st.prepares),
      commits: Array.from(st.commits),
      committed: st.committed,
    });
  }
  return result;
}

module.exports = {
  startConsensus,
  handlePrepareMessage,
  handleCommitMessage,
  getStatus,
};
