const toc = document.querySelector<HTMLElement>('[data-doc-toc]');
const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-doc-toc-link]'));
const sectionIds = Array.from(new Set(links.map((link) => link.dataset.docTocLink ?? '').filter(Boolean)));
const sections = sectionIds
  .map((id) => document.getElementById(id))
  .filter((section): section is HTMLElement => Boolean(section));
const mobileToc = document.querySelector<HTMLDetailsElement>('.docs-toc-mobile');
const mobileDocsMenu = document.querySelector<HTMLDetailsElement>('.docs-mobile-nav');
const desktopDocsMenu = document.querySelector<HTMLDetailsElement>('.docs-document-switcher');
const mobileTocNumber = document.querySelector<HTMLElement>('[data-doc-toc-current-number]');
const mobileTocLabel = document.querySelector<HTMLElement>('[data-doc-toc-current-label]');
const progress = document.querySelector<HTMLElement>('[data-doc-progress]');
const primaryTabs = document.querySelector<HTMLElement>('[data-doc-primary-tabs]');
const docsMapDisclosure = document.querySelector<HTMLDetailsElement>('[data-doc-map-disclosure]');
const printButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-doc-print]'));
const copyTextButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-doc-copy-text]'));
const troubleshootingGuides = Array.from(document.querySelectorAll<HTMLElement>('[data-troubleshoot-guide]'));
const campaignDecisionGuides = Array.from(document.querySelectorAll<HTMLElement>('[data-campaign-decision]'));
const docsLayout = document.querySelector<HTMLElement>('.docs-layout');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const compactDocs = window.matchMedia('(max-width: 820px)');
let scrollFrame = 0;
let activeId = '';

const syncDocsMap = () => {
  if (docsMapDisclosure) docsMapDisclosure.open = !compactDocs.matches;
};

syncDocsMap();
compactDocs.addEventListener('change', syncDocsMap);

const syncProgress = () => {
  if (!progress) return;
  const maximum = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const value = Math.min(1, Math.max(0, window.scrollY / maximum));
  progress.style.transform = `scaleX(${value})`;
};

const setActive = (id: string) => {
  if (!id || activeId === id) return;
  activeId = id;
  links.forEach((link) => {
    const active = link.dataset.docTocLink === id;
    if (active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });

  const activeLink = links.find((link) => link.dataset.docTocLink === id);
  if (activeLink) {
    if (mobileTocNumber) mobileTocNumber.textContent = activeLink.dataset.docTocIndex ?? '';
    if (mobileTocLabel) mobileTocLabel.textContent = activeLink.dataset.docTocLabel ?? activeLink.textContent?.trim() ?? '';
  }
};

const syncSections = () => {
  if (!sections.length) return;
  const marker = window.innerHeight * .28;
  let current = sections[0];
  for (const section of sections) {
    if (section.getBoundingClientRect().top <= marker) current = section;
    else break;
  }
  if (current) setActive(current.id);
};

if (toc && links.length && sections.length) {
  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top));
    const nearest = visible[0]?.target;
    if (nearest instanceof HTMLElement) setActive(nearest.id);
  }, { rootMargin: '-18% 0px -68% 0px', threshold: [0, .01] });

  sections.forEach((section) => observer.observe(section));
  syncSections();
}

mobileToc?.addEventListener('click', (event) => {
  if (event.target instanceof Element && event.target.closest('a')) mobileToc.open = false;
});

mobileToc?.addEventListener('toggle', () => {
  if (!mobileToc.open) return;
  if (mobileDocsMenu) mobileDocsMenu.open = false;
  if (desktopDocsMenu) desktopDocsMenu.open = false;
});

mobileDocsMenu?.addEventListener('toggle', () => {
  if (!mobileDocsMenu.open) return;
  if (mobileToc) mobileToc.open = false;
  if (desktopDocsMenu) desktopDocsMenu.open = false;
});

desktopDocsMenu?.addEventListener('toggle', () => {
  if (!desktopDocsMenu.open) return;
  if (mobileToc) mobileToc.open = false;
  if (mobileDocsMenu) mobileDocsMenu.open = false;
});

const docMenus = [desktopDocsMenu, mobileDocsMenu, mobileToc].filter(
  (menu): menu is HTMLDetailsElement => Boolean(menu),
);

