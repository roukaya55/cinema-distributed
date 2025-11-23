const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pool = require('./config/db');

dotenv.config();

const app = express();
app.use(cors({ origin: ['http://localhost:4200'], credentials: true }));
app.use(express.json());

app.get('/', (_, res) => res.send('Auth service running 🚀'));

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => console.log(`Auth service listening on ${PORT}`));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/auth', require('./routes/authSocialRoutes'));
app.use('/api/auth', require('./routes/resetRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/wishlist', require('./routes/wishlistRoutes'));
