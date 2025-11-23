// utils/cryptoKeys.js
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

let privateKey = null;
let publicKey = null;

function loadOrGenerateKeys(nodeId) {
  const keyDir = path.join(__dirname, "..", "keys", nodeId);

  if (!fs.existsSync(keyDir)) {
    fs.mkdirSync(keyDir, { recursive: true });
  }

  const privatePath = path.join(keyDir, "private.pem");
  const publicPath = path.join(keyDir, "public.pem");

  if (fs.existsSync(privatePath) && fs.existsSync(publicPath)) {
    privateKey = fs.readFileSync(privatePath, "utf8");
    publicKey = fs.readFileSync(publicPath, "utf8");
    console.log(`🔐 Loaded existing keys for ${nodeId}`);
  } else {
    console.log(`🔐 Generating new ECDSA keypair for ${nodeId}...`);

    const { privateKey: priv, publicKey: pub } = crypto.generateKeyPairSync(
      "ec",
      { namedCurve: "secp256k1" }
    );

    privateKey = priv.export({ type: "pkcs8", format: "pem" });
    publicKey = pub.export({ type: "spki", format: "pem" });

    fs.writeFileSync(privatePath, privateKey);
    fs.writeFileSync(publicPath, publicKey);
  }

  return { privateKey, publicKey };
}

// ---------- Canonical JSON helpers ----------

function canonicalize(value) {
  if (value === null || typeof value !== "object") return value;

  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  const keys = Object.keys(value).sort();
  const result = {};
  for (const k of keys) {
    result[k] = canonicalize(value[k]);
  }
  return result;
}

function signData(data) {
  if (!privateKey) {
    throw new Error("Private key not loaded. Call loadOrGenerateKeys() first.");
  }

  const sign = crypto.createSign("SHA256");
  const normalized = canonicalize(data);
  sign.update(JSON.stringify(normalized));
  sign.end();
  return sign.sign(privateKey, "hex");
}

function verifySignature(data, signature, pubKey) {
  const verify = crypto.createVerify("SHA256");
  const normalized = canonicalize(data);
  verify.update(JSON.stringify(normalized));
  verify.end();
  return verify.verify(pubKey, signature, "hex");
}

module.exports = {
  loadOrGenerateKeys,
  signData,
  verifySignature,
  getPublicKey: () => publicKey,
};
