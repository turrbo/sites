#!/usr/bin/env node
/**
 * Generate the 5 missing SEO article types for all 90 expansion cities.
 *
 * Original 10 cities have 10 article types. Expansion 90 cities only have 5.
 * This script generates the missing 5 types:
 *   1. Garage Door Opener Repair
 *   2. Garage Door Maintenance
 *   3. Garage Door Insulation
 *   4. Garage Door Safety Tips
 *   5. Commercial Garage Door Repair
 *
 * Outputs: data/new-seo-articles.json
 * Then appends to Google Sheets "SEO Pages" tab.
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

// Load env from .env.local (same pattern as push-to-sheets.js)
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
  // .env.local not found; will use --generate-only mode
}

const SPREADSHEET_ID = env.GOOGLE_SHEET_ID || process.env.GOOGLE_SHEET_ID;
const SERVICE_ACCOUNT_EMAIL = env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = (env.GOOGLE_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

const GENERATE_ONLY = process.argv.includes("--generate-only");

if (!GENERATE_ONLY && (!SPREADSHEET_ID || !SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY)) {
  console.error("Missing env vars. Use --generate-only to just create JSON, or set up .env.local");
  process.exit(1);
}

// Original 10 cities (already have all 10 article types)
const ORIGINAL_CITIES = [
  "New York,NY", "Los Angeles,CA", "Chicago,IL", "Houston,TX",
  "Phoenix,AZ", "Philadelphia,PA", "San Antonio,TX", "San Diego,CA",
  "Dallas,TX", "Austin,TX"
];

// Top 100 US cities
const TOP_100_CITIES = [
  { city: "New York", state: "NY", stateFull: "New York" },
  { city: "Los Angeles", state: "CA", stateFull: "California" },
  { city: "Chicago", state: "IL", stateFull: "Illinois" },
  { city: "Houston", state: "TX", stateFull: "Texas" },
  { city: "Phoenix", state: "AZ", stateFull: "Arizona" },
  { city: "Philadelphia", state: "PA", stateFull: "Pennsylvania" },
  { city: "San Antonio", state: "TX", stateFull: "Texas" },
  { city: "San Diego", state: "CA", stateFull: "California" },
  { city: "Dallas", state: "TX", stateFull: "Texas" },
  { city: "Austin", state: "TX", stateFull: "Texas" },
  { city: "Jacksonville", state: "FL", stateFull: "Florida" },
  { city: "Fort Worth", state: "TX", stateFull: "Texas" },
  { city: "Columbus", state: "OH", stateFull: "Ohio" },
  { city: "Charlotte", state: "NC", stateFull: "North Carolina" },
  { city: "Indianapolis", state: "IN", stateFull: "Indiana" },
  { city: "San Francisco", state: "CA", stateFull: "California" },
  { city: "Seattle", state: "WA", stateFull: "Washington" },
  { city: "Denver", state: "CO", stateFull: "Colorado" },
  { city: "Washington", state: "DC", stateFull: "District of Columbia" },
  { city: "Nashville", state: "TN", stateFull: "Tennessee" },
  { city: "Oklahoma City", state: "OK", stateFull: "Oklahoma" },
  { city: "El Paso", state: "TX", stateFull: "Texas" },
  { city: "Boston", state: "MA", stateFull: "Massachusetts" },
  { city: "Portland", state: "OR", stateFull: "Oregon" },
  { city: "Las Vegas", state: "NV", stateFull: "Nevada" },
  { city: "Memphis", state: "TN", stateFull: "Tennessee" },
  { city: "Louisville", state: "KY", stateFull: "Kentucky" },
  { city: "Baltimore", state: "MD", stateFull: "Maryland" },
  { city: "Milwaukee", state: "WI", stateFull: "Wisconsin" },
  { city: "Albuquerque", state: "NM", stateFull: "New Mexico" },
  { city: "Tucson", state: "AZ", stateFull: "Arizona" },
  { city: "Fresno", state: "CA", stateFull: "California" },
  { city: "Sacramento", state: "CA", stateFull: "California" },
  { city: "Mesa", state: "AZ", stateFull: "Arizona" },
  { city: "Kansas City", state: "MO", stateFull: "Missouri" },
  { city: "Atlanta", state: "GA", stateFull: "Georgia" },
  { city: "Omaha", state: "NE", stateFull: "Nebraska" },
  { city: "Colorado Springs", state: "CO", stateFull: "Colorado" },
  { city: "Raleigh", state: "NC", stateFull: "North Carolina" },
  { city: "Long Beach", state: "CA", stateFull: "California" },
  { city: "Virginia Beach", state: "VA", stateFull: "Virginia" },
  { city: "Miami", state: "FL", stateFull: "Florida" },
  { city: "Oakland", state: "CA", stateFull: "California" },
  { city: "Minneapolis", state: "MN", stateFull: "Minnesota" },
  { city: "Tampa", state: "FL", stateFull: "Florida" },
  { city: "Tulsa", state: "OK", stateFull: "Oklahoma" },
  { city: "Arlington", state: "TX", stateFull: "Texas" },
  { city: "New Orleans", state: "LA", stateFull: "Louisiana" },
  { city: "Wichita", state: "KS", stateFull: "Kansas" },
  { city: "Cleveland", state: "OH", stateFull: "Ohio" },
  { city: "Bakersfield", state: "CA", stateFull: "California" },
  { city: "Aurora", state: "CO", stateFull: "Colorado" },
  { city: "Anaheim", state: "CA", stateFull: "California" },
  { city: "Honolulu", state: "HI", stateFull: "Hawaii" },
  { city: "Santa Ana", state: "CA", stateFull: "California" },
  { city: "Riverside", state: "CA", stateFull: "California" },
  { city: "Corpus Christi", state: "TX", stateFull: "Texas" },
  { city: "Lexington", state: "KY", stateFull: "Kentucky" },
  { city: "Henderson", state: "NV", stateFull: "Nevada" },
  { city: "Stockton", state: "CA", stateFull: "California" },
  { city: "Saint Paul", state: "MN", stateFull: "Minnesota" },
  { city: "Cincinnati", state: "OH", stateFull: "Ohio" },
  { city: "St. Louis", state: "MO", stateFull: "Missouri" },
  { city: "Pittsburgh", state: "PA", stateFull: "Pennsylvania" },
  { city: "Greensboro", state: "NC", stateFull: "North Carolina" },
  { city: "Lincoln", state: "NE", stateFull: "Nebraska" },
  { city: "Orlando", state: "FL", stateFull: "Florida" },
  { city: "Irvine", state: "CA", stateFull: "California" },
  { city: "Newark", state: "NJ", stateFull: "New Jersey" },
  { city: "Durham", state: "NC", stateFull: "North Carolina" },
  { city: "Chula Vista", state: "CA", stateFull: "California" },
  { city: "Toledo", state: "OH", stateFull: "Ohio" },
  { city: "Fort Wayne", state: "IN", stateFull: "Indiana" },
  { city: "St. Petersburg", state: "FL", stateFull: "Florida" },
  { city: "Laredo", state: "TX", stateFull: "Texas" },
  { city: "Jersey City", state: "NJ", stateFull: "New Jersey" },
  { city: "Chandler", state: "AZ", stateFull: "Arizona" },
  { city: "Madison", state: "WI", stateFull: "Wisconsin" },
  { city: "Lubbock", state: "TX", stateFull: "Texas" },
  { city: "Scottsdale", state: "AZ", stateFull: "Arizona" },
  { city: "Reno", state: "NV", stateFull: "Nevada" },
  { city: "Buffalo", state: "NY", stateFull: "New York" },
  { city: "Gilbert", state: "AZ", stateFull: "Arizona" },
  { city: "Glendale", state: "AZ", stateFull: "Arizona" },
  { city: "North Las Vegas", state: "NV", stateFull: "Nevada" },
  { city: "Winston-Salem", state: "NC", stateFull: "North Carolina" },
  { city: "Chesapeake", state: "VA", stateFull: "Virginia" },
  { city: "Norfolk", state: "VA", stateFull: "Virginia" },
  { city: "Fremont", state: "CA", stateFull: "California" },
  { city: "Garland", state: "TX", stateFull: "Texas" },
  { city: "Irving", state: "TX", stateFull: "Texas" },
  { city: "Hialeah", state: "FL", stateFull: "Florida" },
  { city: "Richmond", state: "VA", stateFull: "Virginia" },
  { city: "Boise", state: "ID", stateFull: "Idaho" },
  { city: "Spokane", state: "WA", stateFull: "Washington" },
  { city: "Baton Rouge", state: "LA", stateFull: "Louisiana" },
  { city: "Tacoma", state: "WA", stateFull: "Washington" },
  { city: "San Bernardino", state: "CA", stateFull: "California" },
  { city: "Modesto", state: "CA", stateFull: "California" },
  { city: "Des Moines", state: "IA", stateFull: "Iowa" },
];

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// --- 5 Missing Article Templates ---

const MISSING_TEMPLATES = [
  {
    titleTemplate: (city, state) => `Garage Door Opener Repair in ${city}, ${state}: Troubleshooting & Costs`,
    slugTemplate: (city, state) => `garage-door-opener-repair-${slugify(city)}-${state.toLowerCase()}`,
    type: "guide",
    generate: (city, state, stateFull) => ({
      content: `<h2>Garage Door Opener Repair in ${city}, ${stateFull}</h2>
<p>A malfunctioning garage door opener is one of the most frustrating problems for ${city} homeowners. Whether your opener won't respond to the remote, makes grinding noises, or reverses unexpectedly, this guide covers troubleshooting steps and repair costs specific to the ${city} area.</p>

<h3>Common Garage Door Opener Problems</h3>
<ul>
<li><strong>Remote not working:</strong> Check batteries first, then reprogram the remote. If multiple remotes fail, the opener's receiver may need replacement ($50-$100)</li>
<li><strong>Opener runs but door doesn't move:</strong> Usually a broken gear or stripped drive gear. Repair cost: $100-$200 for parts and labor</li>
<li><strong>Door reverses before closing:</strong> Check photo-eye sensor alignment and clean the lenses. Sensor replacement: $50-$85</li>
<li><strong>Grinding or scraping sounds:</strong> Worn gears, lack of lubrication, or misaligned chain/belt. Service call: $85-$150</li>
<li><strong>Opener doesn't respond at all:</strong> Check power source, circuit breaker, and wall switch. Motor replacement: $150-$300</li>
<li><strong>Door opens or closes partially:</strong> Likely a limit switch issue. Adjustment is usually included in a service call</li>
</ul>

<h3>Types of Garage Door Openers</h3>
<p>${city} homes commonly use these opener types:</p>
<ul>
<li><strong>Chain drive:</strong> Most affordable ($150-$300). Reliable but noisy. Good for detached garages</li>
<li><strong>Belt drive:</strong> Quieter operation ($200-$400). Ideal for attached garages in ${city} neighborhoods</li>
<li><strong>Screw drive:</strong> Low maintenance ($180-$350). Works well in ${stateFull}'s climate with fewer moving parts</li>
<li><strong>Direct drive:</strong> Quietest option ($250-$500). Only one moving part means fewer repairs</li>
<li><strong>Smart/Wi-Fi openers:</strong> Remote monitoring and control ($250-$500). Popular with tech-savvy ${city} homeowners</li>
</ul>

<h3>Opener Repair Costs in ${city}</h3>
<ul>
<li><strong>Diagnostic service call:</strong> $50-$85</li>
<li><strong>Gear replacement:</strong> $100-$200</li>
<li><strong>Circuit board replacement:</strong> $100-$250</li>
<li><strong>Motor replacement:</strong> $150-$300</li>
<li><strong>Full opener replacement:</strong> $250-$550 installed</li>
<li><strong>Smart opener upgrade:</strong> $300-$600 installed</li>
</ul>

<h3>DIY Troubleshooting Before Calling a Pro</h3>
<ul>
<li>Replace remote batteries and try again</li>
<li>Check that the opener is plugged in and the circuit breaker hasn't tripped</li>
<li>Look for obstructions blocking the photo-eye sensors</li>
<li>Try the wall-mounted button to rule out remote issues</li>
<li>Check if the door opens manually (disconnect the opener with the emergency release)</li>
</ul>

<h3>When to Replace vs. Repair Your Opener</h3>
<p>If your garage door opener in ${city} is more than 15 years old, needs frequent repairs, or lacks modern safety features (auto-reverse, rolling code technology), replacement is often more cost-effective than continued repairs. New openers also offer smart home integration, battery backup, and quieter operation.</p>`,
      metaTitle: `Garage Door Opener Repair ${city}, ${state} | Troubleshooting & Costs`,
      metaDescription: `Garage door opener not working in ${city}, ${stateFull}? Troubleshooting guide, repair costs, and when to replace. Find local opener repair pros.`,
    }),
  },
  {
    titleTemplate: (city, state) => `Garage Door Maintenance Guide for ${city}, ${state} Homeowners`,
    slugTemplate: (city, state) => `garage-door-maintenance-${slugify(city)}-${state.toLowerCase()}`,
    type: "guide",
    generate: (city, state, stateFull) => ({
      content: `<h2>Garage Door Maintenance for ${city}, ${stateFull} Homeowners</h2>
<p>Regular maintenance is the best way to prevent costly garage door repairs and extend the life of your door. For ${city} homeowners, seasonal maintenance is especially important given ${stateFull}'s weather conditions. Follow this guide to keep your garage door running smoothly year-round.</p>

<h3>Monthly Maintenance Checklist</h3>
<ul>
<li><strong>Visual inspection:</strong> Look at springs, cables, rollers, and pulleys for signs of wear</li>
<li><strong>Listen for unusual sounds:</strong> Grinding, scraping, or rattling indicates a problem</li>
<li><strong>Test the balance:</strong> Disconnect the opener and lift the door manually to halfway. A balanced door stays in place; an unbalanced door falls or rises</li>
<li><strong>Test auto-reverse:</strong> Place a 2x4 flat on the ground under the door. The door should reverse when it touches the board</li>
<li><strong>Test photo-eye sensors:</strong> Wave an object in front of the sensors while the door is closing. It should reverse immediately</li>
</ul>

<h3>Seasonal Maintenance Tasks</h3>
<ul>
<li><strong>Lubricate moving parts:</strong> Apply white lithium grease or silicone-based lubricant to rollers, hinges, tracks, and springs every 3-6 months. Never use WD-40 on garage door parts</li>
<li><strong>Tighten hardware:</strong> The average garage door moves up and down over 1,000 times per year. Check and tighten all bolts and brackets</li>
<li><strong>Inspect and replace weather stripping:</strong> Check the rubber seal at the bottom of the door and along the sides. Replace if cracked or worn</li>
<li><strong>Clean and align tracks:</strong> Wipe down tracks with a damp cloth. Use a level to check alignment</li>
<li><strong>Check cables:</strong> Look for fraying or damage. Never attempt to adjust cables yourself as they're under high tension</li>
<li><strong>Wash the door:</strong> Clean with mild detergent and water. For wood doors, check for peeling paint or water damage</li>
</ul>

<h3>Seasonal Tips for ${stateFull}</h3>
<p>${city} homeowners should pay extra attention to:</p>
<ul>
<li>Weather seals before extreme temperature seasons</li>
<li>Lubrication during dry periods to prevent metal-on-metal wear</li>
<li>Spring tension checks as temperature changes affect spring performance</li>
<li>Exterior paint and finish on wood doors to prevent weather damage</li>
</ul>

<h3>Professional Maintenance Service</h3>
<p>An annual professional tune-up in ${city} typically costs <strong>$75-$150</strong> and includes:</p>
<ul>
<li>Complete inspection of all components</li>
<li>Lubrication of all moving parts</li>
<li>Spring tension adjustment</li>
<li>Track alignment check</li>
<li>Opener safety testing</li>
<li>Hardware tightening</li>
</ul>

<h3>Cost Savings from Regular Maintenance</h3>
<p>Investing $75-$150 per year in preventive maintenance can save ${city} homeowners hundreds or thousands in emergency repairs. A well-maintained garage door lasts 20-30 years, while a neglected door may need replacement in 10-15 years.</p>`,
      metaTitle: `Garage Door Maintenance ${city}, ${state} | Complete Guide`,
      metaDescription: `Essential garage door maintenance guide for ${city}, ${stateFull} homeowners. Seasonal checklists, DIY tips, and professional tune-up costs.`,
    }),
  },
  {
    titleTemplate: (city, state) => `Garage Door Insulation in ${city}, ${state}: Benefits, Types & Costs`,
    slugTemplate: (city, state) => `garage-door-insulation-${slugify(city)}-${state.toLowerCase()}`,
    type: "guide",
    generate: (city, state, stateFull) => ({
      content: `<h2>Garage Door Insulation in ${city}, ${stateFull}</h2>
<p>An insulated garage door can make a significant difference in your ${city} home's energy efficiency, comfort, and noise levels. Whether you're upgrading an existing door or choosing insulation for a new installation, this guide covers everything ${city} homeowners need to know.</p>

<h3>Why Insulate Your Garage Door?</h3>
<ul>
<li><strong>Energy savings:</strong> An insulated garage door can reduce energy loss through the garage by up to 70%, lowering heating and cooling costs in ${city}</li>
<li><strong>Temperature regulation:</strong> Keep your garage 10-20 degrees warmer in winter and cooler in summer, important for ${stateFull}'s climate</li>
<li><strong>Noise reduction:</strong> Insulated doors are significantly quieter, both from outside noise and door operation</li>
<li><strong>Durability:</strong> Insulated doors are typically stronger and more dent-resistant than single-layer doors</li>
<li><strong>Home value:</strong> An insulated garage door increases your ${city} home's curb appeal and resale value</li>
</ul>

<h3>Types of Garage Door Insulation</h3>
<ul>
<li><strong>Polystyrene (EPS):</strong> Rigid foam panels inserted into the door. R-value: 3.5-5.0. Cost-effective option for ${city} homeowners. DIY-friendly</li>
<li><strong>Polyurethane foam:</strong> Sprayed or injected to fill the entire door panel. R-value: 6.5-19.0. Better insulation and structural rigidity. Professional installation recommended</li>
<li><strong>Reflective foil:</strong> Reflective barrier that deflects radiant heat. Best for hot ${stateFull} summers. R-value varies. Easy DIY installation</li>
<li><strong>Fiberglass batts:</strong> Traditional insulation fitted into door panels. R-value: 3.0-4.0. Affordable but less effective than foam options</li>
</ul>

<h3>R-Value Guide for ${city}</h3>
<p>The R-value measures insulation effectiveness. For ${city}, ${stateFull}:</p>
<ul>
<li><strong>Attached garage:</strong> R-12 to R-18 recommended for maximum energy savings</li>
<li><strong>Detached garage:</strong> R-6 to R-12 is usually sufficient</li>
<li><strong>Workshop or living space above garage:</strong> R-16 to R-18 for comfort</li>
</ul>

<h3>Insulation Costs in ${city}</h3>
<ul>
<li><strong>DIY insulation kit:</strong> $50-$150 per door</li>
<li><strong>Professional polystyrene installation:</strong> $200-$400 per door</li>
<li><strong>Professional polyurethane installation:</strong> $300-$600 per door</li>
<li><strong>New insulated garage door:</strong> $800-$3,500 installed (includes door and insulation)</li>
</ul>

<h3>DIY vs. Professional Installation</h3>
<p>Polystyrene panels and reflective foil kits are suitable for DIY installation by handy ${city} homeowners. Polyurethane foam injection requires professional equipment and expertise. If your door is older than 15 years, consider replacing it with a new insulated door rather than retrofitting insulation.</p>

<h3>Energy Savings Potential</h3>
<p>Insulating your garage door in ${city} can save <strong>$100-$200 per year</strong> on heating and cooling costs, depending on your garage's size and how often the door opens. The investment typically pays for itself within 1-3 years.</p>`,
      metaTitle: `Garage Door Insulation ${city}, ${state} | Types, Costs & R-Values`,
      metaDescription: `Should you insulate your garage door in ${city}, ${stateFull}? Compare insulation types, R-values, costs, and energy savings for your home.`,
    }),
  },
  {
    titleTemplate: (city, state) => `Garage Door Safety Tips for ${city}, ${state} Homeowners`,
    slugTemplate: (city, state) => `garage-door-safety-tips-${slugify(city)}-${state.toLowerCase()}`,
    type: "guide",
    generate: (city, state, stateFull) => ({
      content: `<h2>Garage Door Safety Tips for ${city}, ${stateFull} Homeowners</h2>
<p>Your garage door is the largest moving object in your ${city} home, weighing between 150 and 400+ pounds. It operates under high spring tension and moves multiple times daily. Following these safety guidelines protects your family and prevents accidents.</p>

<h3>Essential Monthly Safety Checks</h3>
<ul>
<li><strong>Test the auto-reverse feature:</strong> Place a 2x4 board flat on the ground in the door's path and press close. The door must reverse within 2 seconds of touching the board. If it doesn't, the opener needs immediate service</li>
<li><strong>Test photo-eye sensors:</strong> While the door is closing, wave an object (like a broomstick) through the sensor beam about 6 inches off the ground. The door should reverse immediately</li>
<li><strong>Visual spring inspection:</strong> Look at the torsion springs above the door for rust, gaps, or elongation. Never touch or attempt to adjust springs</li>
<li><strong>Check cables visually:</strong> Look for fraying, rust, or loose strands. Damaged cables should be replaced by a professional</li>
<li><strong>Test manual operation:</strong> Pull the emergency release cord and lift the door manually. It should lift smoothly and stay in place at any height</li>
</ul>

<h3>Safety Rules Every ${city} Family Should Follow</h3>
<ul>
<li><strong>Never walk under a moving door:</strong> Wait until the door is fully open or closed before passing through</li>
<li><strong>Keep remotes away from children:</strong> Treat garage door remotes like car keys. Store them out of reach</li>
<li><strong>Don't let children play near the door:</strong> The gap between door sections can pinch fingers as the door moves</li>
<li><strong>Never attempt spring repair yourself:</strong> Garage door springs are under extreme tension and can cause severe injury or death. Always hire a licensed ${city} professional</li>
<li><strong>Know the emergency release:</strong> Teach all family members how to use the red emergency release cord to manually operate the door during power outages</li>
<li><strong>Secure the door when away:</strong> Use the manual lock or disconnect when traveling to prevent break-ins</li>
</ul>

<h3>Child Safety</h3>
<p>The U.S. Consumer Product Safety Commission reports that garage doors cause thousands of injuries annually. ${city} parents should:</p>
<ul>
<li>Install the wall-mounted button at least 5 feet high, out of children's reach</li>
<li>Explain to children that the garage door is not a toy</li>
<li>Never let children race under a closing door</li>
<li>Ensure the auto-reverse and photo-eye sensors are functioning at all times</li>
</ul>

<h3>Security Tips for ${city} Homeowners</h3>
<ul>
<li>Use a rolling code opener to prevent code-grabbing theft</li>
<li>Don't leave the garage door open when you're not in the garage</li>
<li>Install a smart opener with alerts for when the door opens or closes</li>
<li>Use the vacation lock feature when traveling</li>
<li>Ensure the door between the garage and house has a deadbolt</li>
</ul>

<h3>When to Call a Professional</h3>
<p>If any safety test fails, contact a licensed garage door professional in ${city} immediately. A standard safety inspection and tune-up costs <strong>$75-$150</strong> and can prevent costly repairs and dangerous situations.</p>`,
      metaTitle: `Garage Door Safety Tips ${city}, ${state} | Protect Your Family`,
      metaDescription: `Essential garage door safety tips for ${city}, ${stateFull} homeowners. Monthly checks, child safety, security tips, and when to call a pro.`,
    }),
  },
  {
    titleTemplate: (city, state) => `Commercial Garage Door Repair in ${city}, ${state}: Services & Costs`,
    slugTemplate: (city, state) => `commercial-garage-door-repair-${slugify(city)}-${state.toLowerCase()}`,
    type: "guide",
    generate: (city, state, stateFull) => ({
      content: `<h2>Commercial Garage Door Repair in ${city}, ${stateFull}</h2>
<p>Commercial garage doors in ${city} take a beating from heavy daily use, weather exposure, and the demands of business operations. Whether you operate a warehouse, auto shop, fire station, or retail loading dock, keeping your commercial doors in top condition is critical for safety, security, and productivity.</p>

<h3>Types of Commercial Garage Doors in ${city}</h3>
<ul>
<li><strong>Sectional steel doors:</strong> Most common for warehouses and loading docks. Durable and insulated options available</li>
<li><strong>Rolling steel doors:</strong> Space-efficient, ideal for ${city} storefronts and storage facilities. Coil up above the opening</li>
<li><strong>Fire-rated doors:</strong> Required by ${stateFull} fire code for certain commercial buildings. Self-closing with fusible links</li>
<li><strong>High-speed doors:</strong> For busy ${city} warehouses and manufacturing. Open and close rapidly to maintain temperature and workflow</li>
<li><strong>Dock levelers and seals:</strong> Essential for loading dock operations. Keep weather out and maintain energy efficiency</li>
<li><strong>Security grilles:</strong> For ${city} retail storefronts and restaurants. Allow visibility while providing security</li>
</ul>

<h3>Common Commercial Door Problems</h3>
<ul>
<li><strong>Spring failure:</strong> Commercial springs handle thousands of cycles per month. Failure means the door is inoperable</li>
<li><strong>Track damage:</strong> Forklift strikes and heavy use can bend or damage tracks</li>
<li><strong>Panel damage:</strong> Impact from vehicles, equipment, or weather</li>
<li><strong>Motor/operator failure:</strong> Commercial operators run far more than residential ones and wear out faster</li>
<li><strong>Safety sensor issues:</strong> Critical for ${stateFull} code compliance. Malfunctioning sensors are a liability</li>
<li><strong>Weather seal deterioration:</strong> Important for climate control and pest prevention in ${city}</li>
</ul>

<h3>Commercial Repair Costs in ${city}</h3>
<ul>
<li><strong>Commercial spring replacement:</strong> $300-$800 per spring (heavier than residential)</li>
<li><strong>Panel replacement:</strong> $400-$1,500 per panel depending on size and type</li>
<li><strong>Track repair or replacement:</strong> $200-$500</li>
<li><strong>Operator/motor replacement:</strong> $500-$2,000 depending on horsepower and type</li>
<li><strong>Full commercial door replacement:</strong> $2,000-$10,000+ depending on size and specifications</li>
<li><strong>Emergency service:</strong> Add $100-$300 for after-hours commercial repairs</li>
</ul>

<h3>Preventive Maintenance Programs</h3>
<p>Most ${city} commercial garage door companies offer annual maintenance contracts that include:</p>
<ul>
<li>Quarterly or semi-annual inspections</li>
<li>Lubrication of all moving components</li>
<li>Spring tension and balance adjustment</li>
<li>Safety system testing and certification</li>
<li>Priority emergency service</li>
<li>Discounted repair rates</li>
</ul>
<p>Annual commercial maintenance contracts in ${city} typically cost <strong>$200-$500 per door</strong>, depending on door type and frequency of service.</p>

<h3>Compliance and Safety Requirements</h3>
<p>${city} businesses must ensure their commercial garage doors comply with:</p>
<ul>
<li>${stateFull} building codes and fire regulations</li>
<li>OSHA workplace safety standards</li>
<li>UL 325 safety standards for commercial door operators</li>
<li>ADA accessibility requirements where applicable</li>
<li>Local ${city} permit requirements for new installations or major modifications</li>
</ul>

<h3>Finding Commercial Door Specialists in ${city}</h3>
<p>Commercial garage door repair requires different expertise than residential work. Look for ${city} companies that specifically serve commercial clients, carry adequate commercial insurance, and can provide references from other local businesses.</p>`,
      metaTitle: `Commercial Garage Door Repair ${city}, ${state} | Services & Costs`,
      metaDescription: `Commercial garage door repair in ${city}, ${stateFull}. Services for warehouses, loading docks, storefronts. Emergency service, maintenance contracts, and pricing.`,
    }),
  },
];

// --- Google Sheets Auth ---

function base64url(input) {
  return Buffer.from(input).toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function createJWT() {
  const crypto = require("crypto");
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify({
    iss: SERVICE_ACCOUNT_EMAIL,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const signingInput = `${header}.${payload}`;
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(signingInput);
  const signature = sign.sign(PRIVATE_KEY, "base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
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
  if (!res.ok) throw new Error(`Auth error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.access_token;
}

// --- Sheets Operations ---

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
  // Filter to expansion cities only
  const expansionCities = TOP_100_CITIES.filter(
    c => !ORIGINAL_CITIES.includes(`${c.city},${c.state}`)
  );

  console.log(`Generating 5 missing article types for ${expansionCities.length} expansion cities...`);
  console.log(`Total articles to create: ${expansionCities.length * MISSING_TEMPLATES.length}`);

  const allArticles = [];

  for (const { city, state, stateFull } of expansionCities) {
    for (const template of MISSING_TEMPLATES) {
      const title = template.titleTemplate(city, state);
      const slug = template.slugTemplate(city, state);
      const generated = template.generate(city, state, stateFull);

      allArticles.push({
        Title: title,
        Slug: slug,
        Type: template.type,
        Content: generated.content,
        Category: "Garage Door Repair",
        City: city,
        State: state,
        "Meta Title": generated.metaTitle,
        "Meta Description": generated.metaDescription,
        Published: "TRUE",
      });
    }
  }

  console.log(`Generated ${allArticles.length} articles.`);

  // Save to JSON
  const outDir = path.join(__dirname, "..", "data");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "new-seo-articles.json"),
    JSON.stringify(allArticles, null, 2)
  );
  console.log(`Saved to data/new-seo-articles.json`);

  if (GENERATE_ONLY) {
    console.log("\n--generate-only mode. Skipping Google Sheets push.");
    console.log("Run without --generate-only to push to Sheets.");
    return;
  }

  // Push to Google Sheets
  console.log("\nAuthenticating with Google Sheets...");
  const token = await getAccessToken();
  console.log("Authenticated.");

  // Convert articles to rows (same column order as SEO Pages sheet)
  // Columns: Title, Slug, Type, Content, Category, City, State, Meta Title, Meta Description, Published
  const rows = allArticles.map(a => [
    a.Title, a.Slug, a.Type, a.Content, a.Category,
    a.City, a.State, a["Meta Title"], a["Meta Description"], a.Published,
  ]);

  // Append in batches of 50 to avoid request size limits
  const BATCH_SIZE = 50;
  let pushed = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    console.log(`Pushing rows ${i + 1}-${i + batch.length} of ${rows.length}...`);
    await appendRows(token, "SEO Pages", batch);
    pushed += batch.length;
  }

  console.log(`\nDone! Pushed ${pushed} new articles to Google Sheets.`);
  console.log(`Total SEO Pages should now be: ~${550 + pushed} (was 550)`);
}

main().catch(console.error);
