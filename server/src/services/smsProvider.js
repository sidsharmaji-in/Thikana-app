// Pluggable SMS OTP Provider Engine (Slice P2 Production Architecture)
// Supports Mock (Local/CI), Twilio India, and MSG91 (DLT Compliant)

function normalizeIndianPhone(phone) {
  if (!phone || typeof phone !== 'string') return null;
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // +919876543210
  if (/^\+91[6-9]\d{9}$/.test(cleaned)) {
    return cleaned;
  }
  // 9876543210 (10 digits starting with 6-9)
  if (/^[6-9]\d{9}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }
  // 09876543210 (with leading 0)
  if (/^0[6-9]\d{9}$/.test(cleaned)) {
    return `+91${cleaned.slice(1)}`;
  }
  
  return null;
}

class MockSmsProvider {
  constructor() {
    this.sentMessages = [];
  }

  async sendOtp(phone, otpCode) {
    const record = {
      phone,
      otpCode,
      message: `[GharDekho] Your verification code is ${otpCode}. Valid for 10 minutes. Do not share this OTP with anyone.`,
      sentAt: new Date().toISOString()
    };
    this.sentMessages.push(record);
    if (process.env.NODE_ENV !== 'test') {
      console.log(`📱 [Mock SMS Provider] To: ${phone} | Body: "${record.message}"`);
    }
    return {
      success: true,
      provider: 'mock',
      messageId: `mock-msg-${Date.now()}`
    };
  }

  getLastOtp(phone) {
    const matches = this.sentMessages.filter(m => m.phone === phone);
    return matches.length > 0 ? matches[matches.length - 1].otpCode : null;
  }

  clearHistory() {
    this.sentMessages = [];
  }
}

class TwilioSmsProvider {
  constructor(config = {}) {
    this.accountSid = config.accountSid || process.env.TWILIO_ACCOUNT_SID;
    this.authToken = config.authToken || process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = config.fromNumber || process.env.TWILIO_PHONE_NUMBER;
  }

  async sendOtp(phone, otpCode) {
    if (!this.accountSid || !this.authToken) {
      throw new Error('Twilio credentials not configured in environment (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)');
    }

    const https = require('https');
    const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
    const body = new URLSearchParams({
      To: phone,
      From: this.fromNumber,
      Body: `Your GharDekho OTP is ${otpCode}. Valid for 10 minutes.`
    }).toString();

    return new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'api.twilio.com',
        path: `/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(body)
        }
      }, (res) => {
        let resBody = '';
        res.on('data', chunk => resBody += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true, provider: 'twilio', data: JSON.parse(resBody) });
          } else {
            reject(new Error(`Twilio SMS API error: HTTP ${res.statusCode} ${resBody}`));
          }
        });
      });

      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }
}

class Msg91SmsProvider {
  constructor(config = {}) {
    this.authKey = config.authKey || process.env.MSG91_AUTH_KEY;
    this.templateId = config.templateId || process.env.MSG91_TEMPLATE_ID;
  }

  async sendOtp(phone, otpCode) {
    if (!this.authKey) {
      throw new Error('MSG91 credentials not configured in environment (MSG91_AUTH_KEY)');
    }

    const https = require('https');
    const cleanPhone = phone.replace('+', '');
    const payload = JSON.stringify({
      template_id: this.templateId,
      short_url: '0',
      recipients: [
        {
          mobiles: cleanPhone,
          otp: otpCode
        }
      ]
    });

    return new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'control.msg91.com',
        path: '/api/v5/flow/',
        method: 'POST',
        headers: {
          'authkey': this.authKey,
          'content-type': 'application/json',
          'content-length': Buffer.byteLength(payload)
        }
      }, (res) => {
        let resBody = '';
        res.on('data', chunk => resBody += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true, provider: 'msg91', data: JSON.parse(resBody) });
          } else {
            reject(new Error(`MSG91 API error: HTTP ${res.statusCode} ${resBody}`));
          }
        });
      });

      req.on('error', reject);
      req.write(payload);
      req.end();
    });
  }
}

// Global Singleton for mock in tests
const defaultMockProvider = new MockSmsProvider();

function getSmsProvider() {
  const providerType = (process.env.SMS_PROVIDER || 'mock').toLowerCase();
  if (providerType === 'twilio') {
    return new TwilioSmsProvider();
  }
  if (providerType === 'msg91') {
    return new Msg91SmsProvider();
  }
  return defaultMockProvider;
}

module.exports = {
  getSmsProvider,
  defaultMockProvider,
  MockSmsProvider,
  TwilioSmsProvider,
  Msg91SmsProvider,
  normalizeIndianPhone
};

