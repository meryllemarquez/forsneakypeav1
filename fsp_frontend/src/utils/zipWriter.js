// Store-only ZIP writer (no compression: photos are already compressed). No dependencies.
// Entries are kept as Blob parts so memory use is just the photos themselves. Archives stay under
// 4 GB (callers cap them far lower), so ZIP64 is not needed.

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** Lower-case letters, digits and dashes only; '' when nothing usable is left. */
export function slugify(text, max = 40) {
  return String(text || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, max)
    .replace(/-+$/g, '');
}

function dosDateTime(date) {
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const day = ((Math.max(date.getFullYear(), 1980) - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, day };
}

export class ZipBuilder {
  constructor() {
    this.parts = [];
    this.central = [];
    this.offset = 0;
    this.count = 0;
    this.size = 0;
    this.names = new Set();
  }

  /** A name unique inside the archive: a duplicate gets -2, -3... before its extension. */
  uniqueName(name) {
    if (!this.names.has(name)) return name;
    const dot = name.lastIndexOf('.');
    const stem = dot > 0 ? name.slice(0, dot) : name;
    const ext = dot > 0 ? name.slice(dot) : '';
    for (let i = 2; ; i += 1) {
      const candidate = `${stem}-${i}${ext}`;
      if (!this.names.has(candidate)) return candidate;
    }
  }

  async add(name, blob) {
    const finalName = this.uniqueName(name);
    this.names.add(finalName);
    const nameBytes = new TextEncoder().encode(finalName);
    const data = new Uint8Array(await blob.arrayBuffer());
    const crc = crc32(data);
    const { time, day } = dosDateTime(new Date());

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true); // UTF-8 names
    local.setUint16(8, 0, true); // stored
    local.setUint16(10, time, true);
    local.setUint16(12, day, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, nameBytes.length, true);
    local.setUint16(28, 0, true);
    this.parts.push(local.buffer, nameBytes, data);

    this.central.push({ nameBytes, crc, length: data.length, time, day, offset: this.offset });
    this.offset += 30 + nameBytes.length + data.length;
    this.count += 1;
    this.size += data.length;
    return finalName;
  }

  /** Writes the central directory and returns the finished archive as a Blob. */
  finish() {
    const dirStart = this.offset;
    let dirSize = 0;
    for (const e of this.central) {
      const h = new DataView(new ArrayBuffer(46));
      h.setUint32(0, 0x02014b50, true);
      h.setUint16(4, 20, true);
      h.setUint16(6, 20, true);
      h.setUint16(8, 0x0800, true);
      h.setUint16(10, 0, true);
      h.setUint16(12, e.time, true);
      h.setUint16(14, e.day, true);
      h.setUint32(16, e.crc, true);
      h.setUint32(20, e.length, true);
      h.setUint32(24, e.length, true);
      h.setUint16(28, e.nameBytes.length, true);
      h.setUint32(42, e.offset, true);
      this.parts.push(h.buffer, e.nameBytes);
      dirSize += 46 + e.nameBytes.length;
    }
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true);
    end.setUint16(8, this.central.length, true);
    end.setUint16(10, this.central.length, true);
    end.setUint32(12, dirSize, true);
    end.setUint32(16, dirStart, true);
    this.parts.push(end.buffer);
    return new Blob(this.parts, { type: 'application/zip' });
  }
}
