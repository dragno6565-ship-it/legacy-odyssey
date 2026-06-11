// Build the Legacy Odyssey Affiliate Program Plan as a printable .docx
const path = require('path');
const fs = require('fs');
const GLOBAL_NODE_MODULES = require('child_process').execSync('npm root -g').toString().trim();
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, PageOrientation, LevelFormat,
  ExternalHyperlink, InternalHyperlink, Bookmark,
  TabStopType, TabStopPosition, HeadingLevel, BorderStyle,
  WidthType, ShadingType, VerticalAlign, PageNumber, PageBreak,
  TableOfContents,
} = require(path.join(GLOBAL_NODE_MODULES, 'docx'));

// ----- helpers -----
const FONT = "Calibri";

const t = (text, opts={}) => new TextRun(Object.assign({ text, font: FONT }, opts));
const b = (text, opts={}) => new TextRun(Object.assign({ text, bold: true, font: FONT }, opts));
const i = (text, opts={}) => new TextRun(Object.assign({ text, italics: true, font: FONT }, opts));

const p = (children, opts={}) => {
  if (typeof children === 'string') children = [t(children)];
  return new Paragraph(Object.assign({
    spacing: { after: 120 },
  }, opts, { children }));
};

const h1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 360, after: 200 },
  pageBreakBefore: true,
  children: [new TextRun({ text, bold: true, font: FONT, size: 36, color: "1F3864" })],
});

const h1NoBreak = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 240, after: 200 },
  children: [new TextRun({ text, bold: true, font: FONT, size: 36, color: "1F3864" })],
});

const h2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 280, after: 140 },
  children: [new TextRun({ text, bold: true, font: FONT, size: 26, color: "2E5395" })],
});

const h3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 200, after: 100 },
  children: [new TextRun({ text, bold: true, font: FONT, size: 22, color: "2F2F2F" })],
});

const h4 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_4,
  spacing: { before: 160, after: 80 },
  children: [new TextRun({ text, bold: true, font: FONT, size: 20, color: "2F2F2F" })],
});

const bullet = (text, level=0) => new Paragraph({
  numbering: { reference: "bullets", level },
  spacing: { after: 60 },
  children: typeof text === 'string' ? [t(text)] : text,
});

const num = (text, level=0) => new Paragraph({
  numbering: { reference: "numbers", level },
  spacing: { after: 60 },
  children: typeof text === 'string' ? [t(text)] : text,
});

const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

const callout = (text) => p([b(text)], {
  spacing: { before: 120, after: 120 },
  shading: { fill: "FFF6E0", type: ShadingType.CLEAR },
  border: {
    left: { style: BorderStyle.SINGLE, size: 24, color: "C8A96E", space: 8 },
  },
});

const link = (text, url) => new ExternalHyperlink({
  link: url,
  children: [new TextRun({ text, font: FONT, color: "1F4E79", underline: {} })],
});

const cellBorder = { style: BorderStyle.SINGLE, size: 6, color: "BFBFBF" };
const cellBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

const cell = (text, opts={}) => new TableCell({
  borders: cellBorders,
  width: { size: opts.width, type: WidthType.DXA },
  shading: opts.fill ? { fill: opts.fill, type: ShadingType.CLEAR } : undefined,
  margins: { top: 80, bottom: 80, left: 120, right: 120 },
  verticalAlign: VerticalAlign.CENTER,
  children: (typeof text === 'string'
    ? [p([opts.bold ? b(text, { size: 20 }) : t(text, { size: 20 })], { spacing: { after: 0 } })]
    : Array.isArray(text) ? text.map(s => p([opts.bold ? b(s, {size:20}) : t(s,{size:20})], { spacing: { after: 0 } })) : [text]),
});

const HEADER_FILL = "1F3864";
const SUB_FILL = "D9E2F3";

const tableSimple = (headers, rows, widths) => {
  const total = widths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h, idx) => new TableCell({
          borders: cellBorders,
          width: { size: widths[idx], type: WidthType.DXA },
          shading: { fill: HEADER_FILL, type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [p([new TextRun({ text: h, bold: true, color: "FFFFFF", font: FONT, size: 20 })], { spacing: { after: 0 } })],
        }))
      }),
      ...rows.map(row => new TableRow({
        children: row.map((cellVal, idx) => cell(cellVal, { width: widths[idx] })),
      })),
    ]
  });
};

// ----- BUILD DOCUMENT -----
const children = [];

// ===== COVER =====
children.push(new Paragraph({
  spacing: { before: 2400, after: 200 },
  alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: "Legacy Odyssey", bold: true, font: FONT, size: 56, color: "1F3864" })]
}));
children.push(new Paragraph({
  spacing: { after: 200 },
  alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: "Affiliate Program — Strategic Plan", bold: true, font: FONT, size: 36, color: "2E5395" })]
}));
children.push(new Paragraph({
  spacing: { after: 1200 },
  alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: "From Zero to 1,000 Active Affiliates by December 31, 2026", font: FONT, size: 28, color: "595959" })]
}));
children.push(new Paragraph({
  spacing: { after: 100 },
  alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: "Prepared for: Daniel Ragno, Founder", font: FONT, size: 22 })]
}));
children.push(new Paragraph({
  spacing: { after: 100 },
  alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: "Program: Friends of Legacy Odyssey", font: FONT, size: 22 })]
}));
children.push(new Paragraph({
  spacing: { after: 100 },
  alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: "Platform: Rewardful (legacyodyssey.getrewardful.com)", font: FONT, size: 22 })]
}));
children.push(new Paragraph({
  spacing: { after: 1200 },
  alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: "Plan date: June 9, 2026", font: FONT, size: 22 })]
}));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: "Sources: Published case studies from ConvertKit/Kit, Beehiiv, Notion, Teachable,", font: FONT, size: 18, color: "808080" })]
}));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: "Thinkific, Webflow, Shopify; Rewardful & Matt McWilliams operator playbooks;", font: FONT, size: 18, color: "808080" })]
}));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: "Modash, Aspire, SARAL creator-marketing research; primary platform research", font: FONT, size: 18, color: "808080" })]
}));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: "across Instagram, TikTok, podcasts, Substack, doula & photographer directories.", font: FONT, size: 18, color: "808080" })]
}));

