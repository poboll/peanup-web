export const localeOrder = ['zh-cn', 'en', 'zh-tw', 'ja', 'de', 'fr'] as const;

export type Locale = (typeof localeOrder)[number];

export interface LocaleMeta {
  htmlLang: string;
  name: string;
  path: string;
  ogLocale: string;
}

export interface ProductSpec {
  value: string;
  label: string;
  note?: string;
}

export interface CanvasSceneCopy {
  id: 'rain' | 'branch' | 'bird' | 'experience';
  number: string;
  title: string;
  detail: string;
  canvasHeading?: string;
  canvasTitle: string;
  canvasSubtitle: string;
  canvasMeta: string;
  date?: string;
  weather?: string;
  quote?: string;
  quoteSource?: string;
}

interface FeatureCopy {
  label: string;
  title: string;
  body: string;
}

interface HardwareCopy extends FeatureCopy {
  short: string;
}

export interface ProductCopy {
  locale: Locale;
  meta: { title: string; description: string };
  nav: { product: string; experience: string; ecosystem: string; technology: string; design: string; docs: string; language: string };
  hero: { headline: [string, string]; body: string; status: string; imageAlt: string; specsLabel: string };
  specRail: ProductSpec[];
  paper: { index: string; kicker: string; title: [string, string]; body: string; paletteLabel: string; pigments: string[] };
  scenes: { kicker: string; title: [string, string]; body: string; tabsLabel: string; items: CanvasSceneCopy[]; start: string; skip: string; live: { label: string; photo: string; text: string; drop: string; local: string; prompt: string; defaultText: string; privacy: string; intro: string; ready: string; textReady: string; error: string } };
  life: { title: [string, string]; caption: string; imageAlt: string };
  content: { index: string; kicker: string; title: [string, string]; body: string; modesLabel: string; modes: Array<{ id: string; label: string; title: string; meta: string }>; workflow: Array<{ title: string; body: string }> };
  ecosystem: { index: string; kicker: string; title: [string, string]; body: string; flow: string[]; features: FeatureCopy[] };
  technology: { index: string; kicker: string; title: [string, string]; body: string; pipeline: FeatureCopy[]; ditherTitle: [string, string]; ditherBody: string; ditherModes: FeatureCopy[] };
  hardware: { kicker: string; title: [string, string]; body: string; items: HardwareCopy[] };
  specifications: { index: string; kicker: string; title: [string, string]; body: string; items: ProductSpec[]; targetNote: string };
  design: { index: string; kicker: string; title: [string, string]; body: string; phoneAlt: string; handAlt: string; thin: string; light: string };
  story: { title: [string, string]; body: string; status: string };
  footer: { docs: string; contact: string; backTop: string };
}

export const localeMeta = {
  'zh-cn': { htmlLang: 'zh-CN', name: '简体中文', path: '/', ogLocale: 'zh_CN' },
  en: { htmlLang: 'en', name: 'English', path: '/en/', ogLocale: 'en_US' },
  'zh-tw': { htmlLang: 'zh-Hant', name: '繁體中文', path: '/zh-tw/', ogLocale: 'zh_TW' },
  ja: { htmlLang: 'ja', name: '日本語', path: '/ja/', ogLocale: 'ja_JP' },
  de: { htmlLang: 'de', name: 'Deutsch', path: '/de/', ogLocale: 'de_DE' },
  fr: { htmlLang: 'fr', name: 'Français', path: '/fr/', ogLocale: 'fr_FR' },
} satisfies Record<Locale, LocaleMeta>;

const canvasDefaults = {
  rain: { canvasHeading: 'PLUM RAIN', canvasTitle: 'RAIN / 01', canvasSubtitle: 'Six colors, held like paper', canvasMeta: 'PEANUP STUDY 01' },
  branch: { canvasTitle: 'LIGHT / 02', canvasSubtitle: 'A small garden for every day', canvasMeta: 'PEANUP STUDY 02' },
  bird: { canvasTitle: 'FLIGHT / 03', canvasSubtitle: 'Beyond the strings', canvasMeta: 'PEANUP STUDY 03' },
  experience: { canvasTitle: 'YOUR FRAME / 04', canvasSubtitle: 'Photo or words', canvasMeta: 'LOCAL PREVIEW' },
} as const;

type CanvasLabels = Record<CanvasSceneCopy['id'], Pick<CanvasSceneCopy, 'canvasHeading' | 'canvasTitle' | 'canvasSubtitle' | 'canvasMeta'>>;

const localizedCanvas: Record<Locale, CanvasLabels> = {
  en: canvasDefaults,
  'zh-cn': {
    rain: { canvasHeading: '梅雨季节', canvasTitle: '雨 / 01', canvasSubtitle: '六色，像纸一样留下', canvasMeta: 'PEANUP STUDY 01' },
    branch: { canvasTitle: '向光 / 02', canvasSubtitle: '一座日常的小花园', canvasMeta: 'PEANUP STUDY 02' },
    bird: { canvasTitle: '飞行 / 03', canvasSubtitle: '拨动琴弦之外', canvasMeta: 'PEANUP STUDY 03' },
    experience: { canvasTitle: '你的画面 / 04', canvasSubtitle: '照片或文字', canvasMeta: 'LOCAL PREVIEW' },
  },
  'zh-tw': {
    rain: { canvasHeading: '梅雨時節', canvasTitle: '雨 / 01', canvasSubtitle: '六色，像紙一樣留下', canvasMeta: 'PEANUP STUDY 01' },
    branch: { canvasTitle: '向光 / 02', canvasSubtitle: '一座日常的小花園', canvasMeta: 'PEANUP STUDY 02' },
    bird: { canvasTitle: '飛行 / 03', canvasSubtitle: '撥動琴弦之外', canvasMeta: 'PEANUP STUDY 03' },
    experience: { canvasTitle: '你的畫面 / 04', canvasSubtitle: '照片或文字', canvasMeta: 'LOCAL PREVIEW' },
  },
  ja: {
    rain: { canvasHeading: '梅雨の季節', canvasTitle: '雨 / 01', canvasSubtitle: '6色を、紙のように残す', canvasMeta: 'PEANUP STUDY 01' },
    branch: { canvasTitle: '光へ / 02', canvasSubtitle: '日常の小さな庭', canvasMeta: 'PEANUP STUDY 02' },
    bird: { canvasTitle: '飛行 / 03', canvasSubtitle: '弦の向こうへ', canvasMeta: 'PEANUP STUDY 03' },
    experience: { canvasTitle: 'あなたの一枚 / 04', canvasSubtitle: '写真または言葉', canvasMeta: 'LOCAL PREVIEW' },
  },
  de: {
    rain: { canvasHeading: 'REGENZEIT', canvasTitle: 'REGEN / 01', canvasSubtitle: 'Sechs Farben, wie Papier bewahrt', canvasMeta: 'PEANUP STUDY 01' },
    branch: { canvasTitle: 'ZUM LICHT / 02', canvasSubtitle: 'Ein kleiner Garten im Alltag', canvasMeta: 'PEANUP STUDY 02' },
    bird: { canvasTitle: 'FLUG / 03', canvasSubtitle: 'Jenseits der Saiten', canvasMeta: 'PEANUP STUDY 03' },
    experience: { canvasTitle: 'DEIN BILD / 04', canvasSubtitle: 'Foto oder Worte', canvasMeta: 'LOCAL PREVIEW' },
  },
  fr: {
    rain: { canvasHeading: 'SAISON DES PLUIES', canvasTitle: 'PLUIE / 01', canvasSubtitle: 'Six couleurs gardées comme du papier', canvasMeta: 'PEANUP STUDY 01' },
    branch: { canvasTitle: 'VERS LA LUMIÈRE / 02', canvasSubtitle: 'Un petit jardin au quotidien', canvasMeta: 'PEANUP STUDY 02' },
    bird: { canvasTitle: 'ENVOL / 03', canvasSubtitle: 'Au-delà des cordes', canvasMeta: 'PEANUP STUDY 03' },
    experience: { canvasTitle: 'VOTRE IMAGE / 04', canvasSubtitle: 'Photo ou mots', canvasMeta: 'LOCAL PREVIEW' },
  },
};

