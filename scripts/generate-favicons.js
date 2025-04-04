import sharp from 'sharp';
import fs from 'fs/promises';

const logo = `
<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="48" height="48" rx="24" fill="#FFBC04"/>
  <path d="M19.5019 34.3397L1.5 22.8695L28.2639 29.4915L12.4923 24.6219L5.32342 10.9213L39.8935 2L53.5941 20.7985L64.5864 3.91171L105.051 10.9213L101.865 18.1163L111.105 14.1075L94.0585 30.5163V65.5643L62.0374 85L19.5019 69.547V34.3397Z" fill="#000000"/>
</svg>
`;

const sizes = {
  'favicon-16x16.png': 16,
  'favicon-32x32.png': 32,
  'apple-touch-icon.png': 180,
  'android-chrome-192x192.png': 192,
  'android-chrome-512x512.png': 512
};

async function generateFavicons() {
  const svgBuffer = Buffer.from(logo);

  for (const [filename, size] of Object.entries(sizes)) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(`public/${filename}`);
  }

  // Generate OG image
  const ogImage = `
  <svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="630" fill="#FFBC04"/>
    <g transform="translate(500,265) scale(4)">
      ${logo}
    </g>
    <text x="50%" y="500" text-anchor="middle" font-family="Plus Jakarta Sans" font-size="64" fill="#000000">
      SmollPNG - Smart Image Compression
    </text>
  </svg>`;

  await sharp(Buffer.from(ogImage))
    .resize(1200, 630)
    .png()
    .toFile('public/og-image.png');

  // Generate Safari pinned tab icon
  const safariIcon = `
  <svg width="16" height="16" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="48" height="48" rx="24" fill="#000000"/>
    <path d="M19.5019 34.3397L1.5 22.8695L28.2639 29.4915L12.4923 24.6219L5.32342 10.9213L39.8935 2L53.5941 20.7985L64.5864 3.91171L105.051 10.9213L101.865 18.1163L111.105 14.1075L94.0585 30.5163V65.5643L62.0374 85L19.5019 69.547V34.3397Z" fill="#FFBC04"/>
  </svg>`;

  await fs.writeFile('public/safari-pinned-tab.svg', safariIcon);
}

generateFavicons().catch(console.error);
