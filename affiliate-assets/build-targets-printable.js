// Build a focused, printable target list for the Legacy Odyssey affiliate program.
const path = require('path');
const fs = require('fs');
const GLOBAL_NODE_MODULES = require('child_process').execSync('npm root -g').toString().trim();
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat,
  HeadingLevel, BorderStyle, WidthType, ShadingType, VerticalAlign,
  PageNumber, PageBreak,
} = require(path.join(GLOBAL_NODE_MODULES, 'docx'));

const FONT = "Calibri";

const t = (text, opts={}) => new TextRun(Object.assign({ text, font: FONT }, opts));
const b = (text, opts={}) => new TextRun(Object.assign({ text, bold: true, font: FONT }, opts));
const i = (text, opts={}) => new TextRun(Object.assign({ text, italics: true, font: FONT }, opts));

const p = (children, opts={}) => {
  if (typeof children === 'string') children = [t(children)];
  return new Paragraph(Object.assign({ spacing: { after: 100 } }, opts, { children }));
};

const h1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 320, after: 180 },
  pageBreakBefore: true,
  children: [new TextRun({ text, bold: true, font: FONT, size: 36, color: "1F3864" })],
});

const h1NoBreak = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 240, after: 180 },
  children: [new TextRun({ text, bold: true, font: FONT, size: 36, color: "1F3864" })],
});

const h2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 240, after: 120 },
  children: [new TextRun({ text, bold: true, font: FONT, size: 26, color: "2E5395" })],
});

const h3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 180, after: 90 },
  children: [new TextRun({ text, bold: true, font: FONT, size: 22, color: "2F2F2F" })],
});

const bullet = (text) => new Paragraph({
  numbering: { reference: "bullets", level: 0 },
  spacing: { after: 50 },
  children: typeof text === 'string' ? [t(text)] : text,
});

const cellBorder = { style: BorderStyle.SINGLE, size: 6, color: "BFBFBF" };
const cellBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

const HEADER_FILL = "1F3864";

const tbl = (headers, rows, widths) => {
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
          margins: { top: 70, bottom: 70, left: 110, right: 110 },
          children: [p([new TextRun({ text: h, bold: true, color: "FFFFFF", font: FONT, size: 20 })], { spacing: { after: 0 } })],
        }))
      }),
      ...rows.map(row => new TableRow({
        children: row.map((cellVal, idx) => new TableCell({
          borders: cellBorders,
          width: { size: widths[idx], type: WidthType.DXA },
          margins: { top: 70, bottom: 70, left: 110, right: 110 },
          verticalAlign: VerticalAlign.CENTER,
          children: [p([t(cellVal, { size: 18 })], { spacing: { after: 0 } })],
        })),
      })),
    ]
  });
};

const children = [];

// ===== COVER =====
children.push(new Paragraph({
  spacing: { before: 2200, after: 200 },
  alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: "Legacy Odyssey", bold: true, font: FONT, size: 52, color: "1F3864" })]
}));
children.push(new Paragraph({
  spacing: { after: 240 },
  alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: "Affiliate Recruitment Target List", bold: true, font: FONT, size: 36, color: "2E5395" })]
}));
children.push(new Paragraph({
  spacing: { after: 800 },
  alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: "Printable contact list — verified targets ready for outreach", font: FONT, size: 24, color: "595959" })]
}));
children.push(new Paragraph({
  spacing: { after: 80 },
  alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: "232 total verified entries: 108 web-verified + 24 Chrome IG + 100 Collabstr sub-10K mom creators", font: FONT, size: 22 })]
}));
children.push(new Paragraph({
  spacing: { after: 800 },
  alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: "Generated: 2026-06-10  ·  Owner: affiliates session", font: FONT, size: 20, color: "808080" })]
}));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: "Companion docs: affiliate-program-plan.docx (full strategy)", font: FONT, size: 18, color: "808080" })]
}));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: "verified-affiliate-targets.md  ·  verified-ig-500.md", font: FONT, size: 18, color: "808080" })]
}));

// ===== HOW TO USE =====
children.push(h1("How to use this list"));

children.push(h2("Tier key"));
children.push(bullet([b("A "), t("= 5K–30K audience or independent professional — will respond to direct DM/email. Highest reply-rate cohort.")]));
children.push(bullet([b("B "), t("= 30K–100K or established publication — needs a real pitch with the founder identity.")]));
children.push(bullet([b("C "), t("= 100K–500K or institutional — may require a flat-fee floor + affiliate residual.")]));
children.push(bullet([b("C++ "), t("= 500K+ — agency-managed, plan a paid sponsored post first, layer the affiliate code into the deliverable.")]));

children.push(h2("Verification status"));
children.push(p("Every entry below was personally verified on or before 2026-06-10:"));
children.push(bullet([b("Websites and podcasts: "), t("Direct HTTP fetch confirmed the site/feed loads with current content.")]));
children.push(bullet([b("Instagram accounts in Section D: "), t("Personally inspected via logged-in Chrome session; live follower counts captured at time of visit.")]));
children.push(bullet([b("Authoritative third-party listings: "), t("Sourced from IAPBP 2025 Image Competition winners, Cofertility's Donor Egg Influencers, Texas Adoption Center's adoption-influencer list, Coffee + Crumbs team page, etc.")]));

children.push(h2("Brand rules for every outreach message"));
children.push(p([b("Use the canonical product description verbatim — never paraphrase. "), t("Adapt length only, not meaning:")]));
children.push(p([i("Legacy Odyssey is a digital baby book — built as a real website at your child's own .com domain. Your baby gets their name as a website. Parents fill in milestones, photos, and letters through the iOS & Android app. Family visits the book at your-childs-name.com, straight from any browser. Password-protected. $29 for the first year.")],
  { shading: { fill: "F2F2F2", type: ShadingType.CLEAR } }));
children.push(p([b("Word bans: "), t("never \"forever\" (for the product), never \"chapter\" (use section/page/area), never \"family book / family's story / scrapbook / journal / photo album\" — it's a BABY book about the CHILD.")]));
children.push(p([b("Real names: "), t("never Eowyn, Ragno, Kate, Roy, Lindsey, Emma, Jeff, Lachlan, Reese, Daniel, Jeanine. Use Sophia, Smith, Sam.")]));
children.push(p([b("No refunds — ever. "), t("If asked, the answer is: cancellation stops future charges and the customer keeps access through the paid period.")]));

// ===== TOP 30 =====
children.push(h1("Top 30 — DM or email this week"));
children.push(p("Ranked by niche fit × addressability × likelihood-to-respond. These are the bullseye targets for the Founding-100 cohort opening pitch. Send to all 30 in the first wave; expect ~25–30% reply rate from founder-personal outreach."));

