#!/usr/bin/env node
/**
 * Generate blog posts for the Garage Door Repair Directory.
 *
 * Creates ~18 national blog posts across 4 categories:
 *   - Tips & Maintenance
 *   - Cost & Pricing
 *   - Buying Guides
 *   - Safety & Industry
 *
 * Outputs: data/blog-posts.json
 * Then appends to Google Sheets "Blog" tab.
 *
 * Usage:
 *   node scripts/generate-blog.js
 *   node scripts/generate-blog.js --generate-only
 */

const fs = require("fs");
const path = require("path");

// Load env from .env.local
const envPath = path.join(__dirname, "..", ".env.local");
const env = {};
try {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const m = line.match(/^([^=]+)=(.*)$/);
    if (m) {
      let val = m[2].trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      env[m[1].trim()] = val;
    }
  }
} catch {
  // .env.local not found
}

const SPREADSHEET_ID = env.GOOGLE_SHEET_ID || process.env.GOOGLE_SHEET_ID;
const SERVICE_ACCOUNT_EMAIL =
  env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = (
  env.GOOGLE_PRIVATE_KEY ||
  process.env.GOOGLE_PRIVATE_KEY ||
  ""
).replace(/\\n/g, "\n");

const GENERATE_ONLY = process.argv.includes("--generate-only");

