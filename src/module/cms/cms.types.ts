/**
 * The CMS module fronts four sibling Prisma models that share a `ContentStatus`
 * lifecycle but not their columns. Every route is addressed by its URL segment.
 */
export const CMS_CONTENT_TYPES = [
  'pages',
  'services',
  'case-studies',
  'articles',
] as const;

export type CmsContentType = (typeof CMS_CONTENT_TYPES)[number];

export function isCmsContentType(value: string): value is CmsContentType {
  return (CMS_CONTENT_TYPES as readonly string[]).includes(value);
}

/** Human-readable entity name used in audit records and error messages. */
export const CMS_ENTITY_NAME: Record<CmsContentType, string> = {
  pages: 'CmsPage',
  services: 'CmsService',
  'case-studies': 'CmsCaseStudy',
  articles: 'CmsArticle',
};

export const CMS_LABEL: Record<CmsContentType, string> = {
  pages: 'Page',
  services: 'Service',
  'case-studies': 'Case study',
  articles: 'Article',
};
