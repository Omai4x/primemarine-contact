require('dotenv').config();
   const express = require('express');
   const bodyParser = require('body-parser');
   const nodemailer = require('nodemailer');
   const cors = require('cors');

   const app = express();

   // Serve static files from public folder
   app.use(express.static('public'));

   // Parse JSON bodies
   app.use(bodyParser.json());

   // CORS middleware
   app.use(cors({
       origin: [
           'http://localhost:3000', // Local development
           'https://primemarine-contact.onrender.com', // Render backend (if frontend served here)
           'https://your-frontend.netlify.app', // Replace with your frontend URL if separate
           'https://primemarine-se.com' // Your custom domain (if applicable)
       ],
       methods: ['POST', 'OPTIONS'],
       allowedHeaders: ['Content-Type'],
       credentials: true // If using cookies/auth (optional)
   }));

   // Handle OPTIONS preflight
   app.options('/send-message', (req, res) => {
       res.status(200).end();
   });

   // Endpoint for form submission
   app.post('/send-message', async (req, res) => {
       const { name, email, subject, message, privacy } = req.body;

       // Server-side validation
       if (!name || !email || !subject || !message || !privacy) {
           return res.status(400).json({ error: 'All fields are required' });
       }
       if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
           return res.status(400).json({ error: 'Invalid email format' });
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
           from: '"Prime Marine SE" <sales@primemarine-se.com>', // Verified Sender Identity
           to: process.env.EMAIL_TO,
           subject: `Contact Form Submission: ${subject}`,
           text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\nMessage: ${message}\nPrivacy Agreed: ${privacy}`,
           html: `
               <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                   <h2 style="color: #24287c;">New Contact Form Submission</h2>
                   <p><strong>Name:</strong> ${name}</p>
                   <p><strong>Email:</strong> ${email}</p>
                   <p><strong>Subject:</strong> ${subject}</p>
                   <p><strong>Message:</strong> ${message}</p>
                   <p><strong>Privacy Agreement:</strong> ${privacy ? 'Yes' : 'No'}</p>
                   <hr style="border-top: 1px solid #e0e0e0;">
                   <p style="font-size: 12px; color: #666;">
                       This email was sent from the Prime Marine SE contact form. 
                       <a href="mailto:${email}">Reply to this email</a> to contact the sender.
                   </p>
                   <p style="font-size: 12px; color: #666;">
                       <a href="https://primemarine-se.com/unsubscribe">Unsubscribe</a> from future emails.
                   </p>
               </div>
           `,
           replyTo: email // User's email for replies
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