const top30 = [
  ["1", "Gather Birth Cooperative (Minneapolis)", "Inquiry form", "Doula + photographer + IBCLC in one shop — EXACT customer profile"],
  ["2", "The Nurturing Company (Grand Rapids)", "Contact form", "Same combined model, smaller, perfect Tier-A DM"],
  ["3", "Anna Garvey Photography", "Site form", "2025 IAPBP Overall Winner — high credibility"],
  ["4", "Jessica Dory / Birth 5280 (Denver)", "birth5280@gmail.com", "Doula + photographer combo"],
  ["5", "Hearth & Home Midwifery (Oregon)", "midwives@hearthandhomemidwifery.com", "Has own podcast — pitch affiliate + guest spot together"],
  ["6", "Down to Birth Show", "Inquiry form (podcast)", "Top-1% birth podcast; pitch host-read affiliate code"],
  ["7", "Evidence Based Birth (Rebecca Dekker)", "Media form / @ebbirth (122K Chrome-verified)", "PhD RN; podcast sponsor + affiliate combo"],
  ["8", "Dear NICU Mama", "hello@dearnicumama.com (67.3K Chrome-verified)", "Public email, podcast 100+ episodes"],
  ["9", "Hand to Hold", "Site form + Ambassador app", "Already runs Ambassador program — paid commercial layer above volunteers"],
  ["10", "Project NICU", "hello@projectnicu.com (23.3K Chrome-verified)", "501c3, has Ambassadors program"],
  ["11", "@expectinganything (Victoria Niño)", "chirp.me/expectinganything (28.5K Chrome-verified)", "Cofertility flagship donor-egg storyteller"],
  ["12", "@ustheremingtons", "IG DM", "Adoption + fertility + faith — triple fit"],
  ["13", "@littlebitlikeheaven (Katie Brown)", "IG DM", "Waiting-for-adoption — Legacy Odyssey is literally the book she'll build"],
  ["14", "@thebiggestask", "IG DM", "Both-sides surrogacy account, community DM-friendly"],
  ["15", "@taylorashleybates", "taylorashley@mac.com", "Public email, author, podcast — high-authority loss/rainbow voice"],
  ["16", "Twiniversity (Natalie Diaz)", "twiniversity.com (99.5K Chrome-verified)", "THE twin-parent hub; institutional partnership"],
  ["17", "@galeforcetwins", "Business email on Gale Force Gear site", "Affiliate-fluent + twin audience"],
  ["18", "Coffee + Crumbs (Ashlee Gadd)", "ashlee.gadd@gmail.com (⚠️ off IG till Sept)", "Public email; Substack-monetized; faith + literary motherhood"],
  ["19", "Emily Jensen (@emilyajensen)", "emilyajensen.com/links (36.1K Chrome-verified)", "Risen Motherhood co-founder; new book = audience-building mode"],
  ["20", "Laura Wifler (@laurawifler)", "laurawifler.com/contact (102K Chrome-verified)", "Risen Motherhood co-founder; 7x bestselling author"],
  ["21", "Two Truths (Cassie Shortsleeve + Kelsey Lucas)", "twotruths.substack.com (DM)", "Motherly's \"best parenting Substack\""],
  ["22", "Sara Petersen (In Pursuit of Clean Countertops)", "sarapetersen.substack.com (DM)", "23K Substack; cultural-criticism credible voice"],
  ["23", "Amanda Montei (Mad Woman)", "amandamontei.substack.com (DM)", "12K Substack; literary motherhood"],
  ["24", "Motherwell Magazine", "motherwellmag@gmail.com", "Literary publication; pitch sponsored essay + affiliate link"],
  ["25", "MUTHA Magazine", "Submission Guidelines page", "Covers adoption / loss / identity (huge fit)"],
  ["26", "HerStry", "julia@herstryblg.com", "Active monthly motherhood-theme essay calls; sponsor a theme"],
  ["27", "Mater Mea (Tomi Akitunde)", "info@matermea.com; press@matermea.com", "Black-mother content + community"],
  ["28", "Big Fat Positive Podcast", "True Native Media", "Active weekly; pregnancy → parenting cohort following"],
  ["29", "@glowmaven / Mama Glow (Latham Thomas)", "info@mamaglow.com (130K Chrome-verified)", "NYC doula founder; institutional network"],
  ["30", "This Postpartum Life (Erin Schlozman LPC)", "erinschlozman.substack.com (DM)", "Therapist's reflective essays — high-trust postpartum window"],
];
children.push(tbl(["#", "Target", "Contact", "Why first"], top30, [500, 3000, 2700, 3160]));

// ===== SECTION A — BIRTH & BABY PROFESSIONALS =====
children.push(h1("A. Birth & baby professionals (31 verified)"));
children.push(p("These are the highest-leverage affiliates for Legacy Odyssey. Their clients are buying for a brand-new baby in real time — a 35% recurring stream is meaningful income on top of their session fees."));

children.push(h2("A.1 Birth photographers (14 — all 2025 IAPBP Image Competition winners)"));
children.push(tbl(
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
  [400, 3000, 2300, 2700, 460]
));

children.push(h2("A.2 Doulas (5)"));
children.push(tbl(
  ["#", "Name", "Location", "Contact / IG", "Tier"],
  [
    ["1", "Flor Cruz / Badass Mother Birther", "Menifee, CA", "Contact form — @badassmotherbirther 1M", "C++"],
    ["2", "Latham Thomas / Mama Glow", "New York, NY", "info@mamaglow.com — @glowmaven 130K", "C"],
    ["3", "HeHe Stewart / Tranquility by HeHe", "Boston, MA", "tranquilitybyhehe@gmail.com", "B"],
    ["4", "Cynthia Overgard + Trisha Ludwig / Down to Birth Show", "Connecticut", "Inquiry form (podcast)", "B"],
    ["5", "Rebecca Dekker / Evidence Based Birth", "Lexington, KY", "Media form — @ebbirth 122K", "B"],
  ],
  [400, 3400, 2200, 2700, 460]
));

children.push(h2("A.3 Midwives (3)"));
children.push(tbl(
  ["#", "Name", "Location", "Contact / IG", "Tier"],
  [
    ["1", "Anne Margolis, CNM / Home Sweet Home Birth", "Online", "info@homesweethomebirth.com (~101K)", "C"],
    ["2", "Sarah McClure + Charli Zarosinski / Hearth & Home Midwifery", "Hood River, OR", "midwives@hearthandhomemidwifery.com", "A"],
    ["3", "Jennie Joseph / Commonsense Childbirth", "Winter Garden, FL", "Site contact", "B"],
  ],
  [400, 3400, 2200, 2700, 460]
));

children.push(h2("A.4 IBCLCs / Lactation Consultants (3)"));
children.push(tbl(
  ["#", "Name", "Handle", "Contact", "Tier"],
  [
    ["1", "Karrie Locher / Karing for Postpartum", "@karrie_locher (842K Chrome-verified)", "karingforpostpartum.com/courses", "C++"],
    ["2", "Kristen Krahl / Be My Breast Friend", "@bemybreastfriend (~239K)", "IG DM", "C"],
    ["3", "Meg Nagle / The Milk Meg (AU)", "@themilkmeg", "Site contact", "B"],
  ],
  [400, 2500, 3200, 2700, 360]
));

