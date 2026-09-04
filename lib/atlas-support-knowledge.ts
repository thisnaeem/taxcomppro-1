// taxcomppro-web-main/lib/atlas-support-knowledge.ts
// Official Knowledge Base & System Prompts for Tax Compliance Pro Website Support Concierge

export interface KnowledgeItem {
  category: string;
  question: string;
  alternatePhrasings?: string[];
  answer: string;
}

export const ATLAS_SUPPORT_SYSTEM_PROMPT = `You are Atlas, the Tax Compliance Pro Website Support Assistant. Your role is to help visitors and members use TaxCompPro.com and understand Tax Compliance Pro products, memberships, purchases, Toolkits, Atlas Academy, Pro Talks, Marketplace, Marketplace Plus, ProConnect, account features, billing, access, and technical functions. You may also explain the separate Always Ask Atlas product, its features, purchasing, downloading, and technical use.

CRITICAL POLICY & STRICT GUARDRAILS:
You must NEVER provide tax advice, tax-law answers, return-preparation advice, filing-status determinations, credit eligibility decisions, IRS rule interpretations, Schedule C deductions/rules, or substantive tax guidance from this TaxCompPro.com website assistant.
When a user asks ANY tax question (for example: "Can I claim Head of Household?", "What documents do I need for EITC?", "What is the difference between CTC and ACTC?", "Can you help me prepare a return?", "Is my mileage deductible?"), you must NOT answer the tax question. Instead, say:
"I can help with Tax Compliance Pro website and product support, but I don't answer tax questions from this website assistant. If you'd like, I can show you where to learn about the full Always Ask Atlas assistant or help you find a Tax Compliance Pro training resource."

VOICE, TONE & RESPONSE RULES:
- Give answers in 1–3 short, natural, friendly sentences.
- Give the answer first. Do not overwhelm the user with long text or unnecessary steps.
- Never invent or assume unconfirmed details.
- When you do not have enough confirmed information to answer accurately, say:
  "I don't have a confirmed answer for that yet. I can send your question to Tax Compliance Pro Support so the team can help. Would you like me to submit a support ticket?"
- Current official support details: Email: support@taxcomppro.com, Phone: +1 888-702-8272, Hours: Monday–Friday 9:00 AM – 6:00 PM EST (response within 24 business hours).
- The Tools navigation section is currently marked Coming Soon.
- Pricing details: Basic is free ($0/mo), VIP ($29/mo or $290/yr), Marketplace ($49.99/mo), Marketplace Plus ($109.99/mo). Toolkits include 2 months of Marketplace Plus. Ultimate Bundle PLUS includes all 6 Toolkits, 6 Academy masterclasses, 10 staff training licenses, and 6 months of Marketplace Plus.`;

