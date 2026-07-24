
const sgMail = require('@sendgrid/mail');

class EmailService {
  constructor() {
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    }
  }
  
  /**
   * Send a nudge email to a learner
   */
  async sendNudge(learner) {
    try {
      // For MVP, we use SendGrid
      // You could also use nodemailer, AWS SES, etc.
      
      const msg = {
        to: learner.email,
        from: process.env.FROM_EMAIL || 'noreply.momentumiq@gmail.com',
        subject: '📚 We miss you! Stay on track with your learning',
        html: this.getNudgeTemplate(learner),
        text: this.getNudgeText(learner)
      };
      
      if (process.env.SENDGRID_API_KEY) {
        await sgMail.send(msg);
        return { success: true };
      } else {
        // Fallback: Log email (for development)
        console.log('📧 Email would be sent to:', learner.email);
        console.log('📧 Subject:', msg.subject);
        console.log('📧 Body:', msg.text);
        return { success: true };
      }
      
    } catch (error) {
      console.error('❌ Email send failed:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * HTML Email Template
   */
  getNudgeTemplate(learner) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4A90D9; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; padding: 12px 24px; background: #4A90D9; color: white; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>We Miss You! 🌟</h1>
          </div>
          <div class="content">
            <h2>Hi ${learner.name || 'Learner'},</h2>
            <p>We noticed you haven't been active in your course lately. Your learning journey is important to us!</p>
            <p>Don't let your progress slip away. <strong>Log in today</strong> and continue where you left off.</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="#" class="button">Continue Learning Now</a>
            </p>
            <p>Complete just one assignment or watch one video - every step counts!</p>
            <p>We're here to help you succeed. 💪</p>
            <p>Best regards,<br>The MomentumIQ Team</p>
          </div>
          <div class="footer">
            <p>You're receiving this because we care about your learning progress.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
  
  /**
   * Plain text email template (fallback)
   */
  getNudgeText(learner) {
    return `
      We Miss You! 🌟
      
      Hi ${learner.name || 'Learner'},
      
      We noticed you haven't been active in your course lately. Your learning journey is important to us!
      
      Don't let your progress slip away. Log in today and continue where you left off.
      
      Complete just one assignment or watch one video - every step counts!
      
      We're here to help you succeed. 💪
      
      Best regards,
      The MomentumIQ Team
    `;
  }
}

module.exports = new EmailService();