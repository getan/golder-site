export type DesktopOS = 'macos' | 'windows' | 'linux' | 'other';

// OS detection is only a presentation hint. Never infer a Mac's CPU from its
// user agent: Safari, reduced user agents and Rosetta can all mislead us.
export function detectDesktopOS(userAgent: string, platform: string, touchPoints = 0): DesktopOS {
  if (/Android|iPhone|iPad|iPod|CrOS/i.test(userAgent) || (/Mac/i.test(platform) && touchPoints > 1)) return 'other';
  if (/Windows/i.test(userAgent) || /^Win/i.test(platform)) return 'windows';
  if (/Macintosh|Mac OS X/i.test(userAgent) || /^Mac/i.test(platform)) return 'macos';
  if (/Linux|X11/i.test(userAgent) || /Linux/i.test(platform)) return 'linux';
  return 'other';
}

export const assetNames = (version: string) => ({
  macArm: `golder-gui-${version}-arm64.dmg`,
  macIntel: `golder-gui-${version}-amd64.dmg`,
  windows: `golder-gui-setup-${version}-amd64.exe`,
  linuxDebAmd64: `golder-gui_${version}_amd64.deb`,
  linuxDebArm64: `golder-gui_${version}_arm64.deb`,
  linuxTarAmd64: `golder-gui-${version}-linux-amd64.tar.gz`,
  linuxTarArm64: `golder-gui-${version}-linux-arm64.tar.gz`,
});

export type AssetKey = keyof ReturnType<typeof assetNames>;

// Only exact, published assets from the same release are returned. A newly
// created GitHub Release can exist before the GUI workflow attaches its files.
export function releaseDownloads(data: unknown): { tag: string; assets: Partial<Record<AssetKey, string>> } | null {
  if (!data || typeof data !== 'object') return null;
  const release = data as { tag_name?: unknown; assets?: unknown };
  if (typeof release.tag_name !== 'string' || !/^v\d+\.\d+\.\d+$/.test(release.tag_name) || !Array.isArray(release.assets)) return null;
  const tag = release.tag_name;
  const expected = assetNames(tag.slice(1));
  const assets: Partial<Record<AssetKey, string>> = {};
  for (const [key, name] of Object.entries(expected) as [AssetKey, string][]) {
    const url = `https://github.com/getan/golder/releases/download/${tag}/${name}`;
    if (release.assets.some((item: unknown) => {
      if (!item || typeof item !== 'object') return false;
      const asset = item as { name?: unknown; state?: unknown; browser_download_url?: unknown };
      return asset.name === name && asset.state === 'uploaded' && asset.browser_download_url === url;
    })) assets[key] = url;
  }
  return { tag, assets };
}

// GitHub's public expanded-assets fragment avoids the REST API's shared-IP
// rate limit. Only exact links on the expected release are accepted.
export function releaseDownloadsFromHTML(tag: string, html: string): { tag: string; assets: Partial<Record<AssetKey, string>> } | null {
  if (!/^v\d+\.\d+\.\d+$/.test(tag)) return null;
  const assets: Partial<Record<AssetKey, string>> = {};
  for (const [key, name] of Object.entries(assetNames(tag.slice(1))) as [AssetKey, string][]) {
    const path = `/getan/golder/releases/download/${tag}/${name}`;
    if (html.includes(`href="${path}"`) || html.includes(`href='${path}'`)) {
      assets[key] = `https://github.com${path}`;
    }
  }
  return { tag, assets };
}
