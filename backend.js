const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

// Load Google service account credentials from environment variables
const credentials = {
  type: process.env.GOOGLE_TYPE,
  project_id: process.env.GOOGLE_PROJECT_ID,
  private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
  private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Handle newline characters
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
  client_id: process.env.GOOGLE_CLIENT_ID,
  auth_uri: process.env.GOOGLE_AUTH_URI,
  token_uri: process.env.GOOGLE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL
};
const spreadsheetId = '1fHn5CxOoJpYtoqvom6SlX9weBW4JUNvqjTrEbqE7kL8'

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const sheets = google.sheets({ version: 'v4', auth });

// Configure the email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'officialninostore@gmail.com',
    pass: process.env.EMAIL_PASSWORD // Use environment variable for email password
  }
});

// Endpoint to fetch data from Google Sheets
app.get('/api/items', async (req, res) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1!A2:E', // Adjust the range based on your sheet
    });

    const rows = response.data.values;

    if (rows.length) {
      const items = rows.map(row => {
        const sizes = row[3] ? row[3].split(',') : []; // Assume sizes are comma-separated
        const images = row[2] ? row[2].split(',') : []; // Assume images are comma-separated URLs

        return {
          name: row[0],
          price: parseFloat(row[1]),
          images,
          sizes,
        };
      });
      res.json(items); // Send the response only once
    } else {
      res.status(404).json({ message: 'No data found' });
    }
  } catch (error) {
    console.error('Error fetching data from Google Sheets:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
});

// Endpoint to handle order submission
app.post('/submit-order', (req, res) => {
  const orderDetails = req.body;

  const mailOptions = {
    from: 'officialninostore@gmail.com',
    to: 'epiclegend1298@gmail.com',
    subject: 'New Order Submitted',
    text: `Order Details:\n${JSON.stringify(orderDetails, null, 2)}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      return res.status(500).send(error.toString());
    }
    res.status(200).send('Order submitted successfully');
  });
});

// Endpoint to handle contact form submission
app.post('/submit-contact', (req, res) => {
  const { name, email, message } = req.body;

  const mailOptions = {
    from: 'officialninostore@gmail.com',
    to: 'epiclegend1298@gmail.com',
    subject: 'New Contact Form Submission',
    text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      return res.status(500).send(error.toString());
    }
    res.status(200).send('Message sent successfully');
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
