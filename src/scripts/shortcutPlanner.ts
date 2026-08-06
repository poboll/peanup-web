const planners = Array.from(document.querySelectorAll<HTMLElement>('[data-shortcut-planner]'));
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

planners.forEach((planner) => {
  const groups = Array.from(planner.querySelectorAll<HTMLElement>('[data-shortcut-group]'));
  const result = planner.querySelector<HTMLElement>('[data-shortcut-result]');
  const summary = planner.querySelector<HTMLElement>('[data-shortcut-summary]');
  const notes = planner.querySelector<HTMLElement>('[data-shortcut-notes]');
  if (!groups.length || !result || !summary || !notes) return;

  const updateResult = () => {
    const selected = groups
      .map((group) => group.querySelector<HTMLButtonElement>('[data-shortcut-option][aria-pressed="true"]'))
      .filter((button): button is HTMLButtonElement => Boolean(button));
    summary.textContent = selected.map((button) => button.dataset.shortcutPhrase ?? '').join('');
    notes.textContent = selected.map((button) => button.dataset.shortcutNote ?? '').join(' ');

    result.classList.remove('is-updating');
    if (!reduceMotion.matches) {
      void result.offsetWidth;
      result.classList.add('is-updating');
    }
  };

  groups.forEach((group) => {
    const buttons = Array.from(group.querySelectorAll<HTMLButtonElement>('[data-shortcut-option]'));
    const select = (button: HTMLButtonElement, moveFocus = false) => {
      buttons.forEach((candidate) => {
        const active = candidate === button;
        candidate.setAttribute('aria-pressed', active ? 'true' : 'false');
        candidate.tabIndex = active ? 0 : -1;
      });
      updateResult();
      if (moveFocus) button.focus();
    };

    buttons.forEach((button) => button.addEventListener('click', () => select(button)));
    group.addEventListener('keydown', (event) => {
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
      select(buttons[nextIndex], true);
    });
  });
});

export {};
