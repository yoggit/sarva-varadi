import { BaseNotifier } from './base-notifier';
import { NotificationData, EmailOptions } from '../types';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

export class EmailNotifier extends BaseNotifier {
  private transporter: nodemailer.Transporter;

  constructor(private options: EmailOptions) {
    super();
    this.transporter = nodemailer.createTransport(this.options.smtp);
  }

  async send(data: NotificationData): Promise<void> {
    const { summary, reportUrl, failedTests } = data;

    const statusEmoji = this.getStatusEmoji(summary.passRate);
    const duration = this.formatDuration(summary.duration);

    const htmlBody = this.generateEmailHtml(summary, duration, statusEmoji, reportUrl, failedTests);

    const subject = this.options.subject || `${statusEmoji} Test Results - ${summary.passRate}% Pass Rate`;

    const mailOptions: nodemailer.SendMailOptions = {
      from: this.options.from,
      to: this.options.to.join(', '),
      subject,
      html: htmlBody,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('✅ Email notification sent');
    } catch (error) {
      console.error('Error sending email notification:', error);
    }
  }

  private generateEmailHtml(
    summary: any,
    duration: string,
    statusEmoji: string,
    reportUrl?: string,
    failedTests?: Array<{ name: string; error: string }>
  ): string {
    const failedSection = failedTests && failedTests.length > 0
      ? `
        <div style="margin-top: 20px;">
          <h3 style="color: #f85149;">Failed Tests</h3>
          <ul style="list-style: none; padding: 0;">
            ${failedTests.slice(0, 10).map(t => `
              <li style="padding: 8px; background: #fff; border-left: 3px solid #f85149; margin: 5px 0;">
                <strong>${t.name}</strong>
              </li>
            `).join('')}
            ${failedTests.length > 10 ? `<li style="padding: 8px; color: #666;">...and ${failedTests.length - 10} more</li>` : ''}
          </ul>
        </div>
      `
      : '';

    const reportLink = reportUrl
      ? `<a href="${reportUrl}" style="display: inline-block; padding: 10px 20px; background: #0969da; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">View Full Report</a>`
      : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #24292f; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f6f8fa; }
          .header { background: #fff; padding: 20px; border-radius: 8px; text-align: center; }
          .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 20px; }
          .stat { background: #fff; padding: 15px; border-radius: 6px; text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
          .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${statusEmoji} Test Results</h1>
            <p style="color: #666;">${new Date(summary.timestamp).toLocaleString()}</p>
          </div>

          <div class="stats">
            <div class="stat">
              <div class="stat-value">${summary.total}</div>
              <div class="stat-label">Total</div>
            </div>
            <div class="stat">
              <div class="stat-value" style="color: ${summary.passRate >= 95 ? '#3fb950' : summary.passRate >= 80 ? '#d29922' : '#f85149'};">${summary.passRate}%</div>
              <div class="stat-label">Pass Rate</div>
            </div>
            <div class="stat">
              <div class="stat-value">${duration}</div>
              <div class="stat-label">Duration</div>
            </div>
            <div class="stat">
              <div class="stat-value" style="color: #3fb950;">✅ ${summary.passed}</div>
              <div class="stat-label">Passed</div>
            </div>
            <div class="stat">
              <div class="stat-value" style="color: #f85149;">❌ ${summary.failed}</div>
              <div class="stat-label">Failed</div>
            </div>
            <div class="stat">
              <div class="stat-value" style="color: #8b949e;">⏭️ ${summary.skipped}</div>
              <div class="stat-label">Skipped</div>
            </div>
          </div>

          ${failedSection}

          <div style="text-align: center;">
            ${reportLink}
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