const en: ProductCopy = {
  locale: 'en',
  meta: { title: 'Peanup | 3.68-inch E6 six-color e-paper at ≈258.7 PPI', description: 'Peanup is a 3.68-inch E6 six-color Bluetooth e-paper object at ≈258.7 PPI for keeping photos, daily information and small moments in view.' },
  nav: { product: 'Product', experience: 'Experience', ecosystem: 'Ecosystem', technology: 'Technology', design: 'Design', docs: 'Docs', language: 'Language' },
  hero: { headline: ['Keep what you love', 'in plain sight.'], body: 'Send a favorite photo to Peanup. It becomes a small color print that stays quietly in view.', status: 'Coming to Kickstarter', imageAlt: 'White instant-photo-inspired Peanup six-color e-paper device', specsLabel: 'Product highlights' },
  specRail: [
    { value: '3.68”', label: 'E6 SIX-COLOR E-PAPER' }, { value: '≈258.7 PPI', label: 'PIXEL DENSITY' }, { value: '3 mm', label: 'TARGET THICKNESS' }, { value: '28 g', label: 'TARGET WEIGHT' }, { value: 'BLE', label: 'WIRELESS TRANSFER' },
  ],
  paper: { index: '01', kicker: 'Visible without glowing', title: ['Not another bright screen.', 'A piece of paper that can change.'], body: 'Six physical colors render photos and information. The panel does not glow. It looks clearer in daylight and keeps the last frame after each refresh.', paletteLabel: 'Six-color e-paper palette', pigments: ['Black', 'Paper', 'Red', 'Yellow', 'Blue', 'Green'] },
  scenes: {
    kicker: 'PEANUP DISPLAY / 01—04', title: ['Let a moving moment', 'settle onto paper.'], body: 'Scroll or choose a frame. It refreshes from the bottom up, then stays quietly on the display.', tabsLabel: 'Display scene selector',
    items: [
      { id: 'rain', number: '01', title: 'Freeze a moment', detail: 'Six-color clouds · wind-touched rain', ...localizedCanvas.en.rain },
      { id: 'branch', number: '02', title: 'Daily information', detail: 'Date · weather · reading note', date: 'JUL 27', weather: '28° / SHOWERS', quote: 'The day has a texture of its own.', ...localizedCanvas.en.branch },
      { id: 'bird', number: '03', title: 'Create freely', detail: 'Shortcuts · scheduled refresh', ...localizedCanvas.en.bird },
      { id: 'experience', number: '04', title: 'Make it yours', detail: 'Drop a photo · write a line', ...localizedCanvas.en.experience },
    ],
    start: 'Try it', skip: 'Continue',
    live: { label: 'Live e-paper preview', photo: 'Photo', text: 'Text', drop: 'Drop a photo or choose one', local: 'Processed locally in six colors', prompt: 'Write something worth keeping', defaultText: 'Keep today in plain sight.', privacy: 'Your photo never leaves this browser', intro: 'Try a frame here', ready: 'Six-color refresh complete', textReady: 'Text held on e-paper', error: 'This image could not be read' },
  },
  life: { title: ['A small frame,', 'wherever life happens.'], caption: 'MAGNETIC E-PAPER OBJECT', imageAlt: 'Peanup attached to a light-colored bag in everyday use' },
  content: {
    index: '02', kicker: 'One object, many rhythms', title: ['A photo now.', 'Useful information later.'], body: 'Choose a photo or an information card. Check the six-color preview, then send it over Bluetooth.', modesLabel: 'Content modes',
    modes: [
      { id: 'photo', label: 'Photo', title: 'Keep today on paper', meta: 'PHOTO / 16:24' },
      { id: 'calendar', label: 'Calendar', title: 'Sunday, July 27', meta: 'SUNDAY / 27' },
      { id: 'weather', label: 'Weather', title: 'Showers, then clear', meta: 'SHENZHEN / 28°' },
      { id: 'quote', label: 'Reading', title: 'The day has a texture of its own', meta: 'READING / 08:40' },
    ],
    workflow: [{ title: 'Choose', body: 'Photo or information card' }, { title: 'Preview', body: 'Six-color paper rendering' }, { title: 'Send', body: 'Update over Bluetooth' }],
  },
  ecosystem: {
    index: '03', kicker: 'Built for iPhone, open beyond it', title: ['Capture once.', 'Let automation do the rest.'], body: 'Capture, preview and send from iPhone in one flow. Shortcuts can automate familiar updates. A WeChat Mini Program also sends images from other devices.',
    flow: ['Camera', 'Six-color render', 'Bluetooth'],
    features: [
      { label: '01 / SHORTCUTS', title: 'Apple Shortcuts', body: 'Prepare and send a frame with Siri, a widget or a personal automation.' },
      { label: '02 / TRANSFER', title: 'Transfer progress', body: 'See connection, transfer and display-refresh progress in the app.' },
      { label: '03 / LOCAL FIRST', title: 'Processed on your device', body: 'Cropping and six-color conversion happen on iPhone or iPad. The original photo does not need to be uploaded.' },
      { label: '04 / WECHAT', title: 'Mini Program transfer', body: 'Android devices can send images through the WeChat Mini Program.' },
      { label: '05 / EXTENSIONS', title: 'More content sources', body: 'Planned integrations can turn calendars, weather and reading notes into scheduled frames.' },
    ],
  },
  technology: {
    index: '04', kicker: 'From a photograph to physical pigment', title: ['The phone does the computing.', 'The paper keeps the result.'], body: 'Your phone crops the photo and converts it to six colors. Bluetooth sends only the finished frame. The e-paper keeps showing it after the transfer ends.',
    pipeline: [
      { label: '01 / INPUT', title: 'Compose', body: 'Crop to the display shape without stretching the photo.' },
      { label: '02 / SIX-COLOR', title: 'Render in six colors', body: 'Convert the photo for the E6 palette while keeping important detail.' },
      { label: '03 / BLUETOOTH', title: 'Send', body: 'Transfer the finished frame over Bluetooth Low Energy and follow its progress.' },
      { label: '04 / E-PAPER', title: 'Refresh and hold', body: 'The image stays visible after Bluetooth disconnects.' },
    ],
    ditherTitle: ['Every image deserves', 'the right six-color treatment.'], ditherBody: 'Different methods suit different content. Previews need speed. Photos need detail. Text needs clear edges.',
    ditherModes: [
      { label: 'REALTIME', title: 'Ordered 4×4 / 8×8', body: 'Keeps the live camera preview fast and stable.' },
      { label: 'BALANCED', title: 'Floyd–Steinberg / Stucki', body: 'Keeps more texture and detail in photographs.' },
      { label: 'PHOTO', title: 'Perceptual / Spectra Mix', body: 'Tunes color for the E6 palette before the final refresh.' },
    ],
  },
  hardware: {
    kicker: 'HARDWARE / QUIET BY DEFAULT', title: ['The picture stays.', 'The connection comes only when needed.'], body: 'The picture needs no backlight. Bluetooth connects for an update, then returns to standby. Hover or tap to explore four hardware features.',
    items: [
      { label: '01 / BLE', title: 'Bluetooth Low Energy', short: 'Connect briefly, then rest', body: 'After one frame is sent, Bluetooth returns to low-power standby.' },
      { label: '02 / NFC', title: 'CUID NFC', short: 'Access card, where supported', body: 'Peanup may work as an access card where CUID is supported. Enrollment requires the operator’s approval and must follow local rules.' },
      { label: '03 / QI', title: 'Qi wireless charging', short: 'Set it down to recharge', body: 'There is no exposed charging port. Place Peanup on a compatible Qi charger.' },
      { label: '04 / MAGNET', title: 'Magnetic placement', short: 'Snap the frame into place', body: 'Attach it to a fridge or use compatible MagSafe accessories. MagSafe compatibility does not mean Apple certification.' },
    ],
  },
  specifications: {
    index: '05', kicker: 'Kickstarter target specifications', title: ['Light to carry.', 'Ready for every day.'], body: 'A 3.68-inch E6 six-color e-paper panel at approximately 258.7 PPI.', targetNote: 'The 3 mm profile, 28 g weight and one-month-plus battery life are Kickstarter targets. Final production specifications may change. Battery life depends on refresh frequency.',
    items: [
      { value: '3.68” E6', label: 'Active panel' }, { value: '≈258.7 PPI', label: 'Pixel density' }, { value: '6', label: 'Physical e-paper colors' }, { value: '3 mm', label: 'Target thickness' }, { value: '28 g', label: 'Target weight' }, { value: '1+ month', label: 'Target battery life', note: 'Depends on refresh frequency' }, { value: 'BLE', label: 'Wireless image transfer' }, { value: 'Qi', label: 'Wireless charging' }, { value: 'No ports', label: 'No exposed connector' }, { value: 'iOS', label: 'App and Shortcuts' }, { value: 'WeChat', label: 'Mini Program transfer' }, { value: 'CUID', label: 'Conditional NFC access' },
    ],
  },
  design: { index: '06', kicker: 'Instant-photo spirit, digital freedom', title: ['It looks like a print.', 'It behaves like a living frame.'], body: 'The white body feels like an instant print. Carry it, place it on a desk or attach it to a magnetic surface. Final details are still being refined for production.', phoneAlt: 'Peanup displayed beside a smartphone', handAlt: 'Peanup held by hand near a bag', thin: '3 mm target', light: '28 g target' },
  story: { title: ['The charm of Peanut.', 'The lift of Up.'], body: 'Peanup brings together the charm of Peanut and the lift of Up. It stays out of the way and keeps one favorite image close.', status: 'Peanup · Coming to Kickstarter' },
  footer: { docs: 'Open docs', contact: 'Contact', backTop: 'Back to top' },
};