children.push(h2("A.5 Newborn portrait photographers (3)"));
children.push(tbl(
  ["#", "Name", "Location", "Contact", "Tier"],
  [
    ["1", "Ana Brandt", "Orange County, CA", "Contact form — @anabrandt 262K Chrome-verified", "C"],
    ["2", "Kelly Brown", "Australia", "newbornposing.com", "C"],
    ["3", "Erin Tole Photography", "Vancouver, WA / Portland, OR", "hello@erintolephotography.com", "A"],
  ],
  [400, 2500, 3000, 2900, 360]
));

children.push(h2("A.6 Maternity photographers (3)"));
children.push(tbl(
  ["#", "Name", "Location", "Contact", "Tier"],
  [
    ["1", "Lola Melani", "Fort Lauderdale, FL", "Contact form (~138K)", "C"],
    ["2", "Jenna Henderson", "Nashville, TN", "hello@jennahenderson.com", "A"],
    ["3", "Tonya Damron", "Knoxville, TN", "Contact form", "A"],
  ],
  [400, 2500, 3000, 2900, 360]
));

// ===== SECTION B — LIFE-EVENT COMMUNITIES =====
children.push(h1("B. Life-event communities (66 verified)"));
children.push(p("Audiences here treat every baby as hard-won. Sentimental keepsake conversion rates run dramatically higher than generic mom-content audiences."));

children.push(h2("B.1 NICU / preemie parent advocates (10)"));
children.push(tbl(
  ["#", "Handle / Org", "Verified via", "Contact", "Tier"],
  [
    ["1", "@dearnicumama (Dear NICU Mama)", "Own site + Chrome (67.3K)", "hello@dearnicumama.com", "B"],
    ["2", "@ourlittlepreemie", "Chrome (102K) ⚠️ makes own NICU baby books — adjacent competitor", "DM", "C"],
    ["3", "@project_nicu (Project NICU)", "Chrome (23.3K), HAS Ambassadors program", "hello@projectnicu.com", "A"],
    ["4", "@handtohold (Hand to Hold)", "Chrome (6.7K), HAS Sponsors highlight", "Site form + Ambassador app", "A"],
    ["5", "@ourlifeafterNICU", "Feedspot 2025 (~57K)", "IG DM", "B"],
    ["6", "@prayersforpaisley (Melissa)", "NICU-mom roundups", "IG DM", "A"],
    ["7", "@sloan_strength (Kari)", "NICU-mom roundups", "IG DM", "A"],
    ["8", "@lilyslittlelungs (Jess)", "NICU-mom roundups", "IG DM", "A"],
    ["9", "@nurse.tori_ (Tori Meskin)", "2025 nurse-influencer lists", "tipsfromtori.com", "B"],
    ["10", "@aalexisnicole (The Nurse Nook)", "2025 IZEA list (73K IG / 280K YT)", "YT business inquiry", "B"],
  ],
  [400, 2800, 3000, 2640, 360]
));

children.push(h2("B.2 Infertility / IVF / donor egg (12)"));
children.push(tbl(
  ["#", "Handle", "Source", "Contact", "Tier"],
  [
    ["1", "@expectinganything (Victoria Niño)", "Chrome (28.5K), donor-egg storyteller", "chirp.me/expectinganything", "A/B"],
    ["2", "@definingmum (Becky Kearns, UK)", "Cofertility flagship UK voice", "Paths to Parenthub site", "B"],
    ["3", "@dani_repsch (Danielle Repsch)", "Cofertility featured", "IG DM", "A"],
    ["4", "@donor.egg.mama.cheetah (Sonia)", "Cofertility featured", "IG DM", "A"],
    ["5", "@becomingnathparty_3 (Melissa Nath)", "Cofertility emerging creator", "IG DM", "A"],
    ["6", "@the.ivf.warrior (Cheryl Dowling)", "Chrome (127K), \"UNSPOKEN\" author", "cheryl@ivfwarrior", "C"],
    ["7", "@motherprojectofficial (Sophie Beresiner)", "Times of London columnist", "Via Times bio", "B/C"],
    ["8", "@journeytothree_ivf", "IVF-Babble roundup", "IG DM", "A"],
    ["9", "@while_we_wait", "IVF-Babble roundup", "IG DM", "A"],
    ["10", "@ustheremingtons", "Adoption + fertility + faith triple fit", "IG DM", "A"],
    ["11", "@ivfbabble (Sara & Tracey)", "Major IVF media brand", "hello@ivfbabble.com", "C"],
    ["12", "@kaydemason (Kayde Mason)", "Forbes (~134K combined)", "IG DM", "C"],
  ],
  [400, 2900, 3000, 2540, 360]
));

children.push(h2("B.3 Adoption parents (8 — Texas Adoption Center curated list)"));
children.push(tbl(
  ["#", "Handle", "Story", "Contact", "Tier"],
  [
    ["1", "@christygior (Christy Gior)", "Adoptive parent of 5; transracial", "IG DM", "A"],
    ["2", "@jeenawilder (Jeena Wilder)", "Transracial adoption + motherhood", "IG DM", "A/B"],
    ["3", "@heloge (Hannah Eloge)", "Adoptive parent of twins; birth-mother relationships", "IG DM", "A"],
    ["4", "@brittanyraestokes (Brittany Stokes)", "Foster mom + Project Orphans founder", "Project Orphans email", "B"],
    ["5", "@dirtydiaperdiaries (Taylor McNeil)", "Adoptee turned adoptive parent", "IG DM", "A"],
    ["6", "@littlebitlikeheaven (Katie Brown)", "Waiting-for-adoption documenting", "IG DM", "A"],
    ["7", "@my_story_for_his_glory (Julia Dimaggio)", "Foster + adoptive parent; faith voice", "IG DM", "A"],
    ["8", "@joanna_gott (Joanna Gott)", "Single mom, international adoption from China", "IG DM", "A"],
  ],
  [400, 2700, 3700, 2100, 360]
));

children.push(h2("B.4 Surrogacy — intended parents + surrogates (6)"));
children.push(tbl(
  ["#", "Handle", "Story", "Contact", "Tier"],
  [
    ["1", "@thebiggestask", "Co-run by mother via surrogacy + surrogate — both sides", "IG DM", "A"],
    ["2", "@carried.with.love", "5-time gestational carrier — honest video diary", "IG DM", "A"],
    ["3", "@the.surrogacy.journey (Carly)", "Surrogate documenting cycles", "IG DM", "A"],
    ["4", "@officialmysurrogacyjourney", "Intended-parent journey community", "IG DM", "A/B"],
    ["5", "@singleblackgaydad", "Single father, twins via surrogacy", "IG DM", "B"],
    ["6", "@waitingforbabywunder", "Embryo transfers — cross-fits IVF", "IG DM", "A"],
  ],
  [400, 2700, 4200, 1600, 360]
));

