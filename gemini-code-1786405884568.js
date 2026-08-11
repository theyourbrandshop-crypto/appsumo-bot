const { Client } = require('pg');
const express = require('express');
const app = express();

app.use(express.json());

const db = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

db.connect().then(() => {
  console.log('Connected to Supabase database!');
  return db.query(`
    CREATE TABLE IF NOT EXISTS licenses (
      id SERIAL PRIMARY KEY,
      email TEXT,
      license_key TEXT,
      tier TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}).catch(err => console.error('Database connection error', err));

// Wildcard and explicit routes so AppSumo's test ping always succeeds
app.all('/api/appsumo/webhook', async (req, res) => {
  console.log('AppSumo webhook ping received:', req.body);

  if (req.body && req.body.data) {
    try {
      const email = req.body.data.email || 'unknown';
      const licenseKey = req.body.data.license_key || 'unknown';
      const tier = req.body.data.tier || 'standard';

      await db.query(
        'INSERT INTO licenses (email, license_key, tier) VALUES ($1, $2, $3)',
        [email, licenseKey, tier]
      );
      console.log('Successfully saved buyer to database!');
    } catch (err) {
      console.error('Error saving license to database:', err);
    }
  }

  // AppSumo requires this exact success response
  return res.status(200).json({ success: true });
});

app.all('/api/appsumo/oauth/callback', (req, res) => {
  return res.status(200).send('OK');
});

// Catch-all to make sure the server responds to any root check too
app.all('/', (req, res) => {
  return res.status(200).send('Bot is running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
