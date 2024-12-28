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

// Load your Google service account credentials
const credentials = require('./nino.json');
const spreadsheetId = '1fHn5CxOoJpYtoqvom6SlX9weBW4JUNvqjTrEbqE7kL8'; // Replace with your spreadsheet ID

// Authenticate with Google Sheets API
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
    pass: 'tfyg rziu xzon cfxo' // Replace with your App Password
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