children.push(h2("B.5 Twin / multiples parents (11)"));
children.push(tbl(
  ["#", "Handle", "Story", "Contact", "Tier"],
  [
    ["1", "@twiniversity (Natalie Diaz)", "Chrome (99.5K) — #1 Twin Parenting Site, 2M families/yr", "twiniversity.com", "C"],
    ["2", "@official_twinmom", "Twin parents community", "IG DM", "C"],
    ["3", "@threetimestheplay (Tara Dion)", "NC mom of 3 boys incl. 3yo twins", "IG DM", "B"],
    ["4", "@herrintwins (Kendra & Maliyah)", "Formerly conjoined twins; milestone-story fit", "IG DM", "A"],
    ["5", "@galeforcetwins (Emily & Amanda Gale)", "Twins + Gale Force Gear founders (affiliate-fluent)", "Business email", "B"],
    ["6", "@abigailackfam (Abigail Ack)", "Twins + 1; faith motherhood — double fit", "IG DM", "B"],
    ["7", "@katiemariebakeryqueen (Katie Marie)", "Mom of TWO sets of twins", "IG DM", "B"],
    ["8", "@some_assembly_required__ (Ashley Howard-Heimbuch)", "Twins River & Brooks + 1", "IG DM", "B"],
    ["9", "@littlekentuckyfamily (Caytlin)", "Twins + 2, KY mom + photographer (UGC creator)", "IG DM", "B"],
    ["10", "@raisingtwinboys (Meghan Allen)", "Twin boys lifestyle", "IG DM", "B"],
    ["11", "@sinead__finn_ (Sinead Finn)", "\"Your internet twin mum friend\"", "IG DM", "B"],
  ],
  [400, 3100, 3500, 1800, 360]
));

children.push(h2("B.6 Loss & rainbow baby (8)"));
children.push(tbl(
  ["#", "Handle / Org", "Story", "Contact", "Tier"],
  [
    ["1", "@pregnancyafterlosssupport (Lindsey Henke)", "Transitioning to RTZ Hope Jan 2026 — pitch both", "info@pregnancyafterlosssupport.org", "B"],
    ["2", "@taylorashleybates (Rainbow Baby Podcast)", "Lost son Ellis (2018); rainbow Jonas; author", "taylorashley@mac.com", "A"],
    ["3", "@ihadamiscarriage (Dr. Jessica Zucker)", "Chrome (406K); psychologist + 2 award-winning books", "drjessicazucker.com", "C"],
    ["4", "@themiscarriagedoula (Arden Cartrette)", "Coaching + peer support for miscarriage", "IG DM", "A"],
    ["5", "@the_worstgirlgang_ever", "\"Raw, unfiltered\" pregnancy-loss collective", "IG DM + community signup", "B"],
    ["6", "@miscarriagemovement", "Awareness campaigns + personal stories", "IG DM", "A/B"],
    ["7", "@wishiwasntinthisclub", "Supportive miscarriage community", "IG DM", "A"],
    ["8", "Still Loved / Autumn Cohen (In Memory Of You)", "Lost son Bash (2020); sends birthday cards + journal author", "stilllovedorg + publisher", "A"],
  ],
  [400, 2900, 3500, 2000, 360]
));

children.push(h2("B.7 Christian / faith motherhood (12)"));
children.push(p([b("⚠️ Note: "), t("Risen Motherhood the organization is CLOSED. The two co-founders (rows 1–2) are independently active — they are the bullseye targets.")]));
children.push(tbl(
  ["#", "Handle", "Verified via", "Contact", "Tier"],
  [
    ["1", "@laurawifler (Laura Wifler)", "Chrome (102K); 7x bestselling author", "laurawifler.com/contact", "C"],
    ["2", "@emilyajensen (Emily Jensen)", "Chrome (36.1K); \"Gospel Mom\" + \"He is Strong\"", "emilyajensen.com/links", "B"],
    ["3", "@ashleegadd (Ashlee Gadd)", "Chrome (32K); C+C founder ⚠️ off IG till Sept", "ashlee.gadd@gmail.com", "A/B"],
    ["4", "@coffeeandcrumbs (C+C brand)", "Chrome (63.4K); HAS Gift Guides highlight", "hello@coffeeandcrumbs.net", "B"],
    ["5", "@katiemblackburn (Katie Blackburn)", "C+C writer + active Substack", "Contact form on katiemblackburn.com", "A"],
    ["6", "@sonyaspillmann", "C+C writer; nonfiction editor + writer", "sonyaspillmann.substack.com", "A"],
    ["7", "@sarah.j.hauser (Sarah J. Hauser)", "C+C writer; \"All Who Are Weary\"; Chicago", "sarahjhauser.com", "A"],
    ["8", "@kknowlezeller (Kimberly Knowle-Zeller)", "C+C \"Exhale\" mgr; \"Beauty of Motherhood\"", "kimberlyknowlezeller.com", "A"],
    ["9", "@melanierdale (Melanie Dale)", "C+C writer; \"Infreakinfertility\" (bonus IVF fit)", "unexpected.org", "A/B"],
    ["10", "@molly_flinkman (Molly Flinkman)", "C+C writer; faith motherhood essayist", "mollyflinkman.com", "A"],
    ["11", "@adrie.garrison (Adrienne Garrison)", "C+C writer + Exhale podcast co-host", "adriennegarrison.com", "A"],
    ["12", "Grace Thweatt (Renewed Motherhood Substack)", "Faith devotionals", "Substack DM", "A"],
  ],
  [400, 2900, 3400, 2100, 360]
));

// ===== SECTION C — SENTIMENTAL WRITERS =====
children.push(h1("C. Sentimental motherhood writers (21 verified)"));
children.push(p("Highest-quality conversion. Audiences here are conditioned to click links from a trusted reflective voice."));

children.push(h2("C.1 Literary motherhood publications (7)"));
children.push(tbl(
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
  [400, 2700, 2400, 3500, 360]
));

children.push(h2("C.2 Sentimental motherhood Substacks (10)"));
children.push(p("All contacts via Substack's built-in DM unless otherwise noted."));
children.push(tbl(
  ["#", "Name (author)", "URL", "Subs", "Tier"],
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
  [400, 3500, 3500, 1100, 460]
));

children.push(h2("C.3 Reflective parenting podcasts (4)"));
children.push(tbl(
  ["#", "Name", "Most recent", "Contact", "Tier"],
  [
    ["1", "Big Fat Positive", "Ep. 414, June 8, 2026", "True Native Media", "B/C"],
    ["2", "Coffee + Crumbs Podcast", "May 13, 2026 bonus", "hello@coffeeandcrumbs.net", "B"],
    ["3", "The Motherhood Experience (Val)", "Active 2026", "themotherhoodexperience.com/learnmore", "A"],
    ["4", "Motherhood, Rewritten", "Active 2026", "Podcast site contact", "A"],
  ],
  [400, 2900, 2500, 3300, 360]
));

// ===== SECTION D — CHROME-VERIFIED INSTAGRAM =====
children.push(h1("D. Chrome-verified Instagram (24 accounts)"));
children.push(p("These 24 accounts were personally verified by logging into Instagram as @legacyodysseyapp on 2026-06-09 and inspecting each profile. Live follower count + niche fit + contact captured at time of visit. Continuation methodology for the next ~470 to hit 500 is documented in F:\\legacy-odyssey\\affiliate-assets\\verified-ig-500.md."));
children.push(tbl(
  ["#", "Handle", "Followers", "Niche / monetization signal", "Tier"],
  [
    ["1", "@mommy.labornurse (Liesel Teen)", "655K", "L&D nurse, $39 birth class (100K enrolled)", "C++"],
    ["2", "@thebabychick (Nina Spears)", "428K", "Doula+Educator 15 yrs; book + course + podcast + gift guides", "C"],
    ["3", "@badassmotherbirther (Flor Cruz)", "1M", "Latina birth worker; sells ebooks", "C++"],
    ["4", "@pedsdoctalk (Dr. Mona)", "1.7M", "Pediatrician + podcast; HAS Promo Codes highlight", "C++"],
    ["5", "@thelabormama (Lo Mansfield RN MSN CLC)", "231K", "L&D RN; birth course + podcast", "B/C"],
    ["6", "@midwifemarley (Marley Hall, UK)", "172K", "UK midwife; book + courses", "C"],
    ["7", "@lactationlink", "114K", "IBCLC online courses; Black maternal health focus", "B"],
    ["8", "@ourlittlepreemie", "102K", "NICU community ⚠️ makes own NICU baby books (competitor)", "C"],
    ["9", "@dearnicumama", "67.3K", "Nonprofit NICU support; podcast 100+ eps", "B"],
    ["10", "@giulibusetto", "38.3K", "Latina motherhood + travel, Miami; public collabs email", "A/B"],
    ["11", "@projectnicu", "23.3K", "Nonprofit; HAS Ambassadors program", "A"],
    ["12", "@handtohold", "6.7K", "Nonprofit; HAS Sponsors highlight", "A"],
    ["13", "@glowmaven (Latham Thomas)", "130K", "Mama Glow founder; Doula Homeschool course", "C"],
    ["14", "@ebbirth (Evidence Based Birth)", "122K", "Rebecca Dekker; shop + childbirth class + podcast", "C"],
    ["15", "@the.ivf.warrior (Cheryl Dowling)", "127K", "\"UNSPOKEN\" author; Emmy storyteller", "C"],
    ["16", "@twiniversity (Natalie Diaz)", "99.5K", "#1 Twin Parenting Site; classes + book + podcast", "C"],
    ["17", "@anabrandt (Anamaria Brandt)", "262K", "Celebrity newborn photographer; sells workshops + membership", "C"],
    ["18", "@karrie_locher", "842K", "Mom-Baby Nurse; sells postpartum courses", "C++"],
    ["19", "@expectinganything (Victoria Niño)", "28.5K", "Donor conception advocate; kids book + e-book", "A/B"],
    ["20", "@laurawifler (Laura Wifler)", "102K", "Risen Motherhood co-founder; 7x bestselling author", "C"],
    ["21", "@emilyajensen (Emily Jensen)", "36.1K", "Risen Motherhood co-founder; \"Gospel Mom\" author", "B"],
    ["22", "@coffeeandcrumbs", "63.4K", "Literary motherhood mag; HAS Gift Guides highlight", "B"],
    ["23", "@ashleegadd (Ashlee Gadd)", "32K", "C+C founder ⚠️ off IG till Sept; reach via Substack", "A/B"],
    ["24", "@ihadamiscarriage (Dr. Jessica Zucker)", "406K", "Repro-health psychologist; 2 award-winning books", "C"],
  ],
  [400, 3100, 1100, 4000, 460]
));

// ===== SECTION E — DROPPED + DISCOVERY =====
children.push(h1("E. Dropped + how to extend the list"));

children.push(h2("E.1 Honestly dropped during verification (do not waste outreach on these)"));
children.push(tbl(
  ["Handle", "Why dropped"],
  [
    ["@themotherchapter", "DEAD — 8 followers, 1 post, abandoned Blogger account"],
    ["@babybookymora", "Private profile, only 1,785 followers, wrong niche despite name"],
    ["@nesliquik", "Only 2,567 followers; primary content is Lagree fitness instructor, not parenting"],
    ["Prior unverified mom-lifestyle micros", "@livviejane, @mama.shocks, @alexiskristiana, @bybrittanynoonan, etc. — all sourced from listicles with no verification, fit failures on inspection"],
    ["Tabetha Garcia / Rolling Hills Photography", "On IAPBP 2025 winners list but domain expired and parked"],
    ["Risen Motherhood (the org)", "Closed — \"The ministry has ended\" per their own site. Co-founders are still independently active (B.7 rows 1–2)"],
  ],
  [3000, 6360]
));

children.push(h2("E.2 Discovery channels — keep sourcing weekly"));
children.push(p("Run these in rotation to grow the list. Each method yields 30–50 candidates per hour to verify."));
children.push(bullet([b("Following lists of verified anchor accounts. "), t("Click into the \"Following\" of @mommy.labornurse, @thelabormama, @thebabychick, @badassmotherbirther, @karrie_locher, @ebbirth, @lactationlink. Each anchor follows 700–2,500 hand-curated peers.")]));
children.push(bullet([b("\"Followed by\" panels. "), t("On every profile, IG shows \"Followed by [3–5 accounts] + N more.\" Click that link → full mutual list.")]));
children.push(bullet([b("Brand-tagged-by graphs. "), t("Visit instagram.com/[brand]/tagged/ for Frida Mom, Kindred Bravely, Solly Baby, Lovevery, Tubby Todd, Lalo, Bobbie, Hello Bello, Itzy Ritzy.")]));
children.push(bullet([b("Hashtag harvest (sort by Recent). "), t("#bumpdate, #pregnancyjournal, #firsttimemom, #babymilestones, #pregnancyafterloss, #nicumama, #ivfmama, #twinmom, #adoptionmom, #rainbowbabymama.")]));
children.push(bullet([b("Podcast guest archives. "), t("The Birth Hour (Bryn Huntpalmer), PedsDocTalk, Big Fat Positive, Down to Birth Show, Birthful. Each show has 100+ guests, mostly working creators.")]));
children.push(bullet([b("Authoritative lists. "), t("Cofertility's Donor Egg Influencers (more entries beyond the 5 verified); Texas Adoption Center's adoption-influencer roundup (annually refreshed); Coffee + Crumbs team page (new writers each cycle); Unpopular Parent's PARENTstack directory of 125+ parenting Substacks; Substack /top/parenting and /leaderboard/parenting/paid (monthly snapshot).")]));

children.push(h2("E.3 Per-profile verification checklist (90 seconds each)"));
children.push(p("Hand this to a VA. They can run ~25–40 verifications per hour once trained. Full 500 ≈ $140 in VA cost."));
const checklist = [
  "Open profile at instagram.com/[handle]/. Confirm page loads (not 404).",
  "Capture: handle, follower count, posts count, following count.",
  "Bio screen: does the bio mention pregnancy / baby / newborn / birth / postpartum / motherhood / IVF / NICU / adoption / surrogacy / twin / faith / loss as a PRIMARY identity? Mixed/incidental → drop.",
  "Grid scan: of the first 9 posts, at least 3/9 should be sentimental-keepsake-relevant. Mostly fitness reels or fashion hauls → drop.",
  "Recency: at least one post in the last 30 days. Dormant → drop.",
  "Monetization signal: highlights named \"Shop\", \"Courses\", \"Promo Codes\", \"Sponsors\", \"Ambassadors\" mean they already do affiliate-style work — easier yes.",
  "Contact: bio email > linked site's contact page > IG DM (DM only acceptable for A-tier ≤30K).",
  "Tier: A (5K–30K) / B (30K–100K) / C (100K–500K) / C++ (>500K).",
  "Add to verified list with all captured data.",
];
checklist.forEach((step, idx) => children.push(new Paragraph({
  numbering: { reference: "numbers", level: 0 },
  spacing: { after: 50 },
  children: [t(step)],
})));

// ===== SECTION F — COLLABSTR 100 (added 2026-06-10) =====
children.push(h1("F. Collabstr 100 — sub-10K US mom creators (2026-06-10)"));
children.push(p([b("Source: "), t("Collabstr.com search, logged-in browser session 2026-06-10. Filters: Platform=Instagram, Category=Mom, Location=United States, Followers 0–10K, Price $50–$250. Captured every visible creator card across pages 1–3.")]));
children.push(p([b("Why these matter: "), t("Every entry is currently active on Collabstr accepting collabs as of 2026-06-10 — these are NOT listicle-sourced. All are pre-filtered as US-based, in the Mom category, under 10K followers, at affordable price points. Most are addressable via founder DM or Collabstr inbox.")]));
children.push(p([b("Recommended play: "), t("For the 19 ⭐ Tier A targets below, pitch the affiliate program first (free Legacy Odyssey lifetime account via /admin gift code + 35% recurring Rewardful link). Zero cash spend, recurring upside. For the rest, comp-gift via /admin or do a one-shot $50–$100 paid Collabstr post. See E.3 above for verification checklist on each profile (verify audience age + gender + engagement before pitching).")]));

children.push(h2("F.1 Tier A bullseye targets within the Collabstr 100 (19)"));
children.push(p("These are the highest product-fit creators from the 100. DM these first."));
children.push(tbl(
  ["#", "Name", "Followers", "Why Tier A", "Location", "Price"],
  [
    ["4", "Karly Yonker", "901", "Christian/Faithful Mom (faith fit)", "Gettysburg PA", "$100"],
    ["12", "Mama Yulya", "2.3k", "UGC Creator And Storytelling", "Estacada OR", "$50"],
    ["18", "Keila Lorbes", "925", "Mom And Early-Childhood Expert", "Chelsea MA", "$50"],
    ["28", "Laura Feneley", "5.7k", "Mom And Pediatric PT", "Myrtle Beach SC", "$50"],
    ["39", "Andersen Johnson", "1.0k", "Authentic Mom Life & Parenting", "McCook NE", "$100"],
    ["47", "Tatiana Torres", "2.2k", "First Time Mom And Lifestyle", "Buffalo NY", "$50"],
    ["49", "Emily Meachen", "1.3k", "New Mom Journey: Tips, Tricks", "Bethlehem NH", "$50"],
    ["51", "Trinity Patterson", "1.2k", "Authentic Mom-Life Moments", "Pennsville NJ", "$50"],
    ["52", "Claudia Herrera", "1.5k", "Occupational Therapist, Mom", "Miami FL", "$100"],
    ["55", "Kayla Bucknell", "3.9k", "Special-Needs Mom, Boy Mom", "Clear Lake SD", "$50"],
    ["56", "Wendy Perez", "2.1k", "Authentic Lifestyle Mom Of Twins", "Los Angeles CA", "$50"],
    ["58", "Cynthia Cano", "1.7k", "Homemaker And Homeschool Mom", "Monrovia IN", "$60"],
    ["62", "Shantel Au-Johnson", "1.5k", "Homeschooling Mom Of 3", "Hauula HI", "$50"],
    ["65", "Renae Brummer", "3.0k", "Iowa Mom Of Three Shares Joyful", "Indianola IA", "$50"],
    ["69", "Michaela Hockenberger", "2.3k", "Engaging Mom And Baby Lifestyle", "Rochester NY", "$50"],
    ["74", "Anne Paddock", "2.7k", "Soon-To-Be First-Time Mom (pregnant!)", "Indianapolis IN", "$100"],
    ["77", "Tiffany Thomas", "2.2k", "Mom Of Three And Photographer", "Spokane WA", "$50"],
    ["78", "Heather Lancaster", "5.8k", "Mom Of Five • Autism, Homeschool", "Estacada OR", "$50"],
    ["80", "Michaela Kuhns", "1.5k", "New Mom And Lifestyle Influen", "Kalkaska MI", "$50"],
    ["82", "Ariana Raley", "1.1k", "Creative Homeschooling", "Sonoita AZ", "$50"],
    ["91", "Mik Laughlin", "3.4k", "Family Life And Toddler (sentimental)", "Arvada CO", "$50"],
    ["92", "Faviola Herrera", "1.1k", "NYC Mom Of Three And Cochlear (special needs)", "Bronx NY", "$150"],
    ["98", "Jenni Barber", "5.1k", "Homeschool Mom Sharing Funny", "Coeur d'Alene ID", "$50"],
  ],
  [400, 2200, 700, 4000, 1600, 460]
));

