// Security Enhancement Service
// Handles input validation, XSS prevention, CSRF protection, and security monitoring

import { z } from "zod";

// Security event log (in-memory, would use database in production)
const securityEvents: SecurityEvent[] = [];

export interface SecurityEvent {
  id: number;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  userId?: number;
  ipAddress?: string;
  details: string;
  timestamp: Date;
}

export interface ValidationResult {
  isValid: boolean;
  sanitized?: string;
  errors?: string[];
}

export interface SecurityCheckResult {
  passed: boolean;
  threats: string[];
  recommendations: string[];
}

let eventIdCounter = 1;

// Common validation schemas
export const validationSchemas = {
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),

  email: z.string()
    .email("Invalid email address")
    .max(255, "Email too long"),

  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),

  content: z.string()
    .max(2000, "Content too long")
    .transform(val => val.trim()),

  bio: z.string()
    .max(150, "Bio must be at most 150 characters")
    .optional(),

  url: z.string()
    .url("Invalid URL")
    .optional()
};

export class SecurityService {

  // ==================== INPUT VALIDATION ====================

  // Validate and sanitize text input
  validateTextInput(input: string, maxLength: number = 2000): ValidationResult {
    const errors: string[] = [];

    if (!input || typeof input !== "string") {
      return { isValid: false, errors: ["Input must be a string"] };
    }

    if (input.length > maxLength) {
      errors.push(`Input exceeds maximum length of ${maxLength}`);
    }

    // Sanitize HTML entities
    const sanitized = this.sanitizeHtml(input);

    return {
      isValid: errors.length === 0,
      sanitized,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  // Validate username
  validateUsername(username: string): ValidationResult {
    try {
      validationSchemas.username.parse(username);
      return { isValid: true, sanitized: username.toLowerCase() };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { 
          isValid: false, 
          errors: error.errors.map(e => e.message) 
        };
      }
      return { isValid: false, errors: ["Invalid username"] };
    }
  }

  // Validate email
  validateEmail(email: string): ValidationResult {
    try {
      validationSchemas.email.parse(email);
      return { isValid: true, sanitized: email.toLowerCase().trim() };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { 
          isValid: false, 
          errors: error.errors.map(e => e.message) 
        };
      }
      return { isValid: false, errors: ["Invalid email"] };
    }
  }

  // Validate password strength
  validatePassword(password: string): ValidationResult {
    try {
      validationSchemas.password.parse(password);
      return { isValid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { 
          isValid: false, 
          errors: error.errors.map(e => e.message) 
        };
      }
      return { isValid: false, errors: ["Invalid password"] };
    }
  }

  // ==================== XSS PREVENTION ====================

  // Sanitize HTML to prevent XSS
  sanitizeHtml(input: string): string {
    const htmlEntities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#x27;",
      "/": "&#x2F;",
      "`": "&#x60;",
      "=": "&#x3D;"
    };

    return input.replace(/[&<>"'`=/]/g, char => htmlEntities[char] || char);
  }

  // Check for potential XSS patterns
  detectXssPatterns(input: string): string[] {
    const patterns = [
      { regex: /<script\b[^>]*>/gi, name: "script_tag" },
      { regex: /javascript:/gi, name: "javascript_protocol" },
      { regex: /on\w+\s*=/gi, name: "event_handler" },
      { regex: /<iframe\b[^>]*>/gi, name: "iframe_tag" },
      { regex: /data:/gi, name: "data_protocol" },
      { regex: /expression\s*\(/gi, name: "css_expression" }
    ];

    const detected: string[] = [];
    for (const pattern of patterns) {
      if (pattern.regex.test(input)) {
        detected.push(pattern.name);
      }
    }

    return detected;
  }

  // ==================== CSRF PROTECTION ====================

  // Generate CSRF token
  generateCsrfToken(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let token = "";
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  // Validate CSRF token
  validateCsrfToken(token: string, expectedToken: string): boolean {
    if (!token || !expectedToken) return false;
    if (token.length !== expectedToken.length) return false;
    
    // Constant-time comparison to prevent timing attacks
    let result = 0;
    for (let i = 0; i < token.length; i++) {
      result |= token.charCodeAt(i) ^ expectedToken.charCodeAt(i);
    }
    return result === 0;
  }


  // ==================== SQL INJECTION PREVENTION ====================

  // Check for SQL injection patterns
  detectSqlInjection(input: string): boolean {
    const patterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER)\b)/gi,
      /(--)|(\/\*)|(\*\/)/g,
      /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/gi,
      /'\s*(OR|AND)\s+'[^']*'\s*=\s*'[^']*'/gi
    ];

    for (const pattern of patterns) {
      if (pattern.test(input)) {
        return true;
      }
    }

    return false;
  }