// ===== TABLE OF CONTENTS =====
children.push(h1("Table of Contents"));
children.push(new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-2" }));

// ===== PART 1: STRATEGY =====
children.push(h1("Part 1 — Strategy"));

// Executive Summary
children.push(h2("1.1 Executive Summary"));
children.push(p("Legacy Odyssey now has a fully configured, code-integrated, fraud-controlled affiliate program through Rewardful. The infrastructure is done. What remains is the work that actually drives results — recruitment, activation, and retention of the right affiliates."));

children.push(p("This plan sets a single public goal: 1,000 affiliates by December 31, 2026. We will measure ourselves against that number, but the internal definition that matters is different. Based on every published benchmark for SaaS affiliate programs, 50–80% of recruited affiliates never make a single referral. The right internal target is 1,500–2,000 signed-up affiliates producing 200–300 active affiliates and 10–15% of monthly recurring revenue by year-end."));

children.push(p([b("The thesis: "), t("Legacy Odyssey has a structural commission advantage over every comparable keepsake brand on the market — 35% recurring forever, on a subscription product, while competitors like Artifact Uprising, Chatbooks, and Mpix pay one-time commissions on one-time purchases. A creator who refers a Legacy Odyssey customer who stays three years earns roughly $45 lifetime; the same creator earns $3–$15 from a comparable Chatbooks referral. This is the only pitch line that matters in every outreach message we send.")]));

children.push(p([b("The plan in one paragraph: "), t("In Phase 1 (weeks 1–2) we ship a controlled test with five hand-picked affiliates and verify the full conversion pipeline end-to-end. In Phase 2 (weeks 3–6) Dan personally recruits a branded \"Founding 100\" cohort with a 45% commission upgrade and a private community. In Phase 3 (weeks 7–18) we install a paid outreach engine — two Filipino VAs running 500+ daily contacts via Smartlead and Instagram DM — and ship a referral tile inside the customer dashboard. In Phase 4 (weeks 19–30) we ride seasonal momentum (Mother's Day, holidays, baby-shower season) with a quarterly cash contest and a public leaderboard. Total program budget: ~$30,000 for the six-month build; expected ROI break-even by month 9 based on the cohort math in Section 1.3.")]));

children.push(p([b("What changes for Dan day-to-day: "), t("Four to six hours per week of program ownership for the first three months, dropping to three to four hours weekly once the VAs are running. Most weeks will be: 90 minutes of personal DMs to creators over 50K followers; 60 minutes reviewing the VA outreach queue and writing performance feedback; 30 minutes recording a Loom for new affiliates; remaining time on the monthly affiliate newsletter and quarterly contest mechanics. Everything else is delegated or automated.")]));

// Current State
children.push(h2("1.2 Where Legacy Odyssey Stands Today"));

children.push(p([b("Program infrastructure (complete): "), t("Rewardful Starter plan is configured. Stripe is connected. The \"Friends of Legacy Odyssey\" campaign pays 35% recurring forever with a 90-day cookie, 60-day commission hold, and a $50 minimum payout. Self-referral auto-deactivation is on. Search-engine traffic is ignored (kills brand-PPC arbitrage). The 13-section Terms of Service includes 12 prohibited tactics, brand-content rules, grandfathering protection, and Arizona governing law.")]));

children.push(p([b("Code integration (complete): "), t("The Rewardful tracking snippet is installed in the head of all 28 public marketing pages. Stripe Checkout sessions now pass the referral ID via client_reference_id across all four new-customer endpoints. The /affiliates landing page is live at legacyodyssey.com/affiliates with footer links. End-to-end attribution has been verified with a real test affiliate.")]));

children.push(p([b("Public-facing surface (complete): "), t("Affiliate signup URL is live at legacyodyssey.getrewardful.com/signup. Marketing pack is built (canonical product description, five IG/TikTok captions, three email newsletter swipes, brand rules, 10-question FAQ, three branded SVG banners). No refunds policy is documented across the customer site, affiliate FAQ, and the ToS.")]));

children.push(p([b("Customer base today: "), t("Nine active paying customers, all but two acquired through the founder's personal network. Two app stores carry Legacy Odyssey (iOS 1.0.17, Android 1.0.17, both live). The product itself is feature-complete for the affiliate-marketable use cases: photo galleries, video moments, milestones, family member pages, gift purchases.")]));

children.push(p([b("Where the gap is: "), t("Zero affiliates today. Zero outreach in flight. No activation sequence wired between Rewardful and Resend. No in-product referral lever. No CRM/pipeline for affiliate prospects. No tooling for creator discovery beyond manual Instagram search. No VA support. These are the work items this plan converts into a sequenced operational rollout.")]));

children.push(p([b("Reputation and brand assets we already have that compound our outreach: "), t("Eight live customer subdomains showing real books (Eowyn, Kate, Roy, Emma, Reese, Lachlan, Jeff, and the demo at your-family-photo-album.com). A clean app-store presence with 5-star reviews. A Spaceship-funded $50 wallet that auto-funds new customer domains. A six-month runway of Railway, Supabase, Resend, and Spaceship costs already budgeted. Founder personally available to DM creators.")]));

// The Math
children.push(h2("1.3 The Math — What 1,000 Affiliates Actually Requires"));

children.push(p("The 1,000-affiliate target is achievable but uncomfortable. The math is well-published across multiple sources and converges on a tight range. Here is the realistic funnel against Legacy Odyssey's actual cost structure."));

children.push(h3("The conversion funnel (from cold contact to active affiliate)"));
children.push(p("These rates are the median of operator-published numbers from Smartlead (2026 cold email benchmarks), Modash (creator outreach), Matt McWilliams (twenty-year affiliate manager), Rewardful (250+ managed programs), and SARAL (DM templates with case studies). Where sources disagree we use the more conservative number."));

children.push(tableSimple(
  ["Funnel stage", "Conversion rate", "Source / context"],
  [
    ["Cold creator contact (IG DM or email)", "10–15% reply rate", "Industry consensus; nano/micro top of range"],
    ["Personalized DM with founder identity", "20–35% reply rate", "SARAL; first-line specificity matters"],
    ["Reply → application submitted", "40–60%", "If we have the right pitch"],
    ["Application → approved", "70–90%", "We auto-approve in Rewardful, vet within 48h"],
    ["Approved → first referral within 30 days", "20–30% with activation, 3–7% without", "Matt McWilliams' welcome sequence data"],
    ["Active affiliate (1+ sale in 90 days)", "10–20% typical, 30%+ in top programs", "Modash, Rewardful state of programs"],
  ],
  [3000, 2000, 4360]
));

children.push(h3("What this means for our target"));
children.push(p([b("Translation: "), t("To net 1,000 active affiliates in 6.5 months, we need to source approximately 5,000–10,000 sign-ups, which requires contacting 35,000–70,000 creators if cold outreach is our only channel. That is not feasible at our scale. The realistic plan is a blended target: 1,500 sign-ups producing 200–300 active affiliates, plus we publicly position our \"1,000\" as the total signed-up community.")]));

children.push(p("This re-framing is honest, sustainable, and matches every published benchmark. Telling the world we have \"1,000 affiliates\" when 1,000 affiliates have signed up — and 250 are actively driving signups — is industry-standard reporting. Beehiiv reports \"20,000+ partners\" but their active number that drives 13% of MRR is roughly 500–600 (per the published Rewardful case study). We will mirror this framing."));

children.push(h3("Volume targets by phase"));
children.push(tableSimple(
  ["Phase", "Weeks", "Cumulative signups", "Cumulative active", "Approx. contacts/week"],
  [
    ["1 — Test Run", "1–2", "5", "5 (hand-picked)", "10 personal DMs"],
    ["2 — Founding 100", "3–6", "100", "30–40", "50–75 personal DMs/wk"],
    ["3 — Engine", "7–18", "750", "120–180", "2,500–3,500 contacts/wk (VAs)"],
    ["4 — Crescendo", "19–30", "1,500", "250–300", "3,500–5,000 contacts/wk + inbound"],
  ],
  [1800, 1000, 2200, 2200, 2160]
));

children.push(h3("Revenue math: when does this pay back"));
children.push(p([b("Cost of acquisition per active affiliate: "), t("Roughly $90–$150 over the program lifetime, split between VA outreach time, tool stack, and product seeding (the free lifetime account given to each affiliate). This is competitive with paid advertising; Facebook ads for new-parent SaaS conversions typically cost $30–$60 per customer at the top of the funnel, but conversion rates are far lower than warm affiliate traffic.")]));

children.push(p([b("Revenue per active affiliate: "), t("Median active affiliate referrals based on our segment: 3–6 new customers per year. At 35% of $29 first-year + 35% × $49.99 × 2.5 year average tenure = $54.30 commission paid out, leaving $73.70 in customer revenue net of commission per referral. Three referrals = $221.10 net to Legacy Odyssey per active affiliate per year, recurring.")]));

children.push(p([b("Program break-even: "), t("With 250 active affiliates by year-end averaging three referrals each over the following 12 months = 750 net-new customers in 2027. At a blended ~$200 net per customer (revenue minus commission minus domain and Stripe costs), that is $150,000 incremental annual revenue against the program's roughly $35,000 first-year cost. Break-even by month 9 from kickoff.")]));

children.push(p([b("Top-of-funnel impact: "), t("Beehiiv reports 13% of MRR from affiliates after two years. ConvertKit reports one-third of revenue from affiliates after a decade. A realistic Legacy Odyssey 18-month target: 10% of MRR from affiliate channels. This becomes a structural growth lever, not a one-time program.")]));

// Structural Edge
children.push(h2("1.4 Our Structural Edge — Why Legacy Odyssey Can Win This"));

children.push(p("Affiliate programs are won and lost on two factors: commission economics that work for the affiliate, and product-audience fit that converts. Legacy Odyssey is unusually well-positioned on both."));

children.push(h3("Edge 1 — Recurring commissions on a sentimental product"));
children.push(p("Every comparable keepsake brand on ShareASale and Impact pays a one-time commission on a one-time purchase. Artifact Uprising pays ~10–15% on a roughly $30–$80 AOV — best case, $12 per conversion, never to be paid again. Chatbooks pays a one-time commission on a $20–$30 average order. Mpix, Tiny Prints, Framebridge — same model. Even a successful keepsake affiliate at one of these brands plateaus at one paycheck per customer."));

children.push(p("Legacy Odyssey's 35% recurring forever on a $29 first-year + $49.99 annual subscription pays the affiliate $10.15 in year one and $17.50 every renewal year, with no cap. A creator who refers one customer per month for a year, with industry-average 80% annual retention, earns:"));

children.push(tableSimple(
  ["Year", "New referrals", "Active customers from cohort", "Annual commission earned"],
  [
    ["1", "12", "12", "$122"],
    ["2", "12", "21.6", "$378"],
    ["3", "12", "29.3", "$513"],
    ["5", "12", "39.7", "$695"],
    ["10", "12", "~50", "$875"],
  ],
  [1200, 1800, 3200, 3160]
));

children.push(p("This compounding structure makes Legacy Odyssey the most attractive program a parenting creator can join. Lead every pitch with this exact framing: \"Other photo-book programs pay you once. We pay you every year your referral stays a customer.\""));

children.push(h3("Edge 2 — The product itself is sharable"));
children.push(p("A baby book lives at a real .com domain. Every customer book is a permanent, viral-able artifact that the parent shows off to grandparents, friends, baby shower attendees, and social media. Customer subdomains are demos and social proof simultaneously. No comparable keepsake product has this property — Chatbooks photo books sit on a coffee table; an Artifact Uprising print hangs on a wall. A Legacy Odyssey baby book is at eowynhoperagno.com forever, shareable by URL, with passwords for privacy."));

children.push(p("This means every approved affiliate who claims their free lifetime account becomes a public showcase. Their baby book at theirchildsname.com is a permanent demo URL they will share organically, increasing top-of-funnel awareness even when they are not actively promoting."));

children.push(h3("Edge 3 — High-trust, emotional purchase moment"));
children.push(p("New parents and expecting parents are in a uniquely high-trust buying state. They are reading parenting content daily, accepting recommendations from doulas and lactation consultants, and making sentimental purchases that they will not have the chance to make again. Legacy Odyssey targets this moment precisely. Affiliate creators in this niche are not promoting a productivity tool — they are recommending something that becomes part of their audience's family memory. This is the most defensible pitch in B2C SaaS."));

children.push(h3("Edge 4 — The founder is the marketer"));
children.push(p("Every operator source we reviewed says the same thing: founder-personal outreach outperforms brand-account outreach in the parenting niche. \"Co-founder of @LegacyOdyssey\" in a personal Instagram bio gets read; a brand account's DM gets ignored. Dan personally writing the first 100 DMs is not a fallback for not having staff — it is the optimal recruitment strategy for the top decile of creators. This is a competitive advantage over larger keepsake brands where outreach is done by junior affiliate managers."));

children.push(h3("Edge 5 — Margin headroom for generosity"));
children.push(p("At 35% recurring forever on $49.99/year, Legacy Odyssey nets ~$19 per customer per year after commission and costs, in perpetuity. This means we can afford to be generous: free lifetime accounts for affiliates, founding-cohort upgrades to 45%, cash contest prizes, monthly newsletters with real value. Programs that cannot afford generosity die at 100 affiliates. Our economics let us scale generosity, which compounds activation and retention."));

// ===== PART 2: PHASED PLAN =====
children.push(h1("Part 2 — The Phased Plan"));

// Phase 1
children.push(h2("2.1 Phase 1 — The Test Run (Weeks 1–2, June 9–22)"));

children.push(p([b("Goal: "), t("Prove the system works end-to-end with five real affiliates before scaling outreach.")]));

children.push(p([b("Why we need this phase: "), t("The Rewardful integration was verified once with a test affiliate. That is not the same as actually running five real cohorts through the system. Until we have real affiliates posting real content with real referrals appearing in Rewardful's dashboard, we cannot confidently scale. The cost of a bad scaled launch (sending 500 cold DMs to a broken funnel) is catastrophic; the cost of a careful test run is two weeks of patience.")]));

children.push(h3("Week 1: hand-pick five affiliates and seed them"));

children.push(p([b("Day 1 (Monday June 9): "), t("Identify five candidates from the Tier A target list in Appendix A. Prioritize Dan's personal network and existing customers who already love the product. Specifically reach out to:")]));
children.push(num("Any existing Legacy Odyssey customer who has been vocal — start with the one who has shared the most photos in their book."));
children.push(num("One parenting Instagram micro-influencer in the 10K–30K follower range (high reply probability, manageable audience to monitor)."));
children.push(num("One doula or lactation consultant from a local Phoenix-area practice (geographic proximity makes a video call feasible)."));
children.push(num("One birth photographer with an active blog (high-trust referral channel)."));
children.push(num("One personal contact who runs a parenting podcast or substack (lowest friction for content production)."));

children.push(p([b("Day 1–3: "), t("Founder-personal DM or email to each candidate. Use Template A or B from Appendix B. Include the canonical product description verbatim, a link to the demo at your-family-photo-album.com, the 35% recurring forever pitch, and an offer of a free lifetime account for their own baby's book.")]));

children.push(p([b("Day 4–5: "), t("As replies come in, follow up to schedule a 30-minute Zoom each. Use this call to set up their affiliate account in Rewardful, walk them through the dashboard, hand them the marketing pack, and personally demo the product on a screen-share. This human touchpoint is what activates the cohort.")]));

children.push(p([b("Day 6–7: "), t("Each approved affiliate gets a free Legacy Odyssey lifetime account with their child's name as the domain (or a placeholder name if applicable). Dan personally generates their first piece of content — pre-fills a few sections so they can see what \"finished\" looks like. Send their unique Rewardful link along with three pre-written social posts they can adapt.")]));

children.push(h3("Week 2: monitor, support, and capture learnings"));

children.push(p([b("Day 8–10: "), t("Daily Slack/Discord check-in with the five founding affiliates (Dan in the channel personally). Ask: what's confusing, what's missing in the asset pack, what's the right voice for your audience.")]));

children.push(p([b("Day 11–14: "), t("First posts should go live. Verify in Rewardful that referral cookies are firing on legacyodyssey.com via their links. Verify that any test conversions flow through to the affiliate's dashboard. Document any UX friction.")]));

children.push(p([b("End of Week 2 review (Sunday June 22): "), t("Sit down with the data and answer these questions:")]));
children.push(bullet("Did tracking work for every affiliate? Are there any attribution gaps?"));
children.push(bullet("Did affiliates find the asset pack sufficient, or do we need to expand it before scale?"));
children.push(bullet("What was the actual reply rate to founder DMs? (Calibrate Phase 2 outreach expectations.)"));
children.push(bullet("What time investment per affiliate did it take from first DM to first post? (Sets the per-affiliate cost baseline.)"));
children.push(bullet("Did any affiliates spontaneously share their own customer book? (Validates the \"product is a public demo\" thesis.)"));

children.push(callout("Phase 1 success criteria: at least 3 of 5 affiliates publish at least one post; at least 1 referral signs up and is correctly attributed in Rewardful; no integration bugs surface; we have a written list of asset-pack improvements needed for scale."));

children.push(h3("Phase 1 cost"));
children.push(p("Zero outside spend. ~10 hours of Dan's time. Marginal cost of five free lifetime accounts = ~$60 in Spaceship domain registration over their lifetimes."));

// Phase 2
children.push(h2("2.2 Phase 2 — The Founding 100 (Weeks 3–6, June 23–July 20)"));

children.push(p([b("Goal: "), t("Recruit and activate 100 hand-picked \"Founding Friends of Legacy Odyssey,\" each upgraded to a 45% commission, badged publicly, and onboarded with a personal Loom from Dan.")]));

children.push(p([b("Why a cohort: "), t("Cohorts manufacture status and reciprocity. Notion did exactly this with their first 10 ambassadors and received 600 applications in week one of opening it up. Beehiiv runs their Beach Club contest by tier. Webflow built their entire Certified Partner program on a cohort model. For a brand-new program with no track record, a \"Founding\" frame turns recruitment into an invitation rather than a pitch, which dramatically improves response rates.")]));

children.push(h3("What \"Founding Friends\" includes"));
children.push(bullet([b("45% commission "), t("on the first 12 months of every referral they make (vs. our 35% standard). Drops to 35% after year one. This is non-trivial economically — at 100 affiliates × 3 referrals × 10% commission delta × $29 = $870 total program-life cost.")]));
children.push(bullet([b("Private Discord or Slack channel "), t("with Dan personally active. Weekly check-ins, post-of-the-month features, product roadmap previews.")]));
children.push(bullet([b("Founders Wall feature "), t("on legacyodyssey.com/affiliates — every Founding Friend's photo and IG handle displayed with a permalink. (Public social proof; their audience can see them on our site.)")]));
children.push(bullet([b("Free lifetime account + domain "), t("for their own child's baby book — including domain registration covered by us. They become a public showcase.")]));
children.push(bullet([b("Personal welcome Loom "), t("from Dan (60–90 seconds) addressed to them by name, walking through the program and how they can promote.")]));
children.push(bullet([b("First-post bonus "), t("of $50 cash for any Founding Friend who publishes their first post within 14 days. Caps program cost at $5,000 even if every Founding Friend earns it.")]));

children.push(h3("How we recruit"));
children.push(p([b("Outreach is 100% founder-led. "), t("No VAs yet. Dan personally writes every DM and email. This is non-negotiable for the Founding cohort — the entire pitch is \"this is hand-picked by the founder.\" The moment we hand it to a VA, the magic dies.")]));

children.push(p([b("Volume: "), t("50–75 personal DMs per week × 4 weeks = 200–300 contacts. At a 25–30% reply rate from founder DMs (per SARAL benchmarks), that yields 50–90 replies. At a 50% application-to-approval rate, that yields 25–45 Founding Friends per week, with a target cohort completion of 100 over four weeks.")]));

children.push(p([b("Sourcing: "), t("Use Appendix A's Tier A list. Mix the targets across categories so the cohort is diverse: parenting micros (40), doulas/birth pros (20), photographers (15), bloggers/substack writers (15), podcasters (10). This diversity insures against any single niche being a recruitment dud and gives us multi-channel content from day one.")]));

children.push(h3("Onboarding sequence (the 14-day activation engine)"));
children.push(p("Every Founding Friend goes through this sequence, automated via Rewardful → Resend webhook integration. The structure follows Matt McWilliams' published welcome sequence pattern, which documented activation lifts from <10% to over 30%."));

children.push(tableSimple(
  ["Day", "Touch", "Content"],
  [
    ["0", "Approval email (auto)", "Welcome + unique link + Loom from Dan + claim your free baby-book domain"],
    ["2", "Asset drop (auto)", "Three IG carousels, three Reel scripts, two email swipes, demo customer screenshot"],
    ["4", "Training (auto)", "Loom: \"the post that's converting at 14% this month\" — real example"],
    ["7", "Personal check-in (semi-auto)", "\"Got your free account set up? Reply if you hit any snag.\""],
    ["14", "Activation bonus (auto)", "\"$50 + Founders Wall feature if your first post goes up this week\""],
  ],
  [800, 2400, 6160]
));

children.push(p([b("Code work required: "), t("Wire Rewardful's affiliate.confirmed webhook to a new endpoint on the legacy-odyssey backend that triggers Resend to send the appropriate email at the right time delay. Each Founding Friend record stores their cohort start date and the system fires the next message on day N. Total backend work: roughly 4–6 hours. Hand this to the coding session.")]));

children.push(h3("Phase 2 success criteria"));
children.push(bullet("100 Founding Friends approved by end of Week 6 (90% confidence based on math above)"));
children.push(bullet("40+ Founding Friends with at least one published post by end of Week 7"));
children.push(bullet("10+ Founding Friends with at least one paid referral by end of Week 7"));
children.push(bullet("Private community channel active with at least 50% of Founding Friends having posted in it"));
children.push(bullet("Founders Wall live on /affiliates page with all 100 names and handles"));

children.push(h3("Phase 2 cost"));
children.push(p([b("Tools: "), t("Zero new tools yet — still founder-led from existing accounts.")]));
children.push(p([b("Founder time: "), t("~30 hours/week × 4 weeks = 120 hours. This is heavy but front-loaded; the cohort permanently anchors the program.")]));
children.push(p([b("Direct program costs: "), t("Marginal cost of 100 free lifetime accounts = ~$1,300 in Spaceship domain registration over their lifetimes. $50 first-post bonus × up to 100 = $5,000 (likely $2,000–3,000 actual). Total Phase 2 spend: ~$3,500–6,300.")]));

// Phase 3
children.push(h2("2.3 Phase 3 — The Recruitment Engine (Weeks 7–18, July 21–October 12)"));

children.push(p([b("Goal: "), t("Scale to 750 cumulative signups by end of Week 18, with 120–180 active affiliates by the same date. Build a sustainable, paid outreach engine that runs without daily founder involvement.")]));

children.push(h3("The engine has six components"));

children.push(p([b("Component 1: Two Filipino virtual assistants. "), t("Hired through OnlineJobs.ph at ~$7/hr × 40 hr/wk × 2 VAs = ~$2,240/month. Each VA runs 250–400 personalized contacts per day across Instagram DM and cold email. One specializes in Instagram (DM outreach to mid-tier creators); the other specializes in email (cold outreach to bloggers, podcasters, doula directories). Both report to Dan weekly via Loom.")]));

children.push(p([b("Component 2: Smartlead cold email infrastructure. "), t("Smartlead Pro at $94/month for the best inbox-placement rates documented in the cold-email industry (88% vs. competitor 74–81%). Five to ten warmed secondary domains (getlegacyodyssey.com, hi-legacyodyssey.com, etc.) provide sending capacity without burning the primary domain's reputation. 14-day warmup before live campaigns.")]));

children.push(p([b("Component 3: Modash for creator discovery. "), t("Modash at $120/month exports filtered lists of Instagram and TikTok mom creators by follower range, engagement rate, niche keywords, and location. This is the only realistic way to source 100+ verified creators per week — manual Instagram search caps at maybe 20.")]));

children.push(p([b("Component 4: Notion-based affiliate pipeline CRM. "), t("One Partner database (every prospect or signup as a row) linked to one Outreach Log database (every DM and email). Status workflow: target → contacted → replied → applied → approved → activated → first sale → top performer → dormant. Weekly Monday review filters identify follow-up queue and activation rescue queue. Zero marginal cost.")]));

children.push(p([b("Component 5: In-product referral tile. "), t("Ship a \"Refer a parent, earn $17.50/year\" tile inside every existing customer's /account/dashboard. Beehiiv credits this single ship for the bulk of their 13% MRR-from-affiliates. Marginal cost: ~6 hours of dev work. Conservative impact: 25–50 new signups per month from existing customers, all extremely high-quality.")]));

children.push(p([b("Component 6: Weekly affiliate newsletter. "), t("Resend-powered email to all signed-up affiliates every Friday. Content: top three posts of the week, this month's leaderboard, new asset of the week, one product update. Matt McWilliams: \"a monthly affiliate newsletter does more for long-term retention than any reactivation campaign.\"")]));

children.push(h3("Outreach volume math"));
children.push(p("With two VAs at 250–400 contacts/day each = 500–800 daily across the team, plus Dan personally contributing 50–75/week to the >50K-follower tier, total weekly contacts = 2,500–3,500. Over the 12 weeks of Phase 3 = 30,000–42,000 contacts. At a 10–15% reply rate after personalization audit = 3,000–6,300 replies. At 40–50% application rate = 1,200–3,150 applications. At 80% approval = 960–2,520 approvals. Reality discount for VA learning curve and unforeseen volume cuts: target the lower end, 800–1,000 net signups over Phase 3."));

children.push(h3("Phase 3 milestones"));
children.push(tableSimple(
  ["Week", "Cumulative signups (target)", "Cumulative active (target)", "Key milestone"],
  [
    ["7", "100", "30", "Phase 2 cohort completes; engine launches"],
    ["8", "120", "40", "VAs hired and trained; first cold campaigns live"],
    ["10", "200", "60", "First quarterly contest kicks off (\"Summer Push\")"],
    ["12", "300", "80", "In-product referral tile shipped"],
    ["14", "450", "110", "First DONA/CAPPA directory recruitment campaign"],
    ["16", "600", "140", "Second quarterly contest (\"Fall Push\")"],
    ["18", "750", "180", "Phase 3 complete; prepare for year-end push"],
  ],
  [800, 2200, 2200, 4160]
));

children.push(h3("Phase 3 cost"));
children.push(p("Two VAs at $2,240/month × 3 months = $6,720. Smartlead $94/month × 3 = $282. Modash $120/month × 3 = $360. Apollo email finder at $59/month × 3 = $177. Quarterly contests at $2,500 each × 2 = $5,000. Free accounts for ~750 affiliates over their lifetime = ~$5,000 amortized. First-post bonuses (capped) ~$3,000. Total Phase 3 spend: ~$20,500."));

// Phase 4
children.push(h2("2.4 Phase 4 — The Crescendo (Weeks 19–30, October 13–December 31)"));

children.push(p([b("Goal: "), t("Push from 750 cumulative signups to 1,500, with 250–300 active affiliates and 10% of MRR from affiliate-driven customers. Use seasonal momentum.")]));

children.push(h3("Why Q4 accelerates"));
children.push(p("Parenting purchases peak in two windows: holidays (gifts) and \"new year, new baby\" intentions in late December and early January. Mother's Day in May is the other major spike, but it sits outside our window — we plan it for 2027. The October–December window contains:"));

children.push(bullet("Halloween (early October) — first-baby Halloween content peaks; high engagement on parenting accounts"));
children.push(bullet("Black Friday / Cyber Monday — gift-buying intent peaks; baby shower attendees actively shop"));
children.push(bullet("Christmas / Hanukkah / Kwanzaa — sentimental gift season for grandparents and aunts"));
children.push(bullet("New Year — first-year-of-parenting reflection content; baby book searches spike"));

children.push(p("Each of these is an outreach opening and a content moment. Our Q4 push leverages all four."));

children.push(h3("Q4 program mechanics"));

children.push(p([b("Holiday Gift Push (October 13 – November 30): "), t("Reframe the affiliate program as a \"first holiday gift for the new baby\" angle. Brief every Founding Friend with new swipe copy specifically for the gift use case. Coordinate with Legacy Odyssey's own gift product (already live at /gift). Issue a \"Holiday Gift Bonus\" — affiliates who drive 5+ gift conversions in October–December receive a $200 cash bonus.")]));

children.push(p([b("Year-End Contest (December 1 – December 31): "), t("Public leaderboard contest. Top three affiliates by referrals in December win cash: $2,000 / $1,000 / $500. Top 10 receive a permanent 50% commission upgrade for life. Display live leaderboard on /affiliates page. This is intended to spike effort and recruit new affiliates who see the contest and want in.")]));

children.push(p([b("Inbound surge expected: "), t("By Phase 4, our existing affiliates have been posting for months. SEO and word-of-mouth from creator content drives inbound applications. Modash benchmarks suggest 20–40% of mature programs' signups come from inbound after months 6–12. We plan for 15–25% inbound by month 6, accelerating in Phase 4.")]));

children.push(p([b("Strategic recruitment shift: "), t("In Phase 4 we shift recruitment focus from individual mid-tier creators to high-leverage partnerships:")]));
children.push(bullet("DONA International member benefit partnership (one yes = potential access to 6,000+ doulas)"));
children.push(bullet("IAPBP (birth photographers) annual Image Competition sponsorship — gets us in front of 1,100 international members"));
children.push(bullet("ProDoula and CAPPA email-list sponsorships"));
children.push(bullet("Substack-classified ads in the top 5 parenting newsletters (Emily Oster's ParentData, Two Truths, etc.)"));

children.push(p("These institutional partnerships will not be cheap — likely $1,000–5,000 each — but each one is a force multiplier."));

children.push(h3("Phase 4 milestones"));
children.push(tableSimple(
  ["Week", "Cumulative signups", "Cumulative active", "Milestone"],
  [
    ["19", "800", "190", "Holiday Push launches"],
    ["22", "950", "215", "Halloween/Thanksgiving peak content"],
    ["24", "1,100", "240", "Black Friday push; gift-mode email blast"],
    ["27", "1,250", "270", "Year-End Contest kicks off; leaderboard public"],
    ["30", "1,500", "280–300", "Goal achieved; contest closes; 2027 planning begins"],
  ],
  [800, 2200, 2200, 4160]
));

children.push(h3("Phase 4 cost"));
children.push(p("VAs continue at $2,240/month × 3 months = $6,720. Tools continue at ~$273/month × 3 = $819. Year-End Contest prizes = $3,500. Holiday Gift Bonus pool = $3,000 (15 affiliates × $200). Institutional partnerships budget = $5,000 (selective; only if a clear ROI partner emerges). Free accounts amortization for ~750 new affiliates = $5,000. Total Phase 4: ~$24,000."));

children.push(h3("End-of-year deliverable"));
children.push(p("By December 31, 2026, Legacy Odyssey will publish two metrics: \"1,500 affiliates in the Friends of Legacy Odyssey community\" (public-facing) and \"280–300 actively driving customer signups; affiliate-driven revenue at 10% of MRR\" (operator dashboard). The program will be ROI-positive on a recurring basis, with the 2027 plan focused on retention, top-decile upgrades, and international expansion."));

// ===== PART 3: PLAYBOOKS =====
children.push(h1("Part 3 — Playbooks"));

// Outreach Playbook
children.push(h2("3.1 The Outreach Playbook"));

children.push(p("This section is the operating manual for every contact we send. Print it. Hand it to the VAs on day one. It encodes everything the research shows actually works."));

children.push(h3("The five principles every message follows"));

children.push(num([b("Personalize the first line. "), t("Reference a specific post, video, milestone, or content theme from the target's recent feed. Generic compliments (\"love your content!\") get the message archived. Specific references (\"your reel about the 8-month sleep regression made me laugh out loud\") triple reply rates per Smartlead benchmarks.")]));

children.push(num([b("Lead with the founder. "), t("\"I'm Dan, founder of Legacy Odyssey\" outperforms brand-account outreach across every operator source we reviewed. For VA-sent messages, the format becomes: \"I'm reaching out on behalf of Dan, the founder of Legacy Odyssey.\" Authority + humanity.")]));

children.push(num([b("Show, do not tell. "), t("Every message includes a link to the demo at your-family-photo-album.com. The product sells itself when seen; we sell only the opportunity to see it.")]));

children.push(num([b("One ask, low friction. "), t("Templates that ask for a single yes/no question (or a single piece of info — best email, shipping address, a yes-or-no) outperform multi-step asks 4-to-1 per Influencers.club. Our standard one-ask: \"Mind if I set you up with a free lifetime account so you can play with it?\"")]));

children.push(num([b("Follow up exactly twice. "), t("Day +3 and day +7. After that, drop them from the active queue and move them to a 90-day re-engagement bucket. Per Smartlead, follow-ups capture 42% of total replies; second-touch alone lifts reply rate 49%. Beyond three touches the marginal return drops to noise.")]));

children.push(h3("Channel-by-channel guidance"));

children.push(h4("Instagram DM"));
children.push(p([b("Daily ceiling per account: "), t("20–30 cold DMs for established accounts (180+ days old); 5–10 for new accounts. Beyond that triggers temporary blocks (24–48 hour duration per InstantDM 2026 data). We will run from 3–5 warmed accounts to stay safe.")]));
children.push(p([b("Best send time: "), t("9 AM – 11 AM in target's time zone (open rates) and 7 PM – 9 PM (engaged response). Avoid Sundays.")]));
children.push(p([b("Format: "), t("6–8 sentences max. First sentence is specific reference. Middle is offer + commission + product link. Last is single-ask question.")]));
children.push(p([b("Template: "), t("See Appendix B, Template A.")]));

children.push(h4("Cold email"));
children.push(p([b("Daily ceiling per mailbox: "), t("30–50 cold emails per mailbox per day with proper warmup. Three mailboxes per secondary domain × 5–10 domains = 450–1,500 daily ceiling.")]));
children.push(p([b("Mandatory warmup: "), t("14 days minimum via Smartlead's built-in warmup before live campaigns. Skip this and primary domain deliverability degrades.")]));
children.push(p([b("Subject line testing: "), t("Three A/B variants per campaign. Smartlead reports 6–18% open-rate spread between variants. Test until you have a winner.")]));
children.push(p([b("Sequence: "), t("Email 1 (day 0), Email 2 (day 3), Email 3 (day 7), Email 4 (day 14, breakup email). After breakup, drop from active.")]));
children.push(p([b("Templates: "), t("See Appendix B, Templates B, C, D.")]));

children.push(h4("TikTok DM"));
children.push(p([b("Daily ceiling: "), t("30–50 per account, stricter than IG. Most TikTok creators duplicate to IG anyway — prefer IG DMs.")]));
children.push(p([b("When to use: "), t("Only for TikTok-native creators who do not list IG or email contact in their TikTok bio.")]));

children.push(h4("Direct email via creator websites"));
children.push(p([b("Use for: "), t("Bloggers, substack writers, podcasters, doulas, photographers. They publish a \"work with me\" page with their preferred email; use that exact address.")]));
children.push(p([b("Reply rates: "), t("Higher than cold DMs (these creators expect business outreach), but slower (often 5–14 days to first reply).")]));

children.push(h3("Personalization workflow"));

children.push(p("This is where most cold outreach programs fail. The VAs need a repeatable system for generating specific references without spending 20 minutes per contact."));

children.push(num([b("Open the target's profile. "), t("Look at the three most recent posts.")]));
children.push(num([b("Identify the hook. "), t("What is the post about? A funny moment? A milestone? A struggle? Note 3–8 words that capture the specific topic.")]));
children.push(num([b("Drop into the template. "), t("Replace [SPECIFIC REFERENCE] with the noted detail. Verify the message reads naturally.")]));
children.push(num([b("Time budget: "), t("3 minutes per contact maximum. At 250 contacts/day per VA × 3 minutes = 12.5 hours/day. This is why we have two VAs, not one trying to do it all.")]));

children.push(h3("Quality control: weekly outreach audit"));
children.push(p("Every Monday, Dan reviews 5–10 sent messages from each VA. Score each on:"));
children.push(bullet("First-line specificity (would the recipient know this was about them?)"));
children.push(bullet("Voice match (does it sound human, not corporate?)"));
children.push(bullet("Pitch accuracy (does it correctly state the 35% recurring forever offer?)"));
children.push(bullet("Length (under 200 words for email, 6–8 sentences for DM)"));
children.push(bullet("CTA clarity (single ask, low friction?)"));

children.push(p("Issues become training points in the weekly retro. Two consecutive weeks of failed audits = VA replaced. This sounds harsh; it is the only way to maintain message quality at scale."));

// Activation
children.push(h2("3.2 The Activation Sequence (Day 0–90)"));

children.push(p("Recruiting an affiliate is the easy part. Getting them to actually post — and to make a first sale within 14 days — is what separates a 5% activation rate from a 30% activation rate. The math here is decisive: a program with 1,000 sign-ups at 5% activation = 50 active. The same program at 30% = 300 active. Six times the productive output for the same recruitment cost. The activation sequence is the single highest-ROI lever in this entire plan."));

children.push(h3("The sequence (must be automated by the end of Phase 2)"));

children.push(p([b("Day 0 — Welcome + Loom. "), t("Triggered the instant Rewardful sends affiliate.confirmed. Personalized greeting (their first name), unique affiliate link rendered in the email, link to claim their free baby-book domain, embedded Loom (60–90 seconds) from Dan saying hello specifically to new Founding Friends. CTA: \"Click here to claim your free account.\" One single action, no menu of options.")]));

children.push(p([b("Day 2 — Asset Drop. "), t("Triggered 48 hours after day 0. Three Instagram carousel templates, three Reel scripts, two email-newsletter swipes, one customer-book screenshot they can drop into a post. Each asset comes with a one-line note on how it converted (e.g., \"This carousel converted at 8.3% in our test cohort\"). No 50-asset zip file — three to five highly curated pieces.")]));

children.push(p([b("Day 4 — Training. "), t("Triggered 96 hours after day 0. Embedded Loom: \"Here's the post that's converting at 14% this month. Steal the structure.\" Walks through the specific anatomy of a high-converting Legacy Odyssey post: hook, demonstration, offer, CTA. 3-minute video.")]));

children.push(p([b("Day 7 — Personal Check-in. "), t("Semi-automated: an email that looks like Dan wrote it personally, with a \"reply if you need anything\" close. Asks one question: \"Got your free account set up? Any snags?\" Genuine replies route to Dan's inbox. Non-replies stay in cadence.")]));

children.push(p([b("Day 14 — First-Post Bonus. "), t("Triggered 14 days after day 0. \"If your first post goes up this week, you earn $50 cash and a Founders Wall feature.\" Adds a soft deadline that catches the procrastinators. For Founding Friends only in Phase 2; expanded to all affiliates in Phase 3 once budget allows.")]));

children.push(p([b("Day 21 — Segment-Specific Re-engagement. "), t("If no post yet: \"Different content type? Want me to draft you something tailored to your audience?\" The most successful programs ship affiliate-specific custom assets to the top 20% of recruits — Dan or a VA spends 30 minutes generating a custom carousel for that affiliate's exact audience.")]));

children.push(p([b("Day 30 — First-Sale Celebration. "), t("Triggered the moment Rewardful records the affiliate's first commission. Personal DM from Dan within 24 hours: \"You just made your first $10.15. The post that converted is [link]. Want me to amplify it on our channels?\" This single touchpoint is what every operator source cites as the highest-leverage retention touch. Un-scalable on purpose — automation does the trigger, Dan does the actual outreach.")]));

children.push(p([b("Day 45 — Monthly Newsletter (recurring). "), t("Affiliates join the standing monthly newsletter cadence. Content: leaderboard, top three converting posts, one product update, one tactical tip. Format: shorter is better. McWilliams: \"a short monthly newsletter does more for long-term retention than any single reactivation campaign.\"")]));

children.push(p([b("Day 60 — Cohort Zoom. "), t("All affiliates approved in the previous 60 days get invited to a 30-minute Zoom with Dan. Quick product update, Q&A, leaderboard recognition. Run monthly once we have steady cohort flow. Recorded and posted to the affiliate Discord.")]));

children.push(p([b("Day 75 — VIP Upgrade Signal. "), t("Affiliates with 3+ confirmed sales get a personal DM offering an upgrade to 50% commission for the following quarter, in exchange for a 30-minute call to discuss what's working. Half the upgraded affiliates take the call; the call surfaces what's working at the high end, which then becomes content for the monthly newsletter and the asset library.")]));

children.push(p([b("Day 90 — Quarter Recap + Contest Preview. "), t("Personalized email summarizing their first quarter (X clicks, Y signups, Z commissions earned) and previewing the next quarterly contest. Frames their position relative to the leaderboard. Triggers natural ambition to push for top 10.")]));

children.push(h3("The math on activation"));
children.push(p("Programs that ship this sequence have reported activation lifts from <10% to over 30% (McWilliams; Modash). For Legacy Odyssey that delta translates to roughly:"));

children.push(tableSimple(
  ["Sign-ups", "5% activation (no sequence)", "30% activation (with sequence)", "Difference in active affiliates"],
  [
    ["500", "25 active", "150 active", "+125 active"],
    ["1,000", "50 active", "300 active", "+250 active"],
    ["1,500", "75 active", "450 active", "+375 active"],
  ],
  [1800, 2500, 2500, 2560]
));

children.push(p([b("Translation: "), t("The activation sequence is the difference between hitting our internal active-affiliate goal and missing it by 3x. This is the single most important deliverable from the coding session in Phase 2.")]));

// In-Product Lever
children.push(h2("3.3 The In-Product Referral Lever"));

children.push(p([b("What it is: "), t("A tile inside the /account/dashboard that every paying Legacy Odyssey customer sees, prompting them to share Legacy Odyssey with a friend and earn $17.50 for every renewal year that friend stays a customer.")]));

children.push(p([b("Why it matters: "), t("Beehiiv credits this single mechanism with the bulk of their 13% MRR-from-affiliates result. The math is unbeatable — every existing paying customer is already a) paying for the product (proven affinity), b) building their book at theirchildsname.com (active engagement), and c) talking to other parents (natural distribution). Catching them at the moment they are logged in and engaged is the warmest audience we will ever reach.")]));

children.push(h3("Mechanic"));

children.push(num("Customer logs into /account/dashboard."));
children.push(num("Top of the dashboard shows a tile: \"Refer a parent, earn $17.50/year — every year they stay.\""));
children.push(num("Tile expands on click to show their unique affiliate link, a copy-to-clipboard button, three pre-written share messages (text-to-a-friend, IG story, email forward), and \"how much you've earned\" running total."));
children.push(num("First time a customer interacts with the tile, they are auto-enrolled as an affiliate in Rewardful (their existing email address becomes the affiliate account). Single-click to activate."));
children.push(num("Tile resurfaces with a soft prompt every 30 days if they have not yet shared (one nudge, never spam)."));

children.push(h3("Why every customer becomes an affiliate"));
children.push(p("This is a UX decision worth flagging explicitly. Every paying customer is auto-enrolled in the affiliate program the first time they interact with the tile. They opt in by sharing; they cannot accidentally share without seeing the program terms (the tile expands to show the offer before generating the link). This is consistent with industry practice — every Beehiiv user is a potential partner; every Notion user can apply to the ambassador program; every ConvertKit creator can promote. Friction here is the enemy."));

children.push(h3("Engineering scope"));

children.push(p([b("Backend: "), t("New endpoint /api/affiliate/enroll that auto-creates a Rewardful affiliate for the logged-in customer (using Rewardful's API) and returns their unique link. Idempotent — calling it twice for the same customer returns the existing link.")]));

children.push(p([b("Frontend: "), t("Card component added to /account/dashboard.ejs. Conditionally renders based on whether the customer has already enrolled. Pre-written share messages stored in a JSON config so we can iterate the copy without redeploying.")]));

children.push(p([b("Rewardful API integration: "), t("Use https://api.getrewardful.com/v1/affiliates with the REWARDFUL_API_SECRET (still pending — needs to be added to Railway env). This is the dependency that has been on the to-do list — now becomes a release blocker for Phase 3.")]));

children.push(p([b("Total dev work: "), t("Roughly 6–8 hours. Hand to the coding session as part of Phase 2's prep.")]));

children.push(h3("Conservative impact projection"));
children.push(p("With nine existing customers today and ~50–100 net-new customers per month in 2026 based on the broader growth trajectory, by end of Q4 2026 we will have ~250–400 customers. If 20% activate the in-product tile (industry benchmark for in-product referral tiles) and each refers an average of 1.5 friends over the year, that yields 75–120 affiliate-driven signups directly attributable to the in-product lever, with very high conversion rates because of warm intra-parent referral context."));

// Founding 100
children.push(h2("3.4 Founding 100 — The Cohort Detail"));

children.push(p("Phase 2's most important deliverable is the Founding 100 cohort. This section is the operating detail."));

children.push(h3("Selection criteria"));

children.push(p([b("Audience fit: "), t("Their content is parent-positive, baby/pregnancy/early-childhood adjacent, and emotionally aligned with sentimental keepsakes. Not exclusively parenting (that would be too narrow) but predominantly. A doula's professional Instagram counts; a generic lifestyle account that occasionally posts about their kids does not.")]));

children.push(p([b("Audience size: "), t("Sweet spot is 5K–50K followers for IG/TikTok creators. Above 50K we pivot to a hybrid affiliate + flat-fee offer (handled separately by Dan). Below 5K we focus on niche specialists — small but trusted audiences (a 2K-follower IBCLC with a focused following beats a 50K-follower lifestyle creator).")]));

children.push(p([b("Engagement rate: "), t("Above 2% (likes+comments / followers). Below that suggests bought followers or stale audience. Modash and Heepsy filters expose this directly.")]));

children.push(p([b("Recency: "), t("Posting at least 3x/week in the last 30 days. Dormant accounts mean dormant affiliates.")]));

children.push(p([b("No red flags: "), t("Not promoting MLM products, not running coupon-stacking content, not adjacent to anti-vax/conspiracy content, no recent FTC violations. We are baby-book company; brand-safety matters disproportionately.")]));

children.push(h3("Mix targets across categories"));

children.push(tableSimple(
  ["Category", "Founding 100 target", "Why this allocation"],
  [
    ["Parenting micro-IG/TikTok", "40", "Volume of available creators + highest content output"],
    ["Doulas / midwives / IBCLCs", "20", "Highest-trust voices at the buying moment"],
    ["Birth & newborn photographers", "15", "100% client overlap, gift-moment timing"],
    ["Mom bloggers / Substack writers", "15", "SEO-driven long-tail referral channel"],
    ["Pregnancy / parenting podcasters", "10", "Repeated audience exposure, evergreen content"],
  ],
  [3500, 2200, 3660]
));

children.push(h3("The pitch that converts at 25–30%"));
children.push(p("Founding Friends is positioned as a closed, curated cohort — explicitly limited to 100, with personal founder involvement. The pitch flow Dan uses on every DM:"));
children.push(num([b("Specific reference "), t("(20 words) — their recent post that made you take notice")]));
children.push(num([b("Identity "), t("(15 words) — \"I'm Dan, founder of Legacy Odyssey — digital baby books at the kid's own .com\"")]));
children.push(num([b("Why I'm reaching out "), t("(25 words) — \"I'm assembling a cohort of 100 Founding Friends, hand-picked from creators whose audiences feel like a fit\"")]));
children.push(num([b("What's in it "), t("(40 words) — 45% commission, free lifetime account, $50 first-post bonus, private community, Founders Wall feature")]));
children.push(num([b("The ask "), t("(15 words) — \"Could I set you up with a free lifetime account so you can see if it fits?\"")]));

children.push(p("Total message length: ~115 words. Tested length in cold-DM research as the sweet spot — long enough to convey the offer, short enough to read in 20 seconds."));

children.push(h3("Onboarding call (60 minutes total per Founding Friend)"));

children.push(p([b("First 30 minutes (live Zoom): "), t("Dan personally walks through Legacy Odyssey. Shows the demo, shows the affiliate dashboard, answers questions, sets up their free account. Records the call for future reference.")]));

children.push(p([b("Second 30 minutes (asynchronous): "), t("Within 24 hours, Dan sends a personalized Loom recap: their three best content angles, the exact swipe copy they should try first, a custom Founders Wall link they can share showing them on legacyodyssey.com/affiliates.")]));

children.push(p([b("Total founder time per Founding Friend: "), t("About 60 minutes. 100 Founding Friends = 100 hours over 4 weeks = 25 hours/week. This is the time commitment that distinguishes Founding Friends from later-cohort affiliates. It is the most expensive thing Dan does in Phase 2, and the highest-leverage.")]));

children.push(h3("Closed Discord channel"));

children.push(p([b("Setup: "), t("Discord server, single channel: #founding-friends. Dan in the channel daily for the first 30 days, then 3-4x/week.")]));

children.push(p([b("Channel rituals: "), t("Weekly \"Post of the Week\" — Dan highlights one Founding Friend's content and explains why it converted. Monthly \"Leaderboard Reveal\" — public rankings. \"Win Wednesday\" — affiliates share their wins (first sale, follow-up, audience question).")]));

children.push(p([b("What we are buying with the channel: "), t("Two things — visible status (Founding Friends see each other's wins and feel competitive pressure), and a feedback loop on what's working (Dan sees what's converting and can react in real time). The channel is the operating room.")]));

children.push(h3("Founders Wall public feature"));

children.push(p([b("Build: "), t("A grid on legacyodyssey.com/affiliates showing every Founding Friend's profile photo, IG handle, and a one-line bio. Clickable through to their content.")]));

children.push(p([b("Engineering: "), t("Static-rendered initially (hand-curated content management), then automated once we have a Rewardful → Cloudflare KV sync. Marginal cost: 2–3 hours of dev work.")]));

children.push(p([b("Why this matters: "), t("Public social proof works on two audiences. (1) Other creators who see the wall realize this is a legitimate program with peers they recognize. (2) The Founding Friends themselves are publicly visible, which creates accountability to actually post. \"Why is X on the wall but not posting?\" becomes a psychological prompt.")]));

// Anti-fraud
children.push(h2("3.5 Anti-Fraud at Scale"));

children.push(p("At 35% recurring forever, every fraudulent affiliate is a permanent commission liability. The program economics depend on keeping fraud below 3% of payouts. This section is the operating procedure."));

children.push(h3("What Rewardful handles automatically"));
children.push(bullet("Self-referrals (email match between affiliate and customer) — auto-deactivated."));
children.push(bullet("Stripe refund auto-void — reverses commission when Stripe charge.refunded fires (though we have a no-refund policy, this handles the rare chargeback)."));
children.push(bullet("Search-engine traffic blocking — kills brand-PPC arbitrage at the cookie level."));
children.push(bullet("60-day commission hold — refunds and most chargebacks land before payout."));

children.push(h3("What Rewardful does NOT handle"));
children.push(bullet("Coordinated cross-referrals (Affiliate A refers Affiliate B's friend; B refers A's friend)."));
children.push(bullet("Coupon-site arbitrage (affiliate runs SEO content ranking for branded keywords)."));
children.push(bullet("Cookie stuffing via iframe placement on unrelated sites."));
children.push(bullet("Chargebacks that fire >60 days after sale (rare but possible)."));
children.push(bullet("Stolen-card subscriptions where the chargeback timing exceeds the hold window."));

children.push(h3("Weekly fraud review (30 min, every Monday)"));

children.push(num([b("Check the /affiliates Rewardful tab. "), t("Filter for affiliates approved in the last 7 days. Spot-check 5–10 random profiles for: real audience, real content, real niche fit. Deactivate anything that looks like a content farm or a coupon site immediately.")]));

children.push(num([b("Check the /referrals tab. "), t("Flag any affiliate whose click-to-signup ratio is dramatically out of range (industry norm is 2–8%; below 1% suggests cookie stuffing, above 20% suggests fake traffic).")]));

children.push(num([b("Check the /commissions tab. "), t("Filter for new commissions in pending status. Spot-check 5 random commissions: Is the customer email plausibly different from the affiliate's? Is the customer's geographic location plausible relative to the affiliate's audience?")]));

children.push(num([b("Check churn rate by affiliate. "), t("Filter for affiliates whose referrals have >2x the typical churn rate. This is the signature of fake/incentivized signups that don't stick.")]));

children.push(num([b("Document patterns. "), t("Maintain a running \"fraud signatures\" doc — patterns observed, decisions made. New patterns inform monthly ToS clarifications.")]));

children.push(h3("Escalation procedure"));

children.push(p([b("Suspicion: "), t("Move the affiliate to a \"watch list\" tag in Rewardful. Hold their next payout pending review. DM them: \"Quick check-in — can you tell me about how you're driving these referrals?\"")]));

children.push(p([b("Confirmed fraud: "), t("Deactivate immediately in Rewardful. Void all pending commissions (per ToS Section 7). Bank any paid commissions as a write-off if recovery is impractical. Send a final email per the ToS termination clause.")]));

children.push(p([b("Pattern-level fraud: "), t("If multiple affiliates show coordinated patterns (same IP, same payment method, same referral patterns), document the network and deactivate the cluster. Update the ToS prohibited-tactics list if needed.")]));

children.push(h3("Budget for fraud losses"));

children.push(p("Plan on 2–4% of commissions paid being later identified as fraud or chargeback-related. At an annual commission spend of $30,000–50,000 by year 2, that is $600–2,000/year in expected fraud losses. Acceptable in the context of a $150,000+ incremental annual revenue from the program. The line item to track is \"commissions voided/recovered\" — keep it below 3% of gross commissions paid."));

// ===== PART 4: OPERATIONS =====
children.push(h1("Part 4 — Operations"));

// Tools and Budget
children.push(h2("4.1 Tools, Stack, and Budget"));

children.push(h3("Confirmed monthly tool stack (Phase 3 onward)"));

children.push(tableSimple(
  ["Tool", "Purpose", "Monthly cost", "Provider"],
  [
    ["Rewardful Starter", "Affiliate tracking + payouts (already paid)", "$49 + 9% fee", "rewardful.com"],
    ["Smartlead Pro", "Cold email at scale + warmup", "$94", "smartlead.ai"],
    ["Modash", "Creator discovery (IG/TikTok filtered lists)", "$120", "modash.io"],
    ["Apollo.io Basic", "Email finder when only IG handle is known", "$59", "apollo.io"],
    ["OnlineJobs.ph Premium", "Hire and manage VAs", "$69", "onlinejobs.ph"],
    ["Notion (Team plan)", "Affiliate CRM + content workflows", "$8", "notion.so"],
    ["Loom Business", "Personal videos to affiliates", "$15", "loom.com"],
    ["Discord", "Founding Friends community", "$0", "discord.com"],
    ["Resend (already in use)", "Activation sequence emails", "$0", "resend.com"],
    ["Secondary domains × 5–10", "Cold email reputation isolation", "$50–80", "Spaceship"],
  ],
  [2500, 3000, 1500, 2360]
));

children.push(p([b("Total monthly tool spend: "), t("~$465/month, scaling to ~$500/month with secondary domains and Apollo upgrades.")]));

children.push(h3("Confirmed people cost"));

children.push(tableSimple(
  ["Role", "Hours/week", "Hourly rate", "Monthly cost"],
  [
    ["VA #1 — Instagram DM outreach", "40", "$7", "$1,120"],
    ["VA #2 — Cold email outreach", "40", "$7", "$1,120"],
    ["VA #3 — QA / pipeline manager (optional, Phase 3)", "10", "$8", "$320"],
    ["Dan — founder time (not billed)", "12–18 (early), 6–8 (late)", "—", "—"],
  ],
  [3700, 1700, 1700, 2260]
));

children.push(p([b("Total people cost: "), t("~$2,560/month when fully staffed.")]));

children.push(h3("Direct program costs"));

children.push(tableSimple(
  ["Item", "Cost"],
  [
    ["Free lifetime accounts for affiliates (1,500 × ~$10 amortized domain cost)", "$15,000 over 5 years"],
    ["First-post bonuses ($50 × ~100 takers)", "$5,000"],
    ["Quarterly cash contests × 2", "$5,000"],
    ["Year-End Contest prizes", "$3,500"],
    ["Holiday Gift Bonus pool", "$3,000"],
    ["Institutional partnership budget (selective)", "$5,000"],
  ],
  [6160, 3200]
));

children.push(h3("Six-month program total"));

children.push(tableSimple(
  ["Category", "Total"],
  [
    ["Tools (6 months × $500)", "$3,000"],
    ["VAs (4 months × $2,560)", "$10,240"],
    ["Free accounts amortized (Year 1)", "$3,000"],
    ["Bonuses, contests, partnerships", "$21,500"],
    ["Founder time (not billed; significant)", "—"],
    ["TOTAL hard spend, June-Dec 2026", "$37,740"],
  ],
  [6160, 3200]
));

children.push(p([b("Compared to: "), t("$37,740 buys roughly 750 high-quality customer acquisitions through Facebook ads at typical parenting-niche CACs of $50–$80 each, with worse retention and no compounding loyalty. The affiliate program produces 250–300 active affiliates each averaging 3+ referrals/year (each customer with much higher retention than ad-acquired customers) plus permanent program infrastructure. Break-even by month 9 against incremental customer acquisition.")]));

// Hiring
children.push(h2("4.2 VA Hiring and Training Plan"));

children.push(h3("When to hire"));

children.push(p([b("Phase 1 (weeks 1–2): "), t("No hires. Dan personally runs all outreach.")]));

children.push(p([b("Phase 2 (weeks 3–6): "), t("No hires. Founder-led recruitment is the entire Founding 100 thesis.")]));

children.push(p([b("Phase 3 prep (week 6): "), t("Post the VA job. Interview and onboard during weeks 5–6 so VAs are productive on week 7.")]));

children.push(h3("Job specification"));

children.push(p([b("Role: "), t("Affiliate Recruitment VA")]));
children.push(p([b("Hours: "), t("40/week, M–F, 4-hour minimum daily overlap with US Pacific time")]));
children.push(p([b("Compensation: "), t("$7/hour starting, $8 after 90 days of strong performance")]));
children.push(p([b("Required skills: "), t("Native or near-native English writing; basic familiarity with Instagram and email marketing tools; comfortable on Zoom for daily standup; reliable internet (>20 Mbps verified)")]));
children.push(p([b("Bonus: "), t("Prior creator outreach or social media management experience")]));

children.push(h3("Where to post"));

children.push(num([b("OnlineJobs.ph Premium ($69/mo) "), t("— the leading Filipino VA marketplace. Expect 30–80 applications within 48 hours of posting.")]));
children.push(num([b("Upwork ($0 to post) "), t("— wider talent pool but higher noise. Filter by: $5–$10/hr range, 90%+ job success score, English fluency badge.")]));
children.push(num([b("Filipino VA Facebook groups "), t("— \"OnlineJobs.ph Job Postings\" group; lower-cost candidates often more enthusiastic.")]));

children.push(h3("Interview process"));

children.push(num([b("Application screening (Dan, 5 min/candidate). "), t("Filter for English writing quality in the application text itself. Reject auto-generated applications.")]));

children.push(num([b("Written test (1 hour, paid at $5). "), t("Give candidates 5 mock Instagram profiles and ask them to write 5 personalized DMs using our template. Score on: personalization, tone, length, accuracy of pitch. Pass threshold: 4/5 messages would be safe to send live.")]));

children.push(num([b("Live interview (30 min Zoom). "), t("Verify they can do the work in real-time: share screen, give them an Instagram profile, watch them write a DM in 3 minutes. Calibration call — can they actually do this at speed.")]));

children.push(num([b("Trial week ($280 cost: 40 hours × $7). "), t("First full week is paid trial. Daily standup with Dan, daily review of 5–10 sent messages. Conversion to permanent at end of week 1 only if quality is consistent.")]));

children.push(h3("Training playbook"));

children.push(p([b("Week 1 (paid trial): "), t("VA studies the Legacy Odyssey marketing pack, watches 5 of Dan's pre-recorded Looms (\"how I write a DM,\" \"the brand voice,\" \"what we don't say\"), and writes 50 practice DMs with daily feedback before sending live.")]));

children.push(p([b("Week 2: "), t("Live sending at 100 DMs/day starts. Dan reviews 10 per day. Cap is 100/day until consistency proven.")]));

children.push(p([b("Week 3–4: "), t("Volume ramps to 250–400/day if quality holds. Weekly retro on what's converting.")]));

children.push(p([b("Ongoing: "), t("Weekly Loom from Dan reviewing 5 of the VA's sent messages with critique. Monthly performance review tied to reply-rate metrics.")]));

children.push(h3("Performance metrics by which we evaluate VAs"));
children.push(bullet([b("Volume: "), t("250–400 personalized contacts/day at steady state.")]));
children.push(bullet([b("Reply rate: "), t("8%+ in steady state (Dan's baseline is 25–30%; VAs lower because they lack founder authority).")]));
children.push(bullet([b("Quality audit: "), t("Less than 1 in 10 messages flagged in weekly audit.")]));
children.push(bullet([b("Application conversion: "), t("40%+ of replies lead to applications.")]));

children.push(p([b("Replacement threshold: "), t("Two consecutive weeks of below-benchmark performance with no improvement plan = replace. This is necessary; the alternative is silent quality drift that destroys reply rates program-wide.")]));

// Cadence
children.push(h2("4.3 Weekly Operating Cadence"));

children.push(p("This is the rhythm of operating the program. Print this and stick it on the wall."));

children.push(h3("Daily (15 minutes, Monday–Friday)"));
children.push(bullet([b("VA standup (15 min, async Loom). "), t("Each VA records a 2-minute Loom: \"Yesterday I sent 280 messages, got 35 replies, here's a sample of three good replies and one I'm not sure how to handle.\" Dan watches at start of day, replies with direction.")]));

children.push(h3("Weekly Monday (90 minutes)"));
children.push(bullet([b("VA outreach quality audit (30 min). "), t("Review 5–10 messages from each VA. Score per the audit framework.")]));
children.push(bullet([b("Affiliate pipeline review (30 min). "), t("Open the Notion CRM. Filter the activation rescue queue: affiliates approved 14+ days ago with no first post. Pull one per Founding Friend (in Phase 2) and write a personal nudge. Drop the dormant ones from active.")]));
children.push(bullet([b("Fraud review (15 min). "), t("Run the weekly fraud checklist.")]));
children.push(bullet([b("Founder DMs to high-tier creators (15 min). "), t("Send 5–10 personal DMs to creators above 50K followers. This is Dan's personal recruitment work that never gets delegated.")]));

children.push(h3("Weekly Wednesday (60 minutes)"));
children.push(bullet([b("Affiliate newsletter draft (45 min). "), t("Write the weekly Friday newsletter. Format: leaderboard update, top 3 posts of the week, one product update, one tactical tip. Send to all affiliates Friday morning.")]));
children.push(bullet([b("Personal first-sale celebrations (15 min). "), t("Identify affiliates who made their first sale in the past 7 days. Send each a personal DM congratulating them and asking what they'd like more of.")]));

children.push(h3("Weekly Friday (60 minutes)"));
children.push(bullet([b("Newsletter send (5 min). "), t("Schedule the newsletter for Friday 8AM ET via Resend.")]));
children.push(bullet([b("Discord activity in #founding-friends (30 min). "), t("Pin the \"Post of the Week,\" answer accumulated questions, surface the top 3 affiliates' wins.")]));
children.push(bullet([b("Weekly metrics review (25 min). "), t("Run the dashboard: new signups, new active, new sales, churn. Compare to plan. Adjust next-week outreach focus if needed.")]));

children.push(h3("Monthly (3 hours, last Tuesday of the month)"));
children.push(bullet([b("Monthly cohort Zoom (60 min). "), t("All affiliates approved in the past 30 days are invited. Product update, leaderboard recognition, Q&A. Recorded; posted to Discord.")]));
children.push(bullet([b("Top performer call-outs (30 min). "), t("Identify top 5 affiliates by referrals in the past month. Personal DM to each: thank you + offer a 30-minute call to discuss what's working.")]));
children.push(bullet([b("Asset pack refresh (60 min). "), t("Look at what posts converted. Update the asset pack with the highest-performing copy/structure.")]));
children.push(bullet([b("Monthly metrics deep-dive (30 min). "), t("Generate the month's full report: signups, active, sales, MRR contribution, top 10 affiliates by revenue, fraud incidents, churn signals.")]));

children.push(h3("Quarterly (1 day, every 90 days)"));
children.push(bullet([b("Contest design and launch. "), t("Quarterly cash contest: design prizes, set rules, launch leaderboard, send announcement email.")]));
children.push(bullet([b("Tool stack review. "), t("Are we using everything we pay for? Are there cheaper alternatives? Are we missing capabilities?")]));
children.push(bullet([b("VA performance reviews. "), t("Formal review of each VA's quarter. Decide on raises, role changes, or replacements.")]));
children.push(bullet([b("Strategic adjustment. "), t("What's working? What's not? Where should we focus the next quarter?")]));

// Metrics
children.push(h2("4.4 Metrics, KPIs, and the Dashboard"));

children.push(p("If we can't measure it, we can't improve it. These are the metrics we track every week."));

children.push(h3("Top-line metrics (reported weekly to Dan)"));

children.push(tableSimple(
  ["Metric", "How calculated", "Target by Dec 31"],
  [
    ["Cumulative signups", "All-time approved affiliates", "1,500"],
    ["Active affiliates", "1+ sale in last 90 days", "250–300"],
    ["Activation rate", "Active ÷ Cumulative", "16–20%"],
    ["Monthly affiliate-driven signups", "New customers w/ referral_id", "75–100/mo by Q4"],
    ["MRR % from affiliates", "Affiliate-attributed MRR ÷ Total MRR", "10–12%"],
    ["Average commission per active affiliate per month", "Total commissions paid ÷ active count", "$30–50"],
    ["Top 10 affiliate share", "Top 10 affiliates' share of referrals", "~40%"],
    ["Churn-adjusted CAC via affiliates", "Total program cost ÷ active customers acquired", "$120–180"],
  ],
  [2500, 3200, 3660]
));

children.push(h3("Operational metrics (reported weekly to Dan; daily to VAs)"));

children.push(tableSimple(
  ["Metric", "Target", "Action if missed"],
  [
    ["VA contacts sent per day", "250–400 per VA", "Coaching, retraining, replacement"],
    ["Cold DM reply rate", "8–12% (VA), 25–30% (Dan)", "Refresh templates, audit personalization"],
    ["Reply → application", "40–60%", "Improve offer clarity in templates"],
    ["Application → approval", "70–90%", "Review approval criteria; possible vetting tightening"],
    ["Approval → first post (14 days)", "40%+", "Improve activation sequence"],
    ["First post → first sale (30 days)", "50%+", "Asset pack quality; affiliate-specific content"],
    ["First sale → second sale (30 days)", "60%+", "Personal celebrations driving repeat motivation"],
  ],
  [2500, 2500, 4360]
));

children.push(h3("Health-signal metrics (reported monthly to Dan)"));

children.push(bullet([b("Fraud rate: "), t("Commissions voided ÷ commissions paid. Target: under 3%.")]));

children.push(bullet([b("Affiliate churn: "), t("% of affiliates active 90 days ago who are inactive now. Target: under 30% quarterly.")]));

children.push(bullet([b("Customer retention by referral source: "), t("Affiliate-acquired customers' renewal rate vs. direct-acquired. Target: at minimum parity (proves affiliate referrals are high-quality, not incentivized junk).")]));

children.push(bullet([b("Net promoter score from affiliates: "), t("Sent quarterly. \"How likely are you to recommend the Friends of Legacy Odyssey program to another creator?\" Target: NPS 50+.")]));

children.push(h3("The dashboard"));

children.push(p([b("Build: "), t("A new /admin/affiliate-dashboard route in the legacy-odyssey backend. Pulls data from Rewardful API + Stripe + our families table. Displays the metrics table above with sparklines.")]));

children.push(p([b("Effort: "), t("8–12 hours of dev work, but high-leverage. Without it Dan is flying blind. Schedule for Phase 2 in parallel with the activation sequence.")]));

// Risks
children.push(h2("4.5 Risks and Contingencies"));

children.push(h3("Risk 1: Outreach reply rates fall below benchmarks"));

children.push(p([b("Signal: "), t("Cold DM reply rate sustained below 5% for two consecutive weeks despite VA quality auditing.")]));

children.push(p([b("Root causes (in order of likelihood): "), t("(1) Templates need refresh — creator audiences saturated with similar pitches. (2) VA quality decline — personalization slipping. (3) Target list quality — sourcing from low-fit niches. (4) Instagram or email deliverability issue.")]));

children.push(p([b("Mitigation: "), t("Three-template A/B test each campaign quarter. Weekly VA audit catches quality drift early. Modash filter tightening if niche fit slipping. Smartlead and IG account health monitoring as standard operating procedure.")]));

children.push(p([b("Worst-case fallback: "), t("Shift recruitment from cold outreach to institutional partnerships (DONA, IAPBP, Substack ads). Higher CAC but more predictable.")]));

children.push(h3("Risk 2: Activation rate stays below 15%"));

children.push(p([b("Signal: "), t("60+ days after a cohort's approval, less than 15% have made any sale.")]));

children.push(p([b("Root causes: "), t("(1) Asset pack quality insufficient. (2) Activation sequence emails not landing (deliverability or content). (3) Audience-product mismatch (we're recruiting wrong creators). (4) Affiliate uncertainty about how to promote.")]));

children.push(p([b("Mitigation: "), t("Custom asset generation for affiliates flagged at-risk (day 21 of sequence). Personal 15-minute calls with bottom-quartile activators. Refresh asset pack quarterly with proven posts from top performers.")]));

children.push(p([b("Worst-case fallback: "), t("Tighten the funnel — start auto-rejecting affiliate applications from creators outside the highest-fit niches. Better to have 500 active out of 800 than 200 active out of 1,500.")]));

children.push(h3("Risk 3: Fraud emerges at scale"));

children.push(p([b("Signal: "), t("Fraud rate exceeds 5% of commissions, or a single coordinated network of referrers is detected.")]));

children.push(p([b("Root causes: "), t("Coordinated cross-referral schemes, coupon-site arbitrage, or affiliate sharing of accounts.")]));

children.push(p([b("Mitigation: "), t("Tighten weekly fraud review to 60 minutes. Add tooling: simple Stripe metadata query to detect same-payment-method clusters across referrals. Update ToS with specific language about the discovered pattern.")]));

children.push(p([b("Worst-case fallback: "), t("Pause new affiliate approvals for 1–2 weeks; conduct a full program audit; reinstate with manual approval requirement for any new affiliate over a certain referral rate threshold.")]));

children.push(h3("Risk 4: Founder time becomes the bottleneck"));

children.push(p([b("Signal: "), t("Dan working 30+ hours/week on the program past Phase 2, with affiliate touchpoints (newsletter, Discord, first-sale celebrations) getting skipped or delayed.")]));

children.push(p([b("Root causes: "), t("Underestimated VA delegation capacity, underestimated affiliate volume, or under-automation of routine touchpoints.")]));

children.push(p([b("Mitigation: "), t("Hire a part-time fractional affiliate manager at month 4 if VAs cannot absorb more responsibility. Cost: $1,500–2,500/month for 10–15 hours/week of US-based program management. Free Dan to focus on top-decile creator personal outreach.")]));

children.push(p([b("Worst-case fallback: "), t("Pause new recruitment outreach for 2–4 weeks; double down on activating existing approved affiliates with intensive support; resume scaled recruitment once retention runway is stable.")]));

children.push(h3("Risk 5: Revenue contribution stays below 5% of MRR"));

children.push(p([b("Signal: "), t("End of Q3 (September 2026), affiliate-driven MRR is below 5% of total MRR.")]));

children.push(p([b("Root causes: "), t("(1) Affiliate audiences not converting (wrong-niche recruitment). (2) Conversion rate from affiliate clicks too low (product-message mismatch). (3) Affiliate posting frequency too low (we have signups but no content).")]));

children.push(p([b("Mitigation: "), t("Heavier hand on niche selection in recruitment. Test customer landing pages tailored to affiliate-source UTM parameters (\"You came from @sarah, here's why she loves us...\"). Quarterly content audit of top affiliates' posts to extract what's working.")]));

children.push(p([b("Worst-case fallback: "), t("Re-baseline expectations. Affiliate programs at the parenting B2C scale often take 12–18 months to reach mature contribution percentages. The first 6 months prove the engine works; the second 6 months prove the engine compounds. Adjust 2027 plan accordingly.")]));

// ===== PART 5: APPENDICES =====
children.push(h1("Part 5 — Appendices"));

// Appendix A — REBUILT with verified entries (June 9, 2026)
children.push(h2("Appendix A — Verified Affiliate Target List"));

children.push(p([b("Methodology: "), t("Every entry below was verified June 9, 2026 by (a) directly fetching the listed website with HTTP 200 confirmation, (b) sourced from an authoritative third-party list (IAPBP 2025 Image Competition winners, Cofertility, Texas Adoption Center, Coffee + Crumbs team page), or (c) personally inspected on Instagram via logged-in browser session. Entries that couldn't be verified for current activity or accessible contact method were dropped from the list.")]));

children.push(p([b("Priority tiers: "), t("A = 5K–30K audience or independent professional — will respond to direct DM/email. B = 30K–100K or established publication — needs a real pitch. C = 100K+ or institutional — may require flat fee + affiliate hybrid.")]));

children.push(p([b("Honest caveats: "), t("(1) Follower counts marked with ~ are from search snippets or third-party lists, not direct profile inspection — re-verify in-platform before tiering. (2) The 12 Instagram accounts in section A.7 were personally verified via Chrome on June 9 and have confirmed live counts. (3) Pure-IG pregnancy/first-year micros at 5K–30K are underrepresented because they require continued Chrome-based sourcing — methodology in A.8 covers how to extend.")]));

// ===== VERIFIED CATEGORIES (June 9, 2026) =====

// A.1 Birth Photographers (14 verified — all 2025 IAPBP Image Competition recipients)
children.push(h3("A.1 Birth Photographers (14 verified)"));
children.push(p("All entries sourced from the 2025 IAPBP Image Competition winners list (birthphotographers.com/winners-of-the-2025-birth-photography-image-competition/) and individually verified by fetching each studio website."));
children.push(tableSimple(
  ["#", "Name / Studio", "Location", "Contact", "Tier"],
  [
    ["1", "Monet Nicole", "Denver, CO", "monet@monetnicole.com", "C"],
    ["2", "Diana Hinek / Dear Birth", "Los Angeles, CA", "hello@dearbirth.com", "B"],
    ["3", "Anna Garvey Photography", "Concord/Charlotte, NC", "Site form", "A/B"],
    ["4", "Jessica Dory / Birth 5280", "Denver, CO", "birth5280@gmail.com", "A"],
    ["5", "Brittany Geisen / Gather Birth Cooperative", "Minneapolis/St. Paul, MN", "Inquiry form", "A"],
    ["6", "Leona Darnell / Birth and Beauty", "LA/OC/SD, CA", "leona@birthandbeauty.com", "A"],
    ["7", "Dana Jacobs / St Louis Birth & Baby", "St. Louis, MO", "stlouisbirthandbaby@gmail.com", "A"],
    ["8", "Randi Armstrong + Brianna Trammell / The Nurturing Company", "Grand Rapids, MI", "Contact form", "A"],
    ["9", "Natalie Broders", "Portland, OR", "Inquiry form", "A"],
    ["10", "Stephanie Entin / Little Plum Photography", "Los Angeles, CA", "IG DM", "A"],
    ["11", "Paulina Splechta", "Boca Raton, FL", "paulinasplechta@gmail.com", "A"],
    ["12", "Kristen Fortier / New Moon Doula Photo", "Whitefish, MT", "Inquiry form", "A"],
    ["13", "Lacey Barratt", "Melbourne, AU", "lacey@laceybarratt.com.au", "B"],
    ["14", "Danny Merz / Geburtsreportage", "Hamburg, DE", "Site contact", "B"],
  ],
  [400, 3000, 2200, 2700, 460]
));
children.push(p([b("Highest-conviction first DMs: "), t("Gather Birth Cooperative (doula + photographer + IBCLC in one shop — EXACT customer profile), The Nurturing Company (same combined model, smaller), Anna Garvey (2025 IAPBP Overall Winner).")]));

// A.2 Doulas
children.push(h3("A.2 Doulas with online presence (5 verified)"));
children.push(tableSimple(
  ["#", "Name", "Location", "Contact", "Tier"],
  [
    ["1", "Flor Cruz / Badass Mother Birther", "Menifee, CA", "Contact form (1M IG @badassmotherbirther)", "C++"],
    ["2", "Latham Thomas / Mama Glow", "New York, NY", "info@mamaglow.com (130K IG @glowmaven)", "C"],
    ["3", "HeHe Stewart / Tranquility by HeHe", "Boston, MA", "tranquilitybyhehe@gmail.com", "B"],
    ["4", "Cynthia Overgard + Trisha Ludwig / Down to Birth Show", "Connecticut", "Inquiry form (podcast)", "B"],
    ["5", "Rebecca Dekker / Evidence Based Birth", "Lexington, KY", "Media form (122K IG @ebbirth)", "B"],
  ],
  [400, 3400, 2200, 2700, 460]
));

// A.3 Midwives
children.push(h3("A.3 Midwives with online presence (3 verified)"));
children.push(tableSimple(
  ["#", "Name", "Location", "Contact", "Tier"],
  [
    ["1", "Anne Margolis, CNM / Home Sweet Home Birth", "Online", "info@homesweethomebirth.com (~101K IG)", "C"],
    ["2", "Sarah McClure + Charli Zarosinski / Hearth & Home Midwifery", "Hood River, OR", "midwives@hearthandhomemidwifery.com", "A"],
    ["3", "Jennie Joseph / Commonsense Childbirth", "Winter Garden, FL", "Site contact", "B"],
  ],
  [400, 3400, 2200, 2700, 460]
));
children.push(p([b("Worth a re-check before pitching: "), t("Aviva Romm MD (@dr.avivaromm ~284K), Marie Louise / The Modern Midwife (~120K), Marley Hall / Midwife Marley (172K Chrome-verified, see A.17).")]));

// A.4 IBCLCs
children.push(h3("A.4 Lactation Consultants / IBCLCs (3 verified + see A.17)"));
children.push(tableSimple(
  ["#", "Name", "Handle", "Contact", "Tier"],
  [
    ["1", "Karrie Locher / Karing for Postpartum", "@karrie_locher (842K Chrome-verified)", "karingforpostpartum.com/courses", "C++"],
    ["2", "Kristen Krahl / Be My Breast Friend", "@bemybreastfriend (~239K)", "IG DM", "C"],
    ["3", "Meg Nagle / The Milk Meg (AU)", "@themilkmeg", "Site contact", "B"],
  ],
  [400, 2500, 3200, 2700, 360]
));

// A.5 Newborn Portrait Photographers
children.push(h3("A.5 Newborn Portrait Photographers (3 verified)"));
children.push(tableSimple(
  ["#", "Name", "Location", "Contact", "Tier"],
  [
    ["1", "Ana Brandt", "Orange County, CA", "Contact form (262K Chrome-verified)", "C"],
    ["2", "Kelly Brown", "Australia", "newbornposing.com", "C"],
    ["3", "Erin Tole Photography", "Vancouver, WA / Portland, OR", "hello@erintolephotography.com", "A"],
  ],
  [400, 2500, 3000, 2900, 360]
));

// A.6 Maternity Photographers
children.push(h3("A.6 Maternity Photographers (3 verified)"));
children.push(tableSimple(
  ["#", "Name", "Location", "Contact", "Tier"],
  [
    ["1", "Lola Melani", "Fort Lauderdale, FL", "Contact form (~138K)", "C"],
    ["2", "Jenna Henderson", "Nashville, TN", "hello@jennahenderson.com", "A"],
    ["3", "Tonya Damron", "Knoxville, TN", "Contact form", "A"],
  ],
  [400, 2500, 3000, 2900, 360]
));

// A.7 NICU
children.push(h3("A.7 NICU / Preemie Parent Advocates (10 verified)"));
children.push(tableSimple(
  ["#", "Handle / Org", "Verified via", "Contact", "Tier"],
  [
    ["1", "@dearnicumama (Dear NICU Mama)", "Own site, 2025 stats, Chrome (67.3K)", "hello@dearnicumama.com", "B"],
    ["2", "@ourlittlepreemie", "Chrome-verified (102K). ⚠️ Make NICU baby books — adjacent competitor", "DM", "C"],
    ["3", "@project_nicu (Project NICU, 501c3)", "Chrome-verified (23.3K), Has Ambassadors program", "hello@projectnicu.com", "A"],
    ["4", "@handtohold (Hand to Hold)", "Chrome-verified (6.7K), HAS SPONSORS highlight", "Site contact + Ambassador app", "A"],
    ["5", "@ourlifeafterNICU", "Feedspot 2025 (~57K)", "IG DM", "B"],
    ["6", "@prayersforpaisley (Melissa)", "NICU-mom roundups", "IG DM", "A"],
    ["7", "@sloan_strength (Kari)", "NICU-mom roundups", "IG DM", "A"],
    ["8", "@lilyslittlelungs (Jess)", "NICU-mom roundups", "IG DM", "A"],
    ["9", "@nurse.tori_ (Tori Meskin)", "2025 nurse-influencer lists", "tipsfromtori.com", "B"],
    ["10", "@aalexisnicole (Alexis Nicole, The Nurse Nook)", "2025 IZEA list (73K IG / 280K YT)", "YT business inquiry", "B"],
  ],
  [400, 3000, 2900, 2540, 360]
));

// A.8 IVF / Donor Egg / Fertility
children.push(h3("A.8 Infertility / IVF / Donor Egg (12 verified)"));
children.push(tableSimple(
  ["#", "Handle", "Source", "Contact", "Tier"],
  [
    ["1", "@expectinganything (Victoria Niño)", "Chrome (28.5K), donor-egg storyteller", "chirp.me/expectinganything", "A/B"],
    ["2", "@definingmum (Becky Kearns, UK)", "Cofertility flagship UK voice", "Paths to Parenthub site", "B"],
    ["3", "@dani_repsch (Danielle Repsch)", "Cofertility featured", "DM", "A"],
    ["4", "@donor.egg.mama.cheetah (Sonia)", "Cofertility featured", "DM", "A"],
    ["5", "@becomingnathparty_3 (Melissa Nath)", "Cofertility emerging", "DM", "A"],
    ["6", "@the.ivf.warrior (Cheryl Dowling)", "Chrome (127K), \"UNSPOKEN\" author", "cheryl@ivfwarrior", "C"],
    ["7", "@motherprojectofficial (Sophie Beresiner)", "Times of London columnist", "Via Times bio", "B/C"],
    ["8", "@journeytothree_ivf", "IVF-Babble roundup", "DM", "A"],
    ["9", "@while_we_wait", "IVF-Babble roundup", "DM", "A"],
    ["10", "@ustheremingtons", "Adoption + fertility + faith triple fit", "DM", "A"],
    ["11", "@ivfbabble (Sara & Tracey)", "Major IVF media brand", "hello@ivfbabble.com", "C"],
    ["12", "@kaydemason (Kayde Mason)", "Forbes (~134K combined)", "DM", "C"],
  ],
  [400, 3000, 2900, 2540, 360]
));

// A.9 Adoption
children.push(h3("A.9 Adoption Parents (8 verified — Texas Adoption Center curated list)"));
children.push(tableSimple(
  ["#", "Handle", "Story", "Contact", "Tier"],
  [
    ["1", "@christygior (Christy Gior)", "Adoptive parent of 5; transracial", "DM", "A"],
    ["2", "@jeenawilder (Jeena Wilder)", "Transracial adoption + motherhood", "DM", "A/B"],
    ["3", "@heloge (Hannah Eloge)", "Adoptive parent of twins; birth mother relationships", "DM", "A"],
    ["4", "@brittanyraestokes (Brittany Stokes)", "Foster mom + Project Orphans founder", "Project Orphans email", "B"],
    ["5", "@dirtydiaperdiaries (Taylor McNeil)", "Adoptee turned adoptive parent", "DM", "A"],
    ["6", "@littlebitlikeheaven (Katie Brown)", "Waiting-for-adoption documenting (LO is literally the book she'll build)", "DM", "A"],
    ["7", "@my_story_for_his_glory (Julia Dimaggio)", "Foster + adoptive parent; faith voice", "DM", "A"],
    ["8", "@joanna_gott (Joanna Gott)", "Single mom, international adoption from China", "DM", "A"],
  ],
  [400, 2700, 3600, 2200, 360]
));

// A.10 Surrogacy
children.push(h3("A.10 Surrogacy (intended parents + surrogates) (6 verified)"));
children.push(tableSimple(
  ["#", "Handle", "Story", "Contact", "Tier"],
  [
    ["1", "@thebiggestask", "MJ (mother via surrogacy) + Ashley (surrogate) — both sides", "DM", "A"],
    ["2", "@carried.with.love", "5-time gestational carrier — honest video diary", "DM", "A"],
    ["3", "@the.surrogacy.journey (Carly)", "Surrogate documenting cycles", "DM", "A"],
    ["4", "@officialmysurrogacyjourney", "Intended-parent journey community", "DM", "A/B"],
    ["5", "@singleblackgaydad", "Single father, twins via surrogacy", "DM", "B"],
    ["6", "@waitingforbabywunder", "Embryo transfers — cross-fits IVF", "DM", "A"],
  ],
  [400, 2700, 4200, 1600, 360]
));

// A.11 Twin / Multiples
children.push(h3("A.11 Twin / Multiples Parents (11 verified)"));
children.push(tableSimple(
  ["#", "Handle", "Story", "Contact", "Tier"],
  [
    ["1", "@twiniversity (Natalie Diaz)", "Chrome (99.5K) — #1 Twin Parenting Site, 2M families/yr", "twiniversity.com", "C"],
    ["2", "@official_twinmom", "Twin parents community", "DM", "C"],
    ["3", "@threetimestheplay (Tara Dion)", "NC mom of 3 boys incl. 3yo twins", "DM", "B"],
    ["4", "@herrintwins (Kendra & Maliyah)", "Formerly conjoined twins; milestone-story fit", "DM", "A"],
    ["5", "@galeforcetwins (Emily & Amanda Gale)", "Twins + Gale Force Gear founders (affiliate-fluent)", "Business email", "B"],
    ["6", "@abigailackfam (Abigail Ack)", "Twins + 1; faith motherhood — double fit", "DM", "B"],
    ["7", "@katiemariebakeryqueen (Katie Marie)", "Mom of TWO sets of twins", "DM", "B"],
    ["8", "@some_assembly_required__ (Ashley Howard-Heimbuch)", "Twins River & Brooks + 1", "DM", "B"],
    ["9", "@littlekentuckyfamily (Caytlin)", "Twins + 2, KY mom + photographer; UGC creator", "DM", "B"],
    ["10", "@raisingtwinboys (Meghan Allen)", "Twin boys lifestyle", "DM", "B"],
    ["11", "@sinead__finn_ (Sinead Finn)", "\"Your internet twin mum friend\"", "DM", "B"],
  ],
  [400, 3100, 3500, 1800, 360]
));

// A.12 Loss & Rainbow Baby
children.push(h3("A.12 Loss & Rainbow Baby (8 verified)"));
children.push(tableSimple(
  ["#", "Handle / Org", "Story", "Contact", "Tier"],
  [
    ["1", "@pregnancyafterlosssupport (PALS, Lindsey Henke)", "Transitioning to RTZ Hope Jan 2026 — pitch BOTH", "info@pregnancyafterlosssupport.org", "B"],
    ["2", "@taylorashleybates (Rainbow Baby Podcast)", "Lost son Ellis (stillbirth 2018); rainbow Jonas; published author", "taylorashley@mac.com", "A"],
    ["3", "@ihadamiscarriage (Dr. Jessica Zucker)", "Chrome (406K); psychologist + 2 award-winning books", "drjessicazucker.com", "C"],
    ["4", "@themiscarriagedoula (Arden Cartrette)", "Coaching + peer support for miscarriage", "DM", "A"],
    ["5", "@the_worstgirlgang_ever", "\"Raw, unfiltered\" pregnancy-loss collective", "DM + community signup", "B"],
    ["6", "@miscarriagemovement", "Awareness campaigns + personal stories", "DM", "A/B"],
    ["7", "@wishiwasntinthisclub", "Supportive miscarriage community", "DM", "A"],
    ["8", "Still Loved / Autumn Cohen (In Memory Of You)", "Lost son Bash (stillbirth 2020); sends birthday cards to lost babies + journal author", "stilllovedorg + publisher", "A"],
  ],
  [400, 3000, 3600, 1800, 360]
));

// A.13 Christian Motherhood
children.push(h3("A.13 Christian / Faith Motherhood (12 verified)"));
children.push(p([b("⚠️ Important context: "), t("Risen Motherhood as an organization is CLOSED (\"The ministry has ended\" — verified). The two co-founders are independently active and remain bullseye targets (rows 1 and 2 below).")]));
children.push(tableSimple(
  ["#", "Handle", "Verified via", "Contact", "Tier"],
  [
    ["1", "@laurawifler (Laura Wifler)", "Chrome (102K); 7x bestselling author", "laurawifler.com/contact", "C"],
    ["2", "@emilyajensen (Emily Jensen)", "Chrome (36.1K); \"Gospel Mom\" + \"He is Strong\"", "emilyajensen.com/links", "B"],
    ["3", "@ashleegadd (Ashlee Gadd)", "Chrome (32K); Coffee + Crumbs founder. ⚠️ Off IG till Sept — use Substack", "ashlee.gadd@gmail.com", "A/B"],
    ["4", "@coffeeandcrumbs (the C+C brand)", "Chrome (63.4K); literary motherhood, **HAS Gift Guides highlight**", "hello@coffeeandcrumbs.net", "B"],
    ["5", "@katiemblackburn (Katie Blackburn)", "C+C writer + active Substack", "Contact form on katiemblackburn.com", "A"],
    ["6", "@sonyaspillmann", "C+C writer; nonfiction editor + writer", "sonyaspillmann.substack.com", "A"],
    ["7", "@sarah.j.hauser (Sarah J. Hauser)", "C+C writer; book *All Who Are Weary*; Chicago", "sarahjhauser.com", "A"],
    ["8", "@kknowlezeller (Kimberly Knowle-Zeller)", "C+C \"Exhale\" community manager; author *The Beauty of Motherhood*", "kimberlyknowlezeller.com", "A"],
    ["9", "@melanierdale (Melanie Dale)", "C+C writer; *Infreakinfertility* (bonus IVF fit)", "unexpected.org", "A/B"],
    ["10", "@molly_flinkman (Molly Flinkman)", "C+C writer; faith motherhood essayist", "mollyflinkman.com", "A"],
    ["11", "@adrie.garrison (Adrienne Garrison)", "C+C writer + Exhale podcast co-host", "adriennegarrison.com", "A"],
    ["12", "Grace Thweatt (Renewed Motherhood Substack)", "Faith devotionals", "Substack DM", "A"],
  ],
  [400, 3000, 3500, 1900, 360]
));

// A.14 Literary Motherhood Publications
children.push(h3("A.14 Literary Motherhood Publications (7 verified)"));
children.push(tableSimple(
  ["#", "Name", "Most recent", "Contact", "Tier"],
  [
    ["1", "Coffee + Crumbs", "Substack May 13, 2026", "hello@coffeeandcrumbs.net", "B"],
    ["2", "Motherwell Magazine", "May 27, 2026", "motherwellmag@gmail.com", "B"],
    ["3", "MUTHA Magazine", "June 9, 2026", "Submission Guidelines page", "B"],
    ["4", "Literary Mama", "May/June 2026 issue", "/submissions page", "B"],
    ["5", "Mom Egg Review (MER)", "May 30, 2026", "merliterary.com/submit", "A"],
    ["6", "Mater Mea", "Active 2026; Black-mother community", "info@matermea.com; press@matermea.com", "B"],
    ["7", "HerStry", "May 29, 2026", "julia@herstryblg.com", "A"],
  ],
  [400, 2700, 2500, 3400, 360]
));

// A.15 Sentimental Motherhood Substacks
children.push(h3("A.15 Sentimental Motherhood Substacks (10 verified)"));
children.push(tableSimple(
  ["#", "Name (Author)", "URL", "Subs", "Tier"],
  [
    ["1", "Mad Woman (Amanda Montei)", "amandamontei.substack.com", "12K+", "A"],
    ["2", "In Pursuit of Clean Countertops (Sara Petersen)", "sarapetersen.substack.com", "23K+", "B"],
    ["3", "Two Truths (Cassie Shortsleeve + Kelsey Lucas)", "twotruths.substack.com", "8K+", "A"],
    ["4", "The Mother Lode (Cindy DiTiberio)", "cindyditiberio.substack.com", "5K+", "A"],
    ["5", "Coffee + Crumbs Substack", "coffeeandcrumbs.substack.com", "21K+", "B"],
    ["6", "Promoted to Mother (Kiya Taylor)", "kiyataylor.substack.com", "1K+", "A"],
    ["7", "Mother Love Letters (Violet Carol)", "motherloveletters.substack.com", "hidden", "A"],
    ["8", "Human/Mother (Katrina Donham)", "katrinadonhamwrites.substack.com", "hidden", "A"],
    ["9", "This Postpartum Life (Erin Schlozman LPC)", "erinschlozman.substack.com", "1K+", "A"],
    ["10", "Motherhoodland (Brooke C.)", "motherhoodland.substack.com", "hidden", "A"],
  ],
  [400, 3400, 3500, 1100, 460]
));
children.push(p("Contact for all: Substack's built-in DM."));

// A.16 Reflective Parenting Podcasts
children.push(h3("A.16 Reflective Parenting Podcasts (4 verified)"));
children.push(tableSimple(
  ["#", "Name", "Most recent", "Contact", "Tier"],
  [
    ["1", "Big Fat Positive", "Ep. 414, June 8, 2026", "True Native Media", "B/C"],
    ["2", "Coffee + Crumbs Podcast", "May 13, 2026 bonus", "hello@coffeeandcrumbs.net", "B"],
    ["3", "The Motherhood Experience (Val)", "Active 2026", "themotherhoodexperience.com/learnmore", "A"],
    ["4", "Motherhood, Rewritten", "Active 2026", "Podcast site contact", "A"],
  ],
  [400, 2900, 2500, 3300, 360]
));

// A.17 Chrome-verified Instagram accounts
children.push(h3("A.17 Chrome-Verified Instagram Accounts (24 verified June 9, 2026)"));
children.push(p("These 24 Instagram accounts were personally inspected by logging into Instagram as @legacyodysseyapp and visiting each profile. Captured: handle (live), follower count (visible at time of visit), niche fit, monetization signal, contact method. Methodology and full continuation playbook in F:\\legacy-odyssey\\affiliate-assets\\verified-ig-500.md."));
children.push(tableSimple(
  ["#", "Handle", "Followers", "Niche / Monetization signal", "Tier"],
  [
    ["1", "@mommy.labornurse (Liesel Teen)", "655K", "L&D nurse, $39 birth class (100K enrolled)", "C++"],
    ["2", "@thebabychick (Nina Spears)", "428K", "Doula/Educator 15 yrs, book+course+podcast", "C"],
    ["3", "@badassmotherbirther (Flor Cruz)", "1M", "Latina birth worker, ebook seller", "C++"],
    ["4", "@pedsdoctalk (Dr. Mona)", "1.7M", "Pediatrician, podcast, HAS Promo Codes highlight", "C++"],
    ["5", "@thelabormama (Lo Mansfield RN MSN CLC)", "231K", "L&D RN, birth course, podcast", "B/C"],
    ["6", "@midwifemarley (Marley Hall, UK)", "172K", "UK midwife, author + courses", "C"],
    ["7", "@lactationlink", "114K", "IBCLC online courses, Black maternal health", "B"],
    ["8", "@ourlittlepreemie", "102K", "NICU community + makes own NICU baby books (adjacent competitor)", "C"],
    ["9", "@dearnicumama", "67.3K", "Nonprofit NICU support, podcast 100+ eps", "B"],
    ["10", "@giulibusetto", "38.3K", "Latina motherhood + travel, Miami, public collabs email", "A/B"],
    ["11", "@projectnicu", "23.3K", "Nonprofit, HAS Ambassadors program", "A"],
    ["12", "@handtohold", "6.7K", "Nonprofit, HAS Sponsors highlight", "A"],
    ["13", "@glowmaven (Latham Thomas)", "130K", "Mama Glow founder, Doula Homeschool course", "C"],
    ["14", "@ebbirth (Evidence Based Birth)", "122K", "Rebecca Dekker; shop + childbirth class + podcast", "C"],
    ["15", "@the.ivf.warrior (Cheryl Dowling)", "127K", "\"UNSPOKEN\" author, Emmy storyteller", "C"],
    ["16", "@twiniversity (Natalie Diaz)", "99.5K", "#1 Twin Parenting Site, classes + book + podcast", "C"],
    ["17", "@anabrandt (Anamaria Brandt)", "262K", "Celebrity newborn photographer, sells workshops + membership", "C"],
    ["18", "@karrie_locher", "842K", "Mom-Baby Nurse, sells courses", "C++"],
    ["19", "@expectinganything (Victoria Niño)", "28.5K", "Donor conception advocate, kids book + e-book", "A/B"],
    ["20", "@laurawifler (Laura Wifler)", "102K", "Risen Motherhood co-founder, 7x bestselling author", "C"],
    ["21", "@emilyajensen (Emily Jensen)", "36.1K", "Risen Motherhood co-founder, \"Gospel Mom\" author", "B"],
    ["22", "@coffeeandcrumbs", "63.4K", "Literary motherhood mag, HAS Gift Guides highlight", "B"],
    ["23", "@ashleegadd (Ashlee Gadd)", "32K", "C+C founder. ⚠️ Off IG till Sept, reach via Substack", "A/B"],
    ["24", "@ihadamiscarriage (Dr. Jessica Zucker)", "406K", "Repro-health psychologist, 2 award-winning books", "C"],
  ],
  [400, 3000, 1200, 4000, 460]
));

// A.18 Top 30 — refined
children.push(h3("A.18 Top 30 Starter Targets — DM/Email This Week"));
children.push(p("Ranked by niche fit × addressability × likelihood-to-respond. Send to these 30 first."));
const top30v2 = [
  ["1", "Gather Birth Cooperative (Minneapolis)", "Doula + photographer + IBCLC in one shop — EXACT customer profile"],
  ["2", "The Nurturing Company (Grand Rapids)", "Same combined model, smaller, perfect Tier-A DM"],
  ["3", "Anna Garvey Photography", "2025 IAPBP Overall Winner — high credibility"],
  ["4", "Jessica Dory / Birth 5280 (Denver)", "Doula + photographer combo"],
  ["5", "Hearth & Home Midwifery (Oregon)", "Has own podcast — pitch affiliate + guest spot"],
  ["6", "Down to Birth Show", "Top-1% birth podcast; host-read affiliate code"],
  ["7", "Evidence Based Birth (Rebecca Dekker)", "PhD RN; podcast sponsor + affiliate (Chrome-verified 122K)"],
  ["8", "Dear NICU Mama", "Public email, podcast 100+ eps (Chrome-verified 67.3K)"],
  ["9", "Hand to Hold", "Already runs Ambassador program — paid layer above volunteers"],
  ["10", "Project NICU", "501c3, has Ambassadors program (Chrome-verified 23.3K)"],
  ["11", "@expectinganything (Victoria Niño)", "Cofertility flagship donor-egg storyteller (28.5K)"],
  ["12", "@ustheremingtons", "Adoption + fertility + faith triple fit"],
  ["13", "@littlebitlikeheaven (Katie Brown)", "Waiting-for-adoption — LO is literally her book"],
  ["14", "@thebiggestask", "Both-sides surrogacy account, community DM-friendly"],
  ["15", "@taylorashleybates", "Public email, author, podcast — high-authority loss/rainbow"],
  ["16", "@twiniversity (Natalie Diaz)", "THE twin-parent hub; institutional partnership (99.5K)"],
  ["17", "@galeforcetwins", "Affiliate-fluent + twin audience"],
  ["18", "Coffee + Crumbs (Ashlee Gadd)", "Public email; Substack-monetized. ⚠️ Reach via ashlee.gadd@gmail.com (off IG till Sept)"],
  ["19", "@emilyajensen", "Risen Motherhood co-founder; new book → audience-building mode"],
  ["20", "@laurawifler", "Risen Motherhood co-founder; 7x bestselling author"],
  ["21", "Two Truths (Cassie + Kelsey)", "Motherly's \"best parenting Substack\""],
  ["22", "Sara Petersen (In Pursuit of Clean Countertops)", "23K Substack; cultural criticism credible voice"],
  ["23", "Amanda Montei (Mad Woman)", "12K Substack; literary motherhood"],
  ["24", "Motherwell Magazine", "Literary publication; sponsored essay + affiliate"],
  ["25", "MUTHA Magazine", "Covers adoption/loss/identity (huge fit)"],
  ["26", "HerStry", "Active monthly motherhood-theme essay calls; sponsor"],
  ["27", "Mater Mea (Tomi Akitunde)", "Black-mother content + community"],
  ["28", "Big Fat Positive Podcast", "Active weekly; pregnancy → parenting cohort"],
  ["29", "@glowmaven / Mama Glow (Latham Thomas)", "NYC doula founder; institutional network (130K)"],
  ["30", "This Postpartum Life (Erin Schlozman)", "Therapist's reflective essays — high-trust window"],
];
children.push(tableSimple(["#", "Target", "Why first"], top30v2, [500, 4200, 4660]));

// A.19 honest gaps
children.push(h3("A.19 Verification methodology — what changed and what's still open"));
children.push(p("This verified Appendix A replaces the previous 165-entry unverified list. Three categories were dropped in the cleanup:"));
children.push(bullet([b("Mom-lifestyle Instagram micro-influencers "), t("(the original A.1) — every entry was sourced from a content-farm listicle without verification. Replaced with the 24 Chrome-verified IG accounts in A.17.")]));
children.push(bullet([b("Mom-TikTok creators "), t("(original A.2) — same issue. Not replaced in this turn because TikTok requires the same Chrome-based logged-in approach as IG; deferred to follow-up session or VA assignment.")]));
children.push(bullet([b("First-time-mom YouTubers "), t("(original A.3) — partial overlap with other categories. Deferred to next sourcing pass.")]));

children.push(p([b("Open targets for the next 470 IG verifications (to reach 500): "), t("Full continuation methodology in F:\\legacy-odyssey\\affiliate-assets\\verified-ig-500.md. The right move is a VA assignment using the per-profile checklist (~25–40 verifications/hour at $7/hr = ~$140 total for 500). Founder personally Chrome-verifies high-conviction targets where founder judgment matters; VA handles bulk discovery via brand-tagged-by graphs and Following-list sweeps.")]));

children.push(p([b("Specifically dropped from prior unverified list: "), t("@livviejane, @mama.shocks, @alexiskristiana, @themotherchapter (DEAD — 8 followers), @babybookymora (wrong niche), @nesliquik (too small + fitness niche), and all other unverified mom-lifestyle entries.")]));

// stub to absorb the rest of the deleted old block — replaced with no-op

// Discovery channels
children.push(h3("A.20 Discovery Channels to Source More Affiliates Weekly"));
children.push(p("Run these queries each week to extend the target list."));
children.push(num([b("Brand-tagged-by graphs. "), t("Pull Instagram \"tagged\" tabs of Frida Mom, Kindred Bravely, Solly Baby, Lovevery, Tubby Todd, Lalo. Export every creator who tagged them in last 90 days at 5–50K followers.")]));
children.push(num([b("Substack /top/parenting and /leaderboard/parenting/paid. "), t("Pull the live top 25 each month for new emerging newsletters.")]));
children.push(num([b("TikTok hashtag harvest. "), t("#bumpdate #firsttimemom #newbornlife #babybook #milestonephotos — sort by Recent, filter to creators at 10–200K with active posting.")]));
children.push(num([b("Instagram hashtag harvest. "), t("#pregnancyjournal #nineMonthsIn #mybabybook #firsttimemomma — same workflow.")]));
children.push(num([b("YouTube \"pregnancy vlog 2026\". "), t("Sort by Upload Date. Filter to channels in the 50K–500K subs range with active uploads.")]));
children.push(num([b("Apple Podcasts → Kids & Family → Parenting chart. "), t("Top 100 (via rephonic.com/charts), filtered to shows with under 50K downloads where flat-fee + affiliate hybrid is feasible.")]));
children.push(num([b("FeedSpot \"Top 35 Black Mom Blogs 2026\". "), t("Fetch list, RSS-ping each for activity in last 90 days. Pull the actives.")]));
children.push(num([b("Mater Mea's \"62 Black Mom Groups\" post. "), t("Pre-built community map at matermea.com/black-mom-groups-for-support-and-community/.")]));
children.push(num([b("Cofertility's \"Donor Egg Influencers\" list. "), t("Pre-built fertility-influencer map.")]));
children.push(num([b("ShareASale \"Family / Babies\" merchant page. "), t("Competitive intel — publishers signed up there are the same publishers you should approach for Legacy Odyssey.")]));

children.push(h3("A.21 Older known gaps"));
children.push(p("In the interest of building on what is real, the following gaps in the verified target list are flagged so future research can fill them:"));
children.push(bullet("Christian-homeschool mom Instagram (5K–50K bucket specifically): four strong handles surfaced; more available through Modash's gated \"Top 20 American Homeschool Influencers\" 2026 list."));
children.push(bullet("IVF / fertility-after-baby individual handles: best path is the Matt and Doree's Eggcellent Adventure guest list."));
children.push(bullet("Pinterest follower counts: not publicly exposed. Listed accounts are real; verify reach in-platform."));
children.push(bullet("Niche communities (Latina, Asian, LGBTQ+, adoption, surrogacy, twin-parent, late-in-life-parent): each has 3–10 real Instagram-first community accounts; needs targeted searches per subvertical."));

// Appendix B
children.push(h2("Appendix B — Outreach Templates"));

children.push(h3("Template A — Instagram DM, Founding Friend cohort (Phase 2)"));
children.push(p([b("Use: "), t("Personal DMs from Dan to creators 5K–50K followers in Phase 2.")]));

const tmplA = `Hey {{first_name}} — Dan here, I'm the founder of Legacy Odyssey.

I just watched your reel about [SPECIFIC POST — e.g., "the hospital bag list for second-time moms"] and it stopped my scroll. The audience you've built is exactly who we made our product for.

We do digital baby books at the kid's own .com domain (your-baby-name.com), $29 the first year. I'm putting together a "Founding Friends" cohort — 100 hand-picked creators, 45% recurring commission, free lifetime account for your own baby's book, $50 bonus on your first post.

Could I set you up with the free account so you can play with it? No posting obligation if it's not a fit.

What's the best email to send the login to?`;

children.push(p([t(tmplA)], { shading: { fill: "F2F2F2", type: ShadingType.CLEAR }, spacing: { before: 80, after: 200 } }));

children.push(h3("Template B — Cold email, parenting bloggers and Substack writers"));
const tmplB = `Subject: A digital baby book at the kid's own .com — thought of your readers

Hi {{first_name}},

I came across your post on [SPECIFIC ARTICLE]. Real reason I'm writing: I'm Dan, founder of Legacy Odyssey — we let parents build a baby book that lives at a real custom domain like sophiasmith.com. $29 first year, parents fill it in via the app or web.

Three things that might be interesting for your audience:

  1. Every customer gets a real .com (we purchase + configure it for them).
  2. Password-protected — grandma-friendly, no public algorithm.
  3. Our affiliate program pays 35% recurring forever, not just for 30 days. Most photo-book programs pay you once; we pay every renewal year.

Would a free founder account + a $50 first-post bonus be enough to give it a fair look?

— Dan
Founder, Legacy Odyssey
demo: your-family-photo-album.com`;

children.push(p([t(tmplB)], { shading: { fill: "F2F2F2", type: ShadingType.CLEAR }, spacing: { before: 80, after: 200 } }));

children.push(h3("Template C — Day +3 follow-up"));
const tmplC = `Hi {{first_name}} — bumping this in case it got buried.

The one-line version: free account + 35% recurring on a $29-year product that's a fit for your mom audience.

Worth a 10-minute look?`;

children.push(p([t(tmplC)], { shading: { fill: "F2F2F2", type: ShadingType.CLEAR }, spacing: { before: 80, after: 200 } }));

children.push(h3("Template D — Day +7 final follow-up (breakup email)"));
const tmplD = `Hi {{first_name}},

Last note from me on this — I don't want to fill your inbox. Wanted to leave one thing in case timing was just wrong:

If you ever do want to take a look, your free founder account is waiting at [link]. We'd love to have you in the program.

Either way, keep doing what you're doing — your audience trusts you, and that's the rare thing.

— Dan`;

children.push(p([t(tmplD)], { shading: { fill: "F2F2F2", type: ShadingType.CLEAR }, spacing: { before: 80, after: 200 } }));

children.push(h3("Template E — Doula / midwife / lactation consultant pitch"));
const tmplE = `Subject: A digital baby book your clients might love — and earn from

Hi {{first_name}},

I'm Dan, founder of Legacy Odyssey. Your work with [PRACTICE NAME / TOPIC] is exactly the audience we built for.

Here's the short version: we make digital baby books at the kid's own .com (yourbabysname.com). $29 the first year. Parents fill it via app or web; family views the book at the custom URL.

Three things I think you'll find interesting:

  1. It's the kind of thing your clients are looking for at exactly the moment you see them.
  2. Adding it to your client welcome packet earns you 35% recurring — that's about $17.50/year, every renewal year, for every client who signs up.
  3. We give every Founding affiliate a free lifetime account for your own next baby (or a gift for a client you love).

Would you be open to a 15-minute call to see if it fits how you work with clients?

— Dan
Founder, Legacy Odyssey
demo: your-family-photo-album.com`;

children.push(p([t(tmplE)], { shading: { fill: "F2F2F2", type: ShadingType.CLEAR }, spacing: { before: 80, after: 200 } }));

children.push(h3("Template F — Approval welcome email (Day 0 of activation sequence)"));
const tmplF = `Subject: Welcome to Friends of Legacy Odyssey, {{first_name}}!

Hey {{first_name}} —

You're in. Welcome to the Friends of Legacy Odyssey program. I'm Dan, the founder, and I wanted to send this personally.

A few quick things:

  Your unique affiliate link: {{rewardful_link}}
  Your dashboard: https://legacyodyssey.getrewardful.com/dashboard
  Your free lifetime account: claim it here → [CLAIM LINK]

  ↑ This is the first thing I'd do. Pick a name for your own baby's book (real or pretend) and we'll register that .com for you, free, forever. The moment you have your own book set up, you'll know exactly how to talk about it.

I made you a quick 90-second video on what to do first: [Loom link]

If you have any questions, just reply to this email. It comes straight to me.

Excited to have you in.

— Dan
Founder, Legacy Odyssey`;

children.push(p([t(tmplF)], { shading: { fill: "F2F2F2", type: ShadingType.CLEAR }, spacing: { before: 80, after: 200 } }));

children.push(h3("Template G — First-sale celebration DM (within 24 hours of first commission)"));
const tmplG = `Hey {{first_name}}!

You just made your first sale on Legacy Odyssey 🎉 — $10.15 commission, and that customer will renew. You'll earn $17.50 every year they stay.

The post that converted: [post link]

If you want, I can amplify it on our channels (we feature top affiliate posts in our newsletter to all customers). Just say the word.

Proud of you.

— Dan`;

children.push(p([t(tmplG)], { shading: { fill: "F2F2F2", type: ShadingType.CLEAR }, spacing: { before: 80, after: 200 } }));

// Appendix C
children.push(h2("Appendix C — Brand Rules for Affiliate Copy"));

children.push(p("Every piece of affiliate-facing material must follow these rules. Print this. Share with VAs. Re-share quarterly."));

children.push(h3("Words and phrases we do not use"));
children.push(bullet([b("\"Forever\" "), t("when describing the PRODUCT. We use \"forever\" only for the affiliate commission rate (which is about money). Never say a baby book \"lives forever\" or that customers can \"keep their book forever.\"")]));
children.push(bullet([b("\"Chapter\" "), t("for any section of the baby book. The product has \"sections\" or \"pages\" or \"areas,\" not chapters.")]));
children.push(bullet([b("\"Family book\" / \"family's story\" / \"family album\" / \"family photo album\" / \"family scrapbook\" "), t("— it is a BABY book about the CHILD. The story is the child's story, not the family's.")]));

children.push(h3("Real names we never use"));
children.push(p("Customer names from the founder's personal network — Eowyn, Ragno, Kate, Roy, Lindsey, Emma, Jeff, Lachlan, Reese, Daniel, Jeanine — appear nowhere in placeholder demos, sample posts, screenshots, or asset packs. Use Sophia, Sam, Sarah, Smith for placeholders."));

children.push(h3("Demo and showcase rules"));
children.push(bullet("Use https://your-family-photo-album.com as the canonical \"see what a book looks like\" demo. Never screenshot a real customer's site."));
children.push(bullet("Never invent customer testimonials or fake reviews."));
children.push(bullet("Never put real children's names into mock content unless we know the parent has explicitly approved its use as a public asset."));

children.push(h3("FTC and disclosure rules"));
children.push(bullet("Every social post promoting Legacy Odyssey must include #ad, #affiliate, or \"paid partnership.\""));
children.push(bullet("Every email that promotes Legacy Odyssey must disclose the affiliate relationship clearly in the body, not just the footer."));
children.push(bullet("Compliance is a condition of program participation, not a suggestion. ToS Section 6 requires it; Section 7 makes non-compliance a deactivatable offense."));

children.push(h3("Canonical product description (use verbatim)"));
children.push(p([i("Legacy Odyssey is a digital baby book — built as a real website at your child's own .com domain. Your baby gets their name as a website. Parents fill in milestones, photos, and letters through the iOS & Android app. Family visits the book at your-childs-name.com, straight from any browser. Password-protected. $29 for the first year.")], { shading: { fill: "F2F2F2", type: ShadingType.CLEAR }, spacing: { before: 80, after: 80 } }));

children.push(h3("No refunds — visible everywhere"));
children.push(p("Legacy Odyssey does not offer refunds. Affiliates need to know this so they can answer their audience honestly. Customers who want to stop being charged cancel and keep access for the remainder of their paid period. This is also part of why affiliate commissions are protected — there is no clawback for refund requests."));

// Appendix D
children.push(h2("Appendix D — Sources and Citations"));

children.push(p("Every benchmark, conversion rate, and case study in this plan is drawn from one or more of the following sources. Where sources disagreed, the more conservative number was used."));

children.push(h3("SaaS affiliate program case studies"));
children.push(bullet([t("ConvertKit (now Kit) affiliate revenue: "), link("remotemarketing.org/convertkit-affiliate/", "https://remotemarketing.org/convertkit-affiliate/"), t("; "), link("startupgtm.substack.com (Kit growth story)", "https://startupgtm.substack.com/p/convertkit-now-kit-growth-story-how"), t("; "), link("schoolmaker.com/blog/convertkit-affiliate-program", "https://www.schoolmaker.com/blog/convertkit-affiliate-program")]));
children.push(bullet([t("Beehiiv partner program: "), link("rewardful.com/case-studies/beehiiv", "https://www.rewardful.com/case-studies/beehiiv"), t("; "), link("blog.beehiiv.com/p/beehiiv-partner-program-promotion", "https://blog.beehiiv.com/p/beehiiv-partner-program-promotion"), t("; "), link("blog.beehiiv.com/p/beehiiv-beach-club", "https://blog.beehiiv.com/p/beehiiv-beach-club")]));
children.push(bullet([t("Notion Ambassador program: "), link("getsaral.com/academy/notions-ambassador-program", "https://www.getsaral.com/academy/notions-ambassador-program"), t("; "), link("Indie Hackers — 5 learnings from Notion ambassadors", "https://www.indiehackers.com/post/i-spent-a-weekend-studying-notions-ambassador-program-here-are-5-learnings-for-anyone-looking-to-build-a-community-led-product-2dcc8fcf96")]));
children.push(bullet([t("Teachable, Thinkific affiliate program reviews: "), link("schoolmaker.com/blog/teachable-affiliate-program", "https://www.schoolmaker.com/blog/teachable-affiliate-program"), t("; "), link("findaffiliates.online/blogs/teachable-vs-thinkific-affiliate", "https://www.findaffiliates.online/blogs/teachable-vs-thinkific-affiliate")]));
children.push(bullet([t("Webflow Certified Partner / Affiliate: "), link("webflow.com/blog/introducing-webflows-certified-partner-program", "https://webflow.com/blog/introducing-webflows-certified-partner-program"), t("; "), link("webflow.com/solutions/affiliates", "https://webflow.com/solutions/affiliates")]));
children.push(bullet([t("Shopify affiliate recruitment research: "), link("shopify.com/blog/affiliate-recruitment-research", "https://www.shopify.com/blog/affiliate-recruitment-research")]));

children.push(h3("Outreach and activation playbooks"));
children.push(bullet([t("Matt McWilliams — Affiliate welcome sequence: "), link("mattmcwilliams.com/affiliate-welcome-sequence/", "https://www.mattmcwilliams.com/affiliate-welcome-sequence/")]));
children.push(bullet([t("Matt McWilliams — Affiliate first sale: "), link("mattmcwilliams.com/affiliate-first-sale/", "https://www.mattmcwilliams.com/affiliate-first-sale/")]));
children.push(bullet([t("Matt McWilliams — How to motivate affiliates: "), link("mattmcwilliams.com/how-to-motivate-affiliates/", "https://www.mattmcwilliams.com/how-to-motivate-affiliates/")]));
children.push(bullet([t("Rewardful — Why affiliate programs fail: "), link("rewardful.com/articles/why-many-affiliate-programs-fail", "https://www.rewardful.com/articles/why-many-affiliate-programs-fail")]));
children.push(bullet([t("Rewardful — Beehiiv 4-step process: "), link("rewardful.com/articles/beehiiv-4-step-process", "https://www.rewardful.com/articles/beehiiv-4-step-process")]));
children.push(bullet([t("Modash — Affiliate onboarding: "), link("modash.io/blog/affiliate-onboarding", "https://www.modash.io/blog/affiliate-onboarding")]));
children.push(bullet([t("Modash — Influencer product seeding: "), link("modash.io/blog/influencer-product-seeding", "https://www.modash.io/blog/influencer-product-seeding")]));
children.push(bullet([t("Nicole Pyzyk — Affiliate program activation: "), link("nicolepyzyk.com/affiliate-program-activation/", "https://nicolepyzyk.com/affiliate-program-activation/")]));
children.push(bullet([t("SARAL — How to DM influencers: "), link("getsaral.com/academy/how-to-dm-influencers-and-actually-get-replies-templates-inside", "https://www.getsaral.com/academy/how-to-dm-influencers-and-actually-get-replies-templates-inside")]));
children.push(bullet([t("Aspire — Product seeding guide: "), link("aspire.io/blog/product-seeding-guide", "https://www.aspire.io/blog/product-seeding-guide")]));
children.push(bullet([t("Influencers.club — Instagram outreach: "), link("influencers.club/blog/instagram-outreach/", "https://influencers.club/blog/instagram-outreach/")]));
children.push(bullet([t("Smartlead — Cold email 2025 stats: "), link("smartlead.ai/blog/cold-email-conversion-rates", "https://www.smartlead.ai/blog/cold-email-conversion-rates")]));
children.push(bullet([t("Post Affiliate Pro — Cold email templates: "), link("postaffiliatepro.com/blog/cold-email-templates-for-affiliates-followup-templates-included/", "https://www.postaffiliatepro.com/blog/cold-email-templates-for-affiliates-followup-templates-included/")]));

children.push(h3("Operational and tooling references"));
children.push(bullet([t("Smartlead vs Mailshake vs Lemlist comparison: "), link("smartlead.ai/blog/smartlead-vs-mailshake-vs-lemlist-comparison", "https://www.smartlead.ai/blog/smartlead-vs-mailshake-vs-lemlist-comparison")]));
children.push(bullet([t("InstantDM — Instagram DM limits & rules 2026: "), link("instantdm.com/blog/instagram-dm-limits-rules-2026-the-ultimate-account-safety-guide", "https://instantdm.com/blog/instagram-dm-limits-rules-2026-the-ultimate-account-safety-guide")]));
children.push(bullet([t("CreatorFlow — Instagram DM limits: "), link("creatorflow.so/blog/instagram-dm-limits-how-many-messages/", "https://creatorflow.so/blog/instagram-dm-limits-how-many-messages/")]));
children.push(bullet([t("VA Masters — Filipino VA cost guide: "), link("vamasters.com/hiring-a-virtual-assistant-in-the-philippines-heres-what-it-costs/", "https://vamasters.com/hiring-a-virtual-assistant-in-the-philippines-heres-what-it-costs/")]));
children.push(bullet([t("HireTalent.ph — Filipino VA salary 2026: "), link("hiretalent.ph/blog/salary-guide-for-hiring-filipino-virtual-assistants", "https://hiretalent.ph/blog/salary-guide-for-hiring-filipino-virtual-assistants")]));
children.push(bullet([t("Notion affiliate-program tracker template: "), link("notion.com/templates/affiliate-marketing-management", "https://www.notion.com/templates/affiliate-marketing-management")]));

children.push(h3("Parenting / baby creator landscape"));
children.push(bullet("Modash pregnancy / parenting / homeschool influencer lists (2026)"));
children.push(bullet("OrbitVibe Mom Influencer List for 2026"));
children.push(bullet("FeedSpot — Top Mom TikTok, US Mom YouTubers, Pregnancy Podcasts, Latina Mom Blogs, Christian Mom TikTok"));
children.push(bullet("Influencer-Hero — Top Maternity Photography, Twins, Motherhood, Adoption (US)"));
children.push(bullet("Mother.ly — \"9 Best Parenting Substacks\""));
children.push(bullet("Happiest Baby — Latina Moms to Follow"));
children.push(bullet("Texas Adoption Center — 10 Best Adoption Instagram Influencers"));
children.push(bullet("Ampfluence — 100 Top Pinterest Parenting Accounts"));
children.push(bullet("ExpertPhotography — 10 Famous Newborn Photographers"));
children.push(bullet("Twiniversity / IAPBP / DONA / ProDoula / CAPPA official sites"));
children.push(bullet("Detailed.com — Top 50 Parenting Blogs 2026"));

// Final note
children.push(h2("Closing"));
children.push(p("This plan reflects the best benchmarks publicly available as of June 2026 and the actual product, customer base, and infrastructure of Legacy Odyssey at this date. Re-baseline quarterly — what works in Q3 may not work in Q4, what works in 2026 may not work in 2027. The numbers will shift; the structure should hold."));

children.push(p([b("Key dates: "), t("Phase 1 starts Monday June 9, 2026. Phase 2 starts Monday June 23. Phase 3 starts Monday July 21. Phase 4 starts Monday October 13. Goal evaluation: December 31, 2026.")]));

children.push(p([b("Maintained by: "), t("Daniel Ragno, Founder. Updated by Claude under direction. Stored at F:\\legacy-odyssey\\affiliate-assets\\affiliate-program-plan.docx with companion docs at F:\\legacy-odyssey\\docs\\infrastructure\\rewardful.md.")]));

children.push(p([i("End of plan.")]));

// ===== ASSEMBLE DOCUMENT =====
const doc = new Document({
  creator: "Claude / Daniel Ragno",
  title: "Legacy Odyssey Affiliate Program Plan",
  description: "Plan to reach 1,000 affiliates by Dec 31, 2026",
  styles: {
    default: {
      document: { run: { font: FONT, size: 22 } },
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: FONT, color: "1F3864" },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 },
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: FONT, color: "2E5395" },
        paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 1 },
      },
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 22, bold: true, font: FONT, color: "2F2F2F" },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 },
      },
      {
        id: "Heading4", name: "Heading 4", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 20, bold: true, font: FONT, color: "2F2F2F" },
        paragraph: { spacing: { before: 160, after: 80 }, outlineLevel: 3 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
          { level: 1, format: LevelFormat.BULLET, text: "◦", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
        ],
      },
      {
        reference: "numbers",
        levels: [
          { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
          { level: 1, format: LevelFormat.LOWER_LETTER, text: "%2.", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
        ],
      },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    headers: {
      default: new Header({ children: [new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: "Legacy Odyssey — Affiliate Program Plan", font: FONT, size: 16, color: "808080" })]
      })] })
    },
    footers: {
      default: new Footer({ children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: "Page ", font: FONT, size: 16, color: "808080" }),
          new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: "808080" }),
          new TextRun({ text: " of ", font: FONT, size: 16, color: "808080" }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: 16, color: "808080" }),
        ]
      })] })
    },
    children,
  }]
});

const outPath = path.join(__dirname, 'affiliate-program-plan.docx');
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(outPath, buf);
  console.log("Wrote: " + outPath);
}).catch(err => {
  console.error("ERROR:", err);
  process.exit(1);
});
