import fs from 'node:fs';
import path from 'node:path';
import { brotliCompressSync, constants as zlibConstants, gzipSync } from 'node:zlib';

const dist = path.resolve('dist');
if (!fs.existsSync(dist)) throw new Error('dist/ is missing. Run the production build first.');

const productRoutes = ['/', '/en/', '/zh-cn/', '/zh-tw/', '/ja/', '/de/', '/fr/'];
const publicProductRoutes = productRoutes.filter((route) => route !== '/zh-cn/');
const docSlugs = ['', 'content/', 'image-guide/', 'hardware/', 'compatibility/', 'troubleshooting/', 'support/', 'shortcuts/', 'privacy/', 'glossary/', 'campaign/', 'engineering/', 'updates/'];
const docRoutes = docSlugs.flatMap((slug) => [`/docs/${slug}`, `/en/docs/${slug}`]);
const expectedHtmlRoutes = [...productRoutes, ...docRoutes, '/404.html'];
const sitemapRoutes = [...publicProductRoutes, ...docRoutes];

const fileForRoute = (route) => route === '/404.html'
  ? path.join(dist, '404.html')
  : path.join(dist, route.slice(1), 'index.html');

const htmlByRoute = new Map();
for (const route of expectedHtmlRoutes) {
  const file = fileForRoute(route);
  if (!fs.existsSync(file)) throw new Error(`Missing generated route: ${route}`);
  htmlByRoute.set(route, fs.readFileSync(file, 'utf8'));
}

const idsByRoute = new Map(
  [...htmlByRoute].map(([route, html]) => [
    route,
    new Set([...html.matchAll(/\sid=["']([^"']+)["']/g)].map((match) => match[1])),
  ]),
);

const normalizeRoute = (href, fromRoute) => {
  const [rawPath, hash = ''] = href.split('#');
  if (!rawPath) return { route: fromRoute, hash };
  const route = rawPath.startsWith('/') ? rawPath : path.posix.resolve(fromRoute, rawPath);
  return { route: route.endsWith('/') || route === '/404.html' ? route : `${route}/`, hash };
};

const failures = [];
const seoValues = { titles: new Map(), descriptions: new Map() };
const decodeHtml = (value) => value
  .replaceAll('&amp;', '&')
  .replaceAll('&quot;', '"')
  .replaceAll('&#39;', "'")
  .replaceAll('&lt;', '<')
  .replaceAll('&gt;', '>');
const attributeValue = (tag, name) => tag.match(new RegExp(`\\b${name}=["']([^"']*)["']`, 'i'))?.[1] ?? '';
const elementOwnership = (html, watchedClasses = [], watchedIds = []) => {
  const voidElements = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
  const classTargets = new Set(watchedClasses);
  const idTargets = new Set(watchedIds);
  const stack = [];
  const classParents = new Map();
  const idParents = new Map();

  for (const match of html.matchAll(/<\/?([a-z][a-z0-9-]*)\b[^>]*>/gi)) {
    const tag = match[0];
    const name = match[1].toLowerCase();
    if (tag.startsWith('</')) {
      while (stack.length) {
        const item = stack.pop();
        if (item.name === name) break;
      }
      continue;
    }

    const classes = attributeValue(tag, 'class').split(/\s+/).filter(Boolean);
    const id = attributeValue(tag, 'id');
    const parent = stack.at(-1) ?? null;
    for (const className of classes) {
      if (classTargets.has(className) && !classParents.has(className)) classParents.set(className, parent);
    }
    if (idTargets.has(id) && !idParents.has(id)) idParents.set(id, parent);

    if (!voidElements.has(name) && !tag.endsWith('/>')) stack.push({ name, classes, id });
  }

  return { classParents, idParents };
};
const scriptAssetCache = new Map();
const pageRuntimeSource = (html) => {
  const scriptTags = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)];
  const externalSources = scriptTags.map((match) => {
    const reference = match[1];
    if (!reference.startsWith('/')) return '';
    if (scriptAssetCache.has(reference)) return scriptAssetCache.get(reference);
    const file = path.join(dist, reference.slice(1));
    const source = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
    scriptAssetCache.set(reference, source);
    return source;
  });
  return [html, ...externalSources].join('\n');
};

