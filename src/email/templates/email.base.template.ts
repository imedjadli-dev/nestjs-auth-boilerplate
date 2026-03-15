export interface BaseTemplateOptions {
  title: string; // shown in <title> and pre-header
  preheader?: string; // hidden preview text in email clients
  content: string; // inner HTML injected into the body card
}

/**
 * Single source of truth for the email shell:
 * brand bar, wrapper, card, footer.
 * Every email template only provides `content`.
 */
export function baseEmailTemplate({
  title,
  preheader = '',
  content,
}: BaseTemplateOptions): string {
  return /* html */ `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml><o:OfficeDocumentSettings>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings></xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background-color: #0b0f1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f0f4ff; -webkit-font-smoothing: antialiased; }
    a { color: #4f9cf9; }
    img { border: 0; display: block; max-width: 100%; }
    table { border-collapse: collapse; mso-table-lspace: 0; mso-table-rspace: 0; }

    /* Layout */
    .email-wrapper { width: 100%; background-color: #0b0f1a; padding: 40px 16px; }
    .email-card    { max-width: 520px; margin: 0 auto; background-color: #111827; border: 1px solid rgba(255,255,255,0.07); border-radius: 18px; overflow: hidden; box-shadow: 0 32px 64px rgba(0,0,0,0.5); }

    /* Brand header */
    .email-header  { padding: 28px 36px; border-bottom: 1px solid rgba(255,255,255,0.07); background: linear-gradient(135deg, #0d1626, #0f1d33); }
    .brand         { display: flex; align-items: center; gap: 10px; }
    .brand-icon    { width: 30px; height: 30px; background-color: #4f9cf9; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
    .brand-name    { font-size: 13px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: #8a97b0; }

    /* Content body */
    .email-body    { padding: 32px 36px; }
    .email-title   { font-size: 20px; font-weight: 700; color: #f0f4ff; margin-bottom: 8px; line-height: 1.3; }
    .email-intro   { font-size: 14px; color: #8a97b0; font-weight: 300; line-height: 1.6; margin-bottom: 24px; }
    .divider       { border: none; border-top: 1px solid rgba(255,255,255,0.07); margin: 24px 0; }
    .security-note { font-size: 13px; color: #3d4e68; line-height: 1.6; font-weight: 300; }

    /* Info rows */
    .info-block    { background-color: #0d1626; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 18px 20px; margin-bottom: 20px; }
    .info-row      { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
    .info-row:last-child { border-bottom: none; }
    .info-label    { font-size: 12px; color: #3d4e68; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; }
    .info-value    { font-size: 13px; color: #8a97b0; font-weight: 400; text-align: right; max-width: 60%; }

    /* OTP code */
    .otp-block     { background-color: #0d1626; border: 1px solid rgba(79,156,249,0.2); border-radius: 12px; padding: 20px 24px; margin-bottom: 20px; position: relative; }
    .otp-accent    { position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: linear-gradient(180deg, #4f9cf9, transparent); border-radius: 0 2px 2px 0; }
    .otp-label     { font-size: 11px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: #3d4e68; margin-bottom: 10px; }
    .otp-code      { font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 700; letter-spacing: 10px; color: #4f9cf9; line-height: 1; }

    /* Notice */
    .notice        { display: flex; gap: 10px; background: rgba(255,200,80,0.05); border: 1px solid rgba(255,200,80,0.12); border-radius: 10px; padding: 14px 16px; margin-bottom: 20px; }
    .notice-text   { font-size: 13px; color: #b8a050; line-height: 1.55; }
    .notice-text strong { color: #f5c842; font-weight: 600; }

    /* CTA Button */
    .btn           { display: inline-block; background-color: #4f9cf9; color: #ffffff !important; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 10px; letter-spacing: .02em; margin-top: 4px; }

    /* Status badges */
    .badge-success { display: inline-block; background: rgba(52,199,89,0.12); border: 1px solid rgba(52,199,89,0.25); color: #34c759; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px; letter-spacing: .04em; text-transform: uppercase; }
    .badge-danger  { display: inline-block; background: rgba(255,69,58,0.1); border: 1px solid rgba(255,69,58,0.2); color: #ff453a; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px; letter-spacing: .04em; text-transform: uppercase; }

    /* Footer */
    .email-footer  { border-top: 1px solid rgba(255,255,255,0.07); padding: 18px 36px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
    .footer-copy   { font-size: 12px; color: #3d4e68; }
    .footer-links  { font-size: 12px; color: #3d4e68; }
    .footer-links a { color: #3d4e68; text-decoration: none; margin-left: 14px; }

    @media (max-width: 480px) {
      .email-header, .email-body { padding-left: 20px; padding-right: 20px; }
      .email-footer { padding-left: 20px; padding-right: 20px; flex-direction: column; align-items: flex-start; }
      .otp-code { font-size: 26px; letter-spacing: 6px; }
      .info-row { flex-direction: column; align-items: flex-start; gap: 2px; }
      .info-value { text-align: left; max-width: 100%; }
    }
  </style>
</head>
<body>
  <!-- Preheader (hidden preview text) -->
  <span style="display:none;font-size:1px;color:#0b0f1a;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    ${preheader}
  </span>

  <div class="email-wrapper">
    <div class="email-card">

      <!-- Brand Header -->
      <div class="email-header">
        <div class="brand">
          <div class="brand-icon">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>
              <circle cx="8" cy="8" r="2" fill="white"/>
            </svg>
          </div>
          <span class="brand-name">Jadli Solution</span>
        </div>
      </div>

      <!-- Dynamic Content -->
      <div class="email-body">
        ${content}
      </div>

      <!-- Footer -->
      <div class="email-footer">
        <span class="footer-copy">&copy; ${new Date().getFullYear()} Your Company. All rights reserved.</span>
        <span class="footer-links">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Support</a>
        </span>
      </div>

    </div>
  </div>
</body>
</html>
  `.trim();
}
