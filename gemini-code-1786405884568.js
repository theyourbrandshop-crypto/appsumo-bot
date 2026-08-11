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
  // Automatically create table if it doesn't exist yet
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

// Your existing webhook endpoint
app.post('/webhook', async (req, res) => {
  const event = req.body;

  switch (event.type) {
    case 'license_active':
      console.log('License activated:', event.data);
      
      try {
        // Automatically save the buyer's details to the database!
        const email = event.data.email || 'unknown';
        const licenseKey = event.data.license_key || 'unknown';
        const tier = event.data.tier || 'standard';

        await db.query(
          'INSERT INTO licenses (email, license_key, tier) VALUES ($1, $2, $3)',
          [email, licenseKey, tier]
        );
        console.log('Successfully saved buyer to database automatically.');
      } catch (err) {
        console.error('Error saving license to database:', err);
      }
      
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.status(200).send({ received: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
