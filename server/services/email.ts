import sgMail from '@sendgrid/mail';

// Initialize SendGrid if API key is available
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

const baseUrl = process.env.NODE_ENV === 'production' 
  ? process.env.FRONTEND_URL || 'https://yourdomain.com'
  : 'http://localhost:5000';

/**
 * Send email verification link
 */
export async function sendVerificationEmail(email: string, token: string, userName: string): Promise<void> {
  if (!SENDGRID_API_KEY) {
    console.log('📧 [MOCK] Email verification token for', email, ':', token);
    return;
  }

  const verificationLink = `${baseUrl}/verify?token=${token}&type=email`;

  const msg = {
    to: email,
    from: FROM_EMAIL,
    subject: 'Verify Your Email Address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome, ${userName}!</h2>
        <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
        <a href="${verificationLink}" style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
          Verify Email Address
        </a>
        <p>Or click this link: <a href="${verificationLink}">${verificationLink}</a></p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, please ignore this email.</p>
        <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">If you're having trouble clicking the button, copy and paste the URL above into your web browser.</p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log('✅ Verification email sent to', email);
  } catch (error) {
    console.error('❌ Failed to send verification email:', error);
    throw new Error('Failed to send verification email');
  }
}

/**
 * Send account approval notification
 */
export async function sendApprovalNotification(email: string, userName: string): Promise<void> {
  if (!SENDGRID_API_KEY) {
    console.log('📧 [MOCK] Approval notification for', email);
    return;
  }

  const msg = {
    to: email,
    from: FROM_EMAIL,
    subject: 'Your Account Has Been Approved',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Congratulations, ${userName}!</h2>
        <p>Your account has been approved by our administrator.</p>
        <p>You can now access all features of the platform. Please login to get started:</p>
        <a href="${baseUrl}/login" style="background-color: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
          Login Now
        </a>
        <p>If you have any questions, please contact our support team.</p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log('✅ Approval notification sent to', email);
  } catch (error) {
    console.error('❌ Failed to send approval notification:', error);
  }
}

/**
 * Send account rejection notification
 */
export async function sendRejectionNotification(email: string, userName: string, reason?: string): Promise<void> {
  if (!SENDGRID_API_KEY) {
    console.log('📧 [MOCK] Rejection notification for', email);
    return;
  }

  const msg = {
    to: email,
    from: FROM_EMAIL,
    subject: 'Account Registration Update',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hello ${userName},</h2>
        <p>We regret to inform you that your account registration has been rejected.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        <p>If you believe this is an error or would like to reapply, please contact our support team.</p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log('✅ Rejection notification sent to', email);
  } catch (error) {
    console.error('❌ Failed to send rejection notification:', error);
  }
}

/**
 * Send invitation email
 */
export async function sendInviteEmail(email: string, inviteCode: string, invitedBy: string): Promise<void> {
  if (!SENDGRID_API_KEY) {
    console.log('📧 [MOCK] Invite code for', email, ':', inviteCode);
    return;
  }

  const registrationLink = `${baseUrl}/register?invite=${inviteCode}`;

  const msg = {
    to: email,
    from: FROM_EMAIL,
    subject: "You're Invited to Join Our Platform",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>You're Invited!</h2>
        <p>${invitedBy} has invited you to join our platform.</p>
        <p><strong>Your Invite Code:</strong> <code style="background: #f3f4f6; padding: 5px 10px; border-radius: 3px;">${inviteCode}</code></p>
        <p>Click the button below to register:</p>
        <a href="${registrationLink}" style="background-color: #8B5CF6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
          Register Now
        </a>
        <p>This invite code will expire soon. Please use it promptly.</p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log('✅ Invite email sent to', email);
  } catch (error) {
    console.error('❌ Failed to send invite email:', error);
    throw new Error('Failed to send invite email');
  }
}