const zhCn: ProductCopy = {
  ...en,
  locale: 'zh-cn',
  meta: { title: '花生片 Peanup｜3.68 英寸 E6 六色墨水屏｜≈258.7 PPI', description: '花生片 Peanup 是一块 3.68 英寸 E6 六色蓝牙墨水屏，像素密度 ≈258.7 PPI，把照片、日常信息与喜欢的瞬间留在视线里。' },
  nav: { product: '产品', experience: '体验', ecosystem: '生态', technology: '技术', design: '设计', docs: '文档', language: '语言' },
  hero: { headline: ['把喜欢的画面，', '留在身边。'], body: '把喜欢的照片发到花生片。它像一张会更新的彩色相纸，安静地留在身边。', status: '即将登陆 Kickstarter', imageAlt: '白色即时相纸造型的花生片六色电子纸设备', specsLabel: '产品亮点' },
  specRail: [{ value: '3.68”', label: 'E6 六色墨水屏' }, { value: '≈258.7 PPI', label: '像素密度' }, { value: '3 mm', label: '目标厚度' }, { value: '28 g', label: '目标重量' }, { value: 'BLE', label: '无线传图' }],
  paper: { index: '01', kicker: '不发光，也清楚', title: ['不是又一块亮着的屏幕。', '是一张会更新的纸。'], body: '六种实体颜色，用来呈现照片和信息。它不发光，阳光下反而更清楚。刷新结束后，画面会继续保留。', paletteLabel: '六色电子纸色板', pigments: ['墨', '纸', '朱', '黄', '蓝', '绿'] },
  scenes: {
    kicker: 'PEANUP DISPLAY / 01—04', title: ['让流动的此刻，', '在纸上停留。'], body: '滚动或点击即可切换画面。每一幕都从下向上刷新，然后静静留在屏幕上。', tabsLabel: '屏幕场景切换',
    items: [
      { id: 'rain', number: '01', title: '照片定格', detail: '六色云彩 · 风中的细雨', ...localizedCanvas['zh-cn'].rain },
      { id: 'branch', number: '02', title: '日常信息', detail: '日期 · 天气 · 书摘', date: '7 月 27 日', weather: '28° / 阵雨', quote: '家人闲坐，灯火可亲。', quoteSource: '——《冬天》', ...localizedCanvas['zh-cn'].branch },
      { id: 'bird', number: '03', title: '自由创作', detail: '快捷指令 · 定时刷新', ...localizedCanvas['zh-cn'].bird },
      { id: 'experience', number: '04', title: '轮到你了', detail: '拖入照片 · 写下一句话', ...localizedCanvas['zh-cn'].experience },
    ], start: '开始体验', skip: '继续浏览',
    live: { label: '在线电子纸预览', photo: '照片', text: '文字', drop: '拖入照片或点击选择', local: '在本地完成六色处理', prompt: '输入一句想留下的话', defaultText: '把今天，留在纸上。', privacy: '照片不会离开当前浏览器', intro: '在这里试一张', ready: '六色刷新完成', textReady: '文字已在电子纸上保持', error: '无法读取这张图片' },
  },
  life: { title: ['一小片日常，', '随处安放。'], caption: '磁吸六色电子纸物件', imageAlt: '花生片挂在浅色包袋上的日常使用场景' },
  content: { ...en.content, index: '02', kicker: '一个物件，多种节奏', title: ['此刻放照片，', '明天也能看信息。'], body: '选择照片、日历、天气或书摘。先预览六色效果，再通过蓝牙发送。', modesLabel: '内容模式', modes: [{ id: 'photo', label: '照片', title: '把今天，留在纸上', meta: 'PHOTO / 16:24' }, { id: 'calendar', label: '日历', title: '七月廿七 · 星期日', meta: 'SUNDAY / 27' }, { id: 'weather', label: '天气', title: '阵雨转晴', meta: 'SHENZHEN / 28°' }, { id: 'quote', label: '书摘', title: '家人闲坐，灯火可亲', meta: 'READING / 08:40' }], workflow: [{ title: '选择', body: '照片或日常卡片' }, { title: '预览', body: '六色纸感效果' }, { title: '发送', body: '蓝牙更新画面' }] },
  ecosystem: { ...en.ecosystem, index: '03', kicker: '为 iPhone 而生，也能从更多设备传图', title: ['拍下一次，', '剩下的交给自动化。'], body: '在 iPhone 上拍照、预览、发送，一条路完成。快捷指令可以自动更新画面。微信小程序也能从其他设备传图。', flow: ['相机', '六色处理', '蓝牙发送'], features: [{ label: '01 / SHORTCUTS', title: 'Apple 快捷指令', body: '用 Siri、小组件或自动化准备画面，再发送到 Peanup。' }, { label: '02 / TRANSFER', title: '传输进度', body: '在 App 内查看连接、传输和刷屏进度。' }, { label: '03 / LOCAL FIRST', title: '照片在手机上处理', body: '裁切和六色转换都在 iPhone 或 iPad 完成。原图不用上传。' }, { label: '04 / WECHAT', title: '微信小程序传图', body: 'Android 设备也可以通过微信小程序传图。' }, { label: '05 / EXTENSIONS', title: '更多内容来源', body: '计划支持日历、天气和书摘等内容，定时更新喜欢的画面。' }] },
  technology: { ...en.technology, index: '04', kicker: '从一张照片到六色电子纸', title: ['计算留在手机，', '画面留在纸上。'], body: '手机负责裁切和六色转换。蓝牙只发送完成的画面。发送结束，电子纸会继续显示。', pipeline: [{ label: '01 / INPUT', title: '整理画面', body: '按屏幕比例裁切，不拉伸照片。' }, { label: '02 / SIX-COLOR', title: '六色成像', body: '转换为适合 E6 面板的六种颜色，同时尽量保留细节。' }, { label: '03 / BLUETOOTH', title: '蓝牙发送', body: '通过低功耗蓝牙发送画面，并显示进度。' }, { label: '04 / E-PAPER', title: '刷屏并保持', body: '刷新完成后，即使断开连接，画面仍然保留。' }], ditherTitle: ['每张照片，', '都有合适的六色画法。'], ditherBody: '不同算法照顾不同内容。预览要快，照片要细，文字要清楚。', ditherModes: [{ label: 'REALTIME', title: 'Ordered 4×4 / 8×8', body: '让相机实时预览更快、更稳定。' }, { label: 'BALANCED', title: 'Floyd–Steinberg / Stucki', body: '为照片保留更多层次和细节。' }, { label: 'PHOTO', title: '感知量化 / Palette Mix', body: '按照 E6 色板调整颜色，用于最终写屏。' }] },
  hardware: { ...en.hardware, kicker: 'HARDWARE / 默认保持安静', title: ['画面一直在，', '连接只在更新时。'], body: '画面无需常亮。更新时才连接蓝牙，平时安静待机。悬浮或轻点，查看四项硬件能力。', items: [{ label: '01 / BLE', title: '低功耗蓝牙', short: '短暂连接，随后休息', body: '发送一幅画面后，蓝牙回到低功耗待机。' }, { label: '02 / NFC', title: 'CUID NFC', short: '条件合适时，可作门禁卡', body: '门禁系统支持 CUID 并允许录入时，可以把它用作门禁卡。使用前请先取得管理方授权。' }, { label: '03 / QI', title: 'Qi 无线充电', short: '放下，即可补能', body: '没有外露充电口。放上兼容的 Qi 充电器就能充电。' }, { label: '04 / MAGNET', title: '磁吸摆放', short: '轻轻一吸，画面就位', body: '可以吸在冰箱上，也能搭配兼容的 MagSafe 磁吸配件。MagSafe 兼容不代表 Apple 认证。' }] },
  specifications: { ...en.specifications, index: '05', kicker: 'Kickstarter 目标规格', title: ['足够轻巧，', '也足够完整。'], body: '3.68 英寸 E6 六色电子纸，按有效显示区计算约 258.7 PPI。', targetNote: '3 mm、28 g 和一个月以上续航为众筹目标。最终规格以量产版本为准。续航取决于刷新频率。', items: [{ value: '3.68” E6', label: '有效面板' }, { value: '≈258.7 PPI', label: '像素密度' }, { value: '6', label: '实体电子纸颜色' }, { value: '3 mm', label: '目标厚度' }, { value: '28 g', label: '目标重量' }, { value: '1 个月以上', label: '目标续航', note: '取决于刷新频率' }, { value: 'BLE', label: '无线传图' }, { value: 'Qi', label: '无线充电' }, { value: '无接口', label: '无外露连接器' }, { value: 'iOS', label: 'App 与快捷指令' }, { value: '微信', label: '小程序传图' }, { value: 'CUID', label: '有条件的 NFC 门禁' }] },
  design: { index: '06', kicker: '即时相纸的亲切，数字内容的自由', title: ['看起来像相纸，', '用起来更自由。'], body: '白色机身像一张即时相纸。可以拿在手里、放在桌上，也可以吸在常见的磁性表面。外观细节仍在为量产打磨。', phoneAlt: '花生片与手机搭配展示', handAlt: '手持花生片靠近包袋', thin: '3 mm 目标厚度', light: '28 g 目标重量' },
  story: { title: ['Peanut 的可爱，', '加一点 Up 的活力。'], body: 'Peanut 的可爱，加上 Up 的活力，于是有了 Peanup。它不抢走注意力，只把喜欢的画面留在身边。', status: '花生片 Peanup · 即将登陆 Kickstarter' },
  footer: { docs: '开放文档', contact: '联系', backTop: '返回顶部' },
};

const zhTw: ProductCopy = {
  ...zhCn,
  locale: 'zh-tw',
  meta: { title: '花生片 Peanup｜3.68 吋 E6 六色電子紙｜≈258.7 PPI', description: '花生片 Peanup 是一塊 3.68 吋 E6 六色藍牙電子紙，像素密度 ≈258.7 PPI，把照片、日常資訊與喜歡的瞬間留在視線裡。' },
  nav: { product: '產品', experience: '體驗', ecosystem: '生態', technology: '技術', design: '設計', docs: '文件', language: '語言' },
  hero: { headline: ['把喜歡的畫面，', '留在身邊。'], body: '把喜歡的照片傳到花生片。它像一張會更新的彩色相紙，安靜地留在身邊。', status: '即將登上 Kickstarter', imageAlt: '白色即時相紙造型的花生片六色電子紙裝置', specsLabel: '產品亮點' },
  specRail: [{ value: '3.68”', label: 'E6 六色電子紙' }, { value: '≈258.7 PPI', label: '像素密度' }, { value: '3 mm', label: '目標厚度' }, { value: '28 g', label: '目標重量' }, { value: 'BLE', label: '無線傳圖' }],
  paper: { ...zhCn.paper, kicker: '不發光，也清楚', title: ['不是又一塊亮著的螢幕。', '是一張會更新的紙。'], body: '六種實體顏色，用來呈現照片和資訊。它不發光，陽光下反而更清楚。更新結束後，畫面會繼續保留。', paletteLabel: '六色電子紙色板', pigments: ['墨', '紙', '朱', '黃', '藍', '綠'] },
  scenes: { ...zhCn.scenes, title: ['讓流動的此刻，', '在紙上停留。'], body: '捲動或點擊即可切換畫面。每一幕都從下向上更新，然後靜靜留在螢幕上。', tabsLabel: '螢幕場景切換', items: [{ id: 'rain', number: '01', title: '照片定格', detail: '六色雲彩 · 風中的細雨', ...localizedCanvas['zh-tw'].rain }, { id: 'branch', number: '02', title: '日常資訊', detail: '日期 · 天氣 · 書摘', date: '7 月 27 日', weather: '28° / 陣雨', quote: '家人閒坐，燈火可親。', quoteSource: '——《冬天》', ...localizedCanvas['zh-tw'].branch }, { id: 'bird', number: '03', title: '自由創作', detail: '捷徑 · 定時更新', ...localizedCanvas['zh-tw'].bird }, { id: 'experience', number: '04', title: '輪到你了', detail: '拖入照片 · 寫下一句話', ...localizedCanvas['zh-tw'].experience }], start: '開始體驗', skip: '繼續瀏覽', live: { label: '線上電子紙預覽', photo: '照片', text: '文字', drop: '拖入照片或點擊選擇', local: '在本機完成六色處理', prompt: '輸入一句想留下的話', defaultText: '把今天，留在紙上。', privacy: '照片不會離開目前瀏覽器', intro: '在這裡試一張', ready: '六色更新完成', textReady: '文字已保留在電子紙上', error: '無法讀取這張圖片' } },
  life: { title: ['一小片日常，', '隨處安放。'], caption: '磁吸六色電子紙物件', imageAlt: '花生片掛在淺色包袋上的日常使用場景' },
  content: { ...zhCn.content, kicker: '一個物件，多種節奏', title: ['此刻放照片，', '明天也能看資訊。'], body: '選擇照片、日曆、天氣或書摘。先預覽六色效果，再透過藍牙傳送。', modesLabel: '內容模式', modes: [{ id: 'photo', label: '照片', title: '把今天，留在紙上', meta: 'PHOTO / 16:24' }, { id: 'calendar', label: '日曆', title: '七月廿七 · 星期日', meta: 'SUNDAY / 27' }, { id: 'weather', label: '天氣', title: '陣雨轉晴', meta: 'SHENZHEN / 28°' }, { id: 'quote', label: '書摘', title: '家人閒坐，燈火可親', meta: 'READING / 08:40' }], workflow: [{ title: '選擇', body: '照片或日常卡片' }, { title: '預覽', body: '六色紙感效果' }, { title: '傳送', body: '藍牙更新畫面' }] },
  ecosystem: { ...zhCn.ecosystem, kicker: '為 iPhone 而生，也能從更多裝置傳圖', title: ['拍下一次，', '剩下的交給自動化。'], body: '在 iPhone 上拍照、預覽、傳送，一條路完成。捷徑可以自動更新畫面。微信小程式也能從其他裝置傳圖。', flow: ['相機', '六色處理', '藍牙傳送'], features: [{ label: '01 / SHORTCUTS', title: 'Apple 捷徑', body: '用 Siri、小工具或自動化準備畫面，再傳送到 Peanup。' }, { label: '02 / TRANSFER', title: '傳輸進度', body: '在 App 內查看連線、傳輸和更新進度。' }, { label: '03 / LOCAL FIRST', title: '照片在手機上處理', body: '裁切和六色轉換都在 iPhone 或 iPad 完成。原圖不用上傳。' }, { label: '04 / WECHAT', title: '微信小程式傳圖', body: 'Android 裝置也可以透過微信小程式傳圖。' }, { label: '05 / EXTENSIONS', title: '更多內容來源', body: '計畫支援日曆、天氣和書摘等內容，定時更新喜歡的畫面。' }] },
  technology: { ...zhCn.technology, kicker: '從一張照片到六色電子紙', title: ['運算留在手機，', '畫面留在紙上。'], body: '手機負責裁切和六色轉換。藍牙只傳送完成的畫面。傳送結束，電子紙會繼續顯示。', pipeline: [{ label: '01 / INPUT', title: '整理畫面', body: '依螢幕比例裁切，不拉伸照片。' }, { label: '02 / SIX-COLOR', title: '六色成像', body: '轉換為適合 E6 面板的六種顏色，同時盡量保留細節。' }, { label: '03 / BLUETOOTH', title: '藍牙傳送', body: '透過低功耗藍牙傳送畫面，並顯示進度。' }, { label: '04 / E-PAPER', title: '更新並保持', body: '更新完成後，即使中斷連線，畫面仍然保留。' }], ditherTitle: ['每張照片，', '都有合適的六色畫法。'], ditherBody: '不同演算法照顧不同內容。預覽要快，照片要細，文字要清楚。', ditherModes: [{ label: 'REALTIME', title: 'Ordered 4×4 / 8×8', body: '讓相機即時預覽更快、更穩定。' }, { label: 'BALANCED', title: 'Floyd–Steinberg / Stucki', body: '為照片保留更多層次和細節。' }, { label: 'PHOTO', title: '感知量化 / Palette Mix', body: '按照 E6 色板調整顏色，用於最終寫屏。' }] },
  hardware: { ...zhCn.hardware, kicker: 'HARDWARE / 預設保持安靜', title: ['畫面一直在，', '連線只在更新時。'], body: '畫面無需常亮。更新時才連接藍牙，平時安靜待機。懸浮或輕點，查看四項硬體功能。', items: [{ label: '01 / BLE', title: '低功耗藍牙', short: '短暫連線，隨後休息', body: '傳送一幅畫面後，藍牙回到低功耗待機。' }, { label: '02 / NFC', title: 'CUID NFC', short: '條件合適時，可作門禁卡', body: '門禁系統支援 CUID 並允許登錄時，可以把它用作門禁卡。使用前請先取得管理方授權。' }, { label: '03 / QI', title: 'Qi 無線充電', short: '放下，即可補能', body: '沒有外露充電孔。放上相容的 Qi 充電器就能充電。' }, { label: '04 / MAGNET', title: '磁吸擺放', short: '輕輕一吸，畫面就位', body: '可以吸在冰箱上，也能搭配相容的 MagSafe 磁吸配件。MagSafe 相容不代表 Apple 認證。' }] },
  specifications: { ...zhCn.specifications, kicker: 'Kickstarter 目標規格', title: ['足夠輕巧，', '也足夠完整。'], body: '3.68 吋 E6 六色電子紙，依有效顯示區計算約 258.7 PPI。', targetNote: '3 mm、28 g 和一個月以上續航為眾籌目標。最終規格以量產版本為準。續航取決於更新頻率。', items: [{ value: '3.68” E6', label: '有效面板' }, { value: '≈258.7 PPI', label: '像素密度' }, { value: '6', label: '實體電子紙顏色' }, { value: '3 mm', label: '目標厚度' }, { value: '28 g', label: '目標重量' }, { value: '1 個月以上', label: '目標續航', note: '取決於更新頻率' }, { value: 'BLE', label: '無線傳圖' }, { value: 'Qi', label: '無線充電' }, { value: '無介面', label: '無外露連接器' }, { value: 'iOS', label: 'App 與捷徑' }, { value: '微信', label: '小程式傳圖' }, { value: 'CUID', label: '有條件的 NFC 門禁' }] },
  design: { ...zhCn.design, kicker: '即時相紙的親切，數位內容的自由', title: ['看起來像相紙，', '用起來更自由。'], body: '白色機身像一張即時相紙。可以拿在手裡、放在桌上，也可以吸在常見的磁性表面。外觀細節仍在為量產打磨。', phoneAlt: '花生片與手機搭配展示', handAlt: '手持花生片靠近包袋', thin: '3 mm 目標厚度', light: '28 g 目標重量' },
  story: { title: ['Peanut 的可愛，', '加一點 Up 的活力。'], body: 'Peanut 的可愛，加上 Up 的活力，於是有了 Peanup。它不搶走注意力，只把喜歡的畫面留在身邊。', status: '花生片 Peanup · 即將登上 Kickstarter' },
  footer: { docs: '開放文件', contact: '聯絡', backTop: '返回頂端' },
};

