const crypto = require('crypto');

exports.sha256 = (input) => {
  return crypto.createHash('sha256').update(input).digest('hex');
};
