const sgMail = require('@sendgrid/mail');

// Set SendGrid API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
const sendOTPEmail = async (email, otp, name) => {
  const msg = {
    to: email,
    from: process.env.EMAIL_FROM, // Must match your verified sender in SendGrid
    subject: 'Verify Your Eventora Account',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 2px dashed #a855f7; padding: 20px; margin: 20px 0; text-align: center; border-radius: 10px; }
          .otp-code { font-size: 32px; font-weight: bold; color: #a855f7; letter-spacing: 5px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✨ Eventora</h1>
            <p>Your Gateway to Unforgettable Experiences</p>
          </div>
          <div class="content">
            <h2>Hello ${name}!</h2>
            <p>Thank you for signing up with Eventora. To complete your registration, please verify your email address using the OTP below:</p>
            
            <div class="otp-box">
              <p style="margin: 0; color: #666;">Your OTP Code</p>
              <div class="otp-code">${otp}</div>
              <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">Valid for 10 minutes</p>
            </div>
            
            <p>If you didn't create an account with Eventora, please ignore this email.</p>
            <p>Best regards,<br>The Eventora Team</p>
          </div>
          <div class="footer">
            <p>© 2025 Eventora. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await sgMail.send(msg);
    console.log('✅ OTP email sent successfully to:', email);
    console.log('📧 OTP Code:', otp); // For development - remove in production
  } catch (error) {
    console.error('❌ Error sending email:', error);
    if (error.response) {
      console.error('SendGrid Error Details:', error.response.body);
    }
    throw new Error('Failed to send OTP email. Please check your SendGrid configuration.');
  }
};

// Send password reset OTP email
const sendPasswordResetOTP = async (email, otp, name) => {
  const msg = {
    to: email,
    from: process.env.EMAIL_FROM,
    subject: 'Reset Your Eventora Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 2px dashed #a855f7; padding: 20px; margin: 20px 0; text-align: center; border-radius: 10px; }
          .otp-code { font-size: 32px; font-weight: bold; color: #a855f7; letter-spacing: 5px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✨ Eventora</h1>
            <p>Password Reset Request</p>
          </div>
          <div class="content">
            <h2>Hello ${name}!</h2>
            <p>We received a request to reset your password for your Eventora account. Use the OTP below to reset your password:</p>
            
            <div class="otp-box">
              <p style="margin: 0; color: #666;">Your Password Reset OTP</p>
              <div class="otp-code">${otp}</div>
              <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">Valid for 10 minutes</p>
            </div>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong> If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
            </div>
            
            <p>Best regards,<br>The Eventora Team</p>
          </div>
          <div class="footer">
            <p>© 2025 Eventora. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await sgMail.send(msg);
    console.log('✅ Password reset OTP email sent successfully to:', email);
    console.log('📧 Password Reset OTP Code:', otp); // For development - remove in production
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    if (error.response) {
      console.error('SendGrid Error Details:', error.response.body);
    }
    throw new Error('Failed to send password reset OTP email. Please check your SendGrid configuration.');
  }
};

// Send booking confirmation email
const sendBookingConfirmationEmail = async (email, name, booking) => {
  const event = booking.event;
  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const formattedTime = event.time || '18:00';

  // Format selected seats
  let seatsInfo = '';
  if (booking.selectedSeats && booking.selectedSeats.length > 0) {
    const seatLabels = booking.selectedSeats.map(seat => `${seat.row}${seat.seatNumber}`).join(', ');
    seatsInfo = `<p><strong>Selected Seats:</strong> ${seatLabels}</p>`;
  } else {
    seatsInfo = `<p><strong>Tickets:</strong> ${booking.numberOfTickets} ticket(s)</p>`;
  }

  const msg = {
    to: email,
    from: process.env.EMAIL_FROM,
    subject: `Booking Confirmed - ${event.title}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .booking-details { background: white; padding: 20px; margin: 20px 0; border-radius: 10px; border-left: 4px solid #a855f7; }
          .detail-row { margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #eee; }
          .detail-row:last-child { border-bottom: none; }
          .detail-label { font-weight: bold; color: #666; }
          .detail-value { color: #333; margin-top: 5px; }
          .success-badge { background: #10b981; color: white; padding: 10px 20px; border-radius: 20px; display: inline-block; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .qr-code { text-align: center; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✨ Eventora</h1>
            <p>Your Booking is Confirmed!</p>
          </div>
          <div class="content">
            <div style="text-align: center;">
              <div class="success-badge">✓ Booking Confirmed</div>
            </div>
            
            <h2>Hello ${name}!</h2>
            <p>Your booking has been confirmed successfully. We're excited to have you join us!</p>
            
            <div class="booking-details">
              <h3 style="margin-top: 0; color: #a855f7;">Booking Details</h3>
              
              <div class="detail-row">
                <div class="detail-label">Booking Reference</div>
                <div class="detail-value" style="font-size: 18px; font-weight: bold; color: #a855f7;">${booking.bookingReference || 'N/A'}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Event</div>
                <div class="detail-value">${event.title}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Date & Time</div>
                <div class="detail-value">${formattedDate} at ${formattedTime}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Venue</div>
                <div class="detail-value">${event.venue}, ${event.location}</div>
              </div>
              
              ${seatsInfo}
              
              <div class="detail-row">
                <div class="detail-label">Total Amount</div>
                <div class="detail-value" style="font-size: 20px; font-weight: bold; color: #10b981;">₹${booking.totalPrice}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Payment Status</div>
                <div class="detail-value">
                  <span style="background: #10b981; color: white; padding: 5px 10px; border-radius: 5px; font-size: 12px;">
                    ${booking.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>
            
            <p><strong>Important:</strong> Please arrive at least 15 minutes before the event starts. Bring a valid ID and this booking confirmation.</p>
            
            <p>If you have any questions or need to make changes to your booking, please contact us at support@eventora.com</p>
            
            <p>We look forward to seeing you at the event!</p>
            <p>Best regards,<br>The Eventora Team</p>
          </div>
          <div class="footer">
            <p>© 2025 Eventora. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await sgMail.send(msg);
    console.log('✅ Booking confirmation email sent successfully to:', email);
  } catch (error) {
    console.error('❌ Error sending booking confirmation email:', error);
    if (error.response) {
      console.error('SendGrid Error Details:', error.response.body);
    }
    throw new Error('Failed to send booking confirmation email.');
  }
};

module.exports = { generateOTP, sendOTPEmail, sendPasswordResetOTP, sendBookingConfirmationEmail };