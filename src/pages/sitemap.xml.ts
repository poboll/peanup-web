import type { APIRoute } from 'astro';

const paths = [
  '/',
  '/en/',
  '/zh-tw/',
  '/ja/',
  '/de/',
  '/fr/',
  '/docs/',
  '/docs/content/',
  '/docs/image-guide/',
  '/docs/hardware/',
  '/docs/compatibility/',
  '/docs/troubleshooting/',
  '/docs/support/',
  '/docs/shortcuts/',
  '/docs/glossary/',
  '/docs/campaign/',
  '/docs/engineering/',
  '/docs/privacy/',
  '/docs/updates/',
  '/en/docs/',
  '/en/docs/content/',
  '/en/docs/image-guide/',
  '/en/docs/hardware/',
  '/en/docs/compatibility/',
  '/en/docs/troubleshooting/',
  '/en/docs/support/',
  '/en/docs/shortcuts/',
  '/en/docs/glossary/',
  '/en/docs/campaign/',
  '/en/docs/engineering/',
  '/en/docs/privacy/',
  '/en/docs/updates/',
];

export const GET: APIRoute = ({ site }) => {
  const origin = site ?? new URL('https://pean.caiths.com');
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths
    .map((path) => `  <url><loc>${new URL(path, origin).href}</loc></url>`)
    .join('\n')}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
