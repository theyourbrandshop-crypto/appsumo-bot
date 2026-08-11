const express = require('express');
const app = express();

app.use(express.json());

// 1. WEBHOOK ENDPOINT (Catches purchases, refunds, upgrades)
app.post('/api/appsumo/webhook', (req, res) => {
    const event = req.body;

    switch (event.action) {
        case 'license_active':
            console.log(`License activated:`, event.data);
            break;
        case 'license_refunded':
            console.log(`License refunded:`, event.data.license_key);
            break;
        default:
            console.log(`Received event:`, event.action);
    }

    return res.status(200).json({ success: true });
});

// 2. OAUTH REDIRECT / CALLBACK ENDPOINT (Handles user login/signup redirect)
app.get('/api/appsumo/oauth/callback', (req, res) => {
    const authCode = req.query.code;

    if (!authCode) {
        return res.status(400).send('No authorization code provided.');
    }

    console.log(`Received OAuth code: ${authCode}`);

    // Send the user into your app's dashboard or signup page
    return res.redirect('/welcome-dashboard');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
