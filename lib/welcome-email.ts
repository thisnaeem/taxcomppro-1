import { escapeHtml } from "@/lib/email-template";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export const WELCOME_EMAIL_RAW_TEMPLATE = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>Welcome to Tax Comp Pro</title>
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,800;1,600&family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  body, table, td, a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
  table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
  img { -ms-interpolation-mode:bicubic; border:0; outline:none; text-decoration:none; }
  body { margin:0 !important; padding:0 !important; width:100% !important; background:#071120; background-image:linear-gradient(160deg,#071120 0%,#0a2342 40%,#0b3b3a 75%,#0d4a35 100%); }
  a { text-decoration:none; }
  .cta:hover { background:#f3d98b !important; }
  @media screen and (max-width:620px) {
    .container { width:100% !important; }
    .px { padding-left:24px !important; padding-right:24px !important; }
    .hero-title { font-size:38px !important; line-height:42px !important; }
    .col { display:block !important; width:100% !important; padding:0 0 14px 0 !important; }
    .cta { padding:16px 28px !important; font-size:14px !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background:#071120;">

<!-- Preheader -->
<div style="display:none; max-height:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:#071120;">
  You're in. Here's everything waiting for you inside Tax Comp Pro &mdash; and 4 quick steps to get started.
  &#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#071120" style="background:#071120; background-image:linear-gradient(160deg,#071120 0%,#0a2342 40%,#0b3b3a 75%,#0d4a35 100%);">
<tr>
<td align="center" style="padding:32px 12px;">

  <!-- CARD -->
  <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px; background:#0b1a30; background-image:linear-gradient(170deg,#0b1a30 0%,#0b2440 38%,#0b3340 68%,#0c4236 100%); border:1px solid rgba(243,217,139,0.25); border-radius:18px; overflow:hidden;">

    <!-- Gold top bar -->
    <tr><td height="6" style="height:6px; line-height:6px; font-size:0; background:#d4af37; background-image:linear-gradient(90deg,#b8892b,#f3d98b,#d4af37,#f3d98b,#b8892b);">&nbsp;</td></tr>

    <!-- Brand lockup -->
    <tr>
      <td align="center" class="px" style="padding:30px 48px 6px;">
        <p style="margin:0; font-family:'Montserrat','Helvetica Neue',Arial,sans-serif; font-size:13px; letter-spacing:6px; font-weight:700; color:#f3d98b;">TAX&nbsp;COMP&nbsp;PRO</p>
        <p style="margin:4px 0 0; font-family:'Montserrat','Helvetica Neue',Arial,sans-serif; font-size:10px; letter-spacing:2px; color:#8b9bb4; text-transform:uppercase;">The Network for Tax Professionals</p>
      </td>
    </tr>

    <!-- HERO -->
    <tr>
      <td align="center" class="px" style="padding:30px 48px 10px; background-image:radial-gradient(circle at 50% 0%, rgba(212,175,55,0.22) 0%, rgba(11,26,48,0) 65%);">
        <p style="margin:0 0 14px; font-size:18px; letter-spacing:10px; color:#d4af37;">&#10022; &#10023; &#10022;</p>
        <p style="margin:0 0 12px; font-family:'Montserrat','Helvetica Neue',Arial,sans-serif; font-size:11px; letter-spacing:4px; font-weight:700; color:#8b9bb4; text-transform:uppercase;">Membership Confirmed</p>
        <h1 class="hero-title" style="margin:0; font-family:'Playfair Display',Georgia,'Times New Roman',serif; font-size:50px; line-height:54px; font-weight:800; color:#ffffff;">
          Welcome to<br><span style="color:#f3d98b; font-style:italic; font-weight:600;">the Network.</span>
        </h1>
        <p style="margin:18px 0 0; font-family:'Playfair Display',Georgia,serif; font-size:18px; font-style:italic; color:#c9d3e3;">Your seat at the table is officially saved.</p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:26px auto 0;">
          <tr>
            <td width="60" style="border-top:1px solid #d4af37; font-size:0; line-height:0;">&nbsp;</td>
            <td style="padding:0 12px; color:#d4af37; font-size:12px; line-height:12px;">&#9670;</td>
            <td width="60" style="border-top:1px solid #d4af37; font-size:0; line-height:0;">&nbsp;</td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- INTRO -->
    <tr>
      <td class="px" style="padding:28px 56px 8px; font-family:'Montserrat','Helvetica Neue',Arial,sans-serif; font-size:15px; line-height:26px; color:#d6deea;">
        <p style="margin:0 0 18px;">Hi {{first_name}},</p>
        <p style="margin:0 0 18px;">We&rsquo;re so glad you&rsquo;re here. Tax Comp Pro was built for professionals like you &mdash; the people who power this industry &mdash; to <strong style="color:#f3d98b;">connect, learn, sell, and grow</strong> in one place.</p>
        <p style="margin:0;">This isn&rsquo;t just a platform. It&rsquo;s a community designed to <strong style="color:#7fe0b8;">grow you and your business</strong>. Here&rsquo;s a look at everything waiting for you inside.</p>
      </td>
    </tr>

    <!-- SECTION LABEL -->
    <tr>
      <td align="center" class="px" style="padding:34px 48px 16px;">
        <p style="margin:0; font-family:'Montserrat','Helvetica Neue',Arial,sans-serif; font-size:11px; letter-spacing:4px; font-weight:700; color:#d4af37; text-transform:uppercase;">&#10022;&nbsp; What&rsquo;s Inside &nbsp;&#10022;</p>
      </td>
    </tr>

    <!-- FEATURE GRID -->
    <tr>
      <td class="px" style="padding:0 40px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <!-- Row 1 -->
          <tr>
            <td class="col" width="50%" valign="top" style="padding:0 7px 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:rgba(7,17,32,0.45); border:1px solid rgba(139,155,180,0.28); border-radius:14px;">
                <tr><td style="padding:20px 20px 18px; font-family:'Montserrat','Helvetica Neue',Arial,sans-serif;">
                  <p style="margin:0 0 6px; font-family:'Playfair Display',Georgia,serif; font-size:19px; font-weight:800; color:#ffffff;">Atlas Academy</p>
                  <p style="margin:0 0 12px; font-size:13px; line-height:20px; color:#c9d3e3;">Courses, trainings, and toolkits built to sharpen your skills, strengthen your compliance, and grow your practice.</p>
                  <a href="https://www.taxcomppro.com/login" style="font-size:12px; font-weight:700; letter-spacing:1px; color:#f3d98b; text-transform:uppercase;">Start Learning&nbsp;&rarr;</a>
                </td></tr>
              </table>
            </td>
            <td class="col" width="50%" valign="top" style="padding:0 0 14px 7px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:rgba(7,17,32,0.45); border:1px solid rgba(139,155,180,0.28); border-radius:14px;">
                <tr><td style="padding:20px 20px 18px; font-family:'Montserrat','Helvetica Neue',Arial,sans-serif;">
                  <p style="margin:0 0 6px; font-family:'Playfair Display',Georgia,serif; font-size:19px; font-weight:800; color:#ffffff;">Pro Talks</p>
                  <p style="margin:0 0 12px; font-size:13px; line-height:20px; color:#c9d3e3;">Live workshops, breakout rooms, and audio/video AMAs with industry leaders. Join the audience, ask questions, or host your own.</p>
                  <a href="https://www.taxcomppro.com/pro-talks" style="font-size:12px; font-weight:700; letter-spacing:1px; color:#f3d98b; text-transform:uppercase;">See Upcoming Talks &rarr;</a>
                </td></tr>
              </table>
            </td>
          </tr>
          <!-- Row 2 -->
          <tr>
            <td class="col" width="50%" valign="top" style="padding:0 7px 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:rgba(7,17,32,0.45); border:1px solid rgba(139,155,180,0.28); border-radius:14px;">
                <tr><td style="padding:20px 20px 18px; font-family:'Montserrat','Helvetica Neue',Arial,sans-serif;">
                  <p style="margin:0 0 6px; font-family:'Playfair Display',Georgia,serif; font-size:19px; font-weight:800; color:#ffffff;">Pro Marketplace</p>
                  <p style="margin:0 0 12px; font-size:13px; line-height:20px; color:#c9d3e3;">Buy and sell toolkits, courses, office SOPs, software, and coaching &mdash; built by pros, for pros.</p>
                  <a href="https://www.taxcomppro.com/marketplace" style="font-size:12px; font-weight:700; letter-spacing:1px; color:#f3d98b; text-transform:uppercase;">Shop the Marketplace&nbsp;&rarr;</a>
                </td></tr>
              </table>
            </td>
            <td class="col" width="50%" valign="top" style="padding:0 0 14px 7px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:rgba(7,17,32,0.45); border:1px solid rgba(139,155,180,0.28); border-radius:14px;">
                <tr><td style="padding:20px 20px 18px; font-family:'Montserrat','Helvetica Neue',Arial,sans-serif;">
                  <p style="margin:0 0 6px; font-family:'Playfair Display',Georgia,serif; font-size:19px; font-weight:800; color:#ffffff;">Find a Pro</p>
                  <p style="margin:0 0 12px; font-size:13px; line-height:20px; color:#c9d3e3;">A nationwide directory of verified tax and business professionals. Get discovered &mdash; and find your next partner.</p>
                  <a href="https://www.taxcomppro.com/find-a-pro" style="font-size:12px; font-weight:700; letter-spacing:1px; color:#f3d98b; text-transform:uppercase;">Explore the Network &rarr;</a>
                </td></tr>
              </table>
            </td>
          </tr>
          <!-- Row 3 -->
          <tr>
            <td class="col" width="50%" valign="top" style="padding:0 7px 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:rgba(7,17,32,0.45); border:1px solid rgba(139,155,180,0.28); border-radius:14px;">
                <tr><td style="padding:20px 20px 18px; font-family:'Montserrat','Helvetica Neue',Arial,sans-serif;">
                  <p style="margin:0 0 6px; font-family:'Playfair Display',Georgia,serif; font-size:19px; font-weight:800; color:#ffffff;">Niche Groups</p>
                  <p style="margin:0 0 12px; font-size:13px; line-height:20px; color:#c9d3e3;">Join or build branded communities with discussion boards, live sessions, exclusive content, and masterclasses.</p>
                  <a href="https://www.taxcomppro.com/groups" style="font-size:12px; font-weight:700; letter-spacing:1px; color:#f3d98b; text-transform:uppercase;">Find Your Group &rarr;</a>
                </td></tr>
              </table>
            </td>
            <td class="col" width="50%" valign="top" style="padding:0 0 14px 7px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:rgba(7,17,32,0.45); border:1px solid rgba(139,155,180,0.28); border-radius:14px;">
                <tr><td style="padding:20px 20px 18px; font-family:'Montserrat','Helvetica Neue',Arial,sans-serif;">
                  <p style="margin:0 0 6px; font-family:'Playfair Display',Georgia,serif; font-size:19px; font-weight:800; color:#ffffff;">Pro Networks</p>
                  <p style="margin:0 0 12px; font-size:13px; line-height:20px; color:#c9d3e3;">Build your own network on Tax Comp Pro &mdash; bring your team together, share your expertise, and expand your reach.</p>
                  <a href="https://www.taxcomppro.com/login" style="font-size:12px; font-weight:700; letter-spacing:1px; color:#f3d98b; text-transform:uppercase;">Build Your Network&nbsp;&rarr;</a>
                </td></tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- GET STARTED STEPS -->
    <tr>
      <td class="px" style="padding:22px 48px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px dashed #d4af37; border-radius:14px; background:rgba(7,17,32,0.55);">
          <tr>
            <td align="center" style="padding:20px 20px 6px; font-family:'Montserrat','Helvetica Neue',Arial,sans-serif; font-size:11px; letter-spacing:3px; font-weight:700; color:#d4af37; text-transform:uppercase; white-space:nowrap;">
              &#10022;&nbsp; Get Started in 4 Steps &nbsp;&#10022;
            </td>
          </tr>
          <tr>
            <td style="padding:12px 26px 18px; font-family:'Montserrat','Helvetica Neue',Arial,sans-serif; font-size:14px; line-height:21px; color:#d6deea;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="44" valign="top" style="padding:0 0 16px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" valign="middle" width="30" height="30" style="width:30px; height:30px; border-radius:15px; background:#d4af37; background-image:linear-gradient(135deg,#f3d98b,#b8892b); font-family:'Playfair Display',Georgia,serif; font-size:15px; font-weight:800; color:#071120;">1</td></tr></table></td>
                  <td valign="top" style="padding:4px 0 16px;"><strong style="color:#fff;">Complete your profile.</strong> Add your credentials and specialties so clients and peers can find you.</td>
                </tr>
                <tr>
                  <td width="44" valign="top" style="padding:0 0 16px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" valign="middle" width="30" height="30" style="width:30px; height:30px; border-radius:15px; background:#d4af37; background-image:linear-gradient(135deg,#f3d98b,#b8892b); font-family:'Playfair Display',Georgia,serif; font-size:15px; font-weight:800; color:#071120;">2</td></tr></table></td>
                  <td valign="top" style="padding:4px 0 16px;"><strong style="color:#fff;">Join a group.</strong> Find your people and jump into the conversation.</td>
                </tr>
                <tr>
                  <td width="44" valign="top" style="padding:0 0 16px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" valign="middle" width="30" height="30" style="width:30px; height:30px; border-radius:15px; background:#d4af37; background-image:linear-gradient(135deg,#f3d98b,#b8892b); font-family:'Playfair Display',Georgia,serif; font-size:15px; font-weight:800; color:#071120;">3</td></tr></table></td>
                  <td valign="top" style="padding:4px 0 16px;"><strong style="color:#fff;">Explore Atlas Academy.</strong> Start a course and keep sharpening your edge.</td>
                </tr>
                <tr>
                  <td width="44" valign="top" style="padding:0;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" valign="middle" width="30" height="30" style="width:30px; height:30px; border-radius:15px; background:#d4af37; background-image:linear-gradient(135deg,#f3d98b,#b8892b); font-family:'Playfair Display',Georgia,serif; font-size:15px; font-weight:800; color:#071120;">4</td></tr></table></td>
                  <td valign="top" style="padding:4px 0 0;"><strong style="color:#fff;">Save a seat at a Pro Talk.</strong> Learn live and meet the community.</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- PRIMARY CTA -->
    <tr>
      <td align="center" class="px" style="padding:34px 48px 6px;">
        <p style="margin:0; font-family:'Playfair Display',Georgia,serif; font-size:24px; line-height:32px; font-weight:800; color:#ffffff;">
          You belong here.<br><span style="color:#f3d98b; font-style:italic; font-weight:600;">Let&rsquo;s build something great together.</span>
        </p>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding:24px 24px 8px;">
        <!--[if mso]>
        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://www.taxcomppro.com/login" style="height:54px;v-text-anchor:middle;width:300px;" arcsize="50%" stroke="f" fillcolor="#d4af37">
        <w:anchorlock/>
        <center style="color:#071120;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;letter-spacing:2px;">GO TO MY DASHBOARD &rarr;</center>
        </v:roundrect>
        <![endif]-->
        <!--[if !mso]><!-- -->
        <a href="https://www.taxcomppro.com/login" target="_blank" class="cta" style="display:inline-block; background:#d4af37; background-image:linear-gradient(135deg,#f3d98b 0%,#d4af37 55%,#b8892b 100%); color:#071120; font-family:'Montserrat','Helvetica Neue',Arial,sans-serif; font-size:15px; font-weight:700; letter-spacing:2px; text-transform:uppercase; padding:18px 42px; border-radius:50px; box-shadow:0 8px 24px rgba(212,175,55,0.35);">
          Go to My Dashboard &rarr;
        </a>
        <!--<![endif]-->
      </td>
    </tr>

    <!-- UPGRADE (optional: remove for paid-tier welcome) -->
    <tr>
      <td class="px" style="padding:30px 48px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:rgba(13,74,53,0.35); border:1px solid rgba(127,224,184,0.35); border-radius:14px;">
          <tr>
            <td style="padding:20px 24px; font-family:'Montserrat','Helvetica Neue',Arial,sans-serif; font-size:14px; line-height:22px; color:#d6deea;">
              <p style="margin:0 0 6px; font-size:11px; letter-spacing:3px; font-weight:700; color:#7fe0b8; text-transform:uppercase;">Ready for More?</p>
              <p style="margin:0 0 10px;">Upgrade to <strong style="color:#fff;">VIP</strong> for private messaging, training, and priority support &mdash; or go <strong style="color:#fff;">Marketplace Plus</strong> to sell your products, host live Pro Talks, and build your own network. <strong style="color:#f3d98b;">Paid plans include 2 months free.</strong></p>
              <a href="https://www.taxcomppro.com/login" style="font-size:12px; font-weight:700; letter-spacing:1px; color:#7fe0b8; text-transform:uppercase;">View Membership Plans &rarr;</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- AFFILIATE + SUPPORT -->
    <tr>
      <td class="px" style="padding:14px 48px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td class="col" width="50%" valign="top" style="padding:0 7px 0 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:rgba(7,17,32,0.45); border:1px solid rgba(139,155,180,0.28); border-radius:14px;">
                <tr><td style="padding:18px 20px; font-family:'Montserrat','Helvetica Neue',Arial,sans-serif; font-size:13px; line-height:20px; color:#c9d3e3;">
                  <p style="margin:0 0 4px; font-size:11px; letter-spacing:2px; font-weight:700; color:#d4af37; text-transform:uppercase;">Share &amp; Earn</p>
                  <p style="margin:0 0 8px;">Know a pro who belongs here? Join our affiliate program.</p>
                  <a href="https://affiliate.taxcomppro.com" style="font-size:12px; font-weight:700; color:#f3d98b;">Become an Affiliate &rarr;</a>
                </td></tr>
              </table>
            </td>
            <td class="col" width="50%" valign="top" style="padding:0 0 0 7px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:rgba(7,17,32,0.45); border:1px solid rgba(139,155,180,0.28); border-radius:14px;">
                <tr><td style="padding:18px 20px; font-family:'Montserrat','Helvetica Neue',Arial,sans-serif; font-size:13px; line-height:20px; color:#c9d3e3;">
                  <p style="margin:0 0 4px; font-size:11px; letter-spacing:2px; font-weight:700; color:#d4af37; text-transform:uppercase;">We&rsquo;re Here</p>
                  <p style="margin:0 0 8px;">Questions getting set up? Ask <strong style="color:#fff;">Atlas</strong>, our Website &amp; Product Support Assistant, anytime &mdash; or reach our team.</p>
                  <a href="https://www.taxcomppro.com/contact" style="font-size:12px; font-weight:700; color:#f3d98b;">Contact Support &rarr;</a>
                </td></tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- SIGN-OFF -->
    <tr>
      <td align="center" class="px" style="padding:40px 48px 36px;">
        <p style="margin:0 0 14px; font-size:14px; letter-spacing:8px; color:#d4af37;">&#10022; &#10023; &#10022;</p>
        <p style="margin:0; font-family:'Playfair Display',Georgia,serif; font-size:17px; font-style:italic; color:#c9d3e3;">Welcome to the family. We&rsquo;re glad you&rsquo;re in the room.</p>
        <p style="margin:14px 0 0; font-family:'Montserrat','Helvetica Neue',Arial,sans-serif; font-size:13px; letter-spacing:4px; font-weight:700; color:#ffffff; text-transform:uppercase;">Tax Comp Pro</p>
      </td>
    </tr>

    <!-- Gold bottom bar -->
    <tr><td height="4" style="height:4px; line-height:4px; font-size:0; background:#d4af37; background-image:linear-gradient(90deg,#b8892b,#f3d98b,#d4af37,#f3d98b,#b8892b);">&nbsp;</td></tr>
  </table>
  <!-- /CARD -->

  <!-- FOOTER -->
  <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">
    <tr>
      <td align="center" style="padding:22px 24px 8px; font-family:'Montserrat','Helvetica Neue',Arial,sans-serif; font-size:11px; line-height:18px; color:#7d8ca5;">
        You&rsquo;re receiving this email because you created a Tax Comp Pro account.<br>
        <a href="https://www.taxcomppro.com" style="color:#8b9bb4; text-decoration:underline;">taxcomppro.com</a>
        &nbsp;&bull;&nbsp;
        <a href="https://www.taxcomppro.com/community-guidelines" style="color:#8b9bb4; text-decoration:underline;">Community Guidelines</a>
        &nbsp;&bull;&nbsp;
        <a href="https://www.taxcomppro.com/privacy" style="color:#8b9bb4; text-decoration:underline;">Privacy</a>
      </td>
    </tr>
  </table>

</td>
</tr>
</table>
</body>
</html>`;

/**
 * Extracts the user's first name cleanly, falling back to a sensible default.
 */
export function extractFirstName(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts[0]) {
      const first = parts[0];
      return first.charAt(0).toUpperCase() + first.slice(1);
    }
  }
  if (email && email.includes("@")) {
    const localPart = email.split("@")[0].split(/[._-]/)[0];
    if (localPart && localPart.length > 1) {
      return localPart.charAt(0).toUpperCase() + localPart.slice(1);
    }
  }
  return "there";
}

/**
 * Renders the HTML for the welcome email with the recipient's first name.
 */
export function renderWelcomeEmailHtml({ firstName }: { firstName: string }): string {
  const safeName = escapeHtml(firstName);
  return WELCOME_EMAIL_RAW_TEMPLATE
    .replace(/\{\{\s*first_name\s*\}\}/g, safeName)
    .replace(/\{\{\s*userName\s*\}\}/g, safeName)
    .replace(/\{\{\s*name\s*\}\}/g, safeName);
}

export interface WelcomeEmailOptions {
  to: string;
  userName?: string | null;
}

/**
 * Sends the official Welcome to Tax Comp Pro email to a new member upon sign up.
 * Includes an idempotency check so members never receive duplicate welcome emails.
 */
export async function sendWelcomeEmail({
  to,
  userName,
}: WelcomeEmailOptions): Promise<{ success: boolean }> {
  const recipient = to.trim().toLowerCase();
  if (!recipient || !recipient.includes("@")) {
    return { success: false };
  }

  // Idempotency check: prevent duplicate welcome emails within 1 hour
  try {
    const alreadySent = await prisma.emailLog.findFirst({
      where: {
        recipient,
        templateKey: "WELCOME",
        status: "SENT",
      },
    });

    if (alreadySent) {
      console.log(`[WelcomeEmail] Welcome email already sent to ${recipient}. Skipping.`);
      return { success: true };
    }
  } catch (err) {
    console.warn("[WelcomeEmail] Could not check existing welcome logs:", err);
  }

  const firstName = extractFirstName(userName, recipient);

  // Check if a custom template is activated in the database
  try {
    const customTemplate = await prisma.emailTemplate.findUnique({
      where: { key: "WELCOME" },
    });

    if (customTemplate && customTemplate.isActive && customTemplate.bodyHtml?.trim()) {
      // If admin has specifically customized the bodyHtml, render it with variables
      const safeName = escapeHtml(firstName);
      let html = customTemplate.bodyHtml
        .replace(/\{\{\s*first_name\s*\}\}/g, safeName)
        .replace(/\{\{\s*userName\s*\}\}/g, safeName)
        .replace(/\{\{\s*name\s*\}\}/g, safeName)
        .replace(/\{\{\s*email\s*\}\}/g, escapeHtml(recipient));

      // If the admin's custom template is just body content rather than full document, wrap it
      if (!html.includes("<html") && !html.includes("<!DOCTYPE")) {
        html = WELCOME_EMAIL_RAW_TEMPLATE
          .replace(/<p style="margin:0 0 18px;">Hi \{\{first_name\}\},<\/p>[\s\S]*?<\/td>\s*<\/tr>/, `<p style="margin:0 0 18px;">Hi ${safeName},</p>${html}</td></tr>`);
      }

      return sendEmail({
        to: recipient,
        subject: customTemplate.subject || "Welcome to Tax Comp Pro",
        html,
        templateKey: "WELCOME",
        metadata: {
          userName: userName || firstName,
          firstName,
        },
      });
    }
  } catch (err) {
    console.warn("[WelcomeEmail] Falling back to default welcome email template:", err);
  }

  const html = renderWelcomeEmailHtml({ firstName });

  return sendEmail({
    to: recipient,
    subject: "Welcome to Tax Comp Pro",
    html,
    templateKey: "WELCOME",
    metadata: {
      userName: userName || firstName,
      firstName,
    },
  });
}
