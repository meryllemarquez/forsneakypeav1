import { loveBoardManifest } from 'virtual:love-board-manifest';

/**
 * Every PNG under public/assets/love-board/{backgrounds,papers,pins,tapes,stickers},
 * discovered at build/dev time by vite-plugins/loveBoardAssets.js — never a
 * hardcoded list. Add a new file to any of those folders and it appears here
 * with no code changes.
 */
export function useLoveBoardAssets() {
  return loveBoardManifest;
}
