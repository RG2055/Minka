// Winamp Skin Museum client.
//
// The museum (https://skins.webamp.org) exposes a public GraphQL endpoint and
// serves every skin from its CDN. Webamp only understands classic Winamp 2
// archives, so the classic-only search is used: it guarantees every result is a
// .wsz that Webamp can actually load, unlike the mixed search which also returns
// .wal (Winamp 3/5) skins.

const graphqlUrl = "https://skins.webamp.org/graphql";
const cdnBase = "https://r2.webampskins.org";

// Browsing the catalogue, newest-first within the museum's own ordering.
const BROWSE_QUERY = `
  query Browse($first: Int!, $offset: Int!, $sort: SkinsSortOption) {
    skins(first: $first, offset: $offset, sort: $sort) {
      count
      nodes { md5 filename download_url screenshot_url webamp_url nsfw }
    }
  }
`;

// Full-text search restricted to classic skins, so every hit is loadable.
const SEARCH_QUERY = `
  query Search($query: String!, $first: Int!, $offset: Int!) {
    search_classic_skins(query: $query, first: $first, offset: $offset) {
      md5 filename download_url screenshot_url webamp_url nsfw
    }
  }
`;

export function downloadUrl(node) {
  return node.download_url || `${cdnBase}/skins/${node.md5}.wsz`;
}

export function screenshotUrl(node) {
  return node.screenshot_url || `${cdnBase}/screenshots/${node.md5}.png`;
}

// The museum keeps the original archive filename; tidy it for display.
export function skinName(node) {
  return (node.filename || node.md5)
    .replace(/\.(wsz|zip)$/i, "")
    .replace(/[[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim() || node.md5;
}

export const SORTS = [
  { id: "MUSEUM", label: "Curated" },
  { id: "TWEETED", label: "Most shared" }
];

async function request(query, variables) {
  const response = await fetch(graphqlUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables })
  });

  if (!response.ok) {
    throw new Error(`Skin Museum returned HTTP ${response.status}`);
  }

  const body = await response.json();
  if (body.errors?.length) {
    throw new Error(body.errors[0].message || "Skin Museum query failed");
  }
  return body.data;
}

export async function fetchSkins({ offset = 0, first = 24, sort = "MUSEUM" } = {}) {
  const data = await request(BROWSE_QUERY, {
    first,
    offset,
    sort: sort === "MUSEUM" ? null : sort
  });
  const skins = data?.skins;
  return {
    total: skins?.count ?? 0,
    // The search-backed count is unknown, so the browser uses the browse total.
    items: (skins?.nodes ?? []).filter((node) => !node.nsfw)
  };
}

export async function searchSkins({ query, offset = 0, first = 24 }) {
  const data = await request(SEARCH_QUERY, { query, first, offset });
  const items = (data?.search_classic_skins ?? []).filter((node) => !node.nsfw);
  return { total: null, items };
}

// Applies a museum skin to Webamp.
export async function applySkin(webamp, node) {
  const url = downloadUrl(node);
  await webamp.setSkinFromUrl(url);
  return url;
}

export function storeSkin(node) {
  try {
    localStorage.setItem("webamp.skin", JSON.stringify({
      md5: node.md5,
      name: skinName(node),
      url: downloadUrl(node)
    }));
  } catch {
    // Storage unavailable; the skin just will not be restored next visit.
  }
}

export function readStoredSkin() {
  try {
    return JSON.parse(localStorage.getItem("webamp.skin") || "null");
  } catch {
    return null;
  }
}
