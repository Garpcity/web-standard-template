/**
 * Kontrakten mellom frontend og CMS. Typene er utledet fra Zod-skjemaene.
 * Frontend importerer herfra eller fra "@/content" – aldri fra en adapter.
 */
export type {
  ImageRef,
  LinkRef,
  RichText,
  RichTextNode,
  SeoFields,
  Block,
  BlockType,
  BlockOf,
  SiteSettings,
  Menu,
  MenuItem,
  Page,
  Category,
  Person,
  Article,
  Media,
  FormSubmission,
  Redirect,
  BrandGuide,
  SocialPost,
  AgentMeta,
} from "./schema";

export type PreviewContext = {
  enabled: boolean;
  /** Lenke til CMS-redigering av gjeldende dokument, hvis adapteren støtter det. */
  editUrl?: string;
};

export type ArticleQuery = {
  limit?: number;
  offset?: number;
  categoryId?: string;
  includeDrafts?: boolean;
};

export interface ContentAdapter {
  readonly name: "mock" | "wordpress" | "payload";
  getSiteSettings(): Promise<import("./schema").SiteSettings>;
  getMenu(name: import("./schema").Menu["name"]): Promise<import("./schema").Menu>;
  getPage(
    slug: string,
    opts?: { includeDrafts?: boolean },
  ): Promise<import("./schema").Page | null>;
  getPages(): Promise<import("./schema").Page[]>;
  getArticles(query?: ArticleQuery): Promise<import("./schema").Article[]>;
  getArticle(
    slug: string,
    opts?: { includeDrafts?: boolean },
  ): Promise<import("./schema").Article | null>;
  getPeople(ids?: string[]): Promise<import("./schema").Person[]>;
  getPerson(id: string): Promise<import("./schema").Person | null>;
  getCategories(): Promise<import("./schema").Category[]>;
  getRedirects(): Promise<import("./schema").Redirect[]>;
  getBrandGuide(): Promise<import("./schema").BrandGuide | null>;
  getPreviewContext(path: string): Promise<PreviewContext>;
  /** Puck-editor lagrer sider her. Adaptere som ikke støtter det kaster. */
  savePage?(page: import("./schema").Page): Promise<void>;
  /** Agenter (MCP) lager utkast her. Status settes alltid til draft av kalleren. */
  saveArticle?(article: import("./schema").Article): Promise<void>;
  saveSocialPost?(post: import("./schema").SocialPost): Promise<void>;
  getSocialPosts?(): Promise<import("./schema").SocialPost[]>;
}
