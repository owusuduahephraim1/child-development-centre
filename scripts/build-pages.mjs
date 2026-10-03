import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const out = resolve(root, '_site');

function cleanUrl(value) {
  const v = String(value || '').trim();
  if (!v) return '';
  return v.endsWith('/') ? v : v + '/';
}

function js(value) {
  return JSON.stringify(String(value || ''));
}

function absoluteUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try {
    const url = new URL(raw);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

function upsertHeadTag(html, pattern, tag) {
  return pattern.test(html)
    ? html.replace(pattern, tag)
    : html.replace('</head>', `  ${tag}\n</head>`);
}

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

await cp(resolve(root, 'assets'), resolve(out, 'assets'), { recursive: true });
await cp(resolve(root, 'index.html'), resolve(out, 'index.html'));
await writeFile(resolve(out, '.nojekyll'), '');

const repoOwner = process.env.GITHUB_REPOSITORY_OWNER || '';
const repoName = String(process.env.GITHUB_REPOSITORY || '').split('/')[1] || '';
const defaultCanonical = repoOwner && repoName
  ? `https://${repoOwner}.github.io/${repoName}/`
  : '';

const canonicalUrl = cleanUrl(process.env.CDC_CANONICAL_URL || defaultCanonical);
const seoShareImageUrl = absoluteUrl(process.env.CDC_SEO_SHARE_IMAGE_URL);
const config = `window.CDC_CONFIG = {
  neonAuthUrl: ${js(process.env.CDC_NEON_AUTH_URL)},
  neonDataApiUrl: ${js(process.env.CDC_NEON_DATA_API_URL)},
  canonicalUrl: ${js(canonicalUrl)},
  version: "3.0.0",
  videoUploadWorkerUrl: ${js(process.env.CDC_MEDIA_WORKER_URL)},
  bootstrapOrganisationLogo: ${js(process.env.CDC_ORGANISATION_LOGO_URL)},
  bootstrapSchoolLogo: ${js(process.env.CDC_SCHOOL_LOGO_URL)}
};
`;

await writeFile(resolve(out, 'assets/runtime-config.js'), config);

let index = await readFile(resolve(out, 'index.html'), 'utf8');
if (canonicalUrl) {
  index = upsertHeadTag(index, /<link(?:\s+id="canonicalUrl")?\s+rel="canonical"[^>]*>/i, `<link id="canonicalUrl" rel="canonical" href="${canonicalUrl}">`);
  index = upsertHeadTag(index, /<meta(?:\s+id="ogUrl")?\s+property="og:url"[^>]*>/i, `<meta id="ogUrl" property="og:url" content="${canonicalUrl}">`);
}
if (seoShareImageUrl) {
  index = upsertHeadTag(index, /<meta(?:\s+id="ogImage")?\s+property="og:image"[^>]*>/i, `<meta id="ogImage" property="og:image" content="${seoShareImageUrl}">`);
  index = upsertHeadTag(index, /<meta\s+property="og:image:secure_url"[^>]*>/i, `<meta property="og:image:secure_url" content="${seoShareImageUrl}">`);
  index = upsertHeadTag(index, /<meta(?:\s+id="twitterImage")?\s+name="twitter:image"[^>]*>/i, `<meta id="twitterImage" name="twitter:image" content="${seoShareImageUrl}">`);
}
await writeFile(resolve(out, 'index.html'), index);

const robots = canonicalUrl
  ? `User-agent: *\nAllow: /\n\nSitemap: ${canonicalUrl}sitemap.xml\n`
  : 'User-agent: *\nAllow: /\n';
await writeFile(resolve(out, 'robots.txt'), robots);

const sitemap = canonicalUrl
  ? `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${canonicalUrl}</loc></url>\n</urlset>\n`
  : '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>\n';
await writeFile(resolve(out, 'sitemap.xml'), sitemap);

console.log(`Prepared GitHub Pages artifact at ${out}`);
