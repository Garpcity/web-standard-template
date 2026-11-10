/** GraphQL-spørringer mot WPGraphQL + site-core-pluginen. */

const MEDIA = `{ sourceUrl altText caption mediaDetails { width height } }`;
const SEO = `seoTitle seoDescription seoNoindex seoCanonical seoImage ${MEDIA}`;

export const PAGE_FIELDS = `databaseId slug title status date modified isFrontPage siteBlocks ${SEO}`;
export const POST_FIELDS = `databaseId slug title status date modified content summary sources ${SEO}
  featuredImage { node ${MEDIA} }
  author { node { databaseId slug } }
  categories { nodes { databaseId slug name } }`;
export const PERSON_FIELDS = `databaseId slug title status date modified content role email phone knowsAbout credentials sameAs
  featuredImage { node ${MEDIA} }`;
const MENU_ITEM_FIELDS = `databaseId label url target parentDatabaseId`;

export const Q = {
  settings: `query Settings { settings brandGuide redirects generalSettings { title } }`,

  menu: `query Menu($location: MenuLocationEnum!) {
    menuItems(where: { location: $location }, first: 100) { nodes { ${MENU_ITEM_FIELDS} } }
  }`,

  pageBySlug: `query Page($slug: ID!) { page(id: $slug, idType: URI) { ${PAGE_FIELDS} } }`,
  frontPage: `query FrontPage { nodeByUri(uri: "/") { ... on Page { ${PAGE_FIELDS} } } }`,
  pages: `query Pages { pages(first: 200, where: { status: PUBLISH }) { nodes { ${PAGE_FIELDS} } } }`,

  posts: `query Posts($first: Int!, $after: String, $categoryId: Int, $status: [PostStatusEnum]) {
    posts(first: $first, after: $after, where: { categoryId: $categoryId, stati: $status, orderby: { field: DATE, order: DESC } }) {
      pageInfo { hasNextPage endCursor }
      nodes { ${POST_FIELDS} }
    }
  }`,
  postBySlug: `query Post($slug: ID!) { post(id: $slug, idType: SLUG) { ${POST_FIELDS} } }`,

  people: `query People { people(first: 200, where: { status: PUBLISH, orderby: { field: MENU_ORDER, order: ASC } }) { nodes { ${PERSON_FIELDS} } } }`,
  personById: `query Person($id: ID!) { person(id: $id, idType: DATABASE_ID) { ${PERSON_FIELDS} } }`,

  categories: `query Categories { categories(first: 100) { nodes { databaseId slug name description } } }`,
};