document.addEventListener('pointerdown', (event) => {
  if (!(event.target instanceof Node)) return;
  docMenus.forEach((menu) => {
    if (menu.open && !menu.contains(event.target as Node)) menu.open = false;
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  const openMenu = docMenus.find((menu) => menu.open);
  if (!openMenu) return;
  openMenu.open = false;
  openMenu.querySelector<HTMLElement>('summary')?.focus();
});

const scheduleSync = () => {
  if (scrollFrame) return;
  scrollFrame = window.requestAnimationFrame(() => {
    scrollFrame = 0;
    syncSections();
    syncProgress();
  });
};

window.addEventListener('scroll', scheduleSync, { passive: true });
window.addEventListener('resize', scheduleSync, { passive: true });
window.addEventListener('hashchange', scheduleSync);
window.addEventListener('load', scheduleSync, { once: true });
syncProgress();

const centerCurrentPrimaryTab = () => {
  if (!primaryTabs || window.innerWidth > 820) return;
  const activeTab = primaryTabs.querySelector<HTMLElement>('[aria-current="page"]');
  if (!activeTab) {
    primaryTabs.scrollLeft = 0;
    return;
  }

  primaryTabs.scrollLeft = Math.max(0, activeTab.offsetLeft - (primaryTabs.clientWidth - activeTab.offsetWidth) / 2);
};

window.addEventListener('load', centerCurrentPrimaryTab, { once: true });
compactDocs.addEventListener('change', centerCurrentPrimaryTab);
centerCurrentPrimaryTab();

printButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const menu = button.closest('details');
    if (menu instanceof HTMLDetailsElement) menu.open = false;
    window.requestAnimationFrame(() => window.print());
  });
});

const copyText = async (value: string) => {
  let clipboardWrite: Promise<void> | null = null;
  try {
    clipboardWrite = navigator.clipboard?.writeText(value) ?? null;
  } catch {}

  const field = document.createElement('textarea');
  field.value = value;
  field.setAttribute('readonly', '');
  field.style.cssText = 'position:fixed;inset:auto auto 0 -9999px;opacity:0';
  document.body.append(field);
  field.select();
  const legacyDocument = document as unknown as { execCommand(commandId: string): boolean };
  const copied = legacyDocument.execCommand('copy');
  field.remove();

  if (copied) {
    clipboardWrite?.catch(() => undefined);
    return true;
  }

  if (!clipboardWrite) return false;

  return await Promise.race([
    clipboardWrite.then(() => true).catch(() => false),
    new Promise<boolean>((resolve) => window.setTimeout(() => resolve(false), 500)),
  ]);
};

copyTextButtons.forEach((button) => {
  const status = button.querySelector<HTMLElement>('[data-doc-copy-status]');
  const defaultLabel = button.dataset.docCopyLabel ?? status?.textContent ?? 'Copy';
  let feedbackTimer = 0;

  button.addEventListener('click', async () => {
    window.clearTimeout(feedbackTimer);
    button.disabled = true;
    const copied = await copyText(button.dataset.docCopyText ?? '');
    const feedback = copied
      ? button.dataset.docCopySuccess ?? 'Copied'
      : button.dataset.docCopyFailed ?? 'Copy failed';
    if (status) status.textContent = feedback;
    button.classList.toggle('is-copied', copied);
    button.disabled = false;
    feedbackTimer = window.setTimeout(() => {
      if (status) status.textContent = defaultLabel;
      button.classList.remove('is-copied');
    }, 4000);
  });
});

if (docsLayout) {
  const copyLabel = docsLayout.dataset.docCopySection ?? 'Copy section link';
  const copyingLabel = docsLayout.dataset.docCopyingSection ?? 'Copying…';
  const copiedLabel = docsLayout.dataset.docCopiedSection ?? 'Link copied';
  const failedLabel = docsLayout.dataset.docCopySectionFailed ?? 'Copy the link from the address bar';
  const sectionHeaders = Array.from(document.querySelectorAll<HTMLElement>('.docs-section[id] > header'));
  const feedbackTimers = new WeakMap<HTMLButtonElement, number>();

  sectionHeaders.forEach((header) => {
    const section = header.parentElement;
    if (!(section instanceof HTMLElement) || header.querySelector('.docs-section-link')) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'docs-section-link';
    button.setAttribute('aria-label', copyLabel);
    button.title = copyLabel;
    button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 14.5l5-5m-7.8 8.2-1.4 1.4a3 3 0 0 1-4.2-4.2l4.2-4.2a3 3 0 0 1 4.2 0m7.8-4.4 1.4-1.4a3 3 0 1 1 4.2 4.2l-4.2 4.2a3 3 0 0 1-4.2 0" /></svg><span></span>';
    const label = button.querySelector('span');
    if (label) label.textContent = copyLabel;
    header.append(button);
  });

  docsLayout.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLButtonElement>('.docs-section-link');
    const section = button?.closest<HTMLElement>('.docs-section[id]');
    if (!button || !section) return;

    const label = button.querySelector('span');
    const url = new URL(window.location.href);
    url.hash = section.id;
    window.history.replaceState(null, '', url);
    button.setAttribute('aria-label', copyingLabel);
    button.title = copyingLabel;
    if (label) label.textContent = copyingLabel;
    button.classList.add('is-copying');
    const copied = await copyText(url.href);
    const feedback = copied ? copiedLabel : failedLabel;
    button.setAttribute('aria-label', feedback);
    button.title = feedback;
    if (label) label.textContent = feedback;
    button.classList.remove('is-copying');
    button.classList.toggle('is-copied', copied);
    window.clearTimeout(feedbackTimers.get(button));
    feedbackTimers.set(button, window.setTimeout(() => {
      button.setAttribute('aria-label', copyLabel);
      button.title = copyLabel;
      if (label) label.textContent = copyLabel;
      button.classList.remove('is-copied');
    }, 4000));
  });
}