if (
  !GENERATE_ONLY &&
  (!SPREADSHEET_ID || !SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY)
) {
  console.error(
    "Missing env vars. Use --generate-only to just create JSON, or set up .env.local"
  );
  process.exit(1);
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// --- Blog Post Templates ---

const BLOG_POSTS = [
  // Tips & Maintenance
  {
    title: "How to Tell When Your Garage Door Spring Needs Replacing",
    category: "Tips & Maintenance",
    tags: "springs,maintenance,safety,repair",
    excerpt:
      "Learn the warning signs that your garage door spring is failing before it breaks completely. Know when to call a professional.",
    content: `<h2>Signs Your Garage Door Spring Is Failing</h2>
<p>Garage door springs are under enormous tension and handle thousands of cycles per year. Most torsion springs last 10,000-15,000 cycles (about 7-10 years of normal use), but they don't last forever. Recognizing the warning signs early can save you from a sudden failure that leaves your door stuck.</p>

<h3>1. The Door Feels Heavier Than Usual</h3>
<p>Your garage door springs do most of the heavy lifting. If the door suddenly feels heavier when you open it manually, or your opener is straining more than usual, the springs are losing tension. A properly balanced door should stay in place when lifted halfway and released.</p>

<h3>2. Visible Gaps in the Spring Coils</h3>
<p>Look at the torsion spring above your garage door. A healthy spring has tightly wound coils with uniform spacing. If you see a visible gap (usually 2-3 inches) in the coils, the spring has already broken or is about to. This is the most obvious sign of failure.</p>

<h3>3. The Door Opens Unevenly or Crooked</h3>
<p>If your garage door tilts to one side when opening, one spring may have weakened more than the other. Most double-car garages use two torsion springs. When one fails or weakens, the door lifts unevenly, putting dangerous stress on the remaining spring and the opener.</p>

<h3>4. Loud Bang from the Garage</h3>
<p>If you heard a loud bang (like a firecracker) from your garage when no one was in it, a spring has likely broken. The sound comes from the spring unwinding rapidly. Check for a visible gap in the spring coils to confirm.</p>

<h3>5. The Opener Struggles or Won't Lift the Door</h3>
<p>If your opener motor runs but the door barely moves or won't lift at all, the springs have likely failed. The opener motor is not designed to lift the full weight of the door on its own. Continuing to try will burn out the motor.</p>

<h3>6. Rust on the Springs</h3>
<p>Rust weakens spring coils and increases friction, shortening spring life. If you see significant rust, the springs are degrading faster than normal. Regular lubrication with silicone spray can slow this process, but heavily rusted springs should be replaced.</p>

<h3>When to Call a Professional</h3>
<p>Never attempt to replace garage door springs yourself. The springs are under extreme tension and can cause severe injury or death if they snap during removal. Always hire a licensed garage door professional who carries insurance and has experience with spring replacement.</p>

<p>Typical spring replacement costs $150-$350 for a single spring or $200-$500 for a pair. Most professionals recommend replacing both springs at the same time, even if only one has failed, since the other is likely near the end of its life too.</p>`,
    metaTitle:
      "Signs Your Garage Door Spring Needs Replacing | When to Call a Pro",
    metaDescription:
      "6 warning signs your garage door spring is failing. Learn what to look for, why springs break, and when to call a professional for replacement.",
  },
  {
    title: "7 Signs Your Garage Door Opener Is Failing",
    category: "Tips & Maintenance",
    tags: "opener,maintenance,troubleshooting,repair",
    excerpt:
      "Is your garage door opener on its last legs? These 7 warning signs tell you when it's time for a repair or replacement.",
    content: `<h2>Is Your Garage Door Opener Failing?</h2>
<p>The average garage door opener lasts 10-15 years with normal use. As it ages, you'll notice performance issues that signal it's time for a repair or replacement. Here are the 7 most common warning signs.</p>

<h3>1. Intermittent Operation</h3>
<p>If your opener works sometimes but not others, the problem could be worn gears, a failing motor, or electrical issues. Start with the simple fixes: replace remote batteries, check the power supply, and ensure nothing is blocking the photo-eye sensors. If the problem persists, the opener's internal components are wearing out.</p>

<h3>2. Excessive Noise</h3>
<p>All openers make some noise, but grinding, scraping, or rattling sounds indicate a problem. Chain-drive openers are naturally louder than belt-drive models, but any sudden increase in noise means something has changed. Common culprits include worn gears, loose hardware, or a failing motor.</p>

<h3>3. Slow Response Time</h3>
<p>A healthy opener should begin moving the door within 1-2 seconds of pressing the button. If there's a noticeable delay, the opener's processor or motor is struggling. A delay of more than 2-3 seconds warrants attention.</p>

<h3>4. The Door Reverses for No Reason</h3>
<p>If the door starts closing then reverses without hitting anything, the close-limit switch may need adjustment. However, if adjusting the limits doesn't fix it, the logic board could be failing. Random reversals are also a safety concern that should be addressed promptly.</p>

<h3>5. Vibration During Operation</h3>
<p>Excessive vibration usually means the opener is working harder than it should. This could be caused by worn internal parts, poor mounting, or a door that's out of balance. Have the door balance checked first since an unbalanced door puts extra strain on the opener.</p>

<h3>6. The Opener Runs But the Door Doesn't Move</h3>
<p>If you hear the motor running but the door stays put, the drive gear (the plastic gear that connects the motor to the drive mechanism) has likely stripped. This is one of the most common chain-drive opener failures and requires professional repair.</p>

<h3>7. No Safety Features</h3>
<p>If your opener was manufactured before 1993, it likely lacks the auto-reverse and photo-eye safety features required by federal law. While it may still work, replacing it is a safety priority, especially if you have children or pets. Modern openers also offer rolling code security, battery backup, and smart home integration.</p>

<h3>Repair vs. Replace</h3>
<p>If your opener is less than 8 years old and has a single issue, repair usually makes sense. But if it's over 10 years old, lacks safety features, or has multiple problems, replacement is the better investment. New openers cost $250-$550 installed and come with modern safety and convenience features.</p>`,
    metaTitle: "7 Signs Your Garage Door Opener Is Failing | Repair or Replace",
    metaDescription:
      "7 warning signs your garage door opener needs repair or replacement. Troubleshooting tips, when to call a pro, and repair vs replace guidance.",
  },
  {
    title: "Garage Door Maintenance Checklist: What to Do Each Season",
    category: "Tips & Maintenance",
    tags: "maintenance,seasonal,checklist,diy",
    excerpt:
      "Keep your garage door running smoothly year-round with this seasonal maintenance checklist. Prevent costly repairs with simple DIY tasks.",
    content: `<h2>Seasonal Garage Door Maintenance Checklist</h2>
<p>A well-maintained garage door lasts 20-30 years. A neglected one may need replacement in 10-15. The difference? Regular maintenance that takes about 30 minutes per season. This checklist covers everything you need to do to keep your garage door in top shape.</p>

<h3>Spring (March-May)</h3>
<p>Spring is the ideal time for your most thorough maintenance session after winter.</p>
<ul>
<li><strong>Clean the tracks:</strong> Wipe down both tracks with a damp cloth to remove dirt and debris. Don't lubricate the tracks since grease attracts dirt and can cause the rollers to slip</li>
<li><strong>Lubricate moving parts:</strong> Apply white lithium grease or silicone-based lubricant to rollers, hinges, and springs. One spray per hinge, one pass along each spring. Never use WD-40 as a lubricant (it's a solvent, not a lubricant)</li>
<li><strong>Tighten hardware:</strong> Use a socket wrench to tighten all bracket bolts and roller brackets. The average door moves 1,500+ times per year, and vibration loosens hardware</li>
<li><strong>Inspect weather stripping:</strong> Check the rubber seal at the bottom and the weather stripping along the sides and top. Replace any cracked, brittle, or missing sections</li>
<li><strong>Test the balance:</strong> Disconnect the opener (pull the emergency release cord). Lift the door manually to waist height and let go. A balanced door stays in place. If it falls or rises, the springs need professional adjustment</li>
</ul>

<h3>Summer (June-August)</h3>
<ul>
<li><strong>Test safety features:</strong> Place a 2x4 flat on the ground in the door's path and press close. The door must reverse within 2 seconds of contact. Also test the photo-eye sensors by waving an object through the beam while the door is closing</li>
<li><strong>Wash the door:</strong> Clean with mild detergent and water. For wood doors, check for peeling paint, cracks, or water damage. For steel doors, touch up any chips or scratches to prevent rust</li>
<li><strong>Check the opener:</strong> Listen for unusual sounds. Check that the remote and wall button work reliably. Replace remote batteries annually</li>
<li><strong>Inspect cables visually:</strong> Look for fraying, rust, or loose strands on the lift cables. Never touch or adjust cables yourself since they are under high tension</li>
</ul>

<h3>Fall (September-November)</h3>
<ul>
<li><strong>Prepare for winter:</strong> Re-lubricate all moving parts before cold weather arrives. Cold temperatures thicken lubricant, so a fresh application ensures smooth winter operation</li>
<li><strong>Replace weather stripping:</strong> If the bottom seal is worn, replace it before winter to keep out cold air, water, and pests</li>
<li><strong>Test the backup battery:</strong> If your opener has a battery backup, test it by unplugging the opener and operating the door. Replace the battery if it doesn't work</li>
<li><strong>Clear the area:</strong> Remove any stored items that are too close to the door's path. Items near the tracks or photo-eye sensors can cause operational issues</li>
</ul>

<h3>Winter (December-February)</h3>
<ul>
<li><strong>Keep the bottom seal clear:</strong> After snow or ice, make sure the bottom seal isn't frozen to the ground before opening the door. Opening a frozen seal can tear it</li>
<li><strong>Monitor for condensation:</strong> In cold climates, condensation can cause rust. Wipe down any visible moisture on springs and hardware</li>
<li><strong>Listen for changes:</strong> Cold temperatures affect spring tension and lubricant viscosity. Unusual sounds in winter often resolve in spring, but persistent issues should be checked</li>
</ul>

<h3>Annual Professional Tune-Up</h3>
<p>In addition to your DIY maintenance, schedule one professional tune-up per year. A trained technician can safely adjust spring tension, inspect components you can't safely access, and catch problems early. Annual tune-ups typically cost $75-$150 and can prevent repairs costing hundreds more.</p>`,
    metaTitle:
      "Garage Door Maintenance Checklist | Seasonal Guide for Homeowners",
    metaDescription:
      "Complete seasonal garage door maintenance checklist. Spring, summer, fall, and winter tasks to keep your door running smoothly and prevent costly repairs.",
  },
  {
    title: "How to Manually Open a Garage Door During a Power Outage",
    category: "Tips & Maintenance",
    tags: "power outage,emergency,diy,safety",
    excerpt:
      "Power out and stuck in the garage? Here's how to safely disengage your opener and manually operate your garage door.",
    content: `<h2>Opening Your Garage Door Without Power</h2>
<p>When the power goes out, your automatic garage door opener won't work. But every modern opener has a manual release mechanism that lets you operate the door by hand. Here's how to use it safely.</p>

<h3>Before You Start: Safety First</h3>
<ul>
<li><strong>Make sure the door is fully closed</strong> before disengaging the opener. If the door is partially open and the springs are broken, it could crash down when disconnected</li>
<li><strong>Never pull the release if you suspect a broken spring.</strong> A door with broken springs is extremely heavy (150-400+ lbs) and dangerous to lift manually</li>
<li><strong>Lock the door first</strong> if you're inside and don't plan to leave. A disengaged opener means anyone can lift the door from outside</li>
</ul>

<h3>Step-by-Step Instructions</h3>
<ol>
<li><strong>Locate the emergency release cord.</strong> It's the red rope with a handle hanging from the opener rail, usually near the front of the garage. Every opener installed after 1993 has one</li>
<li><strong>Pull the cord down and toward the door.</strong> This disconnects the trolley (the carriage on the rail) from the drive chain or belt. You'll feel or hear a click when it disengages</li>
<li><strong>Lift the door manually.</strong> Grab the door at the bottom and lift straight up. If the springs are working correctly, the door should lift easily and stay open at any position. If it's very heavy, the springs may need adjustment (call a professional after power returns)</li>
<li><strong>Prop the door open if needed.</strong> If you need to drive out, make sure the door stays up on its own. If it slides down, use a C-clamp on the track just below the lowest roller to act as a stop</li>
<li><strong>Close the door manually when done.</strong> Pull the door down gently and lock it using the manual lock (the handle or slide bolt on the inside of the door) if you're leaving</li>
</ol>

<h3>Re-Engaging the Opener After Power Returns</h3>
<ol>
<li>Pull the emergency release cord toward the opener motor (the opposite direction from when you disengaged it)</li>
<li>Press the wall button or remote. The opener will run and the trolley will reconnect to the carriage automatically</li>
<li>If it doesn't reconnect, manually push the door to the fully closed position, then press the button. Some openers need the trolley aligned with the carriage to re-engage</li>
</ol>

<h3>Battery Backup: The Better Solution</h3>
<p>If power outages are common in your area, consider an opener with built-in battery backup. Many modern openers include this feature, and aftermarket battery backup units are available for $50-$100. They provide 20-50 open/close cycles during an outage, so you don't need to use the manual release at all.</p>

<h3>When to Call a Professional</h3>
<p>If the door is too heavy to lift manually, won't stay open, or makes unusual sounds, don't force it. Wait for power to return and call a garage door professional. Operating a door with broken or failing springs can cause serious injury.</p>`,
    metaTitle:
      "How to Open a Garage Door During a Power Outage | Step-by-Step Guide",
    metaDescription:
      "Step-by-step guide to manually opening your garage door during a power outage. Emergency release instructions, safety tips, and battery backup options.",
  },
  {
    title:
      "DIY vs Professional Garage Door Repair: When to Call an Expert",
    category: "Tips & Maintenance",
    tags: "diy,professional,repair,safety",
    excerpt:
      "Some garage door repairs are safe DIY projects. Others can kill you. Here's how to know the difference.",
    content: `<h2>What You Can Fix Yourself (and What You Absolutely Cannot)</h2>
<p>Garage doors involve heavy components under high tension. Some repairs are safe, simple DIY projects. Others are genuinely dangerous and require professional training and tools. Knowing the difference can save you money or save your life.</p>

<h3>Safe DIY Repairs</h3>

<h4>Replacing Weather Stripping ($10-$30)</h4>
<p>The rubber seal at the bottom of the door wears out every 3-5 years. Replacement seals are available at any hardware store and install in 15 minutes. Peel or slide out the old seal and insert the new one. No tools required beyond a utility knife.</p>

<h4>Lubricating Moving Parts ($5-$10)</h4>
<p>Apply white lithium grease or silicone spray to rollers, hinges, and springs twice a year. One can lasts for years. Avoid WD-40 (it's a solvent, not a lubricant) and never grease the tracks.</p>

<h4>Replacing Remote Batteries ($5)</h4>
<p>If your remote stops working, replace the battery before assuming the opener is broken. Most remotes use CR2032 or similar coin cell batteries.</p>

<h4>Aligning Photo-Eye Sensors ($0)</h4>
<p>If your door reverses when closing with nothing in the way, the photo-eye sensors may be misaligned. They're the small sensors on either side of the door at ground level. Loosen the mounting bracket, aim both sensors at each other until the indicator light is solid (not blinking), and retighten.</p>

<h4>Tightening Loose Hardware ($0)</h4>
<p>Vibration from daily use loosens bolts and brackets. Use a socket wrench to tighten all visible hardware on the door and tracks. This takes 10 minutes and prevents bigger problems.</p>

<h3>Call a Professional</h3>

<h4>Spring Replacement ($150-$500)</h4>
<p>This is the #1 most dangerous garage door repair. Torsion springs are wound under extreme tension. A spring that snaps during installation can cause severe injury or death. This is not an exaggeration. Professional spring replacement takes about an hour and includes proper tensioning and balancing.</p>

<h4>Cable Replacement ($150-$350)</h4>
<p>Lift cables are under high tension from the springs. Like springs, they can cause serious injury if they snap during removal. Cables also require proper routing and tensioning that affects door balance.</p>

<h4>Track Replacement or Realignment ($125-$350)</h4>
<p>Tracks must be precisely aligned for the door to operate safely. Improper alignment can cause the door to fall off the tracks, potentially injuring someone or damaging your car.</p>

<h4>Opener Motor or Logic Board Replacement ($150-$400)</h4>
<p>While not as physically dangerous as spring work, opener repairs involve electrical components. Incorrect wiring can create fire hazards or cause the opener to malfunction unpredictably. Also, most homeowners don't have the diagnostic tools to identify the exact failing component.</p>

<h4>Panel Replacement ($200-$800)</h4>
<p>Replacing damaged panels requires removing the door from the tracks, which means working with springs and cables under tension. Panels must also be properly aligned to prevent the door from binding.</p>

<h3>The Bottom Line</h3>
<p>If a repair involves springs, cables, or removing the door from its tracks, hire a professional. The cost of professional repair is far less than an emergency room visit. For everything else (lubrication, weather stripping, sensor alignment, hardware tightening), save the money and do it yourself.</p>`,
    metaTitle:
      "DIY vs Professional Garage Door Repair | What's Safe to Fix Yourself",
    metaDescription:
      "Which garage door repairs are safe DIY projects and which require a professional? Complete guide to knowing when to call an expert.",
  },

  // Cost & Pricing
  {
    title: "How Much Does Garage Door Repair Cost in 2025?",
    category: "Cost & Pricing",
    tags: "cost,pricing,repair,budget",
    excerpt:
      "Complete breakdown of garage door repair costs in 2025. From spring replacement to full door installation, know what to expect before you call.",
    content: `<h2>Garage Door Repair Costs in 2025</h2>
<p>The average garage door repair costs between $150 and $500, depending on the type of repair needed. Some fixes are under $100, while major repairs or replacements can exceed $2,000. Here's a detailed breakdown of what to expect.</p>

<h3>Common Repair Costs</h3>
<table>
<thead><tr><th>Repair Type</th><th>Average Cost</th><th>Range</th></tr></thead>
<tbody>
<tr><td>Spring replacement (single)</td><td>$250</td><td>$150-$350</td></tr>
<tr><td>Spring replacement (pair)</td><td>$350</td><td>$200-$500</td></tr>
<tr><td>Opener repair</td><td>$200</td><td>$100-$350</td></tr>
<tr><td>Opener replacement</td><td>$400</td><td>$250-$550</td></tr>
<tr><td>Cable replacement</td><td>$200</td><td>$150-$350</td></tr>
<tr><td>Roller replacement</td><td>$150</td><td>$100-$200</td></tr>
<tr><td>Panel replacement</td><td>$500</td><td>$200-$800</td></tr>
<tr><td>Track repair</td><td>$200</td><td>$125-$350</td></tr>
<tr><td>Sensor repair/alignment</td><td>$100</td><td>$75-$150</td></tr>
<tr><td>Weather stripping</td><td>$75</td><td>$50-$150</td></tr>
</tbody>
</table>

<h3>Factors That Affect Cost</h3>
<ul>
<li><strong>Type of repair:</strong> Spring and panel replacements cost more than minor adjustments or sensor fixes</li>
<li><strong>Emergency/after-hours service:</strong> Add $75-$200 for evenings, weekends, or holidays</li>
<li><strong>Door type and size:</strong> Double-wide doors and specialty doors (wood, custom) cost more to repair</li>
<li><strong>Parts availability:</strong> Older or unusual doors may require special-order parts</li>
<li><strong>Your location:</strong> Urban areas and high cost-of-living regions have higher labor rates</li>
<li><strong>Service call fee:</strong> Most companies charge $50-$100 just to show up, often applied toward the repair</li>
</ul>

<h3>Full Door Replacement Costs</h3>
<p>If repair costs approach 50% of a new door's cost, replacement usually makes more financial sense. New garage door costs:</p>
<ul>
<li><strong>Single-car steel door:</strong> $750-$1,500 installed</li>
<li><strong>Double-car steel door:</strong> $1,000-$2,500 installed</li>
<li><strong>Insulated steel door:</strong> $1,200-$3,000 installed</li>
<li><strong>Wood door:</strong> $1,500-$4,000 installed</li>
<li><strong>Custom/carriage-style:</strong> $2,000-$6,000+ installed</li>
</ul>

<h3>How to Save Money on Repairs</h3>
<ul>
<li><strong>Get multiple quotes:</strong> Always get 2-3 estimates before committing. Prices vary significantly between companies</li>
<li><strong>Replace springs in pairs:</strong> If one spring fails, the other is likely near end of life. Paying for a return visit costs more than replacing both at once</li>
<li><strong>Schedule regular maintenance:</strong> A $75-$150 annual tune-up prevents repairs costing hundreds more</li>
<li><strong>Avoid emergency rates:</strong> If your door is stuck closed but you have another way in and out, wait for regular business hours</li>
<li><strong>Ask about warranties:</strong> Reputable companies warranty their work for 1-2 years. Parts may have separate manufacturer warranties</li>
</ul>

<h3>Red Flags to Watch For</h3>
<ul>
<li>Companies that won't give a price range over the phone</li>
<li>Quotes significantly lower than everyone else (bait and switch)</li>
<li>Pressure to replace the entire door when only a repair is needed</li>
<li>No written estimate or invoice</li>
<li>No license, insurance, or online reviews</li>
</ul>`,
    metaTitle: "Garage Door Repair Cost 2025 | Complete Price Guide",
    metaDescription:
      "How much does garage door repair cost in 2025? Complete pricing guide for springs, openers, panels, cables, and full door replacement.",
  },
  {
    title: "Why Garage Door Spring Replacement Costs So Much",
    category: "Cost & Pricing",
    tags: "springs,cost,pricing,repair",
    excerpt:
      "Garage door spring replacement costs $200-$500. Here's why, what's included, and how to make sure you're getting a fair price.",
    content: `<h2>Understanding Garage Door Spring Replacement Costs</h2>
<p>When homeowners hear that replacing a pair of garage door springs costs $200-$500, the first reaction is often sticker shock. After all, the springs themselves are only $30-$75 each. But there's good reason for the cost, and understanding what goes into the job helps you evaluate whether you're getting a fair price.</p>

<h3>What You're Paying For</h3>

<h4>The Springs ($30-$75 each)</h4>
<p>The parts themselves are the smallest part of the cost. Standard torsion springs cost $30-$50 each. High-cycle springs (rated for 25,000-50,000 cycles instead of the standard 10,000) cost $50-$75 each but last 2-3x longer.</p>

<h4>Specialized Tools and Equipment</h4>
<p>Spring replacement requires winding bars, vise grips, a torque wrench, and safety equipment. Professional-grade winding bars alone cost $50-$100, and technicians invest in a full set of tools specific to this job. This equipment cost is built into the service price.</p>

<h4>Expertise and Risk</h4>
<p>This is the biggest factor. Garage door springs are under hundreds of pounds of tension. A torsion spring for a standard double-car door holds roughly 400 ft-lbs of force. Incorrect handling can result in the spring or winding bar becoming a projectile. People have died from garage door spring accidents. You're paying for someone who knows how to do this safely.</p>

<h4>Proper Tensioning and Balancing</h4>
<p>Installing the spring is only half the job. The technician must wind the spring to the correct tension for your specific door weight, then test the door balance multiple times. An improperly tensioned spring causes the door to be too heavy or too light, putting stress on the opener and creating a safety hazard.</p>

<h4>Labor Time (1-2 Hours)</h4>
<p>A skilled technician completes the job in about an hour. This includes removal of the old springs, installation, tensioning, balancing, lubrication, and safety testing. Less experienced technicians may take longer.</p>

<h4>Service Call Fee ($50-$100)</h4>
<p>Most companies charge a trip fee that covers fuel, vehicle maintenance, and travel time. Many apply this fee toward the repair if you proceed.</p>

<h3>Cost Breakdown Example</h3>
<p>For a typical two-spring replacement on a double-car door:</p>
<ul>
<li>Service call fee: $75</li>
<li>Two standard torsion springs: $80</li>
<li>Labor (1 hour): $150</li>
<li>Total: approximately $305</li>
</ul>
<p>For high-cycle springs, add $40-$50 to the parts cost.</p>

<h3>When You're Being Overcharged</h3>
<ul>
<li><strong>Over $600 for a pair of standard springs:</strong> Unless you're in a very high cost-of-living area, this is above market rate</li>
<li><strong>Charging per spring turn:</strong> Some dishonest companies charge per "turn" of the winding bar. This is not a legitimate pricing method</li>
<li><strong>Insisting on a full door replacement:</strong> If the door itself is in good condition, you only need new springs</li>
<li><strong>No written estimate before starting work:</strong> Always get a written quote before the technician begins</li>
</ul>

<h3>How to Get the Best Price</h3>
<ul>
<li>Get 3 quotes from licensed, insured companies</li>
<li>Ask about high-cycle springs (they cost more upfront but last much longer)</li>
<li>Replace both springs at the same time (cheaper than two separate visits)</li>
<li>Ask if the service call fee is applied toward the repair</li>
<li>Check if the company offers a warranty on parts and labor</li>
</ul>`,
    metaTitle:
      "Why Garage Door Spring Replacement Costs $200-$500 | Price Breakdown",
    metaDescription:
      "Garage door spring replacement costs explained. Parts, labor, tools, and expertise breakdown. How to know if you're getting a fair price.",
  },
  {
    title: "Garage Door Opener Replacement: What to Expect to Pay",
    category: "Cost & Pricing",
    tags: "opener,cost,pricing,replacement",
    excerpt:
      "Thinking about replacing your garage door opener? Here's what it costs for chain-drive, belt-drive, and smart openers in 2025.",
    content: `<h2>Garage Door Opener Replacement Costs</h2>
<p>A new garage door opener costs $200-$550 installed, depending on the type, features, and horsepower. Here's a complete breakdown to help you budget for a replacement.</p>

<h3>Opener Types and Costs</h3>

<h4>Chain-Drive Openers ($200-$350 installed)</h4>
<p>The most affordable and common type. A metal chain pulls the trolley along the rail. Chain-drive openers are reliable and powerful, but they're the noisiest option. Best for detached garages or homes where noise isn't a concern.</p>

<h4>Belt-Drive Openers ($300-$450 installed)</h4>
<p>Uses a rubber belt instead of a chain. Significantly quieter than chain-drive with similar reliability. The most popular choice for attached garages where bedrooms are above or adjacent to the garage. Worth the premium for noise-sensitive households.</p>

<h4>Screw-Drive Openers ($250-$400 installed)</h4>
<p>Uses a threaded steel rod to move the trolley. Fewer moving parts means less maintenance, but they can be noisy and are sensitive to temperature changes. A solid middle-ground option.</p>

<h4>Direct-Drive (Jackshaft) Openers ($400-$550 installed)</h4>
<p>Mounts on the wall beside the door instead of on the ceiling. The motor drives the torsion bar directly. Ultra-quiet and frees up ceiling space. The most expensive option but ideal for garages with low ceilings or limited overhead space.</p>

<h3>Features That Add Cost</h3>
<ul>
<li><strong>Battery backup:</strong> +$50-$100. Keeps the door operational during power outages. Worth it if outages are common in your area</li>
<li><strong>Smart home integration:</strong> +$30-$80. WiFi connectivity for smartphone control, alerts, and integration with Alexa/Google Home. Most new mid-range openers include this standard</li>
<li><strong>Camera:</strong> +$50-$100. Some smart openers include a built-in camera for monitoring your garage remotely</li>
<li><strong>Extra remotes:</strong> +$25-$50 each. Most openers come with one or two remotes. Additional remotes or keypads cost extra</li>
</ul>

<h3>Horsepower Guide</h3>
<ul>
<li><strong>1/2 HP:</strong> Standard for single-car and lightweight double-car doors. The most common residential choice</li>
<li><strong>3/4 HP:</strong> Recommended for heavier double-car doors, insulated doors, and wood doors</li>
<li><strong>1 HP and above:</strong> For oversized, custom, or very heavy doors. Usually overkill for standard residential doors</li>
</ul>

<h3>Installation Costs</h3>
<p>Professional installation typically adds $100-$200 to the price of the opener. This includes:</p>
<ul>
<li>Removal and disposal of the old opener</li>
<li>Mounting the new opener and rail</li>
<li>Wiring the wall button and photo-eye sensors</li>
<li>Programming remotes</li>
<li>Testing and adjusting limits and force settings</li>
</ul>
<p>DIY installation saves the labor cost, but most manufacturers require professional installation to maintain the warranty.</p>

<h3>Our Recommendation</h3>
<p>For most homeowners, a belt-drive opener with 1/2 or 3/4 HP, battery backup, and smart home connectivity offers the best value. Expect to pay $350-$450 installed. It's quiet, reliable, and includes the features most people want.</p>`,
    metaTitle:
      "Garage Door Opener Replacement Cost 2025 | Types, Features & Prices",
    metaDescription:
      "How much does a new garage door opener cost? Complete 2025 pricing for chain-drive, belt-drive, and smart openers with installation costs.",
  },
  {
    title: "Are Extended Warranties on Garage Doors Worth It?",
    category: "Cost & Pricing",
    tags: "warranty,cost,buying,tips",
    excerpt:
      "Should you buy an extended warranty on your new garage door or opener? Here's an honest breakdown of the pros, cons, and math.",
    content: `<h2>Garage Door Extended Warranties: Worth It or Waste of Money?</h2>
<p>When you buy a new garage door or opener, you'll almost certainly be offered an extended warranty. These typically cost $100-$300 and extend coverage beyond the standard manufacturer warranty. Here's how to decide if it's worth your money.</p>

<h3>What Standard Warranties Already Cover</h3>
<p>Before evaluating an extended warranty, understand what you already get for free:</p>
<ul>
<li><strong>Garage door panels:</strong> Most manufacturers offer a limited lifetime warranty on steel panels against rust-through and defects. This doesn't cover dents, scratches, or normal wear</li>
<li><strong>Hardware (springs, rollers, hinges):</strong> Typically 1-3 years depending on the component and manufacturer</li>
<li><strong>Garage door openers:</strong> Usually 3-5 years on parts and motor, 1 year on accessories (remotes, keypads)</li>
<li><strong>Installation labor:</strong> Most installers warranty their labor for 1-2 years</li>
</ul>

<h3>What Extended Warranties Typically Add</h3>
<ul>
<li>Coverage beyond the standard warranty period (usually 3-10 additional years)</li>
<li>Parts replacement for components that fail prematurely</li>
<li>Sometimes labor costs for warranty repairs</li>
<li>Sometimes annual maintenance visits</li>
</ul>

<h3>The Math: Is It Worth It?</h3>
<p>Consider this scenario:</p>
<ul>
<li>Extended warranty cost: $200</li>
<li>Coverage period: 5 additional years (years 3-8 after installation)</li>
<li>Most likely repairs in years 3-8: roller replacement ($150), sensor issues ($100), weather stripping ($75)</li>
<li>Total likely repair costs: $325</li>
<li>Apparent savings: $125</li>
</ul>
<p>Sounds like a deal, right? But consider that most homeowners won't need all three of those repairs. The warranty company has calculated that, on average, they'll pay out less than $200 in claims per policy. That's how they make money.</p>

<h3>When an Extended Warranty Makes Sense</h3>
<ul>
<li><strong>You chose a budget door or opener:</strong> Lower-cost products are more likely to need repairs sooner</li>
<li><strong>The warranty includes annual maintenance:</strong> If it includes 1-2 professional tune-ups per year, the value increases significantly ($75-$150 per visit)</li>
<li><strong>Your climate is extreme:</strong> Extreme heat, cold, or humidity accelerates wear on door components</li>
<li><strong>Peace of mind matters to you:</strong> Some people prefer knowing all repair costs are covered regardless of the math</li>
</ul>

<h3>When to Skip It</h3>
<ul>
<li><strong>You chose a premium door and opener:</strong> Quality products with strong manufacturer warranties rarely need major repairs in the first 10 years</li>
<li><strong>You're comfortable with basic maintenance:</strong> Most early-life issues are preventable with lubrication and tightening</li>
<li><strong>The warranty excludes springs:</strong> Read the fine print. Some extended warranties exclude the most expensive repair (springs), which defeats the purpose</li>
<li><strong>The price exceeds $300:</strong> At that point, you'd be better off putting the money aside for future repairs</li>
</ul>

<h3>Alternative: Self-Insure</h3>
<p>Instead of buying an extended warranty, put the same amount into a home maintenance fund. If you don't need repairs, you keep the money. If you do, you've got it covered. Over time, this strategy almost always saves money compared to buying warranties on every home appliance and system.</p>`,
    metaTitle:
      "Are Extended Warranties on Garage Doors Worth It? | Honest Analysis",
    metaDescription:
      "Should you buy an extended warranty on your garage door or opener? Honest breakdown of costs, coverage, and when it actually makes financial sense.",
  },

  // Buying Guides
  {
    title: "Best Garage Door Opener Brands Compared",
    category: "Buying Guides",
    tags: "opener,brands,comparison,buying",
    excerpt:
      "Comparing the top garage door opener brands: LiftMaster, Chamberlain, Genie, and more. Features, reliability, and value rated.",
    content: `<h2>Top Garage Door Opener Brands in 2025</h2>
<p>With dozens of garage door opener brands available, choosing the right one can be overwhelming. We've compared the major brands on reliability, features, price, and customer satisfaction to help you make the right choice.</p>

<h3>LiftMaster (Best Overall)</h3>
<p>LiftMaster is the professional installer's choice and the most widely recommended brand by garage door companies. Made by The Chamberlain Group (the largest manufacturer globally).</p>
<ul>
<li><strong>Pros:</strong> Excellent reliability, extensive smart home integration via myQ, battery backup options, professional-grade build quality, wide range of models</li>
<li><strong>Cons:</strong> Higher price point, typically requires professional installation, myQ subscription for some advanced features</li>
<li><strong>Price range:</strong> $250-$500 (opener only)</li>
<li><strong>Best for:</strong> Homeowners who want the most reliable, feature-rich opener and don't mind paying more</li>
</ul>

<h3>Chamberlain (Best Value)</h3>
<p>Chamberlain is LiftMaster's consumer-facing sibling, made by the same company with similar technology at lower prices. Available at retail stores while LiftMaster is sold through professional dealers.</p>
<ul>
<li><strong>Pros:</strong> Same myQ smart technology as LiftMaster, great value for money, DIY-friendly installation, widely available at Home Depot and Lowe's</li>
<li><strong>Cons:</strong> Slightly less robust than LiftMaster equivalents, some models feel more consumer-grade</li>
<li><strong>Price range:</strong> $180-$380 (opener only)</li>
<li><strong>Best for:</strong> DIY installers who want LiftMaster technology at a lower price</li>
</ul>

<h3>Genie (Best Budget Option)</h3>
<p>Genie has been making openers since 1954 and offers reliable, no-frills options at competitive prices. Their Aladdin Connect smart platform competes with myQ.</p>
<ul>
<li><strong>Pros:</strong> Affordable, reliable, good warranty, Aladdin Connect smart features included on many models, easy DIY installation</li>
<li><strong>Cons:</strong> Smart platform not as polished as myQ, fewer model options than Chamberlain/LiftMaster</li>
<li><strong>Price range:</strong> $150-$320 (opener only)</li>
<li><strong>Best for:</strong> Budget-conscious buyers who want basic reliability and smart features</li>
</ul>

<h3>Ryobi (Most Innovative)</h3>
<p>Ryobi's garage door opener system is unique: a modular design where you can add accessories like fans, speakers, lights, and retractable cords to the opener unit.</p>
<ul>
<li><strong>Pros:</strong> Modular accessory system, ultra-quiet, built-in battery backup, strong motor, unique multi-function design</li>
<li><strong>Cons:</strong> Only available at Home Depot, proprietary accessories, newer to the market with less long-term track record</li>
<li><strong>Price range:</strong> $250-$400 (opener only, accessories extra)</li>
<li><strong>Best for:</strong> Tech enthusiasts who want a multi-function garage hub</li>
</ul>

<h3>Quick Comparison</h3>
<table>
<thead><tr><th>Brand</th><th>Reliability</th><th>Smart Features</th><th>Value</th><th>DIY-Friendly</th></tr></thead>
<tbody>
<tr><td>LiftMaster</td><td>Excellent</td><td>Excellent</td><td>Good</td><td>Fair</td></tr>
<tr><td>Chamberlain</td><td>Very Good</td><td>Excellent</td><td>Excellent</td><td>Excellent</td></tr>
<tr><td>Genie</td><td>Good</td><td>Good</td><td>Excellent</td><td>Excellent</td></tr>
<tr><td>Ryobi</td><td>Good</td><td>Good</td><td>Good</td><td>Good</td></tr>
</tbody>
</table>

<h3>Our Recommendation</h3>
<p>For most homeowners, <strong>Chamberlain</strong> offers the best combination of reliability, features, and value. If you want the absolute best and have a professional install it, go with <strong>LiftMaster</strong>. On a tight budget, <strong>Genie</strong> delivers reliable performance at the lowest price.</p>`,
    metaTitle:
      "Best Garage Door Opener Brands 2025 | LiftMaster vs Chamberlain vs Genie",
    metaDescription:
      "Comparing the top garage door opener brands: LiftMaster, Chamberlain, Genie, and Ryobi. Reliability, features, and value rated side by side.",
  },
  {
    title: "Steel vs Wood vs Aluminum Garage Doors: Pros and Cons",
    category: "Buying Guides",
    tags: "materials,buying,comparison,installation",
    excerpt:
      "Choosing a new garage door material? Compare steel, wood, and aluminum on durability, insulation, maintenance, and cost.",
    content: `<h2>Garage Door Materials Compared</h2>
<p>The material of your garage door affects its durability, insulation, maintenance needs, appearance, and cost. Here's an honest comparison of the three most common options to help you choose the right one for your home.</p>

<h3>Steel Garage Doors</h3>
<p>Steel is the most popular garage door material, used in roughly 70% of residential installations.</p>
<ul>
<li><strong>Durability:</strong> Excellent. Resists cracking, warping, and shrinking. Can dent from impact but modern steel doors are surprisingly resilient</li>
<li><strong>Insulation:</strong> Good to excellent when paired with polyurethane or polystyrene insulation. Insulated steel doors achieve R-values up to R-18</li>
<li><strong>Maintenance:</strong> Very low. Occasional washing and touch-up paint for chips. Some styles come with a factory-applied finish that rarely needs refinishing</li>
<li><strong>Appearance:</strong> Available in many styles including raised panel, flush, and carriage house. Can mimic wood grain texture</li>
<li><strong>Cost:</strong> $800-$2,500 installed for a standard double-car door</li>
<li><strong>Lifespan:</strong> 20-30 years with minimal maintenance</li>
</ul>
<p><strong>Best for:</strong> Most homeowners. Offers the best balance of durability, insulation, appearance, and value.</p>

<h3>Wood Garage Doors</h3>
<p>Wood doors offer unmatched natural beauty but require significantly more maintenance.</p>
<ul>
<li><strong>Durability:</strong> Moderate. Susceptible to moisture damage, warping, cracking, and rot. Performance varies by wood species (cedar and redwood resist rot better than pine)</li>
<li><strong>Insulation:</strong> Moderate natural insulation. Can be improved with added insulation panels, but wood doors are generally heavier, which affects opener sizing</li>
<li><strong>Maintenance:</strong> High. Requires staining or painting every 2-3 years. Must be sealed against moisture. Needs regular inspection for rot, especially at the bottom</li>
<li><strong>Appearance:</strong> Unmatched. Natural wood grain, custom designs, and traditional carriage-house looks that can't be perfectly replicated in other materials</li>
<li><strong>Cost:</strong> $1,500-$4,000+ installed depending on wood species and design</li>
<li><strong>Lifespan:</strong> 15-25 years with diligent maintenance, less in wet climates</li>
</ul>
<p><strong>Best for:</strong> Homeowners who prioritize curb appeal, are willing to invest in maintenance, and live in moderate climates.</p>

<h3>Aluminum Garage Doors</h3>
<p>Aluminum is the lightweight alternative, popular for modern and contemporary home styles.</p>
<ul>
<li><strong>Durability:</strong> Good resistance to rust and corrosion (perfect for coastal areas), but dents more easily than steel and doesn't pop back</li>
<li><strong>Insulation:</strong> Poor without added insulation. Aluminum conducts heat and cold readily. Insulated aluminum options exist but don't match insulated steel performance</li>
<li><strong>Maintenance:</strong> Very low. Doesn't rust, doesn't need painting. Wipe down occasionally</li>
<li><strong>Appearance:</strong> Ideal for modern, contemporary, and industrial aesthetics. Available with glass panels for natural light. Clean, sleek lines</li>
<li><strong>Cost:</strong> $1,000-$3,000 installed. Full-view aluminum-and-glass doors can reach $4,000+</li>
<li><strong>Lifespan:</strong> 20-25 years</li>
</ul>
<p><strong>Best for:</strong> Modern homes, coastal areas prone to salt air, and homeowners who want glass panel doors for natural light.</p>

<h3>Quick Comparison</h3>
<table>
<thead><tr><th>Factor</th><th>Steel</th><th>Wood</th><th>Aluminum</th></tr></thead>
<tbody>
<tr><td>Durability</td><td>Excellent</td><td>Moderate</td><td>Good</td></tr>
<tr><td>Insulation</td><td>Excellent</td><td>Moderate</td><td>Poor</td></tr>
<tr><td>Maintenance</td><td>Low</td><td>High</td><td>Very Low</td></tr>
<tr><td>Appearance</td><td>Good</td><td>Excellent</td><td>Modern</td></tr>
<tr><td>Cost</td><td>$$</td><td>$$$</td><td>$$-$$$</td></tr>
<tr><td>Lifespan</td><td>20-30 yr</td><td>15-25 yr</td><td>20-25 yr</td></tr>
</tbody>
</table>

<h3>Our Recommendation</h3>
<p>For most homeowners, an <strong>insulated steel door</strong> is the best choice. It offers the best combination of durability, energy efficiency, and value with minimal maintenance. Choose wood only if you're committed to the maintenance schedule and want unmatched curb appeal. Choose aluminum for modern aesthetics or coastal environments.</p>`,
    metaTitle:
      "Steel vs Wood vs Aluminum Garage Doors | Complete Comparison Guide",
    metaDescription:
      "Comparing steel, wood, and aluminum garage doors on durability, insulation, maintenance, cost, and appearance. Find the right material for your home.",
  },
  {
    title: "Smart Garage Door Openers: What to Look For",
    category: "Buying Guides",
    tags: "smart home,opener,technology,buying",
    excerpt:
      "Shopping for a smart garage door opener? Here's what features actually matter and which ones are just marketing.",
    content: `<h2>Smart Garage Door Openers: A Buyer's Guide</h2>
<p>Smart garage door openers let you control, monitor, and automate your garage door from your phone. But not all smart features are created equal. Here's what to look for and what to skip.</p>

<h3>Essential Smart Features</h3>

<h4>Smartphone Control</h4>
<p>The core feature: open and close your door from anywhere using an app. This is genuinely useful. You can let in a delivery driver, a dog walker, or a family member who forgot their remote. Every smart opener includes this.</p>

<h4>Real-Time Alerts</h4>
<p>Get push notifications when your door opens or closes. Set alerts if the door has been open for more than a set time. This is a real security improvement over traditional openers where you'd never know if someone opened your garage while you're away.</p>

<h4>Activity Log</h4>
<p>See a history of when the door was opened and closed. Useful for knowing when your kids got home from school or verifying that the door was closed overnight.</p>

<h4>Auto-Close Timer</h4>
<p>Set the door to automatically close after a specified time (5, 10, 15 minutes, etc.). This prevents the common scenario of accidentally leaving the door open all day or overnight. A genuinely useful safety feature.</p>

<h3>Nice-to-Have Features</h3>

<h4>Voice Assistant Integration</h4>
<p>Works with Alexa, Google Home, or Apple HomeKit. Convenient for hands-free control when you're in the house. "Hey Google, close the garage door" is surprisingly satisfying. Most platforms require a bridge device or subscription for garage door control specifically.</p>

<h4>Geofencing</h4>
<p>Automatically opens or closes the door based on your phone's location. The door opens as you pull into the driveway and closes when you leave. Sounds great but can be unreliable in practice. GPS accuracy and battery drain are common complaints.</p>

<h4>Camera</h4>
<p>Some smart openers include a built-in camera for monitoring your garage. Useful for checking on deliveries or verifying the door is actually closed. However, a separate security camera often has better quality and more features.</p>

<h3>What to Skip</h3>

<h4>Subscription Services</h4>
<p>Some brands charge monthly fees for features that should be free (like extended activity history or advanced alerts). Check what's included before buying. LiftMaster's myQ platform offers most features for free but charges for some integrations.</p>

<h4>Proprietary Ecosystems</h4>
<p>Be cautious of openers that only work with their own app and don't integrate with standard smart home platforms. If the company goes out of business or drops support, your smart features stop working.</p>

<h3>Retrofit vs. New Opener</h3>
<p>You don't necessarily need a new opener to go smart. Retrofit devices like the Chamberlain myQ Smart Garage Hub ($30-$40) add smartphone control to most existing openers made after 1993. This is a great way to add smart features without replacing a working opener.</p>

<h3>Top Smart Opener Recommendations</h3>
<ul>
<li><strong>Best overall:</strong> Chamberlain B6765T - belt drive, myQ built-in, battery backup, quiet, $300-$350</li>
<li><strong>Best budget:</strong> Genie QuietLift Connect 3053 - belt drive, Aladdin Connect smart features, $200-$250</li>
<li><strong>Best retrofit:</strong> Chamberlain myQ Smart Garage Hub - adds smart features to existing openers, $30-$40</li>
<li><strong>Best premium:</strong> LiftMaster 87504-267 - wall-mounted, ultra-quiet, myQ, battery backup, camera-ready, $450-$550</li>
</ul>`,
    metaTitle:
      "Smart Garage Door Openers Guide | What Features Actually Matter",
    metaDescription:
      "What to look for in a smart garage door opener. Essential features, nice-to-haves, what to skip, and top recommendations for 2025.",
  },
  {
    title:
      "Insulated vs Non-Insulated Garage Doors: Which Do You Need?",
    category: "Buying Guides",
    tags: "insulation,buying,energy,comparison",
    excerpt:
      "Is an insulated garage door worth the extra cost? Here's how to decide based on your climate, garage use, and budget.",
    content: `<h2>Do You Need an Insulated Garage Door?</h2>
<p>Insulated garage doors cost 15-30% more than non-insulated versions. Whether the upgrade is worth it depends on your climate, how you use your garage, and your home's layout. Here's how to make the right choice.</p>

<h3>How Garage Door Insulation Works</h3>
<p>Insulated doors have two or three layers: one or two steel skins with insulation sandwiched between them. The insulation is typically polyurethane (foamed in place, R-12 to R-18) or polystyrene (rigid panels, R-4 to R-8). Higher R-values mean better insulation.</p>

<h3>You Should Get an Insulated Door If:</h3>
<ul>
<li><strong>Your garage is attached to your house.</strong> An attached garage shares one or more walls with your living space. An uninsulated garage door lets outside temperatures affect your home's heating and cooling efficiency</li>
<li><strong>You have rooms above the garage.</strong> Heat rises, and an uninsulated garage below a bedroom or office creates cold floors and higher heating bills</li>
<li><strong>You use the garage as a workspace.</strong> If you work on projects, exercise, or spend time in the garage, insulation makes it comfortable year-round</li>
<li><strong>You live in a hot or cold climate.</strong> If your area regularly sees temperatures below 30F or above 90F, insulation makes a measurable difference in energy costs</li>
<li><strong>You want a quieter door.</strong> Insulated doors are significantly quieter to operate. The insulation dampens vibration and reduces the rattling common with single-layer doors</li>
<li><strong>You want a stronger door.</strong> The sandwich construction of insulated doors makes them more rigid and dent-resistant than single-layer steel doors</li>
</ul>

<h3>A Non-Insulated Door Is Fine If:</h3>
<ul>
<li><strong>Your garage is detached.</strong> If the garage is separate from your house and you don't use it as a workspace, insulation adds cost without much benefit</li>
<li><strong>You live in a mild climate.</strong> If temperatures rarely drop below 40F or rise above 85F, the energy savings won't justify the cost</li>
<li><strong>You're on a tight budget.</strong> A non-insulated door from a good brand is better than a cheap insulated door. You can always add aftermarket insulation later ($50-$150)</li>
</ul>

<h3>Cost Difference</h3>
<ul>
<li><strong>Non-insulated steel door:</strong> $700-$1,200 installed (double-car)</li>
<li><strong>Polystyrene-insulated (R-6 to R-9):</strong> $900-$1,800 installed</li>
<li><strong>Polyurethane-insulated (R-12 to R-18):</strong> $1,200-$2,500 installed</li>
</ul>
<p>The upgrade from non-insulated to polyurethane-insulated typically costs $300-$600 more, which is modest relative to the total door cost.</p>

<h3>Energy Savings</h3>
<p>An insulated garage door can reduce energy loss through the garage by up to 70%. For most homeowners with an attached garage, this translates to $100-$200 per year in heating and cooling savings. The insulation upgrade pays for itself in 2-4 years.</p>

<h3>Our Recommendation</h3>
<p>If your garage is attached to your house, get an insulated door. Period. The energy savings, noise reduction, and durability improvement are worth the modest premium. For detached garages, base the decision on how much time you spend in the garage and your climate.</p>`,
    metaTitle:
      "Insulated vs Non-Insulated Garage Doors | Which Do You Need?",
    metaDescription:
      "Should you buy an insulated or non-insulated garage door? Compare R-values, costs, energy savings, and when insulation is worth the upgrade.",
  },
  {
    title: "Choosing the Right Garage Door Size for Your Home",
    category: "Buying Guides",
    tags: "sizing,buying,installation,planning",
    excerpt:
      "Getting the right garage door size is critical. Here's how to measure your opening and choose the right door dimensions.",
    content: `<h2>Garage Door Sizing Guide</h2>
<p>Ordering the wrong size garage door is an expensive mistake. Doors are not easily trimmed or adjusted, so accurate measurements are essential before you buy. Here's how to get it right.</p>

<h3>Standard Garage Door Sizes</h3>
<p>Most residential garage doors come in standard widths and heights:</p>

<h4>Single-Car Doors</h4>
<ul>
<li><strong>8' x 7'</strong> - The most common single-car size. Fits most standard single garages</li>
<li><strong>9' x 7'</strong> - Slightly wider. Provides more clearance for larger vehicles and easier entry/exit</li>
<li><strong>10' x 7'</strong> - Extra-wide single. Good for trucks, SUVs, or garages that double as workshops</li>
</ul>

<h4>Double-Car Doors</h4>
<ul>
<li><strong>16' x 7'</strong> - The standard double-car size. Fits two average-sized vehicles</li>
<li><strong>16' x 8'</strong> - Standard width with extra height for taller vehicles (trucks, vans)</li>
<li><strong>18' x 7'</strong> - Extra-wide double. Provides more clearance between parked vehicles</li>
<li><strong>18' x 8'</strong> - The most spacious standard option</li>
</ul>

<h3>How to Measure Your Garage Opening</h3>
<ol>
<li><strong>Width:</strong> Measure the opening at the widest point, from the inside edge of one side jamb to the other. Measure at the floor and at the top. Use the smaller number</li>
<li><strong>Height:</strong> Measure from the floor to the bottom of the header (the beam above the opening). Measure on both sides and use the smaller number</li>
<li><strong>Headroom:</strong> Measure from the top of the opening to the ceiling or lowest obstruction (lights, pipes, etc.). Standard openers need at least 10-12 inches of headroom. Low-headroom options are available for tighter spaces</li>
<li><strong>Side room:</strong> Measure the distance from the edge of the opening to the nearest wall on each side. You need at least 3.75 inches on each side for the track</li>
<li><strong>Depth:</strong> Measure from the opening to the back wall. The garage must be deep enough for the door to fully open (door height + 18 inches minimum)</li>
</ol>

<h3>When Standard Sizes Don't Fit</h3>
<p>If your garage opening doesn't match a standard size:</p>
<ul>
<li><strong>Slightly undersized opening:</strong> You may be able to modify the framing to fit a standard door (cheaper than a custom door)</li>
<li><strong>Slightly oversized opening:</strong> Add framing material (filler strips) to reduce the opening to a standard size</li>
<li><strong>Significantly non-standard:</strong> Custom doors are available but cost 30-50% more than standard sizes and have longer lead times</li>
</ul>

<h3>Choosing the Right Height</h3>
<p>The standard 7-foot height works for most sedans and small SUVs. Consider an 8-foot door if:</p>
<ul>
<li>You drive a full-size truck, van, or large SUV</li>
<li>You plan to add a roof rack or cargo carrier</li>
<li>You want extra clearance for comfort and safety</li>
<li>Your garage opening is already 8 feet tall</li>
</ul>
<p>The cost difference between 7' and 8' doors is typically $100-$200 and well worth it if your vehicles are taller.</p>

<h3>Two Single Doors vs. One Double Door</h3>
<p>For a two-car garage, you have a choice:</p>
<ul>
<li><strong>One double door (16' or 18'):</strong> Lower cost, one opener, cleaner look. But if it breaks, both cars are stuck</li>
<li><strong>Two single doors (8' or 9' each):</strong> Higher cost (two doors, two openers), but if one breaks, the other still works. Also provides more design flexibility and better wind resistance</li>
</ul>
<p>In most cases, a single double-car door is the better value unless you live in a high-wind area or want the redundancy of two independent doors.</p>`,
    metaTitle: "Garage Door Size Guide | How to Measure and Choose the Right Fit",
    metaDescription:
      "Standard garage door sizes, how to measure your opening, and when you need a custom door. Complete sizing guide for single and double-car garages.",
  },

  // Safety & Industry
  {
    title: "Garage Door Safety Tips Every Homeowner Should Know",
    category: "Safety & Industry",
    tags: "safety,tips,family,maintenance",
    excerpt:
      "Your garage door is the heaviest moving object in your home. These safety tips protect your family from common hazards.",
    content: `<h2>Essential Garage Door Safety</h2>
<p>Garage doors cause an estimated 30,000 injuries and several deaths in the United States each year. Most of these are preventable. Understanding the hazards and following basic safety practices protects your family and can save lives.</p>

<h3>The Three Biggest Dangers</h3>

<h4>1. Spring Tension</h4>
<p>Torsion springs above your garage door store enormous energy. A spring for a standard double-car door holds roughly 400 ft-lbs of force. If a spring breaks or is improperly handled, it can cause severe injury. Never attempt to adjust, remove, or replace springs yourself.</p>

<h4>2. Crushing Force</h4>
<p>A closing garage door weighs 150-400+ pounds and doesn't stop for much. Modern doors have auto-reverse features, but they can fail or be improperly adjusted. Never walk, run, or drive under a moving door.</p>

<h4>3. Entanglement</h4>
<p>The gaps between door sections, the area around the tracks, and the moving chain or belt mechanism can catch fingers, clothing, or hair. Children are at the greatest risk.</p>

<h3>Monthly Safety Checklist</h3>
<ul>
<li><strong>Test auto-reverse (mechanical):</strong> Place a 2x4 flat on the ground in the door's path. Press close. The door must reverse within 2 seconds of contacting the board. If it doesn't, the opener needs immediate service</li>
<li><strong>Test photo-eye sensors:</strong> While the door is closing, wave an object through the sensor beam (the two small devices on either side of the door near the ground). The door should reverse instantly. Clean the sensor lenses if they're dirty</li>
<li><strong>Inspect springs and cables visually:</strong> Look for gaps in spring coils, fraying cables, or rust. Don't touch them, just look. If you see damage, call a professional</li>
<li><strong>Test manual operation:</strong> Pull the emergency release cord and lift the door manually. It should lift smoothly and stay at any height. A door that drops or is too heavy to lift has a balance problem</li>
</ul>

<h3>Rules for Families with Children</h3>
<ul>
<li>Mount the wall button at least 5 feet high so small children can't reach it</li>
<li>Keep remotes out of children's reach (treat them like car keys)</li>
<li>Teach children that the garage door is not a toy and never to play under or near it</li>
<li>Never let children race under a closing door</li>
<li>Explain the emergency release cord but instruct them never to use it without an adult</li>
<li>If your opener was made before 1993, replace it immediately since it likely lacks required safety features</li>
</ul>

<h3>Security Best Practices</h3>
<ul>
<li>Use an opener with rolling code technology (all openers made after the mid-2000s have this)</li>
<li>Don't leave the remote in your car where thieves can see it (use a keychain remote or smart phone)</li>
<li>Lock the door between the garage and your house with a deadbolt</li>
<li>Use a smart opener with alerts so you know when the door opens or closes</li>
<li>Enable auto-close timers so the door doesn't stay open accidentally</li>
<li>When traveling, use the vacation lock or disconnect the opener</li>
</ul>

<h3>What to Do If Something Goes Wrong</h3>
<ul>
<li><strong>Door won't close:</strong> Check the photo-eye sensors first (they're often just misaligned or dirty). If that's not the issue, call a professional</li>
<li><strong>Loud bang from garage:</strong> A spring has likely broken. Do not try to operate the door. Call a professional</li>
<li><strong>Door is crooked or stuck:</strong> A cable or spring has failed. Do not force the door. Call a professional</li>
<li><strong>Someone is trapped:</strong> Use the emergency release cord (red handle) to disengage the opener, then lift the door manually. If the door is too heavy to lift, call 911</li>
</ul>`,
    metaTitle:
      "Garage Door Safety Tips | Protect Your Family from Common Hazards",
    metaDescription:
      "Essential garage door safety tips for homeowners. Monthly safety checks, child safety rules, security best practices, and what to do in emergencies.",
  },
  {
    title: "The Biggest Garage Door Mistakes Homeowners Make",
    category: "Safety & Industry",
    tags: "mistakes,tips,maintenance,safety",
    excerpt:
      "Avoid these common garage door mistakes that lead to expensive repairs, safety hazards, and shortened door life.",
    content: `<h2>Common Garage Door Mistakes to Avoid</h2>
<p>Most garage door problems are caused by homeowners (or the companies they hire) making preventable mistakes. Here are the biggest ones and how to avoid them.</p>

<h3>1. Ignoring Maintenance</h3>
<p>The most common mistake by far. A garage door has springs, rollers, cables, tracks, and hinges that all need periodic attention. Without lubrication, hardware tightening, and visual inspections, small problems become expensive repairs. Spending 30 minutes twice a year on maintenance can double the life of your door.</p>
<p><strong>Fix:</strong> Set a calendar reminder for spring and fall maintenance. Lubricate, tighten, and inspect. Schedule an annual professional tune-up.</p>

<h3>2. Attempting Spring Repair Yourself</h3>
<p>YouTube makes it look easy. It's not. Garage door springs are under hundreds of pounds of tension. Every year, people are seriously injured or killed attempting DIY spring replacement. The $200-$400 professional fee is the best money you'll spend on your home.</p>
<p><strong>Fix:</strong> Never touch the springs. Hire a licensed professional for any spring-related work.</p>

<h3>3. Using WD-40 as Lubricant</h3>
<p>WD-40 is a solvent, not a lubricant. It actually strips away existing lubrication, leaving metal-on-metal contact that accelerates wear. Many homeowners spray WD-40 on their garage door and wonder why it gets louder and wears out faster.</p>
<p><strong>Fix:</strong> Use white lithium grease or silicone-based lubricant specifically designed for garage doors. Apply to rollers, hinges, and springs. Never lubricate the tracks.</p>

<h3>4. Hanging Things from the Tracks or Opener</h3>
<p>Using the opener rail as a clothes hanger, hanging bikes from the tracks, or storing items on top of the opener are all surprisingly common and all cause problems. Extra weight strains the opener motor, and items near the tracks can obstruct door travel or fall into the mechanism.</p>
<p><strong>Fix:</strong> Keep the area around the door, tracks, and opener completely clear. Use wall-mounted storage systems instead.</p>

<h3>5. Ignoring a Noisy Door</h3>
<p>A garage door that suddenly gets louder is telling you something. Grinding means worn gears or rollers. Scraping means track misalignment. Rattling means loose hardware. Squealing means lack of lubrication. Every unusual sound is a symptom of a problem that will get worse.</p>
<p><strong>Fix:</strong> Investigate new sounds promptly. Most can be fixed with lubrication or tightening. Grinding or scraping sounds warrant a professional inspection.</p>

<h3>6. Choosing the Cheapest Repair Company</h3>
<p>Garage door repair has some of the worst pricing practices in home services. Companies that quote extremely low prices on the phone often upsell aggressively once they arrive, use low-quality parts, or perform unnecessary work.</p>
<p><strong>Fix:</strong> Get 3 quotes from established, well-reviewed companies. Be wary of prices that are significantly lower than competitors. Check for a physical address, license, and insurance.</p>

<h3>7. Not Testing Safety Features</h3>
<p>The auto-reverse mechanism and photo-eye sensors on your opener exist to prevent the door from crushing people, pets, or objects. These features can degrade over time without you knowing. If they fail, the next time something is in the door's path, there's no safety net.</p>
<p><strong>Fix:</strong> Test both safety features monthly using the 2x4 test (auto-reverse) and the wave test (photo-eyes). If either fails, get the opener serviced immediately.</p>

<h3>8. Painting or Finishing the Door Incorrectly</h3>
<p>Using the wrong paint or applying it incorrectly can cause peeling, bubbling, or trapping moisture that leads to rust (on steel doors) or rot (on wood doors). Latex paint over bare steel without primer, for example, will peel within a year.</p>
<p><strong>Fix:</strong> For steel doors, use a rust-inhibiting primer followed by exterior latex paint. For wood doors, use exterior wood stain or paint rated for high-humidity environments. Always prep the surface properly.</p>`,
    metaTitle:
      "8 Garage Door Mistakes Homeowners Make | Avoid Costly Errors",
    metaDescription:
      "The biggest garage door mistakes that lead to expensive repairs and safety hazards. Common errors and how to avoid them.",
  },
  {
    title: "Why You Should Never Replace Garage Door Springs Yourself",
    category: "Safety & Industry",
    tags: "springs,safety,diy,professional",
    excerpt:
      "Garage door spring replacement is the most dangerous home repair you can attempt. Here's why even handy homeowners should hire a pro.",
    content: `<h2>The Case Against DIY Spring Replacement</h2>
<p>If you search for "garage door spring replacement" online, you'll find hundreds of tutorials and videos showing how to do it yourself. What you won't find is the number of ER visits, permanent injuries, and deaths that result from this repair every year. Here's why this is the one job you should never DIY.</p>

<h3>The Physics of Why It's Dangerous</h3>
<p>A torsion spring for a standard residential garage door is wound to a tension of approximately 400 ft-lbs of force. To put that in perspective, that's roughly the same energy as a .44 Magnum bullet. When you're adjusting or removing a torsion spring, you're controlling that energy with two steel bars and your hands. One slip, one stripped winding cone, one moment of lost grip, and that energy releases instantly.</p>

<h3>What Can Go Wrong</h3>
<ul>
<li><strong>Winding bar slips out:</strong> The most common accident. The winding bar becomes a projectile launched by 400+ ft-lbs of force. It can break bones, crack skulls, or kill</li>
<li><strong>Spring breaks during tensioning:</strong> If the spring has a manufacturing defect or the winding cone is damaged, the spring can snap while you're winding it. The broken end whips around with lethal force</li>
<li><strong>Incorrect spring size:</strong> Installing a spring that's the wrong size for your door creates a dangerous imbalance. The door may slam shut unexpectedly or the spring may fail prematurely</li>
<li><strong>Improper tensioning:</strong> Too many turns and the door flies open. Too few and it crashes down. Both scenarios can cause injury or property damage</li>
<li><strong>The door falls:</strong> Working on springs means disconnecting the door from its support system. Without proper technique, the full weight of the door (150-400+ lbs) can come down on you</li>
</ul>

<h3>Why the YouTube Videos Are Misleading</h3>
<p>Tutorial videos make spring replacement look straightforward. What they don't show:</p>
<ul>
<li>The years of experience that make the technician's movements look easy</li>
<li>The specific tools designed for this job (not the makeshift tools DIYers use)</li>
<li>The dozens of failed attempts and near-misses before the videographer got comfortable</li>
<li>What happens when something goes wrong (you don't film those)</li>
</ul>

<h3>The Cost Comparison</h3>
<p>The most common reason for DIY attempts is saving money. Let's look at the actual numbers:</p>
<ul>
<li>DIY spring cost: $30-$75 per spring</li>
<li>Winding bars (if you don't have them): $20-$40</li>
<li>Professional replacement: $200-$500 for a pair</li>
<li>Emergency room visit (average): $2,200+</li>
<li>Lost wages from injury: variable but significant</li>
</ul>
<p>You're saving $125-$375 by risking an injury that could cost thousands in medical bills and weeks or months of recovery. The math doesn't work.</p>

<h3>What About Extension Springs?</h3>
<p>Extension springs (the ones that run along the horizontal tracks) are somewhat less dangerous than torsion springs because they stretch rather than wind. However, they still store significant energy and can cause serious injury if a cable snaps during replacement. The same advice applies: hire a professional.</p>

<h3>Finding a Reliable Professional</h3>
<p>Spring replacement is a quick job for an experienced technician (about 1 hour). To find a good one:</p>
<ul>
<li>Check Google reviews (look for 4+ stars with 50+ reviews)</li>
<li>Verify they're licensed and insured</li>
<li>Get a quote over the phone (reputable companies can estimate spring jobs without an in-person visit)</li>
<li>Ask if they warranty the springs (most offer 1-3 year warranties)</li>
<li>Ask about high-cycle springs (they cost more but last 2-3x longer)</li>
</ul>`,
    metaTitle:
      "Why You Should Never DIY Garage Door Spring Replacement | Safety Warning",
    metaDescription:
      "Why garage door spring replacement is the most dangerous home repair. The physics of what can go wrong and why professionals are worth every penny.",
  },
  {
    title: "How Weather Affects Your Garage Door and What to Do About It",
    category: "Safety & Industry",
    tags: "weather,maintenance,seasonal,tips",
    excerpt:
      "Extreme heat, cold, humidity, and storms all take a toll on your garage door. Here's how weather affects each component and what you can do.",
    content: `<h2>Weather and Your Garage Door</h2>
<p>Your garage door faces every weather condition year-round. Temperature extremes, humidity, rain, wind, and UV exposure all affect different components in different ways. Understanding these effects helps you maintain your door properly and prevent weather-related failures.</p>

<h3>Cold Weather Effects</h3>

<h4>Springs Become Brittle</h4>
<p>Metal contracts in cold weather, making springs tighter and more brittle. This is why springs break most often during the first cold snap of winter. The spring was already near end of life, and the cold was the final stress. There's not much you can do to prevent this, but replacing springs proactively (before they break) avoids the inconvenience of a broken door in freezing weather.</p>

<h4>Lubricant Thickens</h4>
<p>Cold temperatures cause lubricant to thicken, making the door harder to operate and putting more strain on the opener. Apply fresh silicone-based lubricant before winter arrives. Silicone stays fluid at lower temperatures than petroleum-based grease.</p>

<h4>Weather Stripping Stiffens</h4>
<p>Rubber weather stripping becomes rigid in cold weather and may not seal properly. Worse, it can freeze to the ground if moisture gets underneath. Before opening the door on cold mornings, check that the bottom seal isn't frozen to the concrete. Opening a frozen seal tears it.</p>

<h4>Metal Contracts</h4>
<p>Tracks, rollers, and hinges contract slightly in extreme cold. This can cause binding, squeaking, or uneven operation. Usually temporary and resolves as temperatures moderate.</p>

<h3>Hot Weather Effects</h3>

<h4>Metal Expands</h4>
<p>Heat causes metal components to expand. Tracks may develop slight misalignment, and springs may lose some tension. In extreme heat (100F+), these effects are more pronounced. Usually temporary.</p>

<h4>Weather Stripping Softens</h4>
<p>Extreme heat softens rubber seals, making them more prone to deformation and tearing. UV exposure degrades rubber over time, causing cracking. Replace weather stripping every 3-5 years, or sooner if you're in a hot, sunny climate.</p>

<h4>Paint and Finish Degradation</h4>
<p>UV radiation fades and degrades paint and stain on garage doors, especially on south-facing and west-facing doors. Steel doors may show rust where the finish has failed. Wood doors may crack or warp. Apply UV-resistant finishes and inspect annually.</p>

<h3>Humidity and Rain</h3>

<h4>Rust and Corrosion</h4>
<p>Moisture is the enemy of metal components. Springs, tracks, rollers, and hinges can all rust in humid environments. Coastal areas with salt air are especially hard on garage door hardware. Regular lubrication creates a barrier against moisture. Replace any rusted components promptly.</p>

<h4>Wood Door Damage</h4>
<p>Wood garage doors absorb moisture, causing swelling, warping, and eventually rot. The bottom of the door is most vulnerable because it contacts water on the ground. Maintain the finish (stain or paint) and ensure the bottom seal prevents water contact.</p>

<h4>Sensor Issues</h4>
<p>Condensation on photo-eye sensor lenses can cause the door to reverse unexpectedly. If your door refuses to close on humid mornings, wipe the sensor lenses with a dry cloth.</p>

<h3>Wind and Storms</h3>

<h4>Wind Load</h4>
<p>Standard residential garage doors are rated for 20-30 mph winds. In storm-prone areas, wind-rated doors (rated for 110-180 mph depending on the model) are recommended or required by building code. Non-rated doors can bow inward or blow in during severe storms.</p>

<h4>Flying Debris</h4>
<p>Hail and wind-driven debris can dent steel doors and crack wood or aluminum doors. After any significant storm, inspect the door for damage. Small dents in steel doors are cosmetic, but cracks or holes compromise insulation and weather resistance.</p>

<h3>Seasonal Maintenance Summary</h3>
<ul>
<li><strong>Before winter:</strong> Fresh lubrication, check weather stripping, inspect springs</li>
<li><strong>Before summer:</strong> Inspect finish/paint, check weather stripping for UV damage, clean and lubricate</li>
<li><strong>After storms:</strong> Visual inspection for damage, test operation, check sensor alignment</li>
<li><strong>Year-round:</strong> Keep the bottom seal clean and intact, address rust promptly</li>
</ul>`,
    metaTitle:
      "How Weather Affects Your Garage Door | Seasonal Protection Guide",
    metaDescription:
      "How heat, cold, humidity, and storms affect your garage door. Component-by-component guide to weather-related maintenance and prevention.",
  },
];

// --- Google Sheets Auth (same pattern as expand-articles.js) ---

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function createJWT() {
  const crypto = require("crypto");
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({
      iss: SERVICE_ACCOUNT_EMAIL,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  );
  const signingInput = `${header}.${payload}`;
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(signingInput);
  const signature = sign
    .sign(PRIVATE_KEY, "base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `${signingInput}.${signature}`;
}

async function getAccessToken() {
  const jwt = await createJWT();
  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: jwt,
  }).toString();

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok)
    throw new Error(`Auth error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.access_token;
}

async function appendRows(token, sheetName, rows) {
  const range = encodeURIComponent(sheetName);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values: rows }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Append error: ${res.status} ${errText}`);
  }
  return res.json();
}

