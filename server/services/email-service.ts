import nodemailer from 'nodemailer';
import cryptoRandomString from 'crypto-random-string';
import { storage } from '../storage';
import { InsertToken } from '@shared/schema';

// Check if email credentials are available
const hasEmailCredentials = 
  process.env.EMAIL_USER && 
  process.env.EMAIL_PASS && 
  process.env.EMAIL_USER.length > 0 && 
  process.env.EMAIL_PASS.length > 0;

// Configure email transporter
let transporter: nodemailer.Transporter;
let testAccount: nodemailer.TestAccount | null = null;

// Initialize Ethereal test account for development if no credentials provided
async function getTestTransporter() {
  if (!testAccount) {
    try {
      // Create a test account on Ethereal.email (fake SMTP service)
      testAccount = await nodemailer.createTestAccount();
      
      // Create reusable transporter using the test account
      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } catch (error) {
      console.error('Failed to create test account:', error);
      return null;
    }
  } else {
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }
}

if (hasEmailCredentials) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.EMAIL_PORT || '2525'),
    auth: {
      user: process.env.EMAIL_USER || '',
      pass: process.env.EMAIL_PASS || '',
    },
  });
} else {
  // For development, use a test account or log to console
  console.log('No email credentials found. Using ethereal email for testing.');
  // We'll create test account when needed in the send methods
}

export const EmailService = {
  // Generate a unique token for verification or password reset
  generateToken: async (userId: number, type: 'email_verification' | 'password_reset'): Promise<string> => {
    // Generate a random token
    const tokenValue = cryptoRandomString({ length: 32, type: 'url-safe' });
    
    // Create token expiration time (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    // Save token to database
    const tokenData: InsertToken = {
      userId,
      token: tokenValue,
      type,
      expiresAt,
    };
    
    await storage.createToken(tokenData);
    return tokenValue;
  },
  
  // Send verification email
  sendVerificationEmail: async (email: string, userId: number): Promise<boolean> => {
    try {
      const token = await EmailService.generateToken(userId, 'email_verification');
      const verificationUrl = `${process.env.APP_URL || 'http://localhost:5000'}/api/verify-email?token=${token}`;
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'cricsocial@example.com',
        to: email,
        subject: 'Verify your CricSocial account',
        html: `
          <h1>Welcome to CricSocial!</h1>
          <p>Please click the link below to verify your email address:</p>
          <p><a href="${verificationUrl}">Verify Email</a></p>
          <p>This link will expire in 24 hours.</p>
          <p>If you did not create an account, please ignore this email.</p>
        `,
      };
      
      if (!hasEmailCredentials) {
        // In development, try to use Ethereal email for testing
        try {
          const testTransporter = await getTestTransporter();
          if (testTransporter) {
            const info = await testTransporter.sendMail(mailOptions);
            
            // Log the verification info to console
            console.log('===============================================');
            console.log('VERIFICATION EMAIL (Ethereal Test Mode)');
            console.log('===============================================');
            console.log(`To: ${email}`);
            console.log(`Verification URL: ${verificationUrl}`);
            console.log(`Token: ${token}`);
            console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
            console.log('===============================================');
          } else {
            // If creating test transporter failed, just log to console
            console.log('===============================================');
            console.log('VERIFICATION EMAIL (Development Mode)');
            console.log('===============================================');
            console.log(`To: ${email}`);
            console.log(`Verification URL: ${verificationUrl}`);
            console.log(`Token: ${token}`);
            console.log('===============================================');
          }
        } catch (etherealError) {
          console.error('Error using Ethereal email:', etherealError);
          // Fallback to console logging
          console.log('===============================================');
          console.log('VERIFICATION EMAIL (Development Mode)');
          console.log('===============================================');
          console.log(`To: ${email}`);
          console.log(`Verification URL: ${verificationUrl}`);
          console.log(`Token: ${token}`);
          console.log('===============================================');
        }
        return true;
      }
      
      await transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending verification email:', error);
      return false;
    }
  },
  
  // Send password reset email
  sendPasswordResetEmail: async (email: string, userId: number): Promise<boolean> => {
    try {
      const token = await EmailService.generateToken(userId, 'password_reset');
      const resetUrl = `${process.env.APP_URL || 'http://localhost:5000'}/?token=${token}`;
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'cricsocial@example.com',
        to: email,
        subject: 'Reset your CricSocial password',
        html: `
          <h1>Password Reset Request</h1>
          <p>You requested to reset your password. Please click the link below to set a new password:</p>
          <p><a href="${resetUrl}">Reset Password</a></p>
          <p>This link will expire in 24 hours.</p>
          <p>If you did not request a password reset, please ignore this email.</p>
        `,
      };
      
      if (!hasEmailCredentials) {
        // In development, try to use Ethereal email for testing
        try {
          const testTransporter = await getTestTransporter();
          if (testTransporter) {
            const info = await testTransporter.sendMail(mailOptions);
            
            // Log the reset info to console with Ethereal preview URL
            console.log('===============================================');
            console.log('PASSWORD RESET EMAIL (Ethereal Test Mode)');
            console.log('===============================================');
            console.log(`To: ${email}`);
            console.log(`Reset URL: ${resetUrl}`);
            console.log(`Token: ${token}`);
            console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
            console.log('===============================================');
          } else {
            // If creating test transporter failed, just log to console
            console.log('===============================================');
            console.log('PASSWORD RESET EMAIL (Development Mode)');
            console.log('===============================================');
            console.log(`To: ${email}`);
            console.log(`Reset URL: ${resetUrl}`);
            console.log(`Token: ${token}`);
            console.log('===============================================');
          }
        } catch (etherealError) {
          console.error('Error using Ethereal email:', etherealError);
          // Fallback to console logging
          console.log('===============================================');
          console.log('PASSWORD RESET EMAIL (Development Mode)');
          console.log('===============================================');
          console.log(`To: ${email}`);
          console.log(`Reset URL: ${resetUrl}`);
          console.log(`Token: ${token}`);
          console.log('===============================================');
        }
        return true;
      }
      
      await transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }
  },
  
  // Verify a token
  verifyToken: async (token: string, type: 'email_verification' | 'password_reset'): Promise<number | null> => {
    try {
      const tokenObj = await storage.getTokenByToken(token);
      
      if (!tokenObj || tokenObj.type !== type) {
        return null;
      }
      
      // Check if token is expired
      const now = new Date();
      if (tokenObj.expiresAt < now) {
        // Delete expired token
        await storage.deleteToken(tokenObj.id);
        return null;
      }
      
      return tokenObj.userId;
    } catch (error) {
      console.error('Error verifying token:', error);
      return null;
    }
  },
  
  // Consume a token (delete it after use)
  consumeToken: async (token: string): Promise<boolean> => {
    try {
      const tokenObj = await storage.getTokenByToken(token);
      if (!tokenObj) {
        return false;
      }
      
      return await storage.deleteToken(tokenObj.id);
    } catch (error) {
      console.error('Error consuming token:', error);
      return false;
    }
  }
};