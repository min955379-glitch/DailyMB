
// Generates every icon size from assets/icon.svg. Run: npm run icons  (needs `sharp`, a devDependency)
// Outputs are git-ignored and regenerated before each EAS build.
const sharp = require('sharp'); const fs = require('fs'); const path = require('path');
const A = (p) => path.join(__dirname, '..', 'assets', p);
async function main() {
  if (!fs.existsSync(A('icon.svg'))) throw new Error('assets/icon.svg missing');
  const svg = fs.readFileSync(A('icon.svg'));
  // iOS: 1024x1024, no transparency, no rounded corners (iOS masks it).
  await sharp(svg, { density: 300 }).flatten({ background: '#0F766E' }).resize(1024, 1024).png().toFile(A('icon.png'));
  // Splash uses the same mark on teal.
  await sharp(svg, { density: 300 }).resize(1024, 1024).png().toFile(A('splash.png'));
  // Android adaptive foreground: mark kept inside the central 66% safe zone.
  const fg = await sharp(svg, { density: 300 }).resize(676, 676).png().toBuffer();
  await sharp({ create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite([{ input: fg, gravity: 'centre' }]).png().toFile(A('adaptive-icon-foreground.png'));
  await sharp(fs.readFileSync(A('adaptive-background.svg')), { density: 300 }).resize(1024, 1024).png().toFile(A('adaptive-icon-background.png'));
  // Android 13 monochrome themed icon: white silhouette on transparent.
  await sharp(fs.readFileSync(A('notification-icon.svg')), { density: 300 }).resize(1024, 1024).png().toFile(A('adaptive-icon-monochrome.png'));
  // Notification small icon: white on transparent.
  await sharp(fs.readFileSync(A('notification-icon.svg')), { density: 300 }).resize(96, 96).png().toFile(A('notification-icon.png'));
  // Web favicon.
  await sharp(svg, { density: 300 }).resize(64, 64).png().toFile(A('favicon.png'));
  console.log('icons generated in assets/');
}
main().catch((e) => { console.error(e); process.exit(1); });
