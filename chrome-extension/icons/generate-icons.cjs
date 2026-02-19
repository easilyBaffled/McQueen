/**
 * Icon Generator for McQueen Chrome Extension
 * Run with: node generate-icons.js
 *
 * This creates simple PNG icons using Node.js
 */

const fs = require('fs');
const path = require('path');

// Simple PNG encoder for basic icons
function createPNG(width, height, rgba) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = createIHDRChunk(width, height);

  // IDAT chunk (image data)
  const idat = createIDATChunk(width, height, rgba);

  // IEND chunk
  const iend = createIENDChunk();

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createIHDRChunk(width, height) {
  const data = Buffer.alloc(13);
  data.writeUInt32BE(width, 0);
  data.writeUInt32BE(height, 4);
  data.writeUInt8(8, 8); // bit depth
  data.writeUInt8(6, 9); // color type (RGBA)
  data.writeUInt8(0, 10); // compression
  data.writeUInt8(0, 11); // filter
  data.writeUInt8(0, 12); // interlace

  return createChunk('IHDR', data);
}

function createIDATChunk(width, height, rgba) {
  const zlib = require('zlib');

  // Create raw image data with filter bytes
  const rawData = Buffer.alloc((width * 4 + 1) * height);
  let offset = 0;

  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      rawData[offset++] = rgba[i]; // R
      rawData[offset++] = rgba[i + 1]; // G
      rawData[offset++] = rgba[i + 2]; // B
      rawData[offset++] = rgba[i + 3]; // A
    }
  }

  const compressed = zlib.deflateSync(rawData);
  return createChunk('IDAT', compressed);
}

function createIENDChunk() {
  return createChunk('IEND', Buffer.alloc(0));
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = crc32(crcData);

  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc, 0);

  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

// CRC32 implementation
function crc32(data) {
  let crc = 0xffffffff;
  const table = getCRC32Table();

  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

let crcTable = null;
function getCRC32Table() {
  if (crcTable) return crcTable;

  crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[i] = c;
  }
  return crcTable;
}

// Generate icon image data - simple stock chart style icon
function generateIconData(size) {
  const rgba = new Uint8Array(size * size * 4);

  // Colors
  const bgColor = [26, 26, 46, 255]; // Dark blue background
  const chartColor = [0, 200, 83, 255]; // Green for up trend
  const accentColor = [255, 255, 255, 255]; // White accent

  // Fill background
  for (let i = 0; i < size * size; i++) {
    rgba[i * 4] = bgColor[0];
    rgba[i * 4 + 1] = bgColor[1];
    rgba[i * 4 + 2] = bgColor[2];
    rgba[i * 4 + 3] = bgColor[3];
  }

  // Draw upward trend line (simple diagonal)
  const linePoints = [];
  const padding = Math.floor(size * 0.15);
  const chartHeight = size - padding * 2;
  const chartWidth = size - padding * 2;

  // Create wave pattern going up
  for (let x = 0; x < chartWidth; x++) {
    const progress = x / chartWidth;
    const baseY = chartHeight * (1 - progress * 0.6); // Upward trend
    const wave = Math.sin(progress * Math.PI * 2) * (chartHeight * 0.1);
    const y = Math.floor(baseY + wave);
    linePoints.push({ x: x + padding, y: y + padding });
  }

  // Draw the line (thicker for visibility)
  const lineThickness = Math.max(1, Math.floor(size / 16));
  linePoints.forEach((point, i) => {
    for (let dy = -lineThickness; dy <= lineThickness; dy++) {
      for (let dx = -lineThickness; dx <= lineThickness; dx++) {
        const px = point.x + dx;
        const py = point.y + dy;
        if (px >= 0 && px < size && py >= 0 && py < size) {
          const idx = (py * size + px) * 4;
          rgba[idx] = chartColor[0];
          rgba[idx + 1] = chartColor[1];
          rgba[idx + 2] = chartColor[2];
          rgba[idx + 3] = chartColor[3];
        }
      }
    }
  });

  // Draw up arrow at the end
  const arrowSize = Math.floor(size * 0.25);
  const arrowX = size - padding - arrowSize / 2;
  const arrowY = padding + Math.floor(chartHeight * 0.3);

  // Arrow triangle
  for (let dy = 0; dy < arrowSize; dy++) {
    const width = dy;
    for (let dx = -width; dx <= width; dx++) {
      const px = Math.floor(arrowX + dx);
      const py = Math.floor(arrowY + dy);
      if (px >= 0 && px < size && py >= 0 && py < size) {
        const idx = (py * size + px) * 4;
        rgba[idx] = accentColor[0];
        rgba[idx + 1] = accentColor[1];
        rgba[idx + 2] = accentColor[2];
        rgba[idx + 3] = accentColor[3];
      }
    }
  }

  return rgba;
}

// Generate all icon sizes
const sizes = [16, 48, 128];

sizes.forEach((size) => {
  const rgba = generateIconData(size);
  const png = createPNG(size, size, rgba);
  const filename = path.join(__dirname, `icon${size}.png`);
  fs.writeFileSync(filename, png);
  console.log(`Created ${filename}`);
});

console.log('All icons generated successfully!');