  // ==================== SECURITY MONITORING ====================

  // Log security event
  logSecurityEvent(
    type: string,
    severity: SecurityEvent["severity"],
    details: string,
    userId?: number,
    ipAddress?: string
  ): SecurityEvent {
    const event: SecurityEvent = {
      id: eventIdCounter++,
      type,
      severity,
      userId,
      ipAddress,
      details,
      timestamp: new Date()
    };

    securityEvents.push(event);

    // Keep only last 1000 events
    if (securityEvents.length > 1000) {
      securityEvents.shift();
    }

    // Log critical events
    if (severity === "critical") {
      console.error(`[SECURITY CRITICAL] ${type}: ${details}`);
    }

    return event;
  }

  // Get recent security events
  getSecurityEvents(
    filters: {
      type?: string;
      severity?: string;
      userId?: number;
      since?: Date;
    } = {},
    limit: number = 50
  ): SecurityEvent[] {
    let filtered = [...securityEvents];

    if (filters.type) {
      filtered = filtered.filter(e => e.type === filters.type);
    }

    if (filters.severity) {
      filtered = filtered.filter(e => e.severity === filters.severity);
    }

    if (filters.userId) {
      filtered = filtered.filter(e => e.userId === filters.userId);
    }

    if (filters.since) {
      filtered = filtered.filter(e => e.timestamp >= filters.since!);
    }

    return filtered
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Detect suspicious activity
  detectSuspiciousActivity(
    userId: number,
    ipAddress: string
  ): SecurityCheckResult {
    const threats: string[] = [];
    const recommendations: string[] = [];

    // Check for multiple failed logins
    const recentEvents = this.getSecurityEvents({
      userId,
      type: "failed_login",
      since: new Date(Date.now() - 15 * 60 * 1000) // Last 15 minutes
    });

    if (recentEvents.length >= 5) {
      threats.push("Multiple failed login attempts detected");
      recommendations.push("Consider implementing account lockout");
    }

    // Check for unusual IP activity
    const ipEvents = this.getSecurityEvents({
      type: "login",
      since: new Date(Date.now() - 60 * 60 * 1000) // Last hour
    }).filter(e => e.ipAddress === ipAddress);

    if (ipEvents.length > 10) {
      threats.push("High activity from single IP address");
      recommendations.push("Consider rate limiting this IP");
    }

    return {
      passed: threats.length === 0,
      threats,
      recommendations
    };
  }

  // ==================== PRIVACY COMPLIANCE ====================

  // Anonymize user data for GDPR compliance
  anonymizeUserData(userData: Record<string, unknown>): Record<string, unknown> {
    const sensitiveFields = ["email", "phoneNumber", "fullName", "location", "bio"];
    const anonymized = { ...userData };

    for (const field of sensitiveFields) {
      if (anonymized[field]) {
        anonymized[field] = "[REDACTED]";
      }
    }

    return anonymized;
  }

  // Generate data export for user
  generateDataExport(userId: number): {
    format: string;
    fields: string[];
    instructions: string;
  } {
    return {
      format: "JSON",
      fields: [
        "profile_information",
        "posts",
        "comments",
        "likes",
        "followers",
        "following",
        "messages",
        "stories",
        "settings"
      ],
      instructions: "Data export will be prepared and sent to your email within 48 hours."
    };
  }

  // ==================== SECURITY HEADERS ====================

  // Get recommended security headers
  getSecurityHeaders(): Record<string, string> {
    return {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
      "Content-Security-Policy": "default-src 'self'; img-src 'self' data: https:; script-src 'self'",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
    };
  }

  // ==================== STATISTICS ====================

  // Get security statistics
  getSecurityStats(): {
    totalEvents: number;
    criticalEvents: number;
    recentThreats: number;
    topEventTypes: { type: string; count: number }[];
  } {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentEvents = securityEvents.filter(e => e.timestamp >= oneHourAgo);

    // Count by type
    const typeCounts = new Map<string, number>();
    for (const event of securityEvents) {
      typeCounts.set(event.type, (typeCounts.get(event.type) || 0) + 1);
    }

    const topEventTypes = Array.from(typeCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalEvents: securityEvents.length,
      criticalEvents: securityEvents.filter(e => e.severity === "critical").length,
      recentThreats: recentEvents.filter(e => 
        e.severity === "high" || e.severity === "critical"
      ).length,
      topEventTypes
    };
  }
}

// Export singleton instance
export const securityService = new SecurityService();
