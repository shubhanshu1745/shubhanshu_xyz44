import nodemailer from 'nodemailer';
import cryptoRandomString from 'crypto-random-string';
import { storage } from '../storage';
import { InsertToken } from '@shared/schema';

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.EMAIL_PORT || '2525'),
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
  },
});

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
      const verificationUrl = `${process.env.APP_URL || 'http://localhost:5000'}/verify-email?token=${token}`;
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'cricket@example.com',
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
      const resetUrl = `${process.env.APP_URL || 'http://localhost:5000'}/reset-password?token=${token}`;
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'cricket@example.com',
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