// --- Main ---

async function main() {
  console.log(`Generating ${BLOG_POSTS.length} blog posts...`);

  const today = new Date().toISOString().split("T")[0];
  const allPosts = BLOG_POSTS.map((post, i) => {
    // Stagger published dates across the past 3 months
    const daysAgo = Math.floor((BLOG_POSTS.length - i) * 5);
    const pubDate = new Date(Date.now() - daysAgo * 86400000)
      .toISOString()
      .split("T")[0];

    return {
      Title: post.title,
      Slug: slugify(post.title),
      Content: post.content,
      Excerpt: post.excerpt,
      Author: "Garage Door Repair Directory",
      "Image URL": "",
      Category: post.category,
      Tags: post.tags,
      City: "",
      State: "",
      "Published At": pubDate,
      "Meta Title": post.metaTitle,
      "Meta Description": post.metaDescription,
      Published: "TRUE",
    };
  });

  console.log(`Generated ${allPosts.length} blog posts.`);

  // Save to JSON
  const outDir = path.join(__dirname, "..", "data");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "blog-posts.json"),
    JSON.stringify(allPosts, null, 2)
  );
  console.log(`Saved to data/blog-posts.json`);

  if (GENERATE_ONLY) {
    console.log("\n--generate-only mode. Skipping Google Sheets push.");
    return;
  }

  // Push to Google Sheets
  console.log("\nAuthenticating with Google Sheets...");
  const token = await getAccessToken();
  console.log("Authenticated.");

  // Blog sheet columns: Title, Slug, Content, Excerpt, Author, Image URL,
  //                     Category, Tags, City, State, Published At,
  //                     Meta Title, Meta Description, Published
  const rows = allPosts.map((p) => [
    p.Title,
    p.Slug,
    p.Content,
    p.Excerpt,
    p.Author,
    p["Image URL"],
    p.Category,
    p.Tags,
    p.City,
    p.State,
    p["Published At"],
    p["Meta Title"],
    p["Meta Description"],
    p.Published,
  ]);

  // Append in batches
  const BATCH_SIZE = 50;
  let pushed = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    console.log(
      `Pushing rows ${i + 1}-${i + batch.length} of ${rows.length}...`
    );
    await appendRows(token, "Blog", batch);
    pushed += batch.length;
  }

  console.log(`\nDone! Pushed ${pushed} blog posts to Google Sheets.`);
}

main().catch(console.error);
