const nodemailer = require("nodemailer");
require("dotenv").config();

const MailTransporter = (email, otp, url) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "v8734219@gmail.com",
      pass: process.env.node_mailer_password,
    },
  });

  const mailOptions = {
    from: "v8734219@gmail.com",
    to: email,
    subject: "OTP for Email Verification",
    html: `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Verification</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    padding: 20px;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    padding: 20px;
                    border-radius: 5px;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                }
                h1 {
                    color: #333;
                }

                p {
                    font-size: 16px;
                    line-height: 1.5;
                    color: #666;
                }
                .otp {
                    font-size: 24px;
                    font-weight: bold;
                    color: #007bff;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Email Verification</h1>
                <p>Thank you for signing up. To complete your registration, please enter the OTP below:</p>
                ${
                  otp
                    ? `<p>Your OTP for Email Verification is: <span class="otp">${otp}</span></p>
                    <p>If you did not request this OTP, please ignore this email.</p>`
                    : `<a href="${url}"><button>Authenticate Email</button></a>`
                }
            </div>
        </body>
        </html>`,
  };

  return { mailOptions, transporter };
};

module.exports = { MailTransporter };