for (const [route, html] of htmlByRoute) {
  const h1Count = (html.match(/<h1\b/g) ?? []).length;
  if (h1Count !== 1) failures.push(`${route}: expected one H1, found ${h1Count}`);

  const title = decodeHtml(html.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() ?? '');
  const description = decodeHtml(html.match(/<meta name="description" content="([^"]*)"/)?.[1]?.trim() ?? '');
  if (!title) failures.push(`${route}: title is missing`);
  if (!description) failures.push(`${route}: meta description is missing`);

  const imageTags = [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);
  imageTags.forEach((tag, index) => {
    if (!/\bdraggable=["']false["']/i.test(tag)) {
      failures.push(`${route}: image ${index + 1} must set draggable="false"`);
    }
  });

  const runtimeAssetTags = [...html.matchAll(/<(?:script|img|source)\b[^>]*>/gi)].map((match) => match[0]);
  for (const tag of runtimeAssetTags) {
    for (const attribute of ['src', 'data-src', 'srcset', 'data-srcset']) {
      const value = attributeValue(tag, attribute);
      if (/^https?:\/\//i.test(value)) failures.push(`${route}: external runtime asset is not allowed (${value})`);
    }
  }
  const stylesheetTags = [...html.matchAll(/<link\b[^>]*>/gi)]
    .map((match) => match[0])
    .filter((tag) => /\brel=["']stylesheet["']/i.test(tag));
  stylesheetTags.forEach((tag) => {
    const href = attributeValue(tag, 'href');
    if (/^https?:\/\//i.test(href)) failures.push(`${route}: external stylesheet is not allowed (${href})`);
  });
  if (route !== '/zh-cn/' && route !== '/404.html') {
    const titleOwner = seoValues.titles.get(title);
    const descriptionOwner = seoValues.descriptions.get(description);
    if (titleOwner) failures.push(`${route}: title duplicates ${titleOwner}`);
    if (descriptionOwner) failures.push(`${route}: meta description duplicates ${descriptionOwner}`);
    seoValues.titles.set(title, route);
    seoValues.descriptions.set(description, route);
  }

  if (route === '/en/' || route.startsWith('/en/docs/')) {
    if (title.length < 35 || title.length > 60) {
      failures.push(`${route}: English title should be 35-60 characters, found ${title.length}`);
    }
    if (description.length < 120 || description.length > 170) {
      failures.push(`${route}: English meta description should be 120-170 characters, found ${description.length}`);
    }
  }

  if (docRoutes.includes(route)) {
    const runtimeSource = pageRuntimeSource(html);
    const printControlCount = (html.match(/<button\b[^>]*\bdata-doc-print\b/g) ?? []).length;
    if (printControlCount !== 2) {
      failures.push(`${route}: expected desktop and mobile print controls, found ${printControlCount}`);
    }
    if (!runtimeSource.includes('window.print()')) {
      failures.push(`${route}: print control is missing its window.print handler`);
    }
    if (!html.includes('data-doc-copy-section=') || !runtimeSource.includes('docs-section-link')) {
      failures.push(`${route}: section deep-link controls are missing their labels or runtime handler`);
    }
  }

  if (route === '/docs/compatibility/' || route === '/en/docs/compatibility/') {
    if (!idsByRoute.get(route)?.has('accessibility')) {
      failures.push(`${route}: accessibility and readability guidance is missing`);
    }
  }

  if (route === '/docs/campaign/' || route === '/en/docs/campaign/') {
    const runtimeSource = pageRuntimeSource(html);
    const copyControlCount = (html.match(/<button\b[^>]*\bdata-doc-copy-text=/g) ?? []).length;
    if (copyControlCount !== 1) {
      failures.push(`${route}: expected one specification-summary copy control, found ${copyControlCount}`);
    }
    if (!runtimeSource.includes('data-doc-copy-text')) {
      failures.push(`${route}: specification-summary copy control is missing its runtime handler`);
    }

    const guideCount = (html.match(/<div\b(?=[^>]*\bid=["']support-check["'])(?=[^>]*\bdata-campaign-decision(?:[\s=>]))[^>]*>/g) ?? []).length;
    const topicIds = [...html.matchAll(/\bdata-campaign-decision-tab=["']([^"']+)["']/g)].map((match) => match[1]);
    const panelIds = [...html.matchAll(/\bdata-campaign-decision-panel=["']([^"']+)["']/g)].map((match) => match[1]);
    const expectedTopics = ['hardware', 'targets', 'platforms', 'privacy', 'delivery', 'support'];
    if (guideCount !== 1) {
      failures.push(`${route}: expected one campaign decision guide at #support-check, found ${guideCount}`);
    }
    if (topicIds.join(',') !== expectedTopics.join(',')) {
      failures.push(`${route}: campaign decision topics are incomplete or out of order (${topicIds.join(',')})`);
    }
    if (panelIds.join(',') !== expectedTopics.join(',')) {
      failures.push(`${route}: campaign decision result panels are incomplete or out of order (${panelIds.join(',')})`);
    }
    if (!/campaign-decision-panels[^>]*\baria-live=["']polite["']/.test(html)) {
      failures.push(`${route}: campaign decision results need an aria-live region`);
    }
    if (!runtimeSource.includes('data-campaign-decision-tab')
      || !runtimeSource.includes('data-campaign-decision-panel')) {
      failures.push(`${route}: campaign decision guide is missing its runtime selection handler`);
    }

    const guidePanels = [...html.matchAll(/<article\b[^>]*\bdata-campaign-decision-panel=["']([^"']+)["'][^>]*>([\s\S]*?)<\/article>/g)];
    const guideLinks = guidePanels.map((match) => match[2].match(/<a\b[^>]*\bhref=["']([^"']+)["']/)?.[1] ?? '');
    const docsRoot = route.startsWith('/en/') ? '/en/docs' : '/docs';
    const expectedGuideLinks = [
      `${docsRoot}/hardware/#display`,
      `${docsRoot}/hardware/#targets`,
      `${docsRoot}/compatibility/`,
      `${docsRoot}/privacy/`,
      '#faq',
      `${docsRoot}/support/`,
    ];
    if (guideLinks.join(',') !== expectedGuideLinks.join(',')) {
      failures.push(`${route}: campaign decision deep links are incomplete or out of order (${guideLinks.join(',')})`);
    }
  }

  if (route === '/docs/support/' || route === '/en/docs/support/') {
    const runtimeSource = pageRuntimeSource(html);
    const copyControlCount = (html.match(/<button\b[^>]*\bdata-doc-copy-text=/g) ?? []).length;
    if (copyControlCount !== 1) {
      failures.push(`${route}: expected one support-request copy control, found ${copyControlCount}`);
    }
    if (!runtimeSource.includes('data-doc-copy-text')) {
      failures.push(`${route}: support-request copy control is missing its runtime handler`);
    }
    if (!html.includes('mailto:i@caiths.com')) {
      failures.push(`${route}: support contact email is missing`);
    }
    for (const id of ['overview', 'before-backing', 'care', 'software', 'self-help', 'request', 'service-terms', 'faq']) {
      if (!idsByRoute.get(route)?.has(id)) failures.push(`${route}: required support section #${id} is missing`);
    }
  }

  if (route === '/docs/troubleshooting/' || route === '/en/docs/troubleshooting/') {
    const guideCount = (html.match(/<div\b[^>]*\bdata-troubleshoot-guide\b[^>]*>/g) ?? []).length;
    const stageIds = [...html.matchAll(/\bdata-troubleshoot-stage="([^"]+)"/g)].map((match) => match[1]);
    const expectedStages = ['discovery', 'connection', 'transfer', 'refresh', 'qi', 'nfc'];
    if (guideCount !== 1) failures.push(`${route}: expected one interactive troubleshooting guide, found ${guideCount}`);
    if (stageIds.join(',') !== expectedStages.join(',')) {
      failures.push(`${route}: troubleshooting stages are incomplete or out of order (${stageIds.join(',')})`);
    }
    if (!/data-troubleshoot-result[^>]*aria-live="polite"/.test(html)) {
      failures.push(`${route}: troubleshooting result needs an aria-live region`);
    }
    if (!html.includes('data-troubleshoot-link')) {
      failures.push(`${route}: troubleshooting result is missing its section deep link`);
    }
  }

  if (route === '/docs/shortcuts/' || route === '/en/docs/shortcuts/') {
    const plannerCount = (html.match(/<div\b[^>]*\bdata-shortcut-planner\b[^>]*>/g) ?? []).length;
    const groupCount = (html.match(/<fieldset\b[^>]*\bdata-shortcut-group=/g) ?? []).length;
    const optionCount = (html.match(/<button\b[^>]*\bdata-shortcut-option=/g) ?? []).length;
    if (plannerCount !== 1) failures.push(`${route}: expected one Shortcut routine planner, found ${plannerCount}`);
    if (groupCount !== 3 || optionCount !== 12) {
      failures.push(`${route}: Shortcut planner needs 3 groups and 12 options, found ${groupCount}/${optionCount}`);
    }
    if (!/data-shortcut-result[^>]*aria-live="polite"/.test(html)) {
      failures.push(`${route}: Shortcut planner result needs an aria-live region`);
    }
    if (!/shortcut-planner-groups" role="group" aria-label=/.test(html)) {
      failures.push(`${route}: Shortcut planner groups need an explicit accessible group label`);
    }
    if (!html.includes('href="#actions"')) failures.push(`${route}: Shortcut planner must link to the action draft`);
  }

  if (route === '/docs/updates/' || route === '/en/docs/updates/') {
    const runtimeSource = pageRuntimeSource(html);
    const filterCount = (html.match(/<button\b[^>]*\bdata-update-filter=/g) ?? []).length;
    const itemCount = (html.match(/\bdata-update-item\b/g) ?? []).length;
    if (filterCount !== 4 || itemCount !== 4) {
      failures.push(`${route}: project updates needs 4 filters and 4 published nodes, found ${filterCount}/${itemCount}`);
    }
    if (!runtimeSource.includes('data-update-filter') || !runtimeSource.includes('data-update-item')) {
      failures.push(`${route}: project update filter handler is missing`);
    }
    for (const id of ['overview', 'timeline', 'gates', 'next', 'faq']) {
      if (!idsByRoute.get(route)?.has(id)) failures.push(`${route}: required updates section #${id} is missing`);
    }
  }

  if (route === '/') {
    const phoneData = html.match(/data-device-size="([^"]+)"[\s\S]*?data-display-ratio="([^"]+)"[\s\S]*?data-display-points="([^"]+)"[\s\S]*?data-display-ppi="([^"]+)"[\s\S]*?data-status-bar-points="([^"]+)"[\s\S]*?data-status-bar-height="([^"]+)"/);
    if (!phoneData || phoneData[1] !== '71.9x150.0x8.75mm' || phoneData[2] !== '1206/2622' || phoneData[3] !== '402x874' || phoneData[4] !== '460' || phoneData[5] !== '402x62' || phoneData[6] !== '0.070938') {
      failures.push(`${route}: iPhone 17 Pro proportion data is missing or drifted`);
    }
    const statusTag = [...html.matchAll(/<div\b[^>]*\bclass=["'][^"']*iphone-statusbar\b[^>]*>/gi)][0]?.[0] ?? '';
    const styleSource = stylesheetTags
      .map((tag) => attributeValue(tag, 'href'))
      .filter((href) => href.startsWith('/'))
      .map((href) => path.join(dist, href.slice(1)))
      .filter((file) => fs.existsSync(file))
      .map((file) => fs.readFileSync(file, 'utf8'))
      .join('\n');
    // Vite may emit a short visibility rule for the status children before
    // the main block. Match the geometry contract independently of that
    // harmless minifier detail.
    const hasCalibratedStatusCss = /\.iphone-statusbar\{[^}]*top:0;[^}]*right:0;[^}]*left:0;[^}]*width:100%;[^}]*height:15\.422886cqw;[^}]*overflow:hidden/.test(styleSource);
    // Astro/Vite minifies custom-property declarations with or without a space
    // after the colon. The geometry contract is about the values, not the
    // formatter used by the generated stylesheet.
    const hasExactScreenGeometry = /--screen-left:\s*4\.229607%;[^}]*--screen-top:\s*2\.53623%;[^}]*--screen-width:\s*91\.540785%;[^}]*--screen-height:\s*94\.92754%/.test(styleSource);
    // The DOM layer owns the calibrated idle pill and lens cover, then expands
    // on transfer without changing its coordinate system.
    const hasCompactIslandGeometry = /\.dynamic-island\{[^}]*top:4\.058%;[^}]*left:35\.848%;[^}]*width:28\.455%;[^}]*height:4\.019%;[^}]*display:(?:none|block);[^}]*opacity:(?:0|1);[^}]*visibility:(?:hidden|visible)/.test(styleSource)
      && /\.iphone-device\[data-state(?:="transfer"|=transfer)\] \.dynamic-island\{[^}]*display:block;[^}]*opacity:1;[^}]*visibility:visible[^}]*background:#000/.test(styleSource);
    const hidesSyntheticCamera = /\.dynamic-island-camera,\.dynamic-island-sensor\{[^}]*display:none/.test(styleSource);
    const statusImageBlocks = [...styleSource.matchAll(/\.iphone-status-image\{[^}]+\}/g)].map((match) => match[0]);
    const hasNativeStatusImage = statusImageBlocks.some((block) =>
      /left:(?:0|-2\.99%)/.test(block)
      && /width:100%/.test(block)
      && /height:100%/.test(block)
      && /object-fit:fill/.test(block)
    );
    const hasStatusAsset = html.includes('class="iphone-status-image protected-media"')
      && html.includes('src="/assets/iphone-17-pro-status.png"')
      && html.includes('width="1056"')
      && html.includes('height="163"')
      && hasNativeStatusImage
      && html.includes('<time>9:41</time>');
    const hasNativeChassisGeometry = /\.iphone-device\{[^}]*--chassis-width:\s*662;[^}]*--chassis-height:\s*1380;[^}]*--physical-width:\s*71\.9;[^}]*--physical-height:\s*150;/.test(styleSource)
      && /\.iphone-device\{[^}]*--frame-ratio:\s*71\.9\s*\/\s*150;/.test(styleSource)
      && /\.iphone-device\{[^}]*aspect-ratio:var\(--frame-ratio\)/.test(styleSource)
      && /\.iphone-frame\{[^}]*object-fit:contain/.test(styleSource)
      && /\.iphone-glass\{[^}]*border-radius:4%\/5\.8% 5\.8% 5\.35% 5\.35%/.test(styleSource);
    const hasCameraControl = html.includes('class="iphone-camera-control"');
    const hasNativeCameraControl = /\.iphone-camera-control\{[^}]*display:none/.test(styleSource);
    if (attributeValue(statusTag, 'data-status-source') !== 'iphone-17-pro-status-png'
      || !html.includes('data-frame-ratio="71.9/150"')
      || !html.includes('data-frame-asset-ratio="662/1380"')
      || !html.includes('data-screen-frame="28x35x606x1310"')
      || !html.includes('data-status-frame="0x0x402x62"')
      || !html.includes('data-status-visible-bounds="193x66x880x40"')
      || !html.includes('data-island-frame="138x14x126x37"')
      || !hasStatusAsset
      || !hasNativeChassisGeometry
      || !hasCalibratedStatusCss
      || !hasExactScreenGeometry
      || !hasCompactIslandGeometry
      || !hasCameraControl
      || !hasNativeCameraControl
      || !hidesSyntheticCamera
      || !html.includes('<time>9:41</time>')) {
      failures.push(`${route}: iPhone status bar asset geometry or fixed 9:41 time is missing`);
    }

    const appleOwnership = elementOwnership(
      html,
      ['apple-stage', 'shortcut-phone', 'iphone-device', 'apple-journey', 'apple-platforms', 'phone-view-stack'],
      ['automation', 'phone-view-compose', 'phone-view-library', 'phone-view-automate', 'phone-view-transfer'],
    );
    const parentHasClass = (entry, className) => entry?.classes.includes(className) ?? false;
    for (const childClass of ['shortcut-phone', 'apple-journey', 'apple-platforms']) {
      if (!parentHasClass(appleOwnership.classParents.get(childClass), 'apple-stage')) {
        failures.push(`${route}: .${childClass} must be a direct child of .apple-stage`);
      }
    }
    if (!parentHasClass(appleOwnership.classParents.get('iphone-device'), 'shortcut-phone')) {
      failures.push(`${route}: the iPhone device must stay inside .shortcut-phone`);
    }
    if (!parentHasClass(appleOwnership.idParents.get('automation'), 'apple-ecosystem')) {
      failures.push(`${route}: #automation must follow .apple-stage inside .apple-ecosystem`);
    }
    for (const panelId of ['phone-view-compose', 'phone-view-library', 'phone-view-automate', 'phone-view-transfer']) {
      if (!parentHasClass(appleOwnership.idParents.get(panelId), 'phone-view-stack')) {
        failures.push(`${route}: #${panelId} must stay inside .phone-view-stack`);
      }
    }
  }

  const canonicalCount = (html.match(/<link rel="canonical"/g) ?? []).length;
  if (canonicalCount !== 1) failures.push(`${route}: expected one canonical, found ${canonicalCount}`);

  if (route !== '/404.html') {
    const schemaCount = (html.match(/type="application\/ld\+json"/g) ?? []).length;
    if (schemaCount !== 1) failures.push(`${route}: expected one JSON-LD block, found ${schemaCount}`);
    const schemaMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (schemaMatch) {
      try {
        const schema = JSON.parse(schemaMatch[1]);
        const nodes = Array.isArray(schema['@graph']) ? schema['@graph'] : [schema];
        const expectedType = productRoutes.includes(route) ? 'Product' : null;
        const primaryNode = expectedType
          ? nodes.find((node) => node?.['@type'] === expectedType)
          : nodes.find((node) => ['TechArticle', 'WebPage'].includes(node?.['@type']));

        if (!primaryNode) {
          failures.push(`${route}: JSON-LD is missing its primary ${expectedType ?? 'TechArticle/WebPage'} node`);
        }

        if (docRoutes.includes(route)) {
          const breadcrumbNode = nodes.find((node) => node?.['@type'] === 'BreadcrumbList');
          const expectedBreadcrumbCount = route === '/docs/' || route === '/en/docs/' ? 2 : 3;
          if (!Array.isArray(breadcrumbNode?.itemListElement)
            || breadcrumbNode.itemListElement.length !== expectedBreadcrumbCount) {
            failures.push(`${route}: BreadcrumbList needs ${expectedBreadcrumbCount} items`);
          } else {
            breadcrumbNode.itemListElement.forEach((item, index) => {
              if (item?.position !== index + 1 || !item?.name || !item?.item) {
                failures.push(`${route}: BreadcrumbList item ${index + 1} needs position, name and URL`);
              }
            });
          }
        }

        if (primaryNode?.['@type'] === 'TechArticle') {
          const published = primaryNode.datePublished;
          const modified = primaryNode.dateModified;
          const validDate = (value) => typeof value === 'string'
            && /^\d{4}-\d{2}-\d{2}$/.test(value)
            && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
          if (!validDate(published) || !validDate(modified)) {
            failures.push(`${route}: TechArticle requires valid datePublished and dateModified values`);
          } else if (modified < published) {
            failures.push(`${route}: dateModified ${modified} predates datePublished ${published}`);
          }
        }

        if (/\bid=["']faq["']/.test(html)) {
          const faqNode = nodes.find((node) => node?.['@type'] === 'FAQPage');
          if (!Array.isArray(faqNode?.mainEntity) || faqNode.mainEntity.length === 0) {
            failures.push(`${route}: visible FAQ content requires a non-empty FAQPage node`);
          }
        }
      } catch (error) {
        failures.push(`${route}: JSON-LD is not valid JSON (${error.message})`);
      }
    }
    const hreflangCount = (html.match(/<link rel="alternate" hreflang=/g) ?? []).length;
    const expectedHreflangCount = docRoutes.includes(route) ? 3 : 7;
    if (hreflangCount !== expectedHreflangCount) {
      failures.push(`${route}: expected ${expectedHreflangCount} hreflang links, found ${hreflangCount}`);
    }
  }

  for (const match of html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/g)) {
    const href = match[1];
    if (!href || /^(?:https?:|mailto:|tel:|data:|javascript:)/.test(href)) continue;
    const target = normalizeRoute(href, route);
    if (!htmlByRoute.has(target.route)) {
      failures.push(`${route}: link ${href} points to missing route ${target.route}`);
      continue;
    }
    if (target.hash && !idsByRoute.get(target.route)?.has(target.hash)) {
      failures.push(`${route}: link ${href} points to missing anchor #${target.hash}`);
    }
  }

  if (productRoutes.includes(route)) {
    const chineseCampaign = route === '/' || route === '/zh-cn/' || route === '/zh-tw/';
    const docsHref = chineseCampaign ? '/docs/' : '/en/docs/';
    const campaignHref = chineseCampaign ? '/docs/campaign/' : '/en/docs/campaign/';
    if (!html.includes(`href="${campaignHref}"`)) {
      failures.push(`${route}: product story must link to ${campaignHref}`);
    }

    const sceneIds = [...html.matchAll(/\bdata-ink-label=["']([^"']+)["']/g)].map((match) => match[1]);
    const expectedSceneIds = ['rain', 'branch', 'bird', 'experience'];
    if (sceneIds.join(',') !== expectedSceneIds.join(',')) {
      failures.push(`${route}: four-frame tabs are incomplete or out of order (${sceneIds.join(',')})`);
    }
    if ((html.match(/class="ink-canvas-fallback"/g) ?? []).length !== 1) {
      failures.push(`${route}: the four-frame stage needs one static Canvas fallback`);
    }
    const fallbackCloudCount = (html.match(/--cloud-color:/g) ?? []).length;
    if (fallbackCloudCount !== 6) {
      failures.push(`${route}: the static Canvas fallback needs six pigment clouds, found ${fallbackCloudCount}`);
    }

    const liveFileTag = html.match(/<input\b[^>]*\bdata-live-file\b[^>]*>/i)?.[0] ?? '';
    const liveTextTag = html.match(/<textarea\b[^>]*\bdata-live-input\b[^>]*>/i)?.[0] ?? '';
    if (attributeValue(liveFileTag, 'accept') !== 'image/jpeg,image/png,image/webp,image/avif') {
      failures.push(`${route}: live preview file types are incomplete`);
    }
    if (attributeValue(liveTextTag, 'maxlength') !== '120') {
      failures.push(`${route}: live preview text must keep maxlength="120"`);
    }
    if (!html.includes('data-live-reset')) failures.push(`${route}: live preview reset control is missing`);
    if (!/<p\b[^>]*\bdata-live-status\b[^>]*\baria-live=["']polite["']/i.test(html)) {
      failures.push(`${route}: live preview privacy/status copy needs an aria-live region`);
    }
    if (!html.includes('class="mode-open-note"')) {
      failures.push(`${route}: open-ended content track after the four examples is missing`);
    }

    const evidenceBlock = html.match(/<div class="specification-evidence"[\s\S]*?<\/div>/)?.[0] ?? '';
    const evidenceLinks = [...evidenceBlock.matchAll(/<a href="([^"]+)"/g)].map((match) => match[1]);
    const expectedEvidenceLinks = [
      `${docsHref}#specifications`,
      `${campaignHref}#targets`,
      `${campaignHref}#before-pledge`,
    ];
    if (evidenceLinks.join(',') !== expectedEvidenceLinks.join(',')) {
      failures.push(`${route}: specification evidence links are incomplete or out of order (${evidenceLinks.join(',')})`);
    }
  }
}