troubleshootingGuides.forEach((guide) => {
  const picker = guide.querySelector<HTMLElement>('[data-troubleshoot-picker]');
  const output = guide.querySelector<HTMLElement>('[data-troubleshoot-result]');
  const buttons = picker
    ? Array.from(picker.querySelectorAll<HTMLButtonElement>('[data-troubleshoot-stage]'))
    : [];
  if (!picker || !output || buttons.length === 0) return;

  const title = output.querySelector<HTMLElement>('[data-troubleshoot-title]');
  const action = output.querySelector<HTMLElement>('[data-troubleshoot-action]');
  const note = output.querySelector<HTMLElement>('[data-troubleshoot-note]');
  const link = output.querySelector<HTMLAnchorElement>('[data-troubleshoot-link]');
  const linkLabel = link?.querySelector<HTMLElement>('span');

  const selectStage = (button: HTMLButtonElement, moveFocus = false) => {
    buttons.forEach((candidate) => {
      const selected = candidate === button;
      candidate.setAttribute('aria-pressed', selected ? 'true' : 'false');
      candidate.tabIndex = selected ? 0 : -1;
    });

    if (title) title.textContent = button.dataset.stageTitle ?? '';
    if (action) action.textContent = button.dataset.stageAction ?? '';
    if (note) note.textContent = button.dataset.stageNote ?? '';
    if (link) link.href = button.dataset.stageHref ?? '#quick-check';
    if (linkLabel) linkLabel.textContent = button.dataset.stageLink ?? '';

    output.classList.remove('is-updating');
    if (!reduceMotion.matches) {
      void output.offsetWidth;
      output.classList.add('is-updating');
    }
    if (moveFocus) button.focus();
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => selectStage(button));
  });

  picker.addEventListener('keydown', (event) => {
    if (!(event.target instanceof HTMLButtonElement)) return;
    const index = buttons.indexOf(event.target);
    if (index < 0) return;

    let nextIndex = index;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % buttons.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + buttons.length) % buttons.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = buttons.length - 1;
    else return;

    event.preventDefault();
    selectStage(buttons[nextIndex], true);
  });
});

campaignDecisionGuides.forEach((guide) => {
  const picker = guide.querySelector<HTMLElement>('[data-campaign-decision-tabs]');
  const buttons = picker
    ? Array.from(picker.querySelectorAll<HTMLButtonElement>('[data-campaign-decision-tab]'))
    : [];
  const panels = Array.from(guide.querySelectorAll<HTMLElement>('[data-campaign-decision-panel]'));
  if (!picker || buttons.length === 0 || panels.length === 0) return;

  const selectTopic = (button: HTMLButtonElement, moveFocus = false) => {
    const id = button.dataset.campaignDecisionTab ?? '';
    buttons.forEach((candidate) => {
      const selected = candidate === button;
      candidate.setAttribute('aria-pressed', selected ? 'true' : 'false');
      candidate.tabIndex = selected ? 0 : -1;
    });
    panels.forEach((panel) => {
      const selected = panel.dataset.campaignDecisionPanel === id;
      panel.hidden = !selected;
      panel.classList.toggle('is-active', selected);
    });
    const activePanel = panels.find((panel) => panel.dataset.campaignDecisionPanel === id);
    if (activePanel && !reduceMotion.matches) {
      activePanel.classList.remove('is-entering');
      void activePanel.offsetWidth;
      activePanel.classList.add('is-entering');
    }
    if (moveFocus) button.focus();
  };

  buttons.forEach((button) => button.addEventListener('click', () => selectTopic(button)));
  picker.addEventListener('keydown', (event) => {
    if (!(event.target instanceof HTMLButtonElement)) return;
    const index = buttons.indexOf(event.target);
    if (index < 0) return;
    let nextIndex = index;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % buttons.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + buttons.length) % buttons.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = buttons.length - 1;
    else return;
    event.preventDefault();
    selectTopic(buttons[nextIndex], true);
  });
});

export {};
