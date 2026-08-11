const { Client } = require('pg');
const express = require('express');
const app = express();

app.use(express.json());

// Initialize database connection using your Railway variable
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

// Updated to match AppSumo's exact endpoint structure
app.post('/api/appsumo/webhook', async (req, res) => {
  const event = req.body;
  console.log('Received AppSumo webhook:', event);

  try {
    const email = event.data?.email || event.email || 'unknown';
    const licenseKey = event.data?.license_key || event.license_key || 'unknown';
    const tier = event.data?.tier || event.tier || 'standard';

    await db.query(
      'INSERT INTO licenses (email, license_key, tier) VALUES ($1, $2, $3)',
      [email, licenseKey, tier]
    );
    console.log('Successfully saved buyer to database!');
  } catch (err) {
    console.error('Error saving license to database:', err);
  }

  // AppSumo explicitly requires this response to verify the webhook
  res.status(200).send({ success: true });
});

// OAuth callback endpoint to clear that second error warning
app.get('/api/appsumo/oauth/callback', (req, res) => {
  res.status(200).send('OAuth callback received successfully!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
