import { NextRequest, NextResponse } from 'next/server';
const nodemailer = require('nodemailer');

export async function GET() {
  try {
    // Check SMTP configuration
    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
      return NextResponse.json({
        error: 'SMTP configuration missing',
        config: {
          email: !!process.env.SMTP_EMAIL,
          password: !!process.env.SMTP_PASSWORD,
        }
      }, { status: 500 });
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD.replace(/\s/g, ''),
      },
    });

    // Test the connection
    await transporter.verify();

    return NextResponse.json({
      success: true,
      message: 'SMTP configuration is valid',
      email: process.env.SMTP_EMAIL,
      passwordLength: process.env.SMTP_PASSWORD.replace(/\s/g, '').length,
    });

  } catch (error) {
    console.error('SMTP test failed:', error);
    
    return NextResponse.json({
      error: 'SMTP test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      email: process.env.SMTP_EMAIL,
      passwordLength: process.env.SMTP_PASSWORD ? process.env.SMTP_PASSWORD.replace(/\s/g, '').length : 0,
    }, { status: 500 });
  }
}