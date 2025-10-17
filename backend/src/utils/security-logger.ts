/**
 * Security Event Logger
 *
 * Centralized security event logging for monitoring and alerting
 * Logs security-relevant events like:
 * - Failed login attempts
 * - Unauthorized access attempts
 * - Suspicious activity patterns
 * - Data access violations
 * - Rate limit breaches
 */

import { Request } from 'express';

export enum SecurityEventType {
  // Authentication events
  LOGIN_FAILED = 'login_failed',
  LOGIN_SUCCESS = 'login_success',
  REGISTER_FAILED = 'register_failed',
  REGISTER_SUCCESS = 'register_success',
  LOGOUT = 'logout',
  TOKEN_EXPIRED = 'token_expired',
  TOKEN_INVALID = 'token_invalid',

  // Authorization events
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  FORBIDDEN_RESOURCE = 'forbidden_resource',
  PERMISSION_DENIED = 'permission_denied',

  // Rate limiting events
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  RATE_LIMIT_AUTH = 'rate_limit_auth',
  RATE_LIMIT_AI = 'rate_limit_ai',

  // Suspicious activity
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  MULTIPLE_FAILED_LOGINS = 'multiple_failed_logins',
  UNUSUAL_ACCESS_PATTERN = 'unusual_access_pattern',
  POTENTIAL_BRUTE_FORCE = 'potential_brute_force',

  // Data events
  SENSITIVE_DATA_ACCESS = 'sensitive_data_access',
  DATA_EXPORT_REQUEST = 'data_export_request',
  DATA_DELETION_REQUEST = 'data_deletion_request',

  // System events
  SECURITY_CONFIG_CHANGE = 'security_config_change',
  ADMIN_ACTION = 'admin_action',
}

export enum SecuritySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface SecurityEvent {
  type: SecurityEventType;
  severity: SecuritySeverity;
  userId?: string;
  ip?: string;
  userAgent?: string;
  path?: string;
  method?: string;
  message: string;
  details?: any;
  timestamp: string;
}

class SecurityLogger {
  private events: SecurityEvent[] = [];
  private readonly MAX_EVENTS_IN_MEMORY = 1000;

  /**
   * Log a security event
   */
  log(event: Omit<SecurityEvent, 'timestamp'>): void {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    // Add to in-memory store (for potential alerting)
    this.events.push(fullEvent);
    if (this.events.length > this.MAX_EVENTS_IN_MEMORY) {
      this.events.shift(); // Remove oldest event
    }

    // Console logging with color coding
    const logLevel = this.getLogLevel(event.severity);
    const logMessage = this.formatLogMessage(fullEvent);

    console[logLevel](`[SECURITY] ${logMessage}`, {
      ...fullEvent,
      // Sanitize potentially sensitive data
      details: this.sanitizeDetails(event.details),
    });

    // In production, you would also:
    // 1. Send to Sentry/DataDog/CloudWatch
    // 2. Store in database for audit trail
    // 3. Trigger alerts for critical events
    this.handleAlerts(fullEvent);
  }

  /**
   * Log a security event from an Express request
   */
  logFromRequest(
    req: Request,
    type: SecurityEventType,
    severity: SecuritySeverity,
    message: string,
    details?: any
  ): void {
    this.log({
      type,
      severity,
      userId: (req as any).user?.id,
      ip: this.getClientIp(req),
      userAgent: req.headers['user-agent'],
      path: req.path,
      method: req.method,
      message,
      details,
    });
  }

  /**
   * Log failed login attempt
   */
  logFailedLogin(req: Request, email: string, reason: string): void {
    this.logFromRequest(
      req,
      SecurityEventType.LOGIN_FAILED,
      SecuritySeverity.MEDIUM,
      `Failed login attempt for ${email}`,
      { email, reason }
    );

    // Check for potential brute force
    this.checkBruteForce(this.getClientIp(req), email);
  }

  /**
   * Log successful login
   */
  logSuccessfulLogin(req: Request, userId: string, email: string): void {
    this.logFromRequest(
      req,
      SecurityEventType.LOGIN_SUCCESS,
      SecuritySeverity.LOW,
      `Successful login for ${email}`,
      { userId, email }
    );
  }

  /**
   * Log unauthorized access attempt
   */
  logUnauthorizedAccess(req: Request, reason: string): void {
    this.logFromRequest(
      req,
      SecurityEventType.UNAUTHORIZED_ACCESS,
      SecuritySeverity.HIGH,
      `Unauthorized access attempt`,
      { reason }
    );
  }

