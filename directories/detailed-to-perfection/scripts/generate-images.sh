#!/bin/bash
# Generate category hero images for review articles using nano-banana-pro
SCRIPT="$HOME/.claude/skills/nano-banana-pro/scripts/generate_image.py"
OUT_DIR="/home/node/a0/workspace/35cfbcaf-2ab5-4f17-976f-c03d4f10a560/workspace/detailed-to-perfection/public/images/reviews"

generate() {
  local slug="$1"
  local prompt="$2"
  local outfile="$OUT_DIR/$slug.png"

  if [ -f "$outfile" ]; then
    echo "SKIP: $slug (exists)"
    return
  fi

  echo "Generating: $slug..."
  python3 "$SCRIPT" \
    --prompt "$prompt" \
    --filename "$outfile" \
    --resolution 1K 2>&1 | tail -1

  if [ -f "$outfile" ]; then
    echo "  OK: $(du -h "$outfile" | cut -f1)"
  else
    echo "  FAILED: $slug"
  fi
}

# Ceramic Coatings
generate "best-ceramic-coating-sprays-2026" \
  "Professional product photography of ceramic coating spray bottles arranged on a dark reflective surface with a freshly coated car hood showing mirror-like reflection in the background, studio lighting, premium aesthetic, no text"

generate "best-professional-ceramic-coating-kits-2026" \
  "Overhead flat-lay product photography of a professional ceramic coating kit with bottles, applicator pads, microfiber cloths, and gloves arranged neatly on a dark slate surface, studio lighting, no text"

generate "best-graphene-ceramic-coatings-2026" \
  "Close-up of a gloved hand applying graphene ceramic coating to a dark metallic car panel with water beading visible, professional detailing studio environment, dramatic lighting, no text"

# Tools & Equipment
generate "best-da-polishers-under-200" \
  "Professional product photography of dual-action car polishers with polishing pads arranged on a workbench, automotive detailing garage background, warm workshop lighting, no text"

generate "best-foam-cannons-and-foam-guns-2026" \
  "Action shot of thick white foam cascading over a dark car surface from a foam cannon attached to a pressure washer, outdoor detailing setting, bright natural lighting, no text"

generate "best-pressure-washers-for-car-detailing" \
  "Professional pressure washer with foam cannon attachment spraying a luxury car in a professional detailing bay, clean organized environment, dramatic lighting, no text"

generate "best-detailing-brush-sets-2026" \
  "Organized flat-lay of various detailing brushes in different sizes fanned out on a dark surface, from large wheel brushes to small interior brushes, studio lighting, no text"

# Detailing Products
generate "best-clay-bar-kits-for-paint-decontamination" \
  "Close-up of a clay bar being used on a car surface with clay lubricant spray bottle nearby, showing smooth gliding motion, professional studio lighting, no text"

generate "best-microfiber-towels-for-detailing-2026" \
  "Neatly stacked colorful microfiber towels in various types - plush drying, waffle weave, glass towels - on a clean workbench, professional product photography, no text"

generate "best-iron-removers-and-fallout-removers-2026" \
  "Close-up of iron remover spray turning purple on a white car wheel as it dissolves brake dust contamination, dramatic before-and-after effect, professional photography, no text"

generate "best-interior-detailing-kits-2026" \
  "Interior detailing products arranged on a luxury car leather seat - cleaners, conditioners, brushes, microfiber applicators, premium dashboard cleaner, studio lighting, no text"

generate "best-leather-cleaners-and-conditioners-2026" \
  "Professional product photography of premium leather care bottles with a microfiber applicator on a rich brown leather car seat showing beautiful conditioned finish, warm lighting, no text"

# Car Care Basics
generate "best-car-wash-soaps-and-shampoos-2026" \
  "Colorful car wash soap bottles arranged with a wash mitt and bucket on a clean garage floor, with suds and a freshly washed car in the background, bright clean lighting, no text"

generate "best-tire-shine-and-dressing-products-2026" \
  "Split image showing a glossy dressed tire next to tire dressing spray bottles and applicator pads, professional detailing environment, studio lighting, no text"

generate "best-wheel-cleaners-2026" \
  "Before and after of a car wheel being cleaned - one half dirty with brake dust, other half gleaming clean, with wheel cleaner spray bottle, professional photography, no text"

# Paint Protection
generate "best-paint-sealants-for-long-lasting-protection" \
  "A hand applying paint sealant with a foam applicator pad to a deep red car hood showing brilliant reflection and gloss, professional detailing studio, dramatic lighting, no text"

generate "best-paint-protection-film-ppf-kits-2026" \
  "Close-up of transparent paint protection film being carefully applied to a car front bumper edge, showing the clear film conforming to curves, professional installation bay, no text"

generate "best-clear-bra-kits-for-diy-installation" \
  "DIY PPF installation kit components laid out on a clean surface - pre-cut film, squeegee, spray solution, microfiber cloth, with a car hood in the background, bright lighting, no text"

# Window Tinting
generate "best-window-tint-films-for-cars-2026" \
  "Professional window tint film rolls in various shades from light to dark laid out on a clean surface, with a tinted car window visible in the background, studio lighting, no text"

generate "best-ceramic-window-tints-2026" \
  "Close-up of a car side window showing premium ceramic tint with infrared heat rejection visualization, professional tint shop environment, clean modern aesthetic, no text"

# Polishing & Correction
generate "best-polishing-compounds-and-pads-2026" \
  "Assortment of polishing compounds, cutting compounds, and various foam polishing pads in different colors arranged on a detailing cart, professional garage setting, no text"

generate "best-scratch-removers-and-touch-up-paints" \
  "Before and after of a car paint scratch being removed - close-up showing the scratch disappearing with compound and a microfiber cloth, dramatic studio lighting, no text"

generate "best-swirl-removers-2026" \
  "Close-up of car paint under inspection light showing swirl marks on one half and perfectly corrected glossy finish on the other half, professional detailing studio, no text"

# Vehicle Wraps
generate "best-vinyl-wrap-tool-kits-2026" \
  "Organized flat-lay of vinyl wrap installation tools - squeegees, heat gun, cutting blades, gloves, knifeless tape - on a dark surface, professional product photography, no text"

generate "best-vinyl-wrap-films-for-color-change" \
  "Colorful vinyl wrap film samples fanned out showing various finishes - matte, satin, gloss, metallic, color-shifting - with a partially wrapped car in the background, studio lighting, no text"

echo ""
echo "=== Done! ==="
ls -la "$OUT_DIR"/*.png 2>/dev/null | wc -l
echo " images generated"