const ja: ProductCopy = {
  ...en,
  locale: 'ja',
  meta: { title: 'Peanup｜3.68インチ E6 6色電子ペーパー｜≈258.7 PPI', description: 'Peanupは、写真や日々の情報をそっと残す、3.68インチ・≈258.7 PPIのE6 Bluetooth対応6色電子ペーパーです。' },
  nav: { product: '製品', experience: '体験', ecosystem: 'エコシステム', technology: '技術', design: 'デザイン', docs: 'ドキュメント', language: '言語' },
  hero: { headline: ['好きな景色を、', 'いつも見える場所に。'], body: '好きな写真をPeanupへ。小さなカラー写真のように、静かにそばへ残ります。', status: 'Kickstarterで近日公開', imageAlt: '白いインスタント写真風のPeanup 6色電子ペーパー端末', specsLabel: '製品の特長' },
  specRail: [{ value: '3.68”', label: 'E6 6色電子ペーパー' }, { value: '≈258.7 PPI', label: '画素密度' }, { value: '3 mm', label: '目標厚さ' }, { value: '28 g', label: '目標重量' }, { value: 'BLE', label: 'ワイヤレス転送' }],
  paper: { index: '01', kicker: '光らなくても、よく見える', title: ['光る画面ではなく、', '変わる一枚の紙。'], body: '6つの実色で写真や情報を描きます。画面は発光しません。日差しの中ほど見やすく、更新後も表示が残ります。', paletteLabel: '6色電子ペーパーパレット', pigments: ['黒', '紙', '赤', '黄', '青', '緑'] },
  scenes: { ...en.scenes, title: ['流れる一瞬を、', '紙の上に残す。'], body: 'スクロールまたはタブで画面を選べます。下から上へ更新され、そのまま静かに残ります。', tabsLabel: '表示シーン', items: [{ id: 'rain', number: '01', title: '瞬間を定着', detail: '6色の雲 · 風に揺れる雨', ...localizedCanvas.ja.rain }, { id: 'branch', number: '02', title: '日々の情報', detail: '日付 · 天気 · 読書メモ', date: '7月27日', weather: '28° / にわか雨', quote: '日々には、それぞれの質感がある。', ...localizedCanvas.ja.branch }, { id: 'bird', number: '03', title: '自由に作る', detail: 'ショートカット · 定期更新', ...localizedCanvas.ja.bird }, { id: 'experience', number: '04', title: 'あなたの番', detail: '写真を置く · 言葉を書く', ...localizedCanvas.ja.experience }], start: '試してみる', skip: '続きを見る', live: { label: '電子ペーパーのライブプレビュー', photo: '写真', text: 'テキスト', drop: '写真をドロップまたは選択', local: '6色処理は端末内で完結', prompt: '残したい言葉を入力', defaultText: '今日を、紙の上に。', privacy: '写真はこのブラウザから送信されません', intro: 'ここで一枚試す', ready: '6色の更新が完了しました', textReady: '文字を電子ペーパーに保持しました', error: 'この画像を読み込めませんでした' } },
  life: { title: ['小さな一枚を、', '暮らしのどこにでも。'], caption: 'マグネット式6色電子ペーパー', imageAlt: '明るい色のバッグに取り付けたPeanup' },
  content: { ...en.content, index: '02', kicker: '一つの端末、いくつものリズム', title: ['今は写真。', '次は役立つ情報。'], body: '写真、カレンダー、天気、読書メモから選びます。6色の仕上がりを確認し、Bluetoothで送信します。', modesLabel: 'コンテンツモード', modes: [{ id: 'photo', label: '写真', title: '今日を紙の上に', meta: 'PHOTO / 16:24' }, { id: 'calendar', label: 'カレンダー', title: '7月27日 日曜日', meta: 'SUNDAY / 27' }, { id: 'weather', label: '天気', title: 'にわか雨のち晴れ', meta: 'SHENZHEN / 28°' }, { id: 'quote', label: '読書', title: '日々には、それぞれの質感がある', meta: 'READING / 08:40' }], workflow: [{ title: '選ぶ', body: '写真または情報カード' }, { title: '確認', body: '6色の紙面プレビュー' }, { title: '送る', body: 'Bluetoothで更新' }] },
  ecosystem: { ...en.ecosystem, index: '03', kicker: 'iPhoneから、ほかの端末へも', title: ['一度撮れば、', 'あとは自動化に。'], body: 'iPhoneで撮影、プレビュー、送信まで完結します。ショートカットなら更新を自動化できます。ほかの端末からはWeChat Mini Programで送れます。', flow: ['カメラ', '6色処理', 'Bluetooth送信'], features: [{ label: '01 / SHORTCUTS', title: 'Appleショートカット', body: 'Siri、ウィジェット、オートメーションで画面を準備して送信します。' }, { label: '02 / TRANSFER', title: '転送状況', body: '接続、転送、画面更新の進み具合をアプリで確認できます。' }, { label: '03 / LOCAL FIRST', title: '写真は端末内で処理', body: 'トリミングと6色変換はiPhoneやiPadで完了します。元の写真をアップロードする必要はありません。' }, { label: '04 / WECHAT', title: 'Mini Program転送', body: 'Android端末からもWeChat Mini Programで画像を送れます。' }, { label: '05 / EXTENSIONS', title: 'さらに多くの情報', body: 'カレンダー、天気、読書メモの定期更新にも対応予定です。' }] },
  technology: { ...en.technology, index: '04', kicker: '写真から6色電子ペーパーへ', title: ['計算はスマホに。', '画面は紙に。'], body: 'スマホでトリミングと6色変換を行います。Bluetoothで送るのは完成した画面だけです。転送後も表示は残ります。', pipeline: [{ label: '01 / INPUT', title: '構図を整える', body: '画面の比率に合わせて、写真を引き伸ばさずに切り抜きます。' }, { label: '02 / SIX-COLOR', title: '6色で描画', body: '大切な細部を残しながら、E6の6色へ変換します。' }, { label: '03 / BLUETOOTH', title: 'Bluetoothで送信', body: '低消費電力Bluetoothで送り、進行状況を表示します。' }, { label: '04 / E-PAPER', title: '更新して保持', body: '更新後は接続が切れても画面が残ります。' }], ditherTitle: ['写真ごとに、', '合う6色の描き方を。'], ditherBody: '内容に合わせて方法を選びます。プレビューは速く、写真は細かく、文字はくっきり。', ditherModes: [{ label: 'REALTIME', title: 'Ordered 4×4 / 8×8', body: 'カメラのライブプレビューを速く安定させます。' }, { label: 'BALANCED', title: 'Floyd–Steinberg / Stucki', body: '写真の階調と細部をより多く残します。' }, { label: 'PHOTO', title: '知覚量子化 / Palette Mix', body: '最終更新の前にE6パレットへ色を整えます。' }] },
  hardware: { ...en.hardware, kicker: 'HARDWARE / 静けさを標準に', title: ['画面はいつもそこに。', '接続は更新するときだけ。'], body: '画面は点灯し続けません。Bluetoothは更新時だけつながり、普段は待機します。ホバーまたはタップで4つの機能を確認できます。', items: [{ label: '01 / BLE', title: 'Bluetooth Low Energy', short: '短くつなぎ、すぐ休む', body: '一枚を送り終えると、Bluetoothは低消費電力の待機状態へ戻ります。' }, { label: '02 / NFC', title: 'CUID NFC', short: '対応する場所では入退室にも', body: 'CUID対応システムでは入退室カードとして使える場合があります。登録には管理者の許可が必要です。地域の規則にも従ってください。' }, { label: '03 / QI', title: 'Qiワイヤレス充電', short: '置くだけで充電', body: '露出した充電端子はありません。対応するQi充電器に置いて充電します。' }, { label: '04 / MAGNET', title: 'マグネット設置', short: '軽く留めて、画面を置く', body: '冷蔵庫や対応するMagSafeアクセサリに装着できます。MagSafe対応はApple認証を意味しません。' }] },
  specifications: { ...en.specifications, index: '05', kicker: 'Kickstarter目標仕様', title: ['持ち運べる小ささ。', '暮らしに足りる機能。'], body: '3.68インチのE6 6色電子ペーパーです。有効表示領域から算出した密度は約258.7 PPIです。', targetNote: '3 mm、28 g、1か月以上の電池寿命はKickstarterでの目標値です。最終仕様は量産版で確定します。電池寿命は更新頻度によって変わります。', items: [{ value: '3.68” E6', label: '有効パネル' }, { value: '≈258.7 PPI', label: '画素密度' }, { value: '6', label: '物理電子ペーパー色' }, { value: '3 mm', label: '目標厚さ' }, { value: '28 g', label: '目標重量' }, { value: '1か月以上', label: '目標電池寿命', note: '更新頻度に依存' }, { value: 'BLE', label: '無線画像転送' }, { value: 'Qi', label: 'ワイヤレス充電' }, { value: '端子なし', label: '露出コネクタなし' }, { value: 'iOS', label: 'アプリとショートカット' }, { value: 'WeChat', label: 'Mini Program転送' }, { value: 'CUID', label: '条件付きNFC入退室' }] },
  design: { index: '06', kicker: 'インスタント写真の親しさ、デジタルの自由', title: ['プリントのように見えて、', 'もっと自由に使える。'], body: '白い本体は小さなインスタント写真のようです。手に持ち、机に置き、磁石の付く場所に留められます。外観は量産に向けて調整中です。', phoneAlt: 'スマートフォンのそばに置いたPeanup', handAlt: 'バッグの近くで手に持ったPeanup', thin: '目標 3 mm', light: '目標 28 g' },
  story: { title: ['Peanutの愛らしさ。', 'Upの前向きさ。'], body: 'Peanutの愛らしさとUpの前向きさから、Peanupは生まれました。目立ちすぎず、好きな一枚をそばに残します。', status: 'Peanup · Kickstarter 公開予定' },
  footer: { docs: '公開ドキュメント', contact: 'お問い合わせ', backTop: 'ページ上部へ' },
};

