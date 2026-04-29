const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'onboarding@resend.dev';

async function sendWelcomeEmail(to, name) {
  // In Resend test mode, only send to the verified email address
  const testEmail = process.env.RESEND_TEST_EMAIL || 'ikuzwesimpa@gmail.com';
  const recipient = (to === testEmail || !process.env.RESEND_API_KEY?.startsWith('re_')) ? to : testEmail;
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [recipient],
      subject: 'Welcome to Simba Supermarket!',
      html: `
        <h1>Welcome to Simba Supermarket, ${name}!</h1>
        <p>Thank you for registering with Simba Supermarket Kigali.</p>
        <p>You can now shop online, pick up at any of our 9 branches, and enjoy fast grocery delivery across Rwanda.</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}" style="display:inline-block;padding:12px 24px;background:#f97316;color:#fff;text-decoration:none;border-radius:8px;margin:16px 0">Start Shopping</a>
        <p style="color:#666;font-size:0.9rem">Simba Supermarket — Fresh groceries, delivered fast.</p>
      `
    });
    if (error) console.error('Resend welcome email error:', error);
    else console.log(`Welcome email sent to ${recipient}:`, data?.id);
  } catch (err) {
    console.error('Failed to send welcome email:', err.message);
  }
}

async function sendPasswordResetEmail(to, resetToken) {
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5000'}#reset?token=${resetToken}`;
  // In Resend test mode, only send to the verified email address
  const testEmail = process.env.RESEND_TEST_EMAIL || 'ikuzwesimpa@gmail.com';
  const recipient = (to === testEmail || !process.env.RESEND_API_KEY?.startsWith('re_')) ? to : testEmail;
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [recipient],
      subject: 'Simba Supermarket — Password Reset',
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested a password reset for your Simba Supermarket account.</p>
        <p>Click the link below to reset your password (valid for 1 hour):</p>
        <a href="${resetLink}" style="display:inline-block;padding:12px 24px;background:#f97316;color:#fff;text-decoration:none;border-radius:8px;margin:16px 0">Reset Password</a>
        <p style="color:#666;font-size:0.9rem">If you did not request this, you can safely ignore this email.</p>
        <p style="color:#999;font-size:0.8rem">Or copy this link: ${resetLink}</p>
      `
    });
    if (error) console.error('Resend reset email error:', error);
    else console.log(`Password reset email sent to ${recipient}:`, data?.id);
  } catch (err) {
    console.error('Failed to send reset email:', err.message);
  }
}

async function sendOrderConfirmationEmail(to, name, order) {
  // In Resend test mode, only send to the verified email address
  const testEmail = process.env.RESEND_TEST_EMAIL || 'ikuzwesimpa@gmail.com';
  const recipient = (to === testEmail || !process.env.RESEND_API_KEY?.startsWith('re_')) ? to : testEmail;
  try {
    const itemsHtml = (order.items || []).map(item =>
      `<tr><td style="padding:8px;border-bottom:1px solid #eee">${item.name}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${item.quantity} x ${Number(item.price).toLocaleString()} RWF</td></tr>`
    ).join('');
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [recipient],
      subject: `Order Confirmation #${order.id.slice(0, 8).toUpperCase()}`,
      html: `
        <h2>Thank you for your order, ${name}!</h2>
        <p>Your order <strong>#${order.id.slice(0, 8).toUpperCase()}</strong> has been confirmed.</p>
        <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:16px 0">
          <table style="width:100%;border-collapse:collapse">
            <thead><tr><th style="text-align:left;padding:8px">Item</th><th style="text-align:right;padding:8px">Price</th></tr></thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <hr style="border:none;border-top:1px solid #ddd;margin:12px 0">
          <p><strong>Total: ${Number(order.total_price).toLocaleString()} RWF</strong></p>
          <p><strong>Status:</strong> ${order.status}</p>
          ${order.branch_name ? `<p><strong>Pickup Branch:</strong> ${order.branch_name}</p>` : ''}
          ${order.pickup_time_slot ? `<p><strong>Pickup Slot:</strong> ${order.pickup_time_slot}</p>` : ''}
        </div>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}#orders" style="display:inline-block;padding:12px 24px;background:#f97316;color:#fff;text-decoration:none;border-radius:8px;margin:16px 0">View Order</a>
        <p style="color:#666;font-size:0.9rem">Simba Supermarket — Fresh groceries, delivered fast.</p>
      `
    });
    if (error) console.error('Resend order email error:', error);
    else console.log(`Order confirmation email sent to ${recipient}:`, data?.id);
  } catch (err) {
    console.error('Failed to send order confirmation:', err.message);
  }
}

module.exports = { sendWelcomeEmail, sendPasswordResetEmail, sendOrderConfirmationEmail };
