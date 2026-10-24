import fs from 'node:fs';
import path from 'node:path';

// Virtual module that exposes every image found under
// public/assets/love-board/{papers,pins,tapes,stickers} — scanned
// from disk on every load(), never hardcoded. Dropping a new PNG into any of
// those folders makes it show up automatically: on rebuild in production, and
// after a refresh in dev (the watcher below triggers a full reload so the
// virtual module is re-evaluated).
const VIRTUAL_ID = 'virtual:love-board-manifest';
const RESOLVED_VIRTUAL_ID = '\0' + VIRTUAL_ID;

const CATEGORIES = ['papers', 'pins', 'tapes', 'stickers'];
const IMAGE_EXTENSION_PATTERN = /\.(png|jpg|jpeg|webp|gif|svg)$/i;

function toLabel(filename) {
  return filename
    .replace(/\.[^/.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function scanCategory(baseDir, category) {
  const dir = path.join(baseDir, category);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((file) => IMAGE_EXTENSION_PATTERN.test(file))
    .sort()
    .map((file) => ({
      id: file.replace(/\.[^/.]+$/, ''),
      filename: file,
      label: toLabel(file),
      url: `/assets/love-board/${category}/${file}`,
    }));
}

// Stickers get one extra level of nesting so decorative sets (hearts/,
// stars/, ribbons/, ...) can be dropped in as plain folders and show up as
// filter tabs in the library with zero code changes. Files directly inside
// stickers/ (no subfolder) are grouped under "General".
function scanStickers(baseDir) {
  const dir = path.join(baseDir, 'stickers');
  if (!fs.existsSync(dir)) return [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const items = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const subDir = path.join(dir, entry.name);
      const files = fs
        .readdirSync(subDir)
        .filter((file) => IMAGE_EXTENSION_PATTERN.test(file))
        .sort();
      for (const file of files) {
        items.push({
          id: `${entry.name}/${file}`.replace(/\.[^/.]+$/, ''),
          filename: file,
          label: toLabel(file),
          category: toLabel(entry.name),
          url: `/assets/love-board/stickers/${entry.name}/${file}`,
        });
      }
    } else if (IMAGE_EXTENSION_PATTERN.test(entry.name)) {
      items.push({
        id: entry.name.replace(/\.[^/.]+$/, ''),
        filename: entry.name,
        label: toLabel(entry.name),
        category: 'General',
        url: `/assets/love-board/stickers/${entry.name}`,
      });
    }
  }

  return items.sort((a, b) => a.category.localeCompare(b.category) || a.filename.localeCompare(b.filename));
}

function buildManifest(baseDir) {
  const manifest = {};
  for (const category of CATEGORIES) {
    manifest[category] = category === 'stickers' ? scanStickers(baseDir) : scanCategory(baseDir, category);
  }
  return manifest;
}

export default function loveBoardAssetsPlugin() {
  let baseDir;

  return {
    name: 'love-board-assets',

    configResolved(config) {
      baseDir = path.join(config.root, 'public', 'assets', 'love-board');
    },

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_VIRTUAL_ID;
      return undefined;
    },

    load(id) {
      if (id !== RESOLVED_VIRTUAL_ID) return undefined;
      const manifest = buildManifest(baseDir);
      return `export const loveBoardManifest = ${JSON.stringify(manifest)};\n`;
    },

    configureServer(server) {
      server.watcher.add(baseDir);
      server.watcher.on('all', (_event, changedPath) => {
        const normalized = changedPath.split(path.sep).join('/');
        if (normalized.includes('/love-board/') && IMAGE_EXTENSION_PATTERN.test(normalized)) {
          const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_ID);
          if (mod) server.moduleGraph.invalidateModule(mod);
          server.ws.send({ type: 'full-reload' });
        }
      });
    },
  };
}