export const ATLAS_WEBSITE_QA: KnowledgeItem[] = [
  // ── GENERAL & NAVIGATION ──────────────────────────────────────────
  {
    category: "NAVIGATION",
    question: "What can you help me with?",
    alternatePhrasings: ["What do you do?", "How can you help?", "What is your purpose?"],
    answer: "I can help you navigate Tax Compliance Pro, manage your account, understand memberships, access purchases, use Atlas Academy, Toolkits, Marketplace, Communities, Pro Talks, ProConnect, and troubleshoot website issues.",
  },
  {
    category: "GENERAL",
    question: "What is Tax Compliance Pro?",
    alternatePhrasings: ["Tell me about Tax Compliance Pro", "What does TaxCompPro do?"],
    answer: "Tax Compliance Pro provides tools, training, resources, memberships, and technology designed to support tax professionals and their practices.",
  },
  {
    category: "GENERAL",
    question: "Are you the tax-question Atlas?",
    alternatePhrasings: ["Are you the same Atlas from Always Ask Atlas?", "Can you do my taxes?"],
    answer: "I'm the Tax Compliance Pro website-support version of Atlas. I'm here to help with TaxCompPro.com and its features. I can also tell you about the full Atlas assistant available separately through AlwaysAskAtlas.com.",
  },
  {
    category: "ACCOUNT",
    question: "Do I need an account?",
    alternatePhrasings: ["Is an account required?", "Can I use the site without logging in?"],
    answer: "Some areas can be viewed publicly, but an account is required to access member features, communities, and purchased products.",
  },
  {
    category: "ACCOUNT",
    question: "Is it free to join?",
    alternatePhrasings: ["Does it cost money to join?", "Is there a free account?"],
    answer: "Yes. Tax Compliance Pro has a free Basic membership. You can upgrade whenever you need additional features.",
  },
  {
    category: "ACCOUNT",
    question: "How do I create an account?",
    alternatePhrasings: ["Where do I sign up?", "How do I register?"],
    answer: "Select Create Free Account or choose a membership plan from the Pricing page to create your Tax Compliance Pro account.",
  },
  {
    category: "ACCOUNT",
    question: "I already have an account. Where do I sign in?",
    alternatePhrasings: ["Where do I log in?", "How do I sign in?"],
    answer: "Use the Sign In option on TaxCompPro.com. If you're already logged in, I can help you find your dashboard.",
  },
  {
    category: "ACCOUNT",
    question: "I forgot my password.",
    alternatePhrasings: ["How do I reset my password?", "Lost password"],
    answer: "Use the Forgot Password link on the login page. A reset email will be sent to the email associated with your account.",
  },
  {
    category: "ACCOUNT",
    question: "I didn't receive my password-reset email.",
    alternatePhrasings: ["Reset email not received", "Didn't get reset link"],
    answer: "Check your spam or junk folder first. If it still hasn't arrived after a few minutes, I can submit a support ticket so the team can check your account.",
  },
  {
    category: "ACCOUNT",
    question: "My reset link doesn't work.",
    alternatePhrasings: ["Reset link expired", "Password reset error"],
    answer: "Try requesting a new password-reset link. If the new link also fails, I can submit a support ticket for you.",
  },
  {
    category: "ACCOUNT",
    question: "My account says my email already exists.",
    alternatePhrasings: ["Email already in use", "Duplicate account"],
    answer: "It sounds like you may already have an account. Try signing in or using Forgot Password instead of creating another account.",
  },
  {
    category: "ACCOUNT",
    question: "How do I change my profile information?",
    alternatePhrasings: ["How do I edit my profile?", "Update my profile"],
    answer: "Open your account or profile settings, make your desired changes, and select save.",
  },
  {
    category: "ACCOUNT",
    question: "My profile changes aren't saving.",
    alternatePhrasings: ["Can't save profile", "Profile error"],
    answer: "Refresh the page and try again. If your changes still won't save, I can submit a support ticket with the page you're using.",
  },
  {
    category: "ACCOUNT",
    question: "Where is my dashboard?",
    alternatePhrasings: ["How do I find my dashboard?", "Go to dashboard"],
    answer: "Your member dashboard is available immediately after you sign in. You can also access it through the navigation menu.",
  },

  // ── MEMBERSHIPS & BILLING ─────────────────────────────────────────
  {
    category: "MEMBERSHIP",
    question: "What memberships do you offer?",
    alternatePhrasings: ["What plans do you have?", "Membership options", "Pricing plans"],
    answer: "Tax Compliance Pro currently offers Basic (Free), VIP ($29/mo), Marketplace ($49.99/mo), and Marketplace Plus ($109.99/mo) memberships. I can explain the differences if you'd like.",
  },
  {
    category: "MEMBERSHIP",
    question: "What is the free membership?",
    alternatePhrasings: ["What comes with Basic?", "Basic membership features"],
    answer: "Basic membership is free and includes access to view the Marketplace, Member Directory, Communities, the Marketplace feed, and email support.",
  },
  {
    category: "MEMBERSHIP",
    question: "What do I get with VIP?",
    alternatePhrasings: ["VIP membership benefits", "Why upgrade to VIP?"],
    answer: "VIP adds features such as priority support, private messaging, interactive community features, training access, networking, and additional professional resources.",
  },
  {
    category: "MEMBERSHIP",
    question: "What's Marketplace membership?",
    alternatePhrasings: ["Marketplace seller membership", "Selling on marketplace"],
    answer: "Marketplace membership is designed for professionals who want a seller presence, including a customizable profile and the ability to offer services or products through the Marketplace.",
  },
  {
    category: "MEMBERSHIP",
    question: "What's Marketplace Plus?",
    alternatePhrasings: ["Marketplace Plus benefits", "Highest tier membership"],
    answer: "Marketplace Plus is the highest Marketplace tier and adds features such as live audio/video hosting and the ability to post ads, products, or featured services.",
  },
  {
    category: "MEMBERSHIP",
    question: "Where can I see my membership?",
    alternatePhrasings: ["What plan am I on?", "Check my current plan"],
    answer: "Your current membership appears in your member dashboard under Current Plan or in your account billing area.",
  },
  {
    category: "MEMBERSHIP",
    question: "How do I upgrade my membership?",
    alternatePhrasings: ["How to upgrade plan", "Switch membership"],
    answer: "Go to your membership area or Pricing page. Available upgrade options eligible for your current account will appear there.",
  },
  {
    category: "MEMBERSHIP",
    question: "Why don't I see a certain membership upgrade?",
    alternatePhrasings: ["Missing upgrade button", "Can't upgrade plan"],
    answer: "Tax Compliance Pro only displays upgrade options that apply to your current plan. If you believe an option is missing, I can submit a support ticket.",
  },
  {
    category: "BILLING",
    question: "Do paid plans have a free period?",
    alternatePhrasings: ["Free trial", "2 months free"],
    answer: "The site currently advertises two months of free community access with paid plans. Your account will show your exact billing terms before checkout.",
  },
  {
    category: "BILLING",
    question: "When is my next payment?",
    alternatePhrasings: ["Next billing date", "When will I be charged?"],
    answer: "You can find your next billing date in your membership or billing settings in your account dashboard.",
  },
  {
    category: "BILLING",
    question: "How do I cancel my membership?",
    alternatePhrasings: ["Cancel plan", "Stop subscription"],
    answer: "Open your membership or billing settings and select the cancellation option available for your plan. If you can't locate it, I can help submit a support request.",
  },
  {
    category: "BILLING",
    question: "Will canceling stop future charges?",
    alternatePhrasings: ["Will I be charged after cancel?", "Stop recurring billing"],
    answer: "Yes. Once cancellation is successfully completed, future recurring billing for that membership will stop.",
  },
  {
    category: "BILLING",
    question: "My payment failed. What do I do?",
    alternatePhrasings: ["Card declined", "Payment error"],
    answer: "Please verify your card details, billing address, and available funds and try again. If the payment continues to fail, I can submit a support ticket.",
  },
  {
    category: "BILLING",
    question: "I was charged twice.",
    alternatePhrasings: ["Duplicate charge", "Double billed"],
    answer: "I can submit a billing ticket so the support team can review the duplicate transaction and assist you.",
  },

  // ── TOOLKITS ──────────────────────────────────────────────────────
  {
    category: "TOOLKITS",
    question: "Where are the Toolkits?",
    alternatePhrasings: ["How to find Toolkits", "Where can I see Toolkits?"],
    answer: "Select Toolkits from the main menu. You can browse individual Toolkits and available bundles there.",
  },
  {
    category: "TOOLKITS",
    question: "How many Toolkits are there?",
    alternatePhrasings: ["What Toolkits do you have?", "List of toolkits"],
    answer: "Tax Compliance Pro currently offers 6 primary Toolkits: 30 Day Tax Office Launch, Staff's Audit Ready Due Diligence, IRS Fine Defense, Schedule C Reconstruction, IRS Audit Playbook, and Credits & Filing Status Explained.",
  },
  {
    category: "TOOLKITS",
    question: "Do Toolkits include a membership benefit?",
    alternatePhrasings: ["Do I get Marketplace Plus with my Toolkit?", "Toolkit bonus membership"],
    answer: "Yes! Eligible Toolkit purchases currently include two months of Marketplace Membership Plus activated automatically after purchase.",
  },
  {
    category: "TOOLKITS",
    question: "When do I get my Toolkit?",
    alternatePhrasings: ["Instant access toolkit", "Where is my purchased toolkit?"],
    answer: "Toolkits are designed for instant secure access immediately after purchase through your account and Atlas Academy.",
  },
  {
    category: "TOOLKITS",
    question: "Can I download my Toolkit?",
    alternatePhrasings: ["Are toolkits downloadable?", "Download PDF"],
    answer: "Download availability depends on the specific resource. Any materials that are available for download will show a download option inside the Toolkit viewer.",
  },
  {
    category: "TOOLKITS",
    question: "What's the Ultimate Bundle?",
    alternatePhrasings: ["Ultimate practice bundle", "Practice defense package"],
    answer: "The Ultimate Bundle combines multiple Tax Compliance Pro Toolkits and training resources into one comprehensive practice-defense package.",
  },
  {
    category: "TOOLKITS",
    question: "What's Ultimate Bundle PLUS?",
    alternatePhrasings: ["Ultimate PLUS package", "Flagship bundle"],
    answer: "Ultimate Bundle PLUS is the flagship suite with all 6 Toolkits, 6 Atlas Academy video masterclasses, 10 staff training licenses, 6 months of Marketplace Membership Plus, and lifetime form/course revisions.",
  },

  // ── ATLAS ACADEMY & COURSES ───────────────────────────────────────
  {
    category: "ACADEMY",
    question: "What is Atlas Academy?",
    alternatePhrasings: ["Tell me about Atlas Academy", "What courses are in Academy?"],
    answer: "Atlas Academy is the Tax Compliance Pro professional learning hub for masterclass video training in compliance, due diligence, audit defense, and practice development.",
  },
  {
    category: "ACADEMY",
    question: "Where are my courses?",
    alternatePhrasings: ["How to access purchased courses", "Where is my training?"],
    answer: "Sign in and open Atlas Academy from your dashboard or top navigation. Your purchased courses appear there automatically.",
  },
  {
    category: "ACADEMY",
    question: "Do I have to wait for my course to be approved?",
    alternatePhrasings: ["Course approval required?", "Instant course access"],
    answer: "No. Purchased courses become available automatically in Atlas Academy without requiring manual approval.",
  },
  {
    category: "ACADEMY",
    question: "Does my course progress save?",
    alternatePhrasings: ["Is course progress saved?", "Resume course"],
    answer: "Yes. Your Atlas Academy course progress and completed lessons are saved automatically as you work through each course.",
  },
  {
    category: "ACADEMY",
    question: "Where is my certificate?",
    alternatePhrasings: ["How do I get my certificate?", "Certificate of completion"],
    answer: "Once you complete the required course modules and exams, your official certificate becomes available immediately in your course certificate area.",
  },
  {
    category: "ACADEMY",
    question: "Can my employees take the course?",
    alternatePhrasings: ["Staff training seats", "Employee course access"],
    answer: "Staff access depends on the product or license package purchased. Bundles include 5 staff seats, and Ultimate Bundle PLUS includes 10 staff training licenses.",
  },

  // ── PRO TALKS ─────────────────────────────────────────────────────
  {
    category: "PRO_TALKS",
    question: "What is Pro Talk?",
    alternatePhrasings: ["What are Pro Talks?", "Live sessions"],
    answer: "Pro Talk is Tax Compliance Pro's live community feature where tax professionals connect, participate in discussions, and attend live audio/video sessions.",
  },
  {
    category: "PRO_TALKS",
    question: "Can free members join Pro Talks?",
    alternatePhrasings: ["Can Basic members join Pro Talk?", "Who can attend Pro Talks?"],
    answer: "Yes. Free Basic members can enter and participate in Pro Talks. Live hosting privileges are available to eligible Marketplace Plus members.",
  },
  {
    category: "PRO_TALKS",
    question: "Can I host a Pro Talk?",
    alternatePhrasings: ["Who can host Pro Talks?", "Host live session"],
    answer: "Live audio and video hosting in Pro Talk is an exclusive feature for Marketplace Plus members.",
  },

  // ── PROCONNECT & DIGITAL CARDS ────────────────────────────────────
  {
    category: "PROCONNECT",
    question: "What is ProConnect?",
    alternatePhrasings: ["Digital business card", "What does ProConnect do?"],
    answer: "ProConnect is a digital business card and professional profile that provides a shareable public link for your tax practice contact information.",
  },
  {
    category: "PROCONNECT",
    question: "Do people have to log in to see my ProConnect card?",
    alternatePhrasings: ["Is ProConnect public?", "Public digital card"],
    answer: "No. Your public ProConnect link is designed to open instantly on mobile or desktop without requiring the visitor to log in.",
  },
  {
    category: "PROCONNECT",
    question: "Can I change my ProConnect information later?",
    alternatePhrasings: ["Edit digital card", "Update ProConnect"],
    answer: "Yes. You can update your business information, contact details, and social links anytime without purchasing another card.",
  },

  // ── ALWAYS ASK ATLAS (FULL PRODUCT) ───────────────────────────────
  {
    category: "FULL_ATLAS",
    question: "What is Always Ask Atlas?",
    alternatePhrasings: ["Tell me about Always Ask Atlas", "What is the downloadable Atlas?"],
    answer: "Always Ask Atlas is the full, standalone Atlas AI assistant product equipped with specialized tax-assistant capabilities, floating desktop UI, and voice interaction.",
  },
  {
    category: "FULL_ATLAS",
    question: "Where can I learn about the full Atlas?",
    alternatePhrasings: ["Where do I get full Atlas?", "AlwaysAskAtlas website"],
    answer: "You can visit AlwaysAskAtlas.com to learn more about the full Atlas AI assistant and download options.",
  },
  {
    category: "FULL_ATLAS",
    question: "Does Atlas have a desktop version?",
    alternatePhrasings: ["Can I download Atlas?", "Desktop floating assistant"],
    answer: "Yes! The full Atlas product has a standalone desktop app designed to float on your screen with voice interaction, 'Hey Atlas' wake word, and continuing conversation history.",
  },

  // ── TECHNICAL SUPPORT & CONTACT ───────────────────────────────────
  {
    category: "SUPPORT",
    question: "How do I contact Support?",
    alternatePhrasings: ["Support email", "Contact support", "Help desk"],
    answer: "You can reach Tax Compliance Pro Support at support@taxcomppro.com or by phone at +1 888-702-8272. I can also help you submit a support ticket directly.",
  },
  {
    category: "SUPPORT",
    question: "What are Support hours?",
    alternatePhrasings: ["When is support open?", "Customer service hours"],
    answer: "Support hours are Monday through Friday, 9:00 AM to 6:00 PM Eastern. Inquiries are typically answered within 24 business hours.",
  },
];
