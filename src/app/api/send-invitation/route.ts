import { NextRequest, NextResponse } from 'next/server';
const nodemailer = require('nodemailer');

export async function POST(request: NextRequest) {
  try {
    const { email, organizationName, role, inviterName, token } = await request.json();

    // Validate required fields
    if (!email || !organizationName || !role || !token) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check SMTP configuration
    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
      console.error('SMTP configuration missing');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    // Create transporter (using Gmail SMTP)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD.replace(/\s/g, ''), // Remove any spaces from app password
      },
    });

    // Test the connection
    try {
      await transporter.verify();
      console.log('SMTP connection verified');
    } catch (verifyError) {
      console.error('SMTP verification failed:', verifyError);
      return NextResponse.json(
        { error: 'Email service configuration error' },
        { status: 500 }
      );
    }

    // Create invitation link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
    const invitationUrl = `${baseUrl}/accept-invitation?token=${token}`;

    // Email HTML template with SignalCX branding
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Team Invitation - ${organizationName}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; 
          line-height: 1.6; 
          color: #334155; 
          background-color: #f8fafc;
          padding: 20px;
        }
        .email-container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .header { 
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white; 
          padding: 40px 30px; 
          text-align: center;
        }
        .logo-section {
          margin-bottom: 20px;
        }
        .logo-text {
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.5px;
          margin-bottom: 8px;
        }
        .tagline {
          font-size: 16px;
          opacity: 0.9;
          font-weight: 400;
        }
        .header h1 { 
          font-size: 24px; 
          font-weight: 600; 
          margin: 0;
          opacity: 0.95;
        }
        .content { 
          padding: 40px 30px;
          background: white;
        }
        .greeting {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 20px;
        }
        .invitation-text {
          font-size: 16px;
          margin-bottom: 25px;
          color: #475569;
        }
        .organization-name {
          color: #8b5cf6;
          font-weight: 600;
        }
        .inviter-name {
          color: #1e293b;
          font-weight: 600;
        }
        .role-section {
          background: #faf5ff;
          border: 1px solid #e9d5ff;
          border-radius: 8px;
          padding: 16px;
          margin: 25px 0;
          text-align: center;
        }
        .role-label {
          font-size: 14px;
          color: #581c87;
          margin-bottom: 8px;
          font-weight: 500;
        }
        .role-badge { 
          background: #8b5cf6;
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .cta-section {
          text-align: center;
          margin: 35px 0;
        }
        .accept-button { 
          display: inline-block;
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
          padding: 14px 32px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.2s;
          box-shadow: 0 4px 6px -1px rgba(139, 92, 246, 0.2);
        }
        .accept-button:hover {
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          transform: translateY(-1px);
          box-shadow: 0 6px 8px -1px rgba(139, 92, 246, 0.3);
        }
        .capabilities {
          background: #f8fafc;
          border-radius: 8px;
          padding: 20px;
          margin: 25px 0;
        }
        .capabilities h3 {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 12px;
        }
        .capabilities ul {
          list-style: none;
          padding: 0;
        }
        .capabilities li {
          padding: 6px 0;
          color: #475569;
          position: relative;
          padding-left: 20px;
        }
        .capabilities li:before {
          content: '✓';
          position: absolute;
          left: 0;
          color: #8b5cf6;
          font-weight: bold;
        }
        .platform-info {
          background: #f1f5f9;
          border-left: 4px solid #8b5cf6;
          padding: 16px;
          margin: 25px 0;
          border-radius: 0 6px 6px 0;
        }
        .platform-info p {
          margin: 0;
          font-style: italic;
          color: #64748b;
        }
        .expiry-notice {
          background: #fefce8;
          border: 1px solid #fde047;
          border-radius: 6px;
          padding: 16px;
          margin: 25px 0;
          font-size: 14px;
          color: #713f12;
        }
        .footer { 
          background: #f8fafc;
          padding: 30px;
          text-align: center;
          font-size: 14px;
          color: #64748b;
          border-top: 1px solid #e2e8f0;
        }
        .footer p {
          margin: 8px 0;
        }
        .powered-by {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          font-size: 12px;
          color: #94a3b8;
        }
        @media (max-width: 600px) {
          .email-container { margin: 10px; }
          .header, .content, .footer { padding: 25px 20px; }
          .accept-button { padding: 12px 24px; font-size: 15px; }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <div class="logo-section">
            <div class="logo-text">SignalCX</div>
            <div class="tagline">AI-Powered Support Analytics</div>
          </div>
          <h1>You're Invited to Join Our Team</h1>
        </div>
        
        <div class="content">
          <div class="greeting">Hello!</div>
          
          <div class="invitation-text">
            <span class="inviter-name">${inviterName || 'A team administrator'}</span> has invited you to join 
            <span class="organization-name">${organizationName}</span> on SignalCX.
          </div>
          
          <div class="role-section">
            <div class="role-label">Your assigned role:</div>
            <span class="role-badge">${role.replace('_', ' ')}</span>
          </div>
          
          <div class="platform-info">
            <p>SignalCX is an AI-powered support ticket analytics platform that helps teams optimize customer support operations with advanced insights and predictive analytics.</p>
          </div>
          
          <div class="cta-section">
            <a href="${invitationUrl}" class="accept-button">Accept Invitation</a>
          </div>
          
          <div class="capabilities">
            <h3>What you can do with your ${role.replace('_', ' ')} role:</h3>
            <ul>
              ${getRoleCapabilities(role)}
            </ul>
          </div>
          
          <div class="expiry-notice">
            <strong>⏰ Important:</strong> This invitation will expire in 7 days. If you don't have a Google account with this email address, you'll need to create one to accept the invitation.
          </div>
        </div>
        
        <div class="footer">
          <p>This invitation was sent by <strong>${organizationName}</strong> using SignalCX.</p>
          <p>If you believe you received this email in error, you can safely ignore it.</p>
          <div class="powered-by">
            Powered by SignalCX • AI-Driven Support Excellence
          </div>
        </div>
      </div>
    </body>
    </html>
    `;

    // Send email
    const mailOptions = {
      from: `"${organizationName}" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: `Invitation to join ${organizationName} on SignalCX`,
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);

    return NextResponse.json({ 
      success: true, 
      message: 'Invitation email sent successfully',
      messageId: result.messageId 
    });

  } catch (error) {
    console.error('Error sending invitation email:', error);
    
    // More detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error ? error.stack : 'No stack trace';
    
    console.error('Error details:', errorDetails);
    
    return NextResponse.json(
      { 
        error: 'Failed to send invitation email',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

function getRoleCapabilities(role: string): string {
  const capabilities = {
    readonly: [
      'View tickets and analytics dashboards',
      'Access reports and insights',
      'View team performance metrics'
    ],
    agent: [
      'Handle and manage support tickets',
      'Use AI-powered analysis tools',
      'Access customer interaction history',
      'View personal performance metrics'
    ],
    manager: [
      'Oversee team performance and reporting',
      'Access advanced analytics and forecasting',
      'Manage agent assignments and workflows',
      'Generate executive reports'
    ],
    org_admin: [
      'Full organizational control and settings',
      'Manage team members and roles',
      'Configure integrations and data sources',
      'Access all features and administrative tools'
    ]
  };

  const roleCapabilities = capabilities[role as keyof typeof capabilities] || capabilities.readonly;
  return roleCapabilities.map(capability => `<li>${capability}</li>`).join('');
}