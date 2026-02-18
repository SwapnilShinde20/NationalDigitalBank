const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({

  host: "smtp.gmail.com",

  port: 587,

  secure: false,

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },

  tls: {
    rejectUnauthorized: false
  },

  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000

});

// Verify connection configuration
transporter.verify(function (error, success) {
  if (error) {
    console.log("SMTP Connection Error:", error);
  } else {
    console.log("SMTP Server is ready to take our messages");
  }
});

exports.sendVerificationEmail = async (email, link) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Verify Your Email - National Digital Bank',
    html: `
      <div style="font-family: Helvetica, Arial, sans-serif; min-width: 1000px; overflow: auto; line-height: 2">
        <div style="margin: 50px auto; width: 70%; padding: 20px 0">
          <div style="border-bottom: 1px solid #eee">
            <a href="" style="font-size: 1.4em; color: #00466a; text-decoration: none; font-weight: 600">National Digital Bank</a>
          </div>
          <p style="font-size: 1.1em">Hi,</p>
          <p>Thank you for choosing National Digital Bank. Please click the link below to verify your email address. This link is valid for 15 minutes.</p>
          <a href="${link}" style="background: #00466a; margin: 0 auto; width: max-content; padding: 10px 20px; color: #fff; border-radius: 4px; text-decoration: none; display: block; text-align: center;">Verify Email</a>
          <p style="margin-top: 20px; font-size: 0.9em;">Or copy this link: <br/>${link}</p>
          <p style="font-size: 0.9em;">Regards,<br />National Digital Bank</p>
          <hr style="border: none; border-top: 1px solid #eee" />
          <div style="float: right; padding: 8px 0; color: #aaa; font-size: 0.8em; line-height: 1; font-weight: 300">
            <p>National Digital Bank Inc</p>
            <p>Financial District</p>
            <p>India</p>
          </div>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    console.log(`[DEMO FALLBACK] Verification Link for ${email}: ${link}`);
    return false;
  }
};
