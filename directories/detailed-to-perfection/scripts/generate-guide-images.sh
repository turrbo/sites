#!/bin/bash
SCRIPT="$HOME/.claude/skills/nano-banana-pro/scripts/generate_image.py"
OUT_DIR="/home/node/a0/workspace/35cfbcaf-2ab5-4f17-976f-c03d4f10a560/workspace/detailed-to-perfection/public/images/guides"
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

generate "how-to-clay-bar-your-car-complete-guide" \
  "Close-up hands using a clay bar on a wet car surface with lubricant spray, showing smooth gliding technique, professional detailing tutorial style, warm natural light, no text"

generate "paint-correction-101-a-beginner-s-guide" \
  "DA polisher being used on a dark car panel with paint correction compound, showing before and after difference in paint clarity, professional garage lighting, no text"

generate "ceramic-coating-vs-ppf-which-is-right-for-you" \
  "Split comparison showing ceramic coating application on one side and PPF film installation on the other side of a car hood, clean professional studio, no text"

generate "how-to-apply-ceramic-coating-at-home" \
  "Person carefully applying ceramic coating with an applicator pad to a car panel in a clean home garage, step-by-step tutorial feel, bright lighting, no text"

generate "how-to-maintain-your-ceramic-coating" \
  "Gentle hand wash of a ceramic coated car with water beading visible on the surface, using pH-neutral soap and microfiber mitt, sunny driveway setting, no text"

generate "window-tinting-laws-by-state-2026-guide" \
  "Car side window showing different tint darkness levels with visible light meter measuring VLT percentage, professional tint shop environment, educational style, no text"

generate "how-to-choose-the-right-window-tint-shade" \
  "Row of car windows showing progressively darker tint shades from light to limo dark, professional showroom display, clean modern aesthetic, no text"

generate "how-to-polish-your-car-like-a-pro" \
  "Professional detailer using orbital polisher on a red car panel with compound pad, showing technique and proper hand position, well-lit detailing studio, no text"

generate "how-to-remove-swirl-marks-from-car-paint" \
  "Extreme close-up of car paint under LED inspection light showing swirl marks being revealed, diagnostic tutorial style, dramatic lighting contrast, no text"

generate "the-complete-car-wash-guide-two-bucket-method" \
  "Two bucket wash setup with grit guards visible, wash mitt, car shampoo bottle, and a soapy car in background, organized driveway wash station, bright daylight, no text"

generate "how-to-remove-water-spots-from-car-paint" \
  "Close-up of water spots visible on a dark car paint surface with cleaning supplies nearby, before treatment, outdoor natural lighting, no text"

generate "headlight-restoration-step-by-step-guide" \
  "Before and after headlight restoration showing one foggy yellowed headlight and one crystal clear restored headlight on same car, dramatic comparison, no text"

generate "interior-detailing-complete-step-by-step-guide" \
  "Interior of a car being detailed with brushes on dashboard vents, leather conditioner on seats, and steam cleaner nearby, professional interior detailing setup, no text"

generate "engine-bay-detailing-safe-cleaning-methods" \
  "Clean engine bay of a modern car after professional detailing, with cleaning products arranged to the side, well-lit garage, satisfying result photo, no text"

generate "understanding-paint-protection-film-complete-guide" \
  "Transparent PPF being carefully squeegeed onto a car bumper edge, showing the clear film material and precision installation process, professional shop, no text"

generate "vinyl-wrap-vs-paint-pros-cons-and-costs" \
  "Split image showing a car being vinyl wrapped in matte black on one side and being spray painted on the other, professional comparison style, no text"

generate "how-to-use-a-foam-cannon-properly" \
  "Thick snow foam covering an entire car from a foam cannon, with the foam lance and pressure washer visible, satisfying coverage, outdoor wash setting, no text"

generate "how-to-use-a-da-polisher-for-beginners" \
  "Beginner-friendly view of hands holding a DA polisher at proper angle on a car panel, with polishing pad and compound visible, tutorial instructional style, no text"

generate "paint-decontamination-iron-tar-and-overspray-removal" \
  "Iron remover spray turning purple and bleeding on a white car panel surface, showing chemical reaction dissolving contaminants, dramatic close-up, no text"

generate "how-to-protect-your-car-from-sun-damage" \
  "Luxury car parked under intense sun with visible UV rays, alongside a car cover, ceramic coating bottle, and PPF sample, protective measures concept, no text"

generate "convertible-top-care-and-cleaning-guide" \
  "Soft-top convertible being cleaned with specialized fabric cleaner and a soft brush, showing proper technique on canvas top, outdoor bright setting, no text"

generate "how-to-detail-a-black-car-without-swirl-marks" \
  "Flawless black car paint with mirror-like reflection under professional lighting, showing the perfect swirl-free finish result, dramatic studio shot, no text"

generate "ceramic-coating-maintenance-schedule" \
  "Calendar-style flat lay with ceramic coating maintenance products - pH neutral soap, spray sealant, drying towel - arranged around a monthly planner, clean aesthetic, no text"

generate "how-to-remove-tree-sap-and-bird-droppings-safely" \
  "Close-up of tree sap spots on a car surface with isopropyl alcohol and microfiber cloth ready for safe removal, outdoor natural lighting, tutorial style, no text"

generate "ppf-installation-what-to-expect-from-a-professional" \
  "Professional PPF installer using heat gun and squeegee to apply paint protection film on a car hood in a clean installation bay, precision work, no text"

echo ""
echo "=== Guide images done! ==="
ls "$OUT_DIR"/*.png 2>/dev/null | wc -l
echo " images generated"
