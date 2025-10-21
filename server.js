require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const fetch = require('node-fetch');

const app = express();

// Serve static files from public folder
app.use(express.static('public'));

// Parse JSON bodies
app.use(bodyParser.json());

// CORS middleware (adjust for production)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Replace with your Render domain in production
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    next();
});

// Handle OPTIONS preflight
app.options('/send-message', (req, res) => {
    res.status(200).end();
});

// Endpoint for form submission
app.post('/send-message', async (req, res) => {
    const { name, email, subject, message, privacy, recaptchaToken } = req.body;

    // Server-side validation
    if (!name || !email || !subject || !message || !privacy || !recaptchaToken) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    // Verify reCAPTCHA
    const recaptchaUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${recaptchaToken}`;
    const recaptchaResponse = await fetch(recaptchaUrl, { method: 'POST' });
    const recaptchaData = await recaptchaResponse.json();
    if (!recaptchaData.success) {
        return res.status(400).json({ error: 'reCAPTCHA verification failed' });
    }

    // Set up Nodemailer with SendGrid
    const transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        auth: {
            user: 'apikey',
            pass: process.env.SENDGRID_API_KEY
        }
    });

    // Email options
    const mailOptions = {
        from: email,
        to: process.env.EMAIL_TO,
        subject: `Contact Form: ${subject}`,
        text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\nMessage: ${message}\nPrivacy Agreed: ${privacy}`,
        replyTo: email
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Email error:', error);
        res.status(500).json({ error: 'Failed to send email' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));