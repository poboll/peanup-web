const liveStudio = document.querySelector<HTMLElement>('[data-live-studio]');

if (liveStudio) {
  const canvas = liveStudio.querySelector<HTMLCanvasElement>('[data-live-canvas]');
  const context = canvas?.getContext('2d', { willReadFrequently: true });
  const photo = liveStudio.querySelector<HTMLElement>('[data-live-photo]');
  const fileInput = liveStudio.querySelector<HTMLInputElement>('[data-live-file]');
  const textInput = liveStudio.querySelector<HTMLTextAreaElement>('[data-live-input]');
  const toolbar = liveStudio.querySelector<HTMLElement>('.ink-live-toolbar');
  const status = liveStudio.querySelector<HTMLElement>('[data-live-status]');
  const count = liveStudio.querySelector<HTMLOutputElement>('[data-live-count]');
  const reset = liveStudio.querySelector<HTMLButtonElement>('[data-live-reset]');
  const start = document.querySelector<HTMLButtonElement>('[data-live-start]');
  const introText = liveStudio.dataset.liveIntro ?? 'Try a frame here';
  const readyText = liveStudio.dataset.liveReady ?? 'Six-color refresh complete';
  const textReady = liveStudio.dataset.liveTextReady ?? 'Text held on e-paper';
  const errorText = liveStudio.dataset.liveError ?? 'This image could not be read';
  const fallbackText = liveStudio.dataset.liveFallback ?? 'Keep today in plain sight.';
  const initialStatus = status?.textContent ?? '';
  const palette = [[31,34,38], [226,230,225], [35,63,142], [53,86,58], [98,32,30], [193,187,30]] as const;
  let objectUrl = '';
  let renderRevision = 0;

  const resizeTextInput = () => {
    if (!textInput) return;
    const styles = getComputedStyle(textInput);
    const minHeight = Number.parseFloat(styles.minHeight) || 40;
    const maxHeight = Number.parseFloat(styles.maxHeight) || 108;
    textInput.style.height = 'auto';
    textInput.style.height = `${Math.max(minHeight, Math.min(textInput.scrollHeight, maxHeight))}px`;
    textInput.style.overflowY = textInput.scrollHeight > maxHeight ? 'auto' : 'hidden';
  };

  const updateCount = () => {
    if (!count || !textInput) return;
    count.value = `${Array.from(textInput.value).length} / ${textInput.maxLength}`;
  };

  const enforceTextLimit = () => {
    if (!textInput || textInput.maxLength < 1) return;
    const characters = Array.from(textInput.value);
    if (characters.length <= textInput.maxLength) return;
    textInput.value = characters.slice(0, textInput.maxLength).join('');
    textInput.setSelectionRange(textInput.value.length, textInput.value.length);
  };

  const previewBottomInset = () => {
    if (!canvas || !toolbar) return 210;
    const renderedHeight = Math.max(1, liveStudio.getBoundingClientRect().height);
    return Math.max(190, toolbar.getBoundingClientRect().height * canvas.height / renderedHeight + 36);
  };

  const nearest = (r: number, g: number, b: number) => {
    const lightness = r * .2126 + g * .7152 + b * .0722;
    const chroma = Math.max(r, g, b) - Math.min(r, g, b);
    if (lightness > 205 && chroma < 34) return palette[1];
    let result: readonly [number, number, number] = palette[0];
    let distance = Infinity;
    for (const color of palette) {
      const dr = r - color[0]; const dg = g - color[1]; const db = b - color[2];
      const next = dr * dr * .27 + dg * dg * .66 + db * db * .07;
      if (next < distance) { result = color; distance = next; }
    }
    return result;
  };

  const dither = () => {
    if (!canvas || !context) return;
    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    const work = new Float32Array(image.data);
    for (let y = 0; y < canvas.height; y += 1) {
      const reverse = y % 2 === 1;
      for (let step = 0; step < canvas.width; step += 1) {
        const x = reverse ? canvas.width - step - 1 : step;
        const index = (y * canvas.width + x) * 4;
        const color = nearest(work[index], work[index + 1], work[index + 2]);
        const error = [work[index] - color[0], work[index + 1] - color[1], work[index + 2] - color[2]];
        image.data[index] = color[0]; image.data[index + 1] = color[1]; image.data[index + 2] = color[2]; image.data[index + 3] = 255;
        const spread = (dx: number, dy: number, weight: number) => {
          const nx = x + (reverse ? -dx : dx); const ny = y + dy;
          if (nx < 0 || nx >= canvas.width || ny >= canvas.height) return;
          const target = (ny * canvas.width + nx) * 4;
          for (let channel = 0; channel < 3; channel += 1) work[target + channel] += error[channel] * weight;
        };
        spread(1,0,7/16); spread(-1,1,3/16); spread(0,1,5/16); spread(1,1,1/16);
      }
    }
    context.putImageData(image, 0, 0);
  };

  const intro = () => {
    if (!canvas || !context) return;
    context.fillStyle = '#e2e6e1'; context.fillRect(0, 0, canvas.width, canvas.height);
    const barWidth = 64;
    const barGap = 30;
    const barStart = (canvas.width - (barWidth * 4 + barGap * 3)) / 2;
    ['#23408e','#35563a','#62201e','#c1bb1e'].forEach((color, index) => { context.fillStyle = color; context.fillRect(barStart + index * (barWidth + barGap), 94, barWidth, 8); });
    let titleSize = 42;
    do {
      context.font = `500 ${titleSize}px "Songti SC", "Yu Mincho", serif`;
      titleSize -= 1;
    } while (titleSize > 27 && context.measureText(introText).width > canvas.width - 88);
    context.fillStyle = '#1f2226'; context.textAlign = 'center'; context.textBaseline = 'middle';
    context.fillText(introText, canvas.width / 2, canvas.height * .35);
    context.font = '13px ui-monospace, monospace'; context.fillText('PHOTO  /  TEXT  /  SIX COLORS', canvas.width / 2, canvas.height * .415);
    context.textBaseline = 'alphabetic';
  };

  const drawText = () => {
    if (!canvas || !context || !textInput) return;
    context.fillStyle = '#e2e6e1'; context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#23408e'; context.fillRect(46, 48, 72, 7);
    context.fillStyle = '#1f2226'; context.textAlign = 'left'; context.font = '12px ui-monospace, monospace'; context.fillText('PEANUP / NOTE', 46, 86);
    const wrapText = (fontSize: number) => {
      context.font = `500 ${fontSize}px "Songti SC", "Yu Mincho", serif`;
      const lines: string[] = [];
      for (const paragraph of (textInput.value || fallbackText).split('\n')) {
        let line = '';
        let breakAt = -1;
        for (const character of paragraph) {
          const candidate = line + character;
          if (!line || context.measureText(candidate).width <= canvas.width - 92) {
            line = candidate;
            if (/\s/.test(character)) breakAt = line.length;
            continue;
          }
          if (breakAt > 0) {
            lines.push(line.slice(0, breakAt).trimEnd());
            line = `${line.slice(breakAt).trimStart()}${character}`;
          } else {
            lines.push(line);
            line = character.trimStart();
          }
          breakAt = -1;
          for (let index = line.length - 1; index >= 0; index -= 1) {
            if (/\s/.test(line[index])) { breakAt = index + 1; break; }
          }
        }
        if (line) lines.push(line.trimEnd());
        else if (!paragraph) lines.push('');
      }
      return lines;
    };

    let fontSize = 42;
    let lines = wrapText(fontSize);
    const textTop = 158;
    const availableHeight = canvas.height - textTop - previewBottomInset();
    let lineHeight = Math.round(fontSize * 1.38);
    while (fontSize > 22 && lines.length > Math.min(7, Math.floor(availableHeight / lineHeight))) {
      fontSize -= 1;
      lines = wrapText(fontSize);
      lineHeight = Math.round(fontSize * 1.38);
    }
    const visibleLines = Math.max(1, Math.min(7, Math.floor(availableHeight / lineHeight)));
    const fittedLines = lines.slice(0, visibleLines);
    if (lines.length > visibleLines && fittedLines.length) {
      const last = fittedLines.length - 1;
      fittedLines[last] = `${fittedLines[last].replace(/[\s…]+$/u, '')}…`;
    }
    context.font = `500 ${fontSize}px "Songti SC", "Yu Mincho", serif`;
    fittedLines.forEach((value, index) => context.fillText(value, 46, textTop + index * lineHeight));
    context.fillStyle = '#62201e'; context.fillRect(46, canvas.height - previewBottomInset() + 18, canvas.width - 92, 2);
  };

  const handleFile = (file?: File) => {
    if (!file || !canvas || !context) return;
    if (!file.type.startsWith('image/')) {
      if (status) status.textContent = errorText;
      return;
    }
    const revision = ++renderRevision;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      if (revision !== renderRevision) return;
      const scale = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
      const width = image.naturalWidth * scale; const height = image.naturalHeight * scale;
      context.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
      dither();
      if (status) status.textContent = readyText;
    };
    image.onerror = () => { if (revision === renderRevision && status) status.textContent = errorText; };
    image.src = objectUrl;
  };

  start?.addEventListener('click', () => fileInput?.click());
  fileInput?.addEventListener('change', () => handleFile(fileInput.files?.[0]));
  photo?.addEventListener('dragover', (event) => { event.preventDefault(); photo.classList.add('dragging'); });
  photo?.addEventListener('dragleave', () => photo.classList.remove('dragging'));
  photo?.addEventListener('drop', (event) => { event.preventDefault(); photo.classList.remove('dragging'); handleFile(event.dataTransfer?.files[0]); });
  textInput?.addEventListener('input', () => {
    renderRevision += 1;
    enforceTextLimit();
    resizeTextInput();
    updateCount();
    drawText();
    if (status) status.textContent = textReady;
  });
  reset?.addEventListener('click', () => {
    renderRevision += 1;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = '';
    if (fileInput) fileInput.value = '';
    if (textInput) textInput.value = fallbackText;
    resizeTextInput();
    updateCount();
    intro();
    if (status) status.textContent = initialStatus;
  });
  window.addEventListener('resize', resizeTextInput, { passive: true });
  window.addEventListener('beforeunload', () => { if (objectUrl) URL.revokeObjectURL(objectUrl); });
  resizeTextInput();
  updateCount();
  intro();
}

export {};
