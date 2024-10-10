// server.js
const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail', // or another service
  auth: {
    user: 'everygame68@gmail.com',
    pass: 'your_email_password', // Use an App Password if 2FA is enabled
  },
});

// Endpoint to send email
app.post('/send-email', (req, res) => {
  const { email, loanId } = req.body;

  const mailOptions = {
    from: 'everygame68@gmail.com',
    to: email,
    subject: `Loan Approval for Loan ID: ${loanId}`,
    text: `Your loan request with ID: ${loanId} has been approved!`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).send(error.toString());
    }
    res.status(200).send('Email sent: ' + info.response);
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
