#!/usr/bin/env node
/**
 * Expand directory to top 100 US cities.
 * - Fetches garage door repair listings via Google Places API (New) directly
 * - Generates SEO guide articles for each new city
 * - Outputs: new-listings.json, new-seo-pages.json
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!API_KEY) {
  console.error("GOOGLE_PLACES_API_KEY is required");
  process.exit(1);
}

// Top 100 US cities by population
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

const EXISTING_CITIES = [
  "New York,NY", "Los Angeles,CA", "Chicago,IL", "Houston,TX",
  "Phoenix,AZ", "Philadelphia,PA", "San Antonio,TX", "San Diego,CA",
  "Dallas,TX", "Austin,TX"
];

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function fetchJSON(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || "POST",
      headers: options.headers || {},
    };

    const req = https.request(reqOptions, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Parse error: ${data.slice(0, 200)}`));
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error("timeout")); });
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function searchPlaces(city, state) {
  try {
    const body = JSON.stringify({
      textQuery: `garage door repair in ${city}, ${state}`,
      maxResultCount: 8,
    });

    const result = await fetchJSON(
      `https://places.googleapis.com/v1/places:searchText`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": API_KEY,
          "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.currentOpeningHours,places.editorialSummary,places.googleMapsUri,places.location,places.addressComponents,places.shortFormattedAddress",
        },
        body,
      }
    );

    return result;
  } catch (e) {
    console.error(`  Search failed for ${city}, ${state}: ${e.message}`);
    return { places: [] };
  }
}

function formatListing(place, city, state, stateFull) {
  const name = place.displayName?.text || "";
  const addr = place.formattedAddress || place.shortFormattedAddress || "";

  let zip = "";
  if (place.addressComponents) {
    for (const c of place.addressComponents) {
      if (c.types?.includes("postal_code")) zip = c.longText || c.shortText || "";
    }
  }
  if (!zip) {
    const zipMatch = addr.match(/\b(\d{5})\b/);
    if (zipMatch) zip = zipMatch[1];
  }

  return {
    Name: name,
    Slug: slugify(`${name}-${city}-${state}`),
    Category: "Garage Door Repair",
    Description: place.editorialSummary?.text || `${name} provides professional garage door repair services in ${city}, ${stateFull}. Contact us for garage door installation, spring repair, opener replacement, and emergency service.`,
    "Short Description": (place.editorialSummary?.text || `Professional garage door repair in ${city}, ${stateFull}.`).slice(0, 150),
    Address: addr,
    City: city,
    State: state,
    "State Full": stateFull,
    Zip: zip,
    Phone: place.nationalPhoneNumber || place.internationalPhoneNumber || "",
    Website: place.websiteUri || "",
    Email: "",
    "Image URL": "",
    Rating: place.rating ? String(place.rating) : "",
    "Review Count": place.userRatingCount ? String(place.userRatingCount) : "",
    "Price Range": "",
    Amenities: "",
    Hours: place.currentOpeningHours?.weekdayDescriptions?.join("; ") || "",
    Latitude: place.location?.latitude ? String(place.location.latitude) : "",
    Longitude: place.location?.longitude ? String(place.location.longitude) : "",
    Featured: "FALSE",
    Published: "TRUE",
    Tags: "garage door repair",
    "Source URL": place.googleMapsUri || "",
  };
}

// SEO article templates
const SEO_TEMPLATES = [
  {
    titleTemplate: (city, state) => `How Much Does Garage Door Repair Cost in ${city}, ${state}? (2026 Price Guide)`,
    slugTemplate: (city, state) => `garage-door-repair-cost-${slugify(city)}-${state.toLowerCase()}`,
    type: "guide",
    generate: (city, state, stateFull) => ({
      content: `<h2>Garage Door Repair Costs in ${city}, ${stateFull}</h2>
<p>If you're a homeowner in ${city}, ${stateFull} dealing with a malfunctioning garage door, understanding repair costs can help you budget effectively. Garage door repair prices in ${city} typically range from <strong>$150 to $600</strong>, depending on the type of repair needed.</p>

<h3>Common Garage Door Repair Costs in ${city}</h3>
<p>Here's what ${city} homeowners can expect to pay for common garage door repairs:</p>
<ul>
<li><strong>Spring replacement:</strong> $200 - $400 (torsion springs) or $150 - $250 (extension springs)</li>
<li><strong>Opener repair:</strong> $150 - $350</li>
<li><strong>Cable replacement:</strong> $150 - $250</li>
<li><strong>Panel replacement:</strong> $250 - $800</li>
<li><strong>Track repair/alignment:</strong> $125 - $250</li>
<li><strong>Roller replacement:</strong> $100 - $200</li>
<li><strong>Sensor repair:</strong> $100 - $175</li>
</ul>

<h3>Factors That Affect Pricing in ${city}</h3>
<p>Several factors influence garage door repair costs in the ${city} area:</p>
<ul>
<li><strong>Labor rates:</strong> ${city} labor costs may differ from national averages based on local cost of living</li>
<li><strong>Door type:</strong> Steel, wood, aluminum, and fiberglass doors each have different repair costs</li>
<li><strong>Emergency service:</strong> After-hours or weekend repairs in ${city} typically cost 25-50% more</li>
<li><strong>Parts availability:</strong> Common parts are usually stocked locally; specialty parts may need ordering</li>
<li><strong>Door size:</strong> Double-car garage doors generally cost more to repair than single-car doors</li>
</ul>

<h3>How to Save Money on Garage Door Repair in ${city}</h3>
<ul>
<li>Get multiple quotes from ${city}-area garage door companies</li>
<li>Schedule repairs during regular business hours to avoid emergency fees</li>
<li>Ask about warranties on parts and labor</li>
<li>Consider annual maintenance plans to prevent costly emergency repairs</li>
<li>Check if your homeowner's insurance covers the repair</li>
</ul>

<h3>When to Repair vs. Replace Your Garage Door</h3>
<p>If your garage door in ${city} needs frequent repairs or is more than 15-20 years old, replacement may be more cost-effective. A new garage door installation in ${city} typically costs between $800 and $4,000, depending on materials and features. Modern insulated garage doors can also help with ${stateFull}'s climate, reducing energy costs.</p>`,
      metaTitle: `Garage Door Repair Cost in ${city}, ${state} (2026) | Price Guide`,
      metaDescription: `How much does garage door repair cost in ${city}, ${stateFull}? Complete 2026 pricing guide for spring replacement, opener repair, and more. Get quotes from local pros.`,
    }),
  },
  {
    titleTemplate: (city, state) => `Best Garage Door Repair Companies in ${city}, ${state} (2026)`,
    slugTemplate: (city, state) => `best-garage-door-repair-${slugify(city)}-${state.toLowerCase()}`,
    type: "guide",
    generate: (city, state, stateFull) => ({
      content: `<h2>Finding the Best Garage Door Repair in ${city}, ${stateFull}</h2>
<p>Choosing the right garage door repair company in ${city} can be the difference between a quick, affordable fix and a costly headache. This guide will help you find trusted, reliable garage door professionals in the ${city} area.</p>

<h3>What to Look for in a ${city} Garage Door Repair Company</h3>
<ul>
<li><strong>Licensing and insurance:</strong> Verify the company is licensed to operate in ${stateFull} and carries liability insurance</li>
<li><strong>Experience:</strong> Look for companies with at least 5 years of experience serving ${city} homeowners</li>
<li><strong>Reviews and ratings:</strong> Check Google reviews, BBB ratings, and ask for local references</li>
<li><strong>Warranty:</strong> Reputable companies offer warranties on both parts and labor</li>
<li><strong>Response time:</strong> For emergencies, choose a company that offers same-day service in ${city}</li>
<li><strong>Transparent pricing:</strong> Get a written estimate before work begins</li>
</ul>

<h3>Questions to Ask Before Hiring</h3>
<ul>
<li>Are you licensed and insured in ${stateFull}?</li>
<li>Do you offer free estimates for ${city}-area customers?</li>
<li>What warranty do you provide on parts and labor?</li>
<li>How long have you been serving the ${city} area?</li>
<li>Do you offer emergency or after-hours service?</li>
<li>Can you provide references from ${city} customers?</li>
</ul>

<h3>Red Flags to Watch Out For</h3>
<ul>
<li>Demanding full payment upfront before starting work</li>
<li>No written estimates or contracts</li>
<li>Pressure to replace the entire door when only a repair is needed</li>
<li>No physical business address in or near ${city}</li>
<li>Unusually low quotes that seem too good to be true</li>
</ul>

<h3>Browse ${city} Garage Door Repair Companies</h3>
<p>Our directory features verified garage door repair companies serving ${city}, ${stateFull}. Each listing includes contact information, customer ratings, and service details to help you make an informed decision.</p>`,
      metaTitle: `Best Garage Door Repair in ${city}, ${state} (2026) | Top Companies`,
      metaDescription: `Find the best garage door repair companies in ${city}, ${stateFull}. Compare ratings, read reviews, and get quotes from trusted local professionals.`,
    }),
  },
  {
    titleTemplate: (city, state) => `Garage Door Spring Repair in ${city}, ${state}: Complete Guide`,
    slugTemplate: (city, state) => `garage-door-spring-repair-${slugify(city)}-${state.toLowerCase()}`,
    type: "guide",
    generate: (city, state, stateFull) => ({
      content: `<h2>Garage Door Spring Repair in ${city}, ${stateFull}</h2>
<p>A broken garage door spring is one of the most common and urgent garage door problems for ${city} homeowners. When a spring breaks, your garage door becomes inoperable and potentially dangerous. Here's everything you need to know about garage door spring repair in ${city}.</p>

<h3>Types of Garage Door Springs</h3>
<ul>
<li><strong>Torsion springs:</strong> Mounted above the garage door opening. Most common in modern ${city} homes. Typical lifespan: 15,000-20,000 cycles (7-12 years)</li>
<li><strong>Extension springs:</strong> Mounted on either side of the door track. Found in older ${city} homes. Typical lifespan: 10,000-15,000 cycles (5-9 years)</li>
</ul>

<h3>Signs Your Garage Door Spring Needs Repair</h3>
<ul>
<li>Loud bang or snapping sound from the garage</li>
<li>Garage door won't open or feels extremely heavy</li>
<li>Door opens crookedly or only partway</li>
<li>Visible gap in the torsion spring coil</li>
<li>Door slams shut quickly instead of closing slowly</li>
</ul>

<h3>Spring Repair Costs in ${city}</h3>
<ul>
<li><strong>Single torsion spring:</strong> $200 - $300 installed</li>
<li><strong>Pair of torsion springs:</strong> $250 - $400 installed</li>
<li><strong>Extension spring (each):</strong> $150 - $200 installed</li>
<li><strong>Emergency/weekend service:</strong> Add $50 - $150</li>
</ul>

<h3>Why You Should Never DIY Spring Repair</h3>
<p>Garage door springs are under extreme tension and can cause serious injury or death if handled improperly. In ${city}, always hire a licensed professional for spring replacement. The cost savings of DIY are not worth the risk.</p>

<h3>Finding Spring Repair Specialists in ${city}</h3>
<p>When searching for garage door spring repair in ${city}, ${stateFull}, look for companies that specialize in spring repair and can respond quickly. Many ${city} garage door companies offer same-day spring replacement service.</p>`,
      metaTitle: `Garage Door Spring Repair in ${city}, ${state} | Cost & Guide`,
      metaDescription: `Need garage door spring repair in ${city}, ${stateFull}? Learn about costs, types, and find trusted local spring repair specialists. Same-day service available.`,
    }),
  },
  {
    titleTemplate: (city, state) => `Emergency Garage Door Repair in ${city}, ${state}: 24/7 Services`,
    slugTemplate: (city, state) => `emergency-garage-door-repair-${slugify(city)}-${state.toLowerCase()}`,
    type: "guide",
    generate: (city, state, stateFull) => ({
      content: `<h2>Emergency Garage Door Repair in ${city}, ${stateFull}</h2>
<p>When your garage door breaks unexpectedly, you need fast, reliable service. Whether it's a broken spring at midnight or a door stuck open during a ${stateFull} storm, knowing where to find 24/7 emergency garage door repair in ${city} is essential.</p>

<h3>Common Garage Door Emergencies</h3>
<ul>
<li><strong>Broken spring:</strong> The most common emergency. Door becomes inoperable instantly</li>
<li><strong>Door stuck open:</strong> A security risk, especially overnight. Needs immediate attention</li>
<li><strong>Door off track:</strong> Can damage the door and frame if not repaired quickly</li>
<li><strong>Snapped cable:</strong> Door may hang at an angle, creating a safety hazard</li>
<li><strong>Failed opener:</strong> Can't open or close the door remotely or manually</li>
<li><strong>Storm damage:</strong> Wind, hail, or debris damage requiring immediate repair</li>
</ul>

<h3>What to Expect from Emergency Service in ${city}</h3>
<ul>
<li><strong>Response time:</strong> Most ${city} emergency services arrive within 30-60 minutes</li>
<li><strong>Pricing:</strong> Expect to pay $50-$150 more than standard rates for after-hours service</li>
<li><strong>Availability:</strong> True 24/7 service means nights, weekends, and holidays</li>
<li><strong>Temporary fixes:</strong> If parts aren't available, a technician can often secure the door temporarily</li>
</ul>

<h3>What to Do While Waiting for Emergency Repair</h3>
<ul>
<li>Do not attempt to force the door open or closed</li>
<li>If the door is stuck open, do not leave your home unattended</li>
<li>Disconnect the automatic opener by pulling the emergency release cord</li>
<li>Keep children and pets away from the garage door</li>
<li>If you suspect a broken spring, do not try to manually lift the door</li>
</ul>

<h3>Emergency Repair Costs in ${city}</h3>
<p>Emergency garage door repair in ${city} typically costs between <strong>$200 and $600</strong>, depending on the repair needed and time of service. Weekend and holiday rates may be higher. Always ask for a price estimate before authorizing emergency work.</p>`,
      metaTitle: `Emergency Garage Door Repair ${city}, ${state} | 24/7 Service`,
      metaDescription: `Need emergency garage door repair in ${city}, ${stateFull}? Find 24/7 garage door repair services near you. Fast response times and fair pricing.`,
    }),
  },
  {
    titleTemplate: (city, state) => `Garage Door Installation in ${city}, ${state}: Costs & Options`,
    slugTemplate: (city, state) => `garage-door-installation-${slugify(city)}-${state.toLowerCase()}`,
    type: "guide",
    generate: (city, state, stateFull) => ({
      content: `<h2>Garage Door Installation in ${city}, ${stateFull}</h2>
<p>Whether you're building a new home in ${city} or replacing an aging garage door, choosing the right door and installer makes all the difference. This guide covers everything ${city} homeowners need to know about garage door installation.</p>

<h3>Types of Garage Doors Available in ${city}</h3>
<ul>
<li><strong>Steel doors:</strong> Most popular choice. Durable, low maintenance, $800-$2,500 installed</li>
<li><strong>Wood doors:</strong> Classic look, higher maintenance. $1,200-$4,000 installed</li>
<li><strong>Aluminum doors:</strong> Lightweight, modern aesthetic. $1,000-$3,000 installed</li>
<li><strong>Fiberglass doors:</strong> Resistant to dents and corrosion. $1,000-$2,500 installed</li>
<li><strong>Vinyl doors:</strong> Low maintenance, dent-resistant. $900-$2,000 installed</li>
</ul>

<h3>Installation Costs in ${city}</h3>
<ul>
<li><strong>Single-car door:</strong> $800 - $2,500 (including installation)</li>
<li><strong>Double-car door:</strong> $1,200 - $4,000 (including installation)</li>
<li><strong>Custom/designer doors:</strong> $3,000 - $10,000+</li>
<li><strong>New opener included:</strong> Add $200 - $500</li>
<li><strong>Old door removal:</strong> Usually included, or $50-$100</li>
</ul>

<h3>Choosing the Right Door for ${stateFull}'s Climate</h3>
<p>The climate in ${city}, ${stateFull} should influence your garage door choice. Insulated doors (R-value of 12-18) help maintain temperature and reduce energy bills. Weather seals protect against rain, wind, and debris.</p>

<h3>The Installation Process</h3>
<ul>
<li>Professional measurement and consultation</li>
<li>Door and hardware ordering (1-3 weeks for custom orders)</li>
<li>Old door removal and disposal</li>
<li>New track and hardware installation</li>
<li>Door panel installation and balancing</li>
<li>Opener installation and programming</li>
<li>Safety testing and walkthrough</li>
</ul>

<h3>ROI of a New Garage Door</h3>
<p>A new garage door offers one of the highest returns on investment of any home improvement project. In ${city}, homeowners can expect a <strong>90-100% return</strong> on a new garage door when selling their home, making it one of the smartest upgrades you can make.</p>`,
      metaTitle: `Garage Door Installation ${city}, ${state} | Costs & Guide (2026)`,
      metaDescription: `Planning a garage door installation in ${city}, ${stateFull}? Compare door types, costs, and find top-rated installers near you. Free quotes available.`,
    }),
  },
];

async function main() {
  const newCities = TOP_100_CITIES.filter(
    c => !EXISTING_CITIES.includes(`${c.city},${c.state}`)
  );

  console.log(`Processing ${newCities.length} new cities...`);
  // Text Search: $0.032 per request (90 requests)
  console.log(`Estimated API cost: ~$${(newCities.length * 0.032).toFixed(2)} (Text Search only, no Details needed)`);

  const allListings = [];
  const allSEOPages = [];
  let searchCost = 0;
  let failedCities = [];
  let successCities = 0;

  for (let i = 0; i < newCities.length; i++) {
    const { city, state, stateFull } = newCities[i];
    console.log(`\n[${i + 1}/${newCities.length}] ${city}, ${state}...`);

    // Search with all needed fields in one request (no separate details call needed)
    const searchResult = await searchPlaces(city, state);
    searchCost += 0.032;
    const places = searchResult.places || [];
    console.log(`  Found ${places.length} places`);

    if (places.length === 0) {
      failedCities.push(`${city}, ${state}`);
    } else {
      successCities++;
    }

    // Format listings directly from search results
    const cityListings = [];
    for (const place of places.slice(0, 8)) {
      const listing = formatListing(place, city, state, stateFull);
      if (listing.Name) cityListings.push(listing);
    }

    // Set top 2 rated as featured
    cityListings.sort((a, b) => (parseFloat(b.Rating) || 0) - (parseFloat(a.Rating) || 0));
    if (cityListings.length >= 2) {
      cityListings[0].Featured = "TRUE";
      cityListings[1].Featured = "TRUE";
    } else if (cityListings.length === 1) {
      cityListings[0].Featured = "TRUE";
    }

    allListings.push(...cityListings);
    console.log(`  Added ${cityListings.length} listings (${cityListings.filter(l => l.Featured === "TRUE").length} featured)`);

    // Generate SEO pages
    for (const template of SEO_TEMPLATES) {
      const title = template.titleTemplate(city, state);
      const slug = template.slugTemplate(city, state);
      const generated = template.generate(city, state, stateFull);

      allSEOPages.push({
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
    console.log(`  Generated ${SEO_TEMPLATES.length} SEO articles`);

    // Budget check
    if (searchCost > 180) {
      console.log(`\n*** BUDGET WARNING: Approaching $200 limit. Current cost: $${searchCost.toFixed(2)} ***`);
      break;
    }

    await sleep(250); // Rate limiting between cities
  }

  console.log(`\n=== Summary ===`);
  console.log(`Cities with listings: ${successCities}`);
  console.log(`Total listings: ${allListings.length}`);
  console.log(`Total SEO pages: ${allSEOPages.length}`);
  console.log(`Total API cost: $${searchCost.toFixed(2)}`);
  if (failedCities.length > 0) {
    console.log(`Failed cities (${failedCities.length}): ${failedCities.join(", ")}`);
  }

  // Write output files
  const outDir = path.join(__dirname, "..", "data");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(
    path.join(outDir, "new-listings.json"),
    JSON.stringify(allListings, null, 2)
  );
  fs.writeFileSync(
    path.join(outDir, "new-seo-pages.json"),
    JSON.stringify(allSEOPages, null, 2)
  );

  console.log(`\nOutput written to:`);
  console.log(`  data/new-listings.json (${allListings.length} listings)`);
  console.log(`  data/new-seo-pages.json (${allSEOPages.length} articles)`);
}

main().catch(console.error);