const de: ProductCopy = {
  ...en,
  locale: 'de',
  meta: { title: 'Peanup | 3,68-Zoll-E6-E-Paper mit ≈258.7 PPI', description: 'Peanup ist ein 3,68-Zoll-E6-E-Paper-Objekt mit sechs Farben, ≈258.7 PPI und Bluetooth für Fotos, Alltagsinformationen und kleine Momente.' },
  nav: { product: 'Produkt', experience: 'Erleben', ecosystem: 'Ökosystem', technology: 'Technik', design: 'Design', docs: 'Dokumentation', language: 'Sprache' },
  hero: { headline: ['Lieblingsmomente,', 'immer im Blick.'], body: 'Sende ein Lieblingsfoto an Peanup. Wie ein kleiner Farbabzug bleibt es still in deiner Nähe.', status: 'Demnächst auf Kickstarter', imageAlt: 'Weißes Peanup E-Paper-Gerät im Stil eines Sofortbilds', specsLabel: 'Produktmerkmale' },
  specRail: [{ value: '3,68”', label: 'E6-E-PAPER / SECHS FARBEN' }, { value: '≈258.7 PPI', label: 'PIXELDICHTE' }, { value: '3 mm', label: 'ZIELDICKE' }, { value: '28 g', label: 'ZIELGEWICHT' }, { value: 'BLE', label: 'BILDÜBERTRAGUNG' }],
  paper: { index: '01', kicker: 'Sichtbar, ohne zu leuchten', title: ['Kein weiterer heller Bildschirm.', 'Ein Blatt Papier, das sich ändert.'], body: 'Sechs echte Farben zeigen Fotos und Informationen. Das Panel leuchtet nicht. Im Tageslicht ist es besonders gut lesbar und behält das letzte Bild.', paletteLabel: 'Sechsfarbige E-Paper-Palette', pigments: ['Schwarz', 'Papier', 'Rot', 'Gelb', 'Blau', 'Grün'] },
  scenes: { ...en.scenes, title: ['Ein flüchtiger Moment.', 'Auf Papier bewahrt.'], body: 'Scrolle oder wähle ein Bild. Es wird von unten nach oben aktualisiert und bleibt danach ruhig stehen.', tabsLabel: 'Anzeige-Szenen', items: [{ id: 'rain', number: '01', title: 'Moment festhalten', detail: 'Sechsfarbige Wolken · Regen im Wind', ...localizedCanvas.de.rain }, { id: 'branch', number: '02', title: 'Alltag im Blick', detail: 'Datum · Wetter · Lesefund', date: '27. JULI', weather: '28° / SCHAUER', quote: 'Jeder Tag hat seine eigene Textur.', ...localizedCanvas.de.branch }, { id: 'bird', number: '03', title: 'Frei gestalten', detail: 'Kurzbefehle · Auto-Updates', ...localizedCanvas.de.bird }, { id: 'experience', number: '04', title: 'Jetzt du', detail: 'Foto ablegen · Text schreiben', ...localizedCanvas.de.experience }], start: 'Ausprobieren', skip: 'Weiter', live: { label: 'Live-Vorschau auf E-Paper', photo: 'Foto', text: 'Text', drop: 'Foto ablegen oder auswählen', local: 'Lokale Verarbeitung in sechs Farben', prompt: 'Einen bleibenden Satz schreiben', defaultText: 'Diesen Tag im Blick behalten.', privacy: 'Dein Foto verlässt diesen Browser nicht', intro: 'Hier ein Bild ausprobieren', ready: 'Sechsfarbige Aktualisierung abgeschlossen', textReady: 'Text auf E-Paper gehalten', error: 'Dieses Bild konnte nicht gelesen werden' } },
  life: { title: ['Ein kleines Bild,', 'überall im Alltag.'], caption: 'MAGNETISCHES E-PAPER-OBJEKT', imageAlt: 'Peanup an einer hellen Tasche im Alltag' },
  content: { ...en.content, index: '02', kicker: 'Ein Objekt, viele Rhythmen', title: ['Jetzt ein Foto.', 'Später nützliche Informationen.'], body: 'Wähle ein Foto oder eine Informationskarte. Prüfe die Sechsfarb-Vorschau und sende sie per Bluetooth.', modesLabel: 'Inhaltsmodi', modes: [{ id: 'photo', label: 'Foto', title: 'Diesen Tag auf Papier', meta: 'PHOTO / 16:24' }, { id: 'calendar', label: 'Kalender', title: 'Sonntag, 27. Juli', meta: 'SUNDAY / 27' }, { id: 'weather', label: 'Wetter', title: 'Schauer, später klar', meta: 'SHENZHEN / 28°' }, { id: 'quote', label: 'Lesen', title: 'Jeder Tag hat seine eigene Textur', meta: 'READING / 08:40' }], workflow: [{ title: 'Wählen', body: 'Foto oder Informationskarte' }, { title: 'Vorschau', body: 'Darstellung auf Sechsfarb-Papier' }, { title: 'Senden', body: 'Update per Bluetooth' }] },
  ecosystem: { ...en.ecosystem, index: '03', kicker: 'Für das iPhone. Offen für weitere Geräte.', title: ['Einmal aufnehmen.', 'Den Rest automatisieren.'], body: 'Auf dem iPhone folgen Aufnahme, Vorschau und Versand in einem Ablauf. Kurzbefehle automatisieren vertraute Updates. Andere Geräte senden Bilder über das WeChat Mini Program.', flow: ['Kamera', 'Sechsfarb-Rendering', 'Bluetooth'], features: [{ label: '01 / SHORTCUTS', title: 'Apple Kurzbefehle', body: 'Ein Bild mit Siri, einem Widget oder einer Automation vorbereiten und senden.' }, { label: '02 / TRANSFER', title: 'Übertragungsstatus', body: 'Verbindung, Übertragung und Display-Aktualisierung in der App verfolgen.' }, { label: '03 / LOCAL FIRST', title: 'Verarbeitung auf dem Gerät', body: 'Zuschnitt und Sechsfarb-Umwandlung laufen auf iPhone oder iPad. Das Original muss nicht hochgeladen werden.' }, { label: '04 / WECHAT', title: 'Übertragung per Mini Program', body: 'Auch Android-Geräte senden Bilder über das WeChat Mini Program.' }, { label: '05 / EXTENSIONS', title: 'Weitere Inhalte', body: 'Kalender, Wetter und Lesefunde sollen später auch geplante Bilder liefern.' }] },
  technology: { ...en.technology, index: '04', kicker: 'Vom Foto zum Sechsfarb-E-Paper', title: ['Das Telefon rechnet.', 'Das Papier behält das Ergebnis.'], body: 'Das Smartphone schneidet das Foto zu und wandelt es in sechs Farben um. Bluetooth sendet nur das fertige Bild. Danach bleibt es auf dem E-Paper sichtbar.', pipeline: [{ label: '01 / INPUT', title: 'Bild gestalten', body: 'Auf das Displayformat zuschneiden, ohne das Foto zu verzerren.' }, { label: '02 / SIX-COLOR', title: 'In sechs Farben rendern', body: 'Für die E6-Palette umwandeln und wichtige Details erhalten.' }, { label: '03 / BLUETOOTH', title: 'Senden', body: 'Das fertige Bild über Bluetooth Low Energy senden und den Fortschritt verfolgen.' }, { label: '04 / E-PAPER', title: 'Aktualisieren und halten', body: 'Das Bild bleibt auch nach dem Trennen sichtbar.' }], ditherTitle: ['Für jedes Foto', 'die passende Sechsfarb-Darstellung.'], ditherBody: 'Je nach Inhalt kommt eine andere Methode zum Einsatz. Vorschauen sollen schnell sein. Fotos brauchen Details. Text braucht klare Kanten.', ditherModes: [{ label: 'REALTIME', title: 'Ordered 4×4 / 8×8', body: 'Hält die Live-Vorschau schnell und stabil.' }, { label: 'BALANCED', title: 'Floyd–Steinberg / Stucki', body: 'Bewahrt mehr Abstufungen und Details in Fotos.' }, { label: 'PHOTO', title: 'Perzeptiv / Palette Mix', body: 'Stimmt die Farben vor dem finalen Update auf die E6-Palette ab.' }] },
  hardware: { ...en.hardware, kicker: 'HARDWARE / STANDARDMÄSSIG RUHIG', title: ['Das Bild bleibt.', 'Die Verbindung kommt nur beim Update.'], body: 'Das Bild braucht keine Beleuchtung. Bluetooth verbindet sich nur zum Aktualisieren und kehrt dann in den Standby zurück. Mit Maus oder Tippen siehst du vier Hardware-Funktionen.', items: [{ label: '01 / BLE', title: 'Bluetooth Low Energy', short: 'Kurz verbinden, dann ruhen', body: 'Nach der Übertragung eines Bildes kehrt Bluetooth in den stromsparenden Standby zurück.' }, { label: '02 / NFC', title: 'CUID NFC', short: 'Zutrittskarte, wo unterstützt', body: 'Bei CUID-Unterstützung kann Peanup als Zutrittskarte dienen. Die Registrierung braucht die Freigabe des Betreibers und muss lokale Regeln einhalten.' }, { label: '03 / QI', title: 'Kabelloses Laden mit Qi', short: 'Ablegen und laden', body: 'Es gibt keinen freiliegenden Ladeanschluss. Lege Peanup auf ein kompatibles Qi-Ladegerät.' }, { label: '04 / MAGNET', title: 'Magnetische Platzierung', short: 'Einrasten und zeigen', body: 'Befestige Peanup am Kühlschrank oder nutze kompatibles MagSafe-Zubehör. MagSafe-Kompatibilität bedeutet keine Apple-Zertifizierung.' }] },
  specifications: { ...en.specifications, index: '05', kicker: 'Zielwerte für Kickstarter', title: ['Klein genug zum Mitnehmen.', 'Komplett für den Alltag.'], body: 'Ein 3,68-Zoll-E6-E-Paper mit sechs Farben. Aus der aktiven Fläche ergeben sich rund 258,7 PPI.', targetNote: '3 mm, 28 g und mehr als ein Monat Laufzeit sind Kickstarter-Zielwerte. Die endgültigen Daten stehen mit der Serienversion fest. Die Laufzeit hängt von der Anzahl der Updates ab.', items: [{ value: '3,68” E6', label: 'Aktive Anzeige' }, { value: '≈258.7 PPI', label: 'Pixeldichte' }, { value: '6', label: 'Physische E-Paper-Farben' }, { value: '3 mm', label: 'Zieldicke' }, { value: '28 g', label: 'Zielgewicht' }, { value: '1+ Monat', label: 'Ziel-Akkulaufzeit', note: 'Abhängig von Updates' }, { value: 'BLE', label: 'Drahtlose Bildübertragung' }, { value: 'Qi', label: 'Kabelloses Laden' }, { value: 'Ohne Ports', label: 'Kein freiliegender Anschluss' }, { value: 'iOS', label: 'App und Kurzbefehle' }, { value: 'WeChat', label: 'Mini-Program-Übertragung' }, { value: 'CUID', label: 'Bedingter NFC-Zutritt' }] },
  design: { index: '06', kicker: 'Sofortbild-Charakter, digitale Freiheit', title: ['Sieht aus wie ein Abzug.', 'Lebt wie ein neuer Rahmen.'], body: 'Das weiße Gehäuse erinnert an ein Sofortbild. Du kannst es tragen, aufstellen oder an einer magnetischen Fläche befestigen. Die letzten Details werden für die Produktion weiter verfeinert.', phoneAlt: 'Peanup neben einem Smartphone', handAlt: 'Peanup in der Hand nahe einer Tasche', thin: '3 mm Zieldicke', light: '28 g Zielgewicht' },
  story: { title: ['Der Charme von Peanut.', 'Der Auftrieb von Up.'], body: 'Peanup verbindet den Charme von Peanut mit dem Auftrieb von Up. Es drängt sich nicht auf und hält ein Lieblingsbild in deiner Nähe.', status: 'Peanup · Demnächst auf Kickstarter' },
  footer: { docs: 'Offene Dokumentation', contact: 'Kontakt', backTop: 'Nach oben' },
};

