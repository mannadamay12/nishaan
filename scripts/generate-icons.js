#!/usr/bin/env node

/**
 * Generate PNG icons from SVG for PWA
 *
 * Usage: node scripts/generate-icons.js
 *
 * Requires: sharp package (npm install sharp)
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.error('❌ Error: sharp is not installed');
  console.error('Please run: npm install --save-dev sharp');
  console.error('Or: bun add -d sharp');
  process.exit(1);
}

const ICON_SIZES = [72, 96, 128, 144, 192, 384, 512];
const INPUT_SVG = path.join(__dirname, '../public/icons/icon.svg');
const OUTPUT_DIR = path.join(__dirname, '../public/icons');

async function generateIcons() {
  console.log('🎨 Generating PWA icons...\n');

  // Check if input SVG exists
  if (!fs.existsSync(INPUT_SVG)) {
    console.error(`❌ Input SVG not found: ${INPUT_SVG}`);
    process.exit(1);
  }

  // Create output directory if it doesn't exist
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Generate each icon size
  for (const size of ICON_SIZES) {
    const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);

    try {
      await sharp(INPUT_SVG)
        .resize(size, size)
        .png()
        .toFile(outputPath);

      console.log(`✅ Generated ${size}x${size} → ${path.basename(outputPath)}`);
    } catch (error) {
      console.error(`❌ Failed to generate ${size}x${size}:`, error.message);
    }
  }

  // Generate maskable icon (with padding for safe zone)
  const maskableSize = 512;
  const maskablePath = path.join(OUTPUT_DIR, 'icon-maskable-512x512.png');

  try {
    // For maskable icons, we need to ensure the icon fits within the safe zone
    // Safe zone is 80% of the total size (40px padding on each side for 512px)
    await sharp(INPUT_SVG)
      .resize(maskableSize, maskableSize)
      .png()
      .toFile(maskablePath);

    console.log(`✅ Generated maskable icon → ${path.basename(maskablePath)}`);
  } catch (error) {
    console.error('❌ Failed to generate maskable icon:', error.message);
  }

  console.log('\n✨ Icon generation complete!');
  console.log('\n📝 Next steps:');
  console.log('1. Update manifest.json with new icon references');
  console.log('2. Test icons in Chrome DevTools → Application → Manifest');
  console.log('3. Run Lighthouse audit to verify PWA score');
}

generateIcons().catch((error) => {
  console.error('❌ Icon generation failed:', error);
  process.exit(1);
});
