#!/bin/bash
SCRIPT="$HOME/.claude/skills/nano-banana-pro/scripts/generate_image.py"
OUT_DIR="/home/node/a0/workspace/35cfbcaf-2ab5-4f17-976f-c03d4f10a560/workspace/detailed-to-perfection/public/images/blog"
mkdir -p "$OUT_DIR"

generate() {
  local slug="$1"
  local prompt="$2"
  local outfile="$OUT_DIR/$slug.png"
  if [ -f "$outfile" ]; then echo "SKIP: $slug"; return; fi
  echo "Generating: $slug..."
  python3 "$SCRIPT" --prompt "$prompt" --filename "$outfile" --resolution 1K 2>&1 | tail -1
  if [ -f "$outfile" ]; then echo "  OK: $(du -h "$outfile" | cut -f1)"; else echo "  FAILED"; fi
}

generate "is-graphene-coating-worth-it-in-2026" \
  "Futuristic graphene molecular structure visualization overlaid on a sleek car surface with ceramic-like water beading, modern technology concept, dark premium aesthetic, no text"

generate "florida-window-tint-laws-what-you-need-to-know-in-2026" \
  "Car with tinted windows parked on a sunny Florida street with palm trees, showing different tint levels on front and rear windows, bright tropical lighting, no text"

generate "5-detailing-mistakes-that-ruin-your-paint" \
  "Dramatic close-up of swirl marks and scratches on car paint under harsh light, showing damage from improper washing technique, cautionary style photography, no text"

generate "diy-vs-professional-ceramic-coating-an-honest-comparison" \
  "Split scene showing DIY ceramic coating in a home garage on left vs professional application in a clean studio on right, comparison concept, no text"

generate "how-often-should-you-detail-your-car" \
  "Calendar with seasonal car detailing photos for each quarter - spring wash, summer protection, fall cleanup, winter prep, organized collage style, no text"

generate "the-rise-of-mobile-detailing-services-in-2026" \
  "Professional mobile detailing van setup in a residential driveway with portable equipment, pressure washer, and a car being detailed, modern suburban setting, no text"

generate "ppf-vs-ceramic-coating-vs-vinyl-wrap-complete-comparison" \
  "Three panels showing PPF film installation, ceramic coating liquid application, and vinyl wrap heat forming on same model car, clean comparison layout, no text"

generate "best-time-of-year-to-get-your-car-detailed" \
  "Four-season car scene showing the same vehicle in spring rain, summer sun, autumn leaves, and winter snow, seasonal transition concept, no text"

generate "electric-vehicle-detailing-what-s-different" \
  "Tesla or modern electric vehicle being carefully detailed with specialized EV-safe products, clean minimalist garage, modern technology aesthetic, no text"

generate "why-professional-detailing-is-worth-the-investment" \
  "Before and after transformation of a neglected car exterior, left side dirty and oxidized, right side showing mirror-like professional detail finish, dramatic lighting, no text"

generate "how-to-start-a-car-detailing-business-in-2026" \
  "Professional detailing workspace with organized tools, branded equipment, pricing board, and a customer car, entrepreneurial small business atmosphere, no text"

generate "the-truth-about-touchless-car-washes" \
  "Automatic touchless car wash spraying high-pressure water and chemicals on a car, industrial wash bay setting, showing chemical cleaning process, no text"

generate "ceramic-coating-myths-debunked" \
  "Dramatic image of water beading on a ceramic coated car surface alongside common myths being crossed out, myth-busting concept, premium dark aesthetic, no text"

generate "what-is-paint-correction-and-do-you-need-it" \
  "Before and after paint correction under inspection light, half the panel shows imperfections, other half shows perfect glossy correction, professional studio, no text"

generate "top-detailing-trends-to-watch-in-2026" \
  "Modern detailing studio with cutting-edge equipment, graphene products, smart tools, and eco-friendly supplies arranged in a trend showcase display, futuristic clean aesthetic, no text"

generate "how-to-protect-your-car-during-florida-summers" \
  "Car parked in intense Florida summer heat with sun protection products arranged on hood - ceramic coating, UV protectant, car cover - palm trees and beach in background, no text"

generate "the-environmental-impact-of-car-detailing-products" \
  "Eco-friendly green car detailing products with plant-based labels arranged on grass next to a clean car, environmental sustainability concept, natural bright lighting, no text"

generate "understanding-ceramic-coating-hardness-ratings-9h-explained" \
  "Scientific close-up of pencil hardness test being performed on ceramic coated surface, laboratory testing concept with hardness scale visible, technical educational style, no text"

generate "should-you-tip-your-detailer-etiquette-guide" \
  "Professional detailer shaking hands with satisfied car owner next to a freshly detailed luxury car, warm professional interaction, bright clean environment, no text"

generate "matte-paint-and-wrap-care-special-considerations" \
  "Beautiful matte finish car in stealth gray or satin black with specialized matte care products arranged in foreground, dramatic moody lighting showing the flat finish texture, no text"

echo ""
echo "=== Blog images done! ==="
ls "$OUT_DIR"/*.png 2>/dev/null | wc -l
echo " images generated"
