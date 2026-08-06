const filters = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-update-filter]'));
const items = Array.from(document.querySelectorAll<HTMLElement>('[data-update-item]'));
const empty = document.querySelector<HTMLElement>('[data-updates-empty]');

if (filters.length > 0 && items.length > 0) {
  const applyFilter = (filter: string, selected: HTMLButtonElement) => {
    filters.forEach((button) => {
      const isSelected = button === selected;
      button.setAttribute('aria-pressed', String(isSelected));
      button.classList.toggle('is-active', isSelected);
    });

    let visible = 0;
    items.forEach((item) => {
      const matches = filter === 'all' || item.dataset.updateType === filter;
      item.hidden = !matches;
      if (matches) visible += 1;
    });
    if (empty) empty.hidden = visible > 0;
  };

  filters.forEach((button) => {
    button.addEventListener('click', () => applyFilter(button.dataset.updateFilter ?? 'all', button));
  });

  const initial = filters.find((button) => button.getAttribute('aria-pressed') === 'true') ?? filters[0];
  if (initial) applyFilter(initial.dataset.updateFilter ?? 'all', initial);
}