const notFoundHtml = htmlByRoute.get('/404.html') ?? '';
if (!notFoundHtml.includes('/assets/peanup-product-cutout.webp')) {
  failures.push('/404.html: dark-safe transparent product image is missing');
}
if (notFoundHtml.includes('/assets/peanup-product.webp')) {
  failures.push('/404.html: white-background product photograph must not be used');
}

const assetReferences = (html, extension) => [...html.matchAll(new RegExp(`(?:href|src)="(/_astro/[^"]+\\.${extension})"`, 'g'))]
  .map((match) => match[1]);
const assetFile = (reference) => path.join(dist, reference.slice(1));
const gzipBytes = (file) => gzipSync(fs.readFileSync(file), { level: 9 }).byteLength;
const brotliBytes = (file) => brotliCompressSync(fs.readFileSync(file), {
  params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 6 },
}).byteLength;
const sum = (values) => values.reduce((total, value) => total + value, 0);
const homeHtml = htmlByRoute.get('/');
const docsHtml = htmlByRoute.get('/docs/');
const homeCss = assetReferences(homeHtml, 'css');
const docsCss = assetReferences(docsHtml, 'css');
const homeJs = assetReferences(homeHtml, 'js');
const sharedCss = homeCss.filter((reference) => docsCss.includes(reference));
const productCss = homeCss.filter((reference) => !docsCss.includes(reference));
const docsOnlyCss = docsCss.filter((reference) => !homeCss.includes(reference));