  /**
   * Log rate limit exceeded
   */
  logRateLimitExceeded(req: Request, limitType: string): void {
    this.logFromRequest(
      req,
      SecurityEventType.RATE_LIMIT_EXCEEDED,
      SecuritySeverity.MEDIUM,
      `Rate limit exceeded: ${limitType}`,
      { limitType }
    );
  }

  /**
   * Log suspicious activity
   */
  logSuspiciousActivity(req: Request, description: string, details?: any): void {
    this.logFromRequest(
      req,
      SecurityEventType.SUSPICIOUS_ACTIVITY,
      SecuritySeverity.HIGH,
      `Suspicious activity detected: ${description}`,
      details
    );
  }

  /**
   * Get recent security events
   */
  getRecentEvents(limit: number = 100): SecurityEvent[] {
    return this.events.slice(-limit);
  }

  /**
   * Get events by type
   */
  getEventsByType(type: SecurityEventType): SecurityEvent[] {
    return this.events.filter((event) => event.type === type);
  }

  /**
   * Get events by severity
   */
  getEventsBySeverity(severity: SecuritySeverity): SecurityEvent[] {
    return this.events.filter((event) => event.severity === severity);
  }

  /**
   * Get events for a specific IP
   */
  getEventsByIp(ip: string): SecurityEvent[] {
    return this.events.filter((event) => event.ip === ip);
  }

  /**
   * Get events for a specific user
   */
  getEventsByUser(userId: string): SecurityEvent[] {
    return this.events.filter((event) => event.userId === userId);
  }

  /**
   * Private helper methods
   */

  private getLogLevel(severity: SecuritySeverity): 'log' | 'warn' | 'error' {
    switch (severity) {
      case SecuritySeverity.LOW:
        return 'log';
      case SecuritySeverity.MEDIUM:
        return 'warn';
      case SecuritySeverity.HIGH:
      case SecuritySeverity.CRITICAL:
        return 'error';
    }
  }

  private formatLogMessage(event: SecurityEvent): string {
    const severityEmoji = {
      [SecuritySeverity.LOW]: 'ℹ️',
      [SecuritySeverity.MEDIUM]: '⚠️',
      [SecuritySeverity.HIGH]: '🚨',
      [SecuritySeverity.CRITICAL]: '🔥',
    };

    return `${severityEmoji[event.severity]} [${event.type}] ${event.message}`;
  }

  private sanitizeDetails(details: any): any {
    if (!details) return details;

    const sanitized = { ...details };

    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'creditCard'];
    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private getClientIp(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.headers['x-real-ip'] ||
      req.socket.remoteAddress ||
      'unknown'
    ).toString();
  }

  private checkBruteForce(ip: string, email: string): void {
    const recentFailedLogins = this.events.filter(
      (event) =>
        event.type === SecurityEventType.LOGIN_FAILED &&
        event.ip === ip &&
        new Date(event.timestamp).getTime() > Date.now() - 15 * 60 * 1000 // Last 15 minutes
    );

    if (recentFailedLogins.length >= 5) {
      this.log({
        type: SecurityEventType.POTENTIAL_BRUTE_FORCE,
        severity: SecuritySeverity.CRITICAL,
        ip,
        message: `Potential brute force attack detected from ${ip}`,
        details: {
          email,
          attemptCount: recentFailedLogins.length,
          timeWindow: '15 minutes',
        },
      });
    }
  }

  private handleAlerts(event: SecurityEvent): void {
    // In production, implement alerting logic here:
    // - Send email for critical events
    // - Send Slack/Discord notification
    // - Trigger PagerDuty for critical issues
    // - Log to monitoring service (Sentry, DataDog, etc.)

    if (event.severity === SecuritySeverity.CRITICAL) {
      console.error('🚨 CRITICAL SECURITY EVENT 🚨', {
        type: event.type,
        message: event.message,
        timestamp: event.timestamp,
      });

      // TODO: Implement actual alerting
      // await sendSlackAlert(event);
      // await sendEmailAlert(event);
    }
  }
}

// Export singleton instance
export const securityLogger = new SecurityLogger();

/**
 * Helper functions for common security logging patterns
 */

export function logAuthFailure(req: Request, email: string, reason: string): void {
  securityLogger.logFailedLogin(req, email, reason);
}

export function logAuthSuccess(req: Request, userId: string, email: string): void {
  securityLogger.logSuccessfulLogin(req, userId, email);
}

export function logUnauthorized(req: Request, reason: string = 'No token provided'): void {
  securityLogger.logUnauthorizedAccess(req, reason);
}

export function logRateLimit(req: Request, limitType: string): void {
  securityLogger.logRateLimitExceeded(req, limitType);
}

export function logSuspicious(req: Request, description: string, details?: any): void {
  securityLogger.logSuspiciousActivity(req, description, details);
}