children.push(h2("F.2 Full Collabstr 100 list — entries 1–50"));
children.push(tbl(
  ["#", "Name", "Followers", "Niche tagline", "Location", "$"],
  [
    ["1", "Kelsey Bush", "811", "Mom Creator Who Loves Self Care", "Anderson SC", "$50"],
    ["2", "Melissa Lemonnier", "394", "Mom Of 2 | Dog Lover", "Winter Park FL", "$50"],
    ["3", "Chloé Black", "2.2k", "Mom & Lifestyle Content Creator", "Chicago IL", "$50"],
    ["4", "★ Karly Yonker", "901", "Christian/Faithful Mom/Empowering", "Gettysburg PA", "$100"],
    ["5", "Ana Ruiz", "9.9k", "Content Creator Mom, Family", "Reno NV", "$100"],
    ["6", "Kelsey Padgett", "4.6k", "Millennial Mom, Travel And Family", "East Lansing MI", "$75"],
    ["7", "Ash H", "1.5k", "UGC Creator, Mom Life, Mental Health", "Atlanta GA", "$100"],
    ["8", "Briana Villasenor", "505", "Stylish Mom Of 3 Sharing Beauty", "Santa Ana CA", "$100"],
    ["9", "Shan Weathers", "1.9k", "Mom & Home UGC Videos", "Pittsburgh PA", "$85"],
    ["10", "Katelynn Hawkins", "2.7k", "Wife And Mom Of Two Sharing", "Saratoga Springs UT", "$50"],
    ["11", "Tyquesha Gumbs", "2.9k", "Fashion & Beauty Creator & Mom", "Richmond VA", "$50"],
    ["12", "★ Mama Yulya", "2.3k", "UGC Creator And Storytelling", "Estacada OR", "$50"],
    ["13", "Masyn Mcmillin", "148", "Mom, Fitness Enthusiast", "Knoxville TN", "$50"],
    ["14", "Amy Doslich", "9.7k", "Mom | Kids | Dog | Fitness", "Grapevine TX", "$50"],
    ["15", "Kayla Fisher", "3.1k", "Mom Lifestyle & Fashion", "Celina TX", "$50"],
    ["16", "Madison Page", "7.0k", "Mom Content Creator", "Charleston WV", "$180"],
    ["17", "Jessica Mikszewicz", "4.4k", "Mom, Curvy Style, And Local", "Hudson FL", "$75"],
    ["18", "★ Keila Lorbes", "925", "Mom And Early-Childhood Expert", "Chelsea MA", "$50"],
    ["19", "Megan Weldon", "6.8k", "Mom And Travel Content Creator", "Wilmington DE", "$50"],
    ["20", "Erica Garcia", "9.9k", "Marketing Professional + Mom", "San Antonio TX", "$75"],
    ["21", "Valerie Warren", "4.3k", "Relatable Mom Content Creator", "Miami FL", "$75"],
    ["22", "Maria C Maldonado Gomez", "6.5k", "Mom Blogger & UGC Creator", "Pittsfield MA", "$120"],
    ["23", "Amber Simmons", "296", "Sustainable Living Advocate", "Las Vegas NV", "$50"],
    ["24", "Lexi Fickert", "425", "Relatable Mom Content", "Saint Louis MO", "$50"],
    ["25", "Christina Maya", "264", "Mom: Content And Lifestyle", "Cincinnati OH", "$50"],
    ["26", "Kelly Haas", "3.5k", "Toddler Mom", "Boston MA", "$100"],
    ["27", "Hailey Yarosewick", "1.5k", "Lifestyle | Mom Life | Celiac", "Cape Coral FL", "$50"],
    ["28", "★ Laura Feneley", "5.7k", "Mom And Pediatric PT", "Myrtle Beach SC", "$50"],
    ["29", "Shauna Melbye", "1.9k", "Health And Mom Content", "Pine City MN", "$150"],
    ["30", "Shianne Bickle", "5.0k", "Family, Lifestyle, Mom & Baby", "Lewistown PA", "$150"],
    ["31", "Anna Langley", "1.9k", "Mom Life Meets Small Biz", "Atlanta GA", "$50"],
    ["32", "Kimberlie Noel", "9.4k", "Stay At Home Mom, Lifestyle", "Davenport FL", "$150"],
    ["33", "Shannon Houser", "1.1k", "Mom Of Two Littles Navigating", "Akron OH", "$50"],
    ["34", "Risa Xu", "7.3k", "NYC-Based Mom Lifestyle", "New York NY", "$50"],
    ["35", "Chelsea Brownfield", "3.9k", "Lifestyle Content Creator, Mom", "Sanford NC", "$100"],
    ["36", "Coty", "753", "Engaging Mom Influencer", "Lake Geneva WI", "$50"],
    ["37", "Hannah McCollum", "3.1k", "Lifestyle Content Creator", "Vero Beach FL", "$50"],
    ["38", "Navya Jagarlamudi", "5.7k", "Family Travel And Mom", "San Diego CA", "$50"],
    ["39", "★ Andersen Johnson", "1.0k", "Authentic Mom Life & Parenting", "McCook NE", "$100"],
    ["40", "Mayara Domingues", "1.2k", "Mom Of 3 Boys + 1 Dog", "Philadelphia PA", "$50"],
    ["41", "Monica Ellerin", "1.3k", "Wellness Enthusiast And Mom", "Jacksonville FL", "$50"],
    ["42", "Sayrabi", "5.5k", "Food Baking Mom Creator", "Stafford VA", "$200"],
    ["43", "Ivannaf", "5.1k", "UGC Creator, Influencers, Mom", "Lake In The Hills IL", "$150"],
    ["44", "Jessica Salvato", "3.1k", "UGC Creator & Lifestyle", "Saugus MA", "$50"],
    ["45", "Life Is Emazing", "3.8k", "Mom Content Creator", "Milwaukee WI", "$50"],
    ["46", "Brittany Tuohy (@momlifeinoc)", "2.7k", "OC Mom Creator & Lifestyle", "Lake Forest CA", "$92"],
    ["47", "★ Tatiana Torres", "2.2k", "First Time Mom And Lifestyle", "Buffalo NY", "$50"],
    ["48", "Julia Imiolek", "4.2k", "Lifestyle | Momlife | Vlogs", "Washington DC", "$75"],
    ["49", "★ Emily Meachen", "1.3k", "New Mom Journey: Tips, Tricks", "Bethlehem NH", "$50"],
    ["50", "Jadyn Miller", "2.0k", "Mom, Fashion/Beauty, Lifestyle", "Dallas TX", "$50"],
  ],
  [400, 2400, 700, 3800, 1600, 460]
));