const fr: ProductCopy = {
  ...en,
  locale: 'fr',
  meta: { title: 'Peanup | Papier électronique E6 six couleurs 3,68 pouces, ≈258.7 PPI', description: 'Peanup est un objet en papier électronique E6 six couleurs de 3,68 pouces et ≈258.7 PPI, connecté en Bluetooth, pour garder photos et informations à portée de regard.' },
  nav: { product: 'Produit', experience: 'Expérience', ecosystem: 'Écosystème', technology: 'Technologie', design: 'Design', docs: 'Documentation', language: 'Langue' },
  hero: { headline: ['Gardez vos images', 'sous les yeux.'], body: 'Envoyez une photo à Peanup. Comme un petit tirage couleur, elle reste discrètement près de vous.', status: 'Bientôt sur Kickstarter', imageAlt: 'Appareil Peanup blanc en papier électronique six couleurs inspiré d’une photo instantanée', specsLabel: 'Points forts du produit' },
  specRail: [{ value: '3,68”', label: 'E-PAPER E6 SIX COULEURS' }, { value: '≈258.7 PPI', label: 'DENSITÉ DE PIXELS' }, { value: '3 mm', label: 'ÉPAISSEUR CIBLE' }, { value: '28 g', label: 'POIDS CIBLE' }, { value: 'BLE', label: 'TRANSFERT SANS FIL' }],
  paper: { index: '01', kicker: 'Visible sans émettre de lumière', title: ['Pas un écran lumineux de plus.', 'Une feuille qui peut changer.'], body: 'Six couleurs physiques affichent photos et informations. La dalle n’émet pas de lumière. Elle reste nette en plein jour et conserve la dernière image.', paletteLabel: 'Palette du papier électronique six couleurs', pigments: ['Noir', 'Papier', 'Rouge', 'Jaune', 'Bleu', 'Vert'] },
  scenes: { ...en.scenes, title: ['Un instant en mouvement,', 'posé sur le papier.'], body: 'Faites défiler ou choisissez une scène. Elle s’actualise de bas en haut, puis reste tranquillement affichée.', tabsLabel: 'Sélecteur de scènes', items: [{ id: 'rain', number: '01', title: 'Figer un instant', detail: 'Nuages six couleurs · pluie dans le vent', ...localizedCanvas.fr.rain }, { id: 'branch', number: '02', title: 'Infos du jour', detail: 'Date · météo · extrait de lecture', date: '27 JUIL.', weather: '28° / AVERSES', quote: 'Chaque jour possède sa propre texture.', ...localizedCanvas.fr.branch }, { id: 'bird', number: '03', title: 'Créer librement', detail: 'Raccourcis · actualisation programmée', ...localizedCanvas.fr.bird }, { id: 'experience', number: '04', title: 'À vous de jouer', detail: 'Déposer une photo · écrire une phrase', ...localizedCanvas.fr.experience }], start: 'Essayer', skip: 'Continuer', live: { label: 'Aperçu e-paper en direct', photo: 'Photo', text: 'Texte', drop: 'Déposez ou choisissez une photo', local: 'Traitement local en six couleurs', prompt: 'Écrivez une phrase à garder', defaultText: 'Garder cette journée sous les yeux.', privacy: 'Votre photo ne quitte pas ce navigateur', intro: 'Essayez une image ici', ready: 'Actualisation six couleurs terminée', textReady: 'Texte conservé sur l’e-paper', error: 'Cette image ne peut pas être lue' } },
  life: { title: ['Une petite image,', 'partout dans la vie.'], caption: 'OBJET E-PAPER MAGNÉTIQUE', imageAlt: 'Peanup fixé à un sac clair dans une scène quotidienne' },
  content: { ...en.content, index: '02', kicker: 'Un objet, plusieurs rythmes', title: ['Une photo maintenant.', 'Une information utile ensuite.'], body: 'Choisissez une photo ou une carte d’information. Vérifiez le rendu six couleurs, puis envoyez-le par Bluetooth.', modesLabel: 'Modes de contenu', modes: [{ id: 'photo', label: 'Photo', title: 'Garder cette journée sur papier', meta: 'PHOTO / 16:24' }, { id: 'calendar', label: 'Calendrier', title: 'Dimanche 27 juillet', meta: 'SUNDAY / 27' }, { id: 'weather', label: 'Météo', title: 'Averses puis éclaircies', meta: 'SHENZHEN / 28°' }, { id: 'quote', label: 'Lecture', title: 'Chaque jour possède sa propre texture', meta: 'READING / 08:40' }], workflow: [{ title: 'Choisir', body: 'Photo ou carte d’information' }, { title: 'Prévisualiser', body: 'Rendu papier en six couleurs' }, { title: 'Envoyer', body: 'Actualisation Bluetooth' }] },
  ecosystem: { ...en.ecosystem, index: '03', kicker: 'Pensé pour l’iPhone, ouvert aux autres appareils', title: ['Capturez une fois.', 'L’automatisation fait le reste.'], body: 'Sur iPhone, capture, aperçu et envoi suivent un seul parcours. Les Raccourcis automatisent les mises à jour habituelles. Le mini-programme WeChat permet aussi d’envoyer depuis d’autres appareils.', flow: ['Appareil photo', 'Rendu six couleurs', 'Bluetooth'], features: [{ label: '01 / SHORTCUTS', title: 'Raccourcis Apple', body: 'Préparez et envoyez une image avec Siri, un widget ou une automatisation.' }, { label: '02 / TRANSFER', title: 'Progression du transfert', body: 'Suivez la connexion, l’envoi et l’actualisation dans l’app.' }, { label: '03 / LOCAL FIRST', title: 'Traitement sur l’appareil', body: 'Le recadrage et la conversion six couleurs se font sur iPhone ou iPad. La photo d’origine n’a pas besoin d’être envoyée.' }, { label: '04 / WECHAT', title: 'Transfert par Mini Program', body: 'Les appareils Android peuvent aussi envoyer des images avec le mini-programme WeChat.' }, { label: '05 / EXTENSIONS', title: 'Plus de sources', body: 'Calendriers, météo et extraits de lecture pourront alimenter des images programmées.' }] },
  technology: { ...en.technology, index: '04', kicker: 'De la photo au papier électronique six couleurs', title: ['Le téléphone calcule.', 'Le papier garde le résultat.'], body: 'Le téléphone recadre la photo et la convertit en six couleurs. Le Bluetooth envoie seulement l’image terminée. Le papier électronique la conserve ensuite.', pipeline: [{ label: '01 / INPUT', title: 'Composer', body: 'Recadrer au format de l’écran sans étirer la photo.' }, { label: '02 / SIX-COLOR', title: 'Rendre en six couleurs', body: 'Adapter la photo à la palette E6 tout en gardant les détails importants.' }, { label: '03 / BLUETOOTH', title: 'Envoyer', body: 'Transférer l’image par Bluetooth Low Energy et suivre sa progression.' }, { label: '04 / E-PAPER', title: 'Rafraîchir et conserver', body: 'L’image reste visible après la déconnexion.' }], ditherTitle: ['Pour chaque photo,', 'le bon rendu six couleurs.'], ditherBody: 'Chaque contenu demande une méthode adaptée. L’aperçu doit être rapide. La photo garde ses détails. Le texte reste net.', ditherModes: [{ label: 'REALTIME', title: 'Ordered 4×4 / 8×8', body: 'Garde l’aperçu de l’appareil photo rapide et stable.' }, { label: 'BALANCED', title: 'Floyd–Steinberg / Stucki', body: 'Conserve davantage de nuances et de détails dans les photos.' }, { label: 'PHOTO', title: 'Perceptuel / Palette Mix', body: 'Ajuste les couleurs à la palette E6 avant l’actualisation finale.' }] },
  hardware: { ...en.hardware, kicker: 'HARDWARE / CALME PAR DÉFAUT', title: ['L’image reste.', 'La connexion vient seulement pour actualiser.'], body: 'L’image n’a pas besoin de rétroéclairage. Le Bluetooth se connecte pour une mise à jour, puis revient en veille. Survolez ou touchez pour découvrir quatre fonctions.', items: [{ label: '01 / BLE', title: 'Bluetooth Low Energy', short: 'Se connecter brièvement, puis se reposer', body: 'Après l’envoi d’une image, le Bluetooth revient en veille basse consommation.' }, { label: '02 / NFC', title: 'CUID NFC', short: 'Badge, là où il est accepté', body: 'Peanup peut servir de badge si le système prend en charge CUID. L’enregistrement exige l’accord du gestionnaire et le respect des règles locales.' }, { label: '03 / QI', title: 'Recharge sans fil Qi', short: 'Poser pour recharger', body: 'Aucun port de charge n’est visible. Posez Peanup sur un chargeur Qi compatible.' }, { label: '04 / MAGNET', title: 'Placement magnétique', short: 'Fixer l’image en un geste', body: 'Fixez-le au réfrigérateur ou utilisez des accessoires MagSafe compatibles. La compatibilité MagSafe ne signifie pas une certification Apple.' }] },
  specifications: { ...en.specifications, index: '05', kicker: 'Objectifs Kickstarter', title: ['Assez léger pour voyager.', 'Assez complet pour le quotidien.'], body: 'Un papier électronique E6 six couleurs de 3,68 pouces. Sa zone active correspond à environ 258,7 PPI.', targetNote: 'Les 3 mm, 28 g et plus d’un mois d’autonomie sont des objectifs Kickstarter. Les caractéristiques finales seront celles de la version de série. L’autonomie dépend de la fréquence d’actualisation.', items: [{ value: '3,68” E6', label: 'Dalle active' }, { value: '≈258.7 PPI', label: 'Densité de pixels' }, { value: '6', label: 'Couleurs physiques e-paper' }, { value: '3 mm', label: 'Épaisseur cible' }, { value: '28 g', label: 'Poids cible' }, { value: 'Plus d’un mois', label: 'Autonomie cible', note: 'Selon les actualisations' }, { value: 'BLE', label: 'Transfert d’image sans fil' }, { value: 'Qi', label: 'Recharge sans fil' }, { value: 'Sans ports', label: 'Aucun connecteur apparent' }, { value: 'iOS', label: 'App et Raccourcis' }, { value: 'WeChat', label: 'Transfert Mini Program' }, { value: 'CUID', label: 'Accès NFC sous conditions' }] },
  design: { index: '06', kicker: 'L’esprit de l’instantané, la liberté du numérique', title: ['L’allure d’un tirage.', 'La liberté d’un cadre vivant.'], body: 'Le boîtier blanc évoque une photo instantanée. Portez-le, posez-le ou fixez-le à une surface magnétique. Les derniers détails sont encore affinés pour la production.', phoneAlt: 'Peanup présenté près d’un smartphone', handAlt: 'Peanup tenu en main près d’un sac', thin: 'Objectif 3 mm', light: 'Objectif 28 g' },
  story: { title: ['Le charme de Peanut.', 'L’élan de Up.'], body: 'Peanup unit le charme de Peanut à l’élan de Up. Il reste discret et garde une image préférée près de vous.', status: 'Peanup · Bientôt sur Kickstarter' },
  footer: { docs: 'Documentation ouverte', contact: 'Contact', backTop: 'Retour en haut' },
};

export const productCopy = { en, 'zh-cn': zhCn, 'zh-tw': zhTw, ja, de, fr } satisfies Record<Locale, ProductCopy>;

export const getLocaleAlternates = () => localeOrder.map((locale) => ({
  lang: localeMeta[locale].htmlLang,
  href: localeMeta[locale].path,
}));
