// models/blockModel.js
const pool = require('../config/db');
const crypto = require('crypto');
const { computeMerkleRoot } = require('../utils/merkle');

function computeHash(prevHash, merkleRoot, timestamp) {
  return crypto
    .createHash('sha256')
    .update(prevHash + merkleRoot + timestamp)
    .digest('hex');
}

class Block {

  /**
   * Atomically add a block:
   * - type: "booking" | "payment"
   * - refId: booking_id or payment_id
   * - dataObj: pure logical data (NO signature, NO signer_id)
   * - signature: ECDSA signature over { ...dataObj, timestamp }
   * - signerId: node id (NODE_ID)
   * - timestamp: ISO string (same used in signature + hash)
   */
  static async addBlockAtomic(type, refId, dataObj, signature, signerId, timestamp) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      await client.query("LOCK TABLE blocks IN EXCLUSIVE MODE");

      // Get last block
      const lastRes = await client.query(
        `SELECT * FROM blocks ORDER BY block_id DESC LIMIT 1`
      );

      const last = lastRes.rows[0] || null;
      const prevHash = last ? last.hash : "GENESIS";

      const dataStr = JSON.stringify(dataObj);
      const merkleRoot = computeMerkleRoot(dataObj);

      const hash = computeHash(prevHash, merkleRoot, timestamp);

      const insertRes = await client.query(
        `INSERT INTO blocks (prev_hash, data, merkle_root, hash, timestamp, signature, signer_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING *`,
        [prevHash, dataStr, merkleRoot, hash, timestamp, signature, signerId]
      );

      const block = insertRes.rows[0];
      // Ensure data is an object
      if (typeof block.data === "string") {
        block.data = JSON.parse(block.data);
      }

      if (type === "payment") {
        await client.query(
          `INSERT INTO payment_blocks (block_id, payment_id) VALUES ($1,$2)`,
          [block.block_id, refId]
        );
      }

      if (type === "booking") {
        await client.query(
          `INSERT INTO booking_blocks (block_id, booking_id) VALUES ($1,$2)`,
          [block.block_id, refId]
        );
      }

      await client.query("COMMIT");
      return block;

    } catch (err) {
      await client.query("ROLLBACK");
      throw err;

    } finally {
      client.release();
    }
  }

  static async getAllBlocks() {
    const res = await pool.query(
      "SELECT * FROM blocks ORDER BY block_id ASC"
    );
    // Normalize data to objects
    return res.rows.map(b => ({
      ...b,
      data: typeof b.data === "string" ? JSON.parse(b.data) : b.data,
    }));
  }

  static async verifyChain() {
    const blocks = await Block.getAllBlocks();

    if (blocks.length <= 1) return { valid: true };

    for (let i = 1; i < blocks.length; i++) {
      const prev = blocks[i - 1];
      const curr = blocks[i];

      // Recompute expected hash using same formula
      const expectedHash = crypto
        .createHash("sha256")
        .update(prev.hash + curr.merkle_root + curr.timestamp)
        .digest("hex");

      if (curr.hash !== expectedHash) {
        return {
          valid: false,
          brokenBlock: curr.block_id,
          reason: "Hash mismatch"
        };
      }

      if (curr.prev_hash !== prev.hash) {
        return {
          valid: false,
          brokenBlock: curr.block_id,
          reason: "prev_hash mismatch"
        };
      }
    }

    return { valid: true };
  }
  

static async insertReplicaBlock(block) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      await client.query("LOCK TABLE blocks IN EXCLUSIVE MODE");

      // If we already have this block, do nothing
      const exists = await client.query(
        "SELECT block_id FROM blocks WHERE hash = $1",
        [block.hash]
      );
      if (exists.rows.length > 0) {
        await client.query("COMMIT");
        return exists.rows[0];
      }

      const dataStr =
        typeof block.data === "string" ? block.data : JSON.stringify(block.data);

      const insertRes = await client.query(
        `INSERT INTO blocks
           (block_id, prev_hash, data, merkle_root, hash, timestamp,
            signature, signer_id, consensus_state)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING *`,
        [
          block.block_id,
          block.prev_hash,
          dataStr,
          block.merkle_root,
          block.hash,
          block.timestamp,
          block.signature,
          block.signer_id,
          block.consensus_state || "pending",
        ]
      );

      await client.query("COMMIT");
      return insertRes.rows[0];
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
}



module.exports = Block;