if (sharedCss.length !== 1 || productCss.length !== 1 || docsOnlyCss.length !== 1 || homeJs.length !== 2) {
  failures.push('performance budget check could not identify the expected shared/product/docs bundles');
}

const sharedCssGzip = sum(sharedCss.map((reference) => gzipBytes(assetFile(reference))));
const productCssGzip = sum(productCss.map((reference) => gzipBytes(assetFile(reference))));
const docsCssGzip = sum(docsOnlyCss.map((reference) => gzipBytes(assetFile(reference))));
const persistentJsGzip = sum(homeJs.map((reference) => gzipBytes(assetFile(reference))));
const allJsFiles = fs.readdirSync(path.join(dist, '_astro'))
  .filter((file) => file.endsWith('.js'))
  .map((file) => path.join(dist, '_astro', file));
const allJsGzip = sum(allJsFiles.map(gzipBytes));
const inlineModuleGzipByRoute = [...htmlByRoute].map(([route, html]) => {
  const modules = [...html.matchAll(/<script\b(?=[^>]*\btype=["']module["'])(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)]
    .map((match) => match[1].trim())
    .filter(Boolean);
  return [route, sum(modules.map((module) => gzipSync(Buffer.from(module), { level: 9 }).byteLength))];
});
const [heaviestInlineRoute, maxInlineJsGzip] = inlineModuleGzipByRoute
  .sort((left, right) => right[1] - left[1])[0] ?? ['/', 0];
const totalInteractiveJsGzip = allJsGzip + maxInlineJsGzip;
const heroFile = allJsFiles.find((file) => path.basename(file).startsWith('heroSketch.'));
const heroGzip = heroFile ? gzipBytes(heroFile) : 0;
const persistentJsFiles = new Set(homeJs.map(assetFile));
const deferredJsFiles = allJsFiles.filter((file) => !persistentJsFiles.has(file));
const deferredJsRaw = sum(deferredJsFiles.map((file) => fs.statSync(file).size));
const deferredJsGzip = sum(deferredJsFiles.map(gzipBytes));
const homeTextGzip = gzipSync(Buffer.from(homeHtml), { level: 9 }).byteLength
  + sum([...homeCss, ...homeJs].map((reference) => gzipBytes(assetFile(reference))));

const criticalTextBrotli = brotliCompressSync(Buffer.from(homeHtml), {
  params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 6 },
}).byteLength + sum([...homeCss, ...homeJs].map((reference) => brotliBytes(assetFile(reference))));
const criticalImages = [
  'assets/peanup-product-preview-light.webp',
  'assets/peanup-product-preview-dark.webp',
  'assets/peanup-product.avif',
].map((file) => path.join(dist, file));
const criticalImagesBytes = sum(criticalImages.map((file) => fs.statSync(file).size));
const criticalBrotli = criticalTextBrotli + criticalImagesBytes;

const performanceBudgets = [
  ['shared CSS gzip', sharedCssGzip, 4 * 1024],
  ['product CSS gzip', productCssGzip, 20 * 1024],
  ['Docs CSS gzip', docsCssGzip, 12 * 1024],
  ['persistent product JS gzip', persistentJsGzip, 6 * 1024],
  ['four-frame animation gzip', heroGzip, 11 * 1024],
  ['all interactive JS gzip', totalInteractiveJsGzip, 30 * 1024],
  ['critical first view Brotli', criticalBrotli, 70 * 1024],
];
for (const [label, actual, budget] of performanceBudgets) {
  if (actual > budget) failures.push(`${label}: ${actual} B exceeds ${budget} B budget`);
}

const sitemapFile = path.join(dist, 'sitemap.xml');
const sitemap = fs.existsSync(sitemapFile) ? fs.readFileSync(sitemapFile, 'utf8') : '';
for (const route of sitemapRoutes) {
  const url = new URL(route, 'https://pean.caiths.com').href;
  if (!sitemap.includes(`<loc>${url}</loc>`)) failures.push(`sitemap.xml: missing ${url}`);
}
if (sitemap.includes('<loc>https://pean.caiths.com/zh-cn/</loc>')) {
  failures.push('sitemap.xml: compatibility route /zh-cn/ must stay excluded');
}

const publicMetadata = path.join(dist, '.DS_Store');
if (fs.existsSync(publicMetadata)) failures.push('dist/.DS_Store must not ship');

if (failures.length > 0) {
  console.error(`Site verification failed with ${failures.length} issue(s):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`Verified ${expectedHtmlRoutes.length} HTML routes, internal links, anchors, metadata and sitemap entries.`);
  console.log(`Performance budgets passed: ${persistentJsGzip} B persistent JS gzip, ${totalInteractiveJsGzip} B total JS gzip (${maxInlineJsGzip} B max inline on ${heaviestInlineRoute}), ${criticalBrotli} B critical Brotli.`);
  console.log(`Performance detail: ${sharedCssGzip} B shared CSS gzip, ${productCssGzip} B product CSS gzip, ${docsCssGzip} B Docs CSS gzip, ${heroGzip} B four-frame animation gzip, ${deferredJsRaw} B/${deferredJsGzip} B deferred JS raw/gzip, ${homeTextGzip} B first-view text gzip, ${criticalImagesBytes} B first-view images.`);
}