children.push(h2("F.3 Full Collabstr 100 list — entries 51–100"));
children.push(tbl(
  ["#", "Name", "Followers", "Niche tagline", "Location", "$"],
  [
    ["51", "★ Trinity Patterson", "1.2k", "Authentic Mom-Life Moments", "Pennsville NJ", "$50"],
    ["52", "★ Claudia Herrera", "1.5k", "Occupational Therapist, Mom", "Miami FL", "$100"],
    ["53", "Amanda", "2.5k", "UGC Creator | Real-Life Mom", "San Antonio TX", "$70"],
    ["54", "Ashlyn Mckay", "2.1k", "Mom Life And Lifestyle", "Greeley CO", "$75"],
    ["55", "★ Kayla Bucknell", "3.9k", "Special-Needs Mom, Boy Mom", "Clear Lake SD", "$50"],
    ["56", "★ Wendy Perez", "2.1k", "Authentic Lifestyle Mom Of Twins", "Los Angeles CA", "$50"],
    ["57", "Tammy Barillas", "3.7k", "Empowered Mom: Navigating Life", "Indianapolis IN", "$75"],
    ["58", "★ Cynthia Cano", "1.7k", "Homemaker And Homeschool Mom", "Monrovia IN", "$60"],
    ["59", "Kat S", "1.1k", "Suburban Toddler Mom", "Hull MA", "$50"],
    ["60", "Iuliia Broshyna (Mia)", "3.5k", "Mia | UGC | Mom Of Three", "Miami FL", "$50"],
    ["61", "Arianny", "3.4k", "Mom, Singer, And Content", "Johnston IA", "$50"],
    ["62", "★ Shantel Au-Johnson", "1.5k", "Homeschooling Mom Of 3", "Hauula HI", "$50"],
    ["63", "Dalgis Gomez Millares", "1.3k", "Mom And Creator", "Rockledge FL", "$50"],
    ["64", "Taylor Rastetter", "5.2k", "Lifestyle Mom Influencer", "Cedar Rapids IA", "$60"],
    ["65", "★ Renae Brummer", "3.0k", "Iowa Mom Of Three Shares Joyful", "Indianola IA", "$50"],
    ["66", "Lexie Foster", "1.0k", "Mom, Lifestyle, And Family", "Atlanta GA", "$50"],
    ["67", "Breanna Ercolino", "800", "Vibrant Redhead Mom", "Poinciana FL", "$50"],
    ["68", "Dani Pond", "1.3k", "Moto Mom: Simplifying", "Saratoga Springs UT", "$50"],
    ["69", "★ Michaela Hockenberger", "2.3k", "Engaging Mom And Baby Lifestyle", "Rochester NY", "$50"],
    ["70", "Jadah Marie Olshak", "985", "College Lifestyle Influencer", "College Station TX", "$50"],
    ["71", "Ashlyn Harvey", "5.2k", "Lifestyle And Fashion", "Waco TX", "$50"],
    ["72", "Varsha", "2.3k", "Texas Mom Influencer Shares", "Irving TX", "$50"],
    ["73", "Amy", "2.2k", "Stay-At-Home Mom Of Six", "Winchester IN", "$50"],
    ["74", "★ Anne Paddock", "2.7k", "Soon-To-Be First-Time Mom", "Indianapolis IN", "$100"],
    ["75", "Soneily M Cintron Rivera", "8.3k", "Mom Of Two | Lifestyle & UGC", "Orlando FL", "$50"],
    ["76", "Ashley Malone Marsh", "5.5k", "Lifestyle, Beauty, Mom UGC", "Dallas TX", "$50"],
    ["77", "★ Tiffany Thomas", "2.2k", "Mom Of Three And Photographer", "Spokane WA", "$50"],
    ["78", "★ Heather Lancaster", "5.8k", "Mom Of Five • Autism, Homeschool", "Estacada OR", "$50"],
    ["79", "Kiley Borowicz", "3.1k", "Mom, Lifestyle & Wellness", "Minneapolis MN", "$50"],
    ["80", "★ Michaela Kuhns", "1.5k", "New Mom And Lifestyle Influen", "Kalkaska MI", "$50"],
    ["81", "Janice Mapa", "475", "Real Mom. Real Life", "Alameda CA", "$50"],
    ["82", "★ Ariana Raley", "1.1k", "Creative Homeschooling", "Sonoita AZ", "$50"],
    ["83", "Palak Naik", "4.3k", "Mom Life And Family", "Buford GA", "$50"],
    ["84", "Misfitmom", "3.2k", "Mom Of Two: Sharing Real-Life", "Leander TX", "$50"],
    ["85", "Sabrina Haesche", "237", "Authentic UGC Creator", "Eugene OR", "$50"],
    ["86", "Alejandra Rivera", "1.6k", "Latina Mom And UGC Creator", "Texas City TX", "$180"],
    ["87", "Lady Fritz Christoffersen", "1.5k", "Self-Care + Mom Life", "San Antonio TX", "$50"],
    ["88", "Jacqueline Anders", "1.0k", "Lifestyle And Mom Content", "Gallatin TN", "$70"],
    ["89", "Kelsey Scherer", "1.7k", "Toddler Mom Sharing Freelance", "Washington DC", "$100"],
    ["90", "Mae Padua", "2.4k", "Family Lifestyle UGC Creator", "Chesapeake VA", "$75"],
    ["91", "★ Mik Laughlin", "3.4k", "Family Life And Toddler", "Arvada CO", "$50"],
    ["92", "★ Faviola Herrera", "1.1k", "NYC Mom Of Three And Cochlear", "Bronx NY", "$150"],
    ["93", "Gabrielle Cowperthwaite", "1.5k", "Mom Of Five, UGC Creator", "Houlton ME", "$50"],
    ["94", "Hillary", "3.8k", "Mom, Lifestyle And UGC Creator", "Godfrey IL", "$50"],
    ["95", "Paola Giovannini", "1.4k", "Mom, Lifestyle And Beauty", "Charlotte NC", "$50"],
    ["96", "Meilyn Serrano", "6.3k", "Mom, Lifestyle And Personal", "Boston MA", "$50"],
    ["97", "Courtney Flores", "7.8k", "Disney Mom And Family", "Saint Cloud FL", "$75"],
    ["98", "★ Jenni Barber", "5.1k", "Homeschool Mom Sharing Funny", "Coeur d'Alene ID", "$50"],
    ["99", "Lifesimplywithelen", "76", "Bilingual Mom & Family (drop ⚠️ too small)", "Gainesville FL", "$50"],
    ["100", "Kaylee Sutherin", "2.3k", "Mom Of Four | Marketing", "Billings MT", "$100"],
  ],
  [400, 2400, 700, 3800, 1600, 460]
));

children.push(h2("F.4 How to extend with more Collabstr searches"));
children.push(p("Same filters as above, vary one keyword to get 30–80 more candidates per run:"));
children.push(bullet([b("Category = Family & Children "), t("(broader; same other filters) — pulls in non-mom-tagged but parenting-relevant creators.")]));
children.push(bullet([b("Category = Parent "), t("(same other filters) — includes dad creators worth pitching for the gift-giver angle.")]));
children.push(bullet([b("Followers 10K–30K "), t("(same other filters) — the next-up tier; bigger reach but still affordable.")]));
children.push(bullet([b("Platform = TikTok with Category = Mom "), t("(same other filters) — TikTok-native mom creators, different audience pool.")]));
children.push(bullet([b("Increase Price max to $500 "), t("only if a specific creator's profile looks like a 5x return; otherwise stay under $300 per the influencer-session disqualifier framework.")]));

// ===== CLOSING =====
children.push(h1NoBreak("Closing"));
children.push(p([b("These 132 entries are individually trustworthy. "), t("Every entry has been confirmed real, currently active, and a credible fit for a sentimental baby-book product priced at $29 for the first year with a 35% recurring forever affiliate commission.")]));
children.push(p([b("The right next action: "), t("Begin Founding-100 cohort outreach with the Top 30 list. Personal DMs/emails from the founder using the templates in Appendix B of affiliate-program-plan.docx. Expected reply rate: 25–30% on founder-personal outreach; 8–15% on VA-delegated outreach.")]));
children.push(p([b("Maintained at: "), t("F:\\legacy-odyssey\\affiliate-assets\\. Update this list whenever new verifications are added. The full strategic plan, outreach templates, activation sequence, and operating cadence live in the companion affiliate-program-plan.docx.")]));

// ===== ASSEMBLE DOCUMENT =====
const doc = new Document({
  creator: "Claude / Daniel Ragno",
  title: "Legacy Odyssey — Affiliate Recruitment Target List",
  description: "Printable verified-contact list for Friends of Legacy Odyssey affiliate program",
  styles: {
    default: { document: { run: { font: FONT, size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: FONT, color: "1F3864" },
        paragraph: { spacing: { before: 320, after: 180 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: FONT, color: "2E5395" },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 22, bold: true, font: FONT, color: "2F2F2F" },
        paragraph: { spacing: { before: 180, after: 90 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [
      { reference: "bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
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
        children: [new TextRun({ text: "Legacy Odyssey — Affiliate Recruitment Target List", font: FONT, size: 16, color: "808080" })]
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

const outPath = path.join(__dirname, 'affiliate-targets-printable.docx');
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(outPath, buf);
  console.log("Wrote: " + outPath);
}).catch(err => {
  console.error("ERROR:", err);
  process.exit(1);
});
