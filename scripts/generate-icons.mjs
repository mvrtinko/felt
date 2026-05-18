import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = `${__dirname}/../public`;

mkdirSync(outDir, { recursive: true });

const svg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="g" cx="20%" cy="20%" r="80%">
      <stop offset="0%" stop-color="#143524"/>
      <stop offset="100%" stop-color="#081810"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#g)"/>
  <g transform="translate(140,90)">
    <path d="M 90 80 Q 90 50 130 50 L 230 50 L 230 95 L 145 95 Q 135 95 135 105 L 135 175 L 215 175 L 215 220 L 135 220 L 135 360 L 85 360 Z" fill="#e94560"/>
    <circle cx="245" cy="345" r="18" fill="#c9a96e"/>
  </g>
</svg>
`;

async function build() {
  await sharp(Buffer.from(svg(512))).png().toFile(`${outDir}/icon-512.png`);
  await sharp(Buffer.from(svg(192))).resize(192, 192).png().toFile(`${outDir}/icon-192.png`);
  await sharp(Buffer.from(svg(512))).resize(180, 180).png().toFile(`${outDir}/apple-touch-icon.png`);
  // Maskable icon (with safe-area padding)
  const maskSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#0d2818"/>
  <g transform="translate(180,130)">
    <path d="M 60 60 Q 60 30 100 30 L 180 30 L 180 70 L 115 70 Q 105 70 105 80 L 105 140 L 170 140 L 170 180 L 105 180 L 105 300 L 60 300 Z" fill="#e94560"/>
  </g>
</svg>`;
  await sharp(Buffer.from(maskSvg)).png().toFile(`${outDir}/icon-maskable-512.png`);
  console.log("✓ icons generated");
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});

// Also write a static SVG to public for reference
writeFileSync(`${outDir}/icon.svg`, svg(512));
