const { sha256 } = require('./hashUtil');

function computeMerkleRoot(dataObj) {
  const leaves = Object.values(dataObj).map(v => sha256(JSON.stringify(v)));

  if (leaves.length === 0) return sha256("");

  let level = leaves;

  while (level.length > 1) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = level[i + 1] || left;
      next.push(sha256(left + right));
    }
    level = next;
  }

  return level[0];
}

module.exports = { computeMerkleRoot };
