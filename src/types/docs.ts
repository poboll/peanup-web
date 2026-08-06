export interface DocTocItem {
  id: string;
  label: string;
}

export interface DocPageConfig {
  title: string;
  description: string;
  locale: 'zh-cn' | 'en';
  current: 'product' | 'content' | 'image' | 'hardware' | 'compatibility' | 'troubleshooting' | 'support' | 'shortcuts' | 'glossary' | 'campaign' | 'engineering' | 'privacy' | 'updates';
  toc: DocTocItem[];
  seriesLabel: string;
  revisionLabel: string;
  datePublished: string;
  dateModified: string;
  schemaType?: 'TechArticle' | 'WebPage';
  articleClass?: string;
  faqs?: Array<[question: string, answer: string]>;
}
