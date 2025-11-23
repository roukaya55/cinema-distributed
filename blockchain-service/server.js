const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

require('./config/db');
const { loadOrGenerateKeys } = require("./utils/cryptoKeys");
loadOrGenerateKeys(process.env.NODE_ID);
const blockchainRoutes = require('./routes/blockchainRoutes');

const app = express();
app.use(bodyParser.json());

app.use('/api/blockchain', blockchainRoutes);

const PORT = process.env.PORT || 4006;
app.listen(PORT, () => {
  console.log(`🚀 Blockchain service running on port ${PORT}`);
});
