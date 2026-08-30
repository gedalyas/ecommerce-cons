// Gera public/favicon.ico e public/icon.svg a partir da marca do produto:
// quadrado arredondado verde (--primary #0F6E56) com três barras ascendentes brancas.
// Roda com `node scripts/generate-favicon.mjs`. Sem dependências externas.
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public");

const BG = [0x0f, 0x6e, 0x56];
const FG = [0xff, 0xff, 0xff];

/** Cobertura do pixel (0..1) por supersampling 4x4 de uma função de dentro/fora. */
function coverage(x, y, inside) {
  let hits = 0;
  for (let sy = 0; sy < 4; sy++) {
    for (let sx = 0; sx < 4; sx++) {
      if (inside(x + (sx + 0.5) / 4, y + (sy + 0.5) / 4)) hits++;
    }
  }
  return hits / 16;
}

function insideRoundedRect(px, py, x, y, w, h, r) {
  if (px < x || py < y || px > x + w || py > y + h) return false;
  const cx = Math.min(Math.max(px, x + r), x + w - r);
  const cy = Math.min(Math.max(py, y + r), y + h - r);
  return (px - cx) ** 2 + (py - cy) ** 2 <= r * r;
}

/** RGBA do ícone em `size` px. Barras: 3 colunas ascendentes com base alinhada. */
function renderRGBA(size) {
  const u = size / 256; // unidade de projeto (arte desenhada em 256)
  const rgba = Buffer.alloc(size * size * 4);

  const bars = [
    { x: 62, w: 34, top: 150 },
    { x: 111, w: 34, top: 106 },
    { x: 160, w: 34, top: 66 },
  ];
  const barBottom = 190;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const bgA = coverage(x, y, (fx, fy) => insideRoundedRect(fx / u, fy / u, 8, 8, 240, 240, 56));
      let fgA = 0;
      for (const b of bars) {
        fgA = Math.max(
          fgA,
          coverage(x, y, (fx, fy) =>
            insideRoundedRect(fx / u, fy / u, b.x, b.top, b.w, barBottom - b.top, 8),
          ),
        );
      }
      // Barras só existem sobre o fundo; composição simples fundo → barra.
      const a = bgA;
      const mix = Math.min(fgA, bgA);
      rgba[i] = Math.round(BG[0] * (1 - mix) + FG[0] * mix);
      rgba[i + 1] = Math.round(BG[1] * (1 - mix) + FG[1] * mix);
      rgba[i + 2] = Math.round(BG[2] * (1 - mix) + FG[2] * mix);
      rgba[i + 3] = Math.round(a * 255);
    }
  }
  return rgba;
}

function crc32(buf) {
  let c = ~0;
  for (const byte of buf) {
    c ^= byte;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePNG(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  // filtro 0 em cada scanline: o ganho de outros filtros não compensa aqui.
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** ICO com PNGs embutidos — suportado por todos os navegadores atuais. */
function encodeICO(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // tipo: ícone
  header.writeUInt16LE(entries.length, 4);

  const dir = Buffer.alloc(16 * entries.length);
  let offset = header.length + dir.length;
  entries.forEach((e, i) => {
    const o = i * 16;
    dir[o] = e.size >= 256 ? 0 : e.size;
    dir[o + 1] = e.size >= 256 ? 0 : e.size;
    dir[o + 2] = 0; // paleta
    dir[o + 3] = 0;
    dir.writeUInt16LE(1, o + 4); // planos
    dir.writeUInt16LE(32, o + 6); // bits por pixel
    dir.writeUInt32BE(e.png.length, o + 8);
    dir.writeUInt32LE(offset, o + 12);
    dir.writeUInt32LE(e.png.length, o + 8); // little-endian (sobrescreve)
    offset += e.png.length;
  });

  return Buffer.concat([header, dir, ...entries.map((e) => e.png)]);
}

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-label="E-commerce Insights">
  <rect x="8" y="8" width="240" height="240" rx="56" fill="#0F6E56"/>
  <rect x="62" y="150" width="34" height="40" rx="8" fill="#FFFFFF"/>
  <rect x="111" y="106" width="34" height="84" rx="8" fill="#FFFFFF"/>
  <rect x="160" y="66" width="34" height="124" rx="8" fill="#FFFFFF"/>
</svg>
`;

const sizes = [16, 32, 48, 256];
const entries = sizes.map((size) => ({ size, png: encodePNG(size, renderRGBA(size)) }));
writeFileSync(join(OUT, "favicon.ico"), encodeICO(entries));
writeFileSync(join(OUT, "icon.svg"), SVG);
writeFileSync(join(OUT, "apple-touch-icon.png"), encodePNG(180, renderRGBA(180)));
console.log("favicon.ico, icon.svg e apple-touch-icon.png gerados em public/");
