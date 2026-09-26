// Skin Museum browser window, built with Webamp's generated-window chrome so it
// matches the player and follows the active skin.
//
// Layout follows the museum itself: a grid of skin screenshots with the archive
// name underneath, and a footer with paging. Clicking a skin applies it live.

import { fetchSkins, searchSkins, screenshotUrl, skinName, downloadUrl, SORTS, storeSkin, readStoredSkin } from "./skins.js";

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};

export function createSkinBrowser({ onApply, overlayHost = null }) {
  // Assigned below and invoked whenever a skin is applied, so the host can
  // remember it in the player's own skins menu.
  let notifyPicked = () => {};
  const overlay = el("div", "skins-overlay");
  overlay.hidden = true;

  // Generated-window frame, identical structure to Webamp's own gen-window.
  const windowEl = el("div", "gen-window window skins-window");
  const top = el("div", "gen-top draggable");
  const topRight = el("div", "gen-top-right draggable");
  const closeButton = el("div", "gen-close winamp-active");
  closeButton.setAttribute("role", "button");
  closeButton.setAttribute("aria-label", "Close skin browser");
  closeButton.tabIndex = 0;
  topRight.append(closeButton);

  const titleNode = el("div", "gen-top-title draggable");
  for (const ch of "SKIN MUSEUM") {
    titleNode.append(el("div", `draggable gen-text-letter gen-text-${ch === " " ? "space" : ch.toLowerCase()}`));
  }

  top.append(
    el("div", "gen-top-left draggable"),
    el("div", "gen-top-left-fill draggable"),
    el("div", "gen-top-left-end draggable"),
    titleNode,
    el("div", "gen-top-right-end draggable"),
    el("div", "gen-top-right-fill draggable"),
    topRight
  );

  const middle = el("div", "gen-middle");
  const middleLeft = el("div", "gen-middle-left draggable");
  middleLeft.append(el("div", "gen-middle-left-bottom draggable"));
  const middleCenter = el("div", "gen-middle-center");
  const middleRight = el("div", "gen-middle-right draggable");
  middleRight.append(el("div", "gen-middle-right-bottom draggable"));
  middle.append(middleLeft, middleCenter, middleRight);

  const bottom = el("div", "gen-bottom");
  bottom.append(
    el("div", "gen-bottom-left draggable"),
    el("div", "gen-bottom-fill draggable"),
    el("div", "gen-bottom-right draggable")
  );

  // Interior
  const body = el("div", "skins-body");

  const toolbar = el("div", "skins-toolbar");
  const search = el("input", "skins-input");
  search.type = "search";
  search.placeholder = "Search skins...";
  search.setAttribute("aria-label", "Search skins");
  const sortSelect = el("select", "skins-select");
  sortSelect.setAttribute("aria-label", "Sort skins");
  for (const s of SORTS) sortSelect.append(new Option(s.label, s.id));
  const status = el("span", "skins-status", "Loading...");
  toolbar.append(search, sortSelect, status);

  const grid = el("div", "skins-grid");

  const footer = el("div", "skins-footer");
  const prevButton = el("button", "skins-button", "Prev");
  const pageLabel = el("span", "skins-page");
  const nextButton = el("button", "skins-button", "Next");
  prevButton.type = "button";
  nextButton.type = "button";
  footer.append(prevButton, pageLabel, nextButton);

  body.append(toolbar, grid, footer);
  middleCenter.append(body);
  windowEl.append(top, middle, bottom);
  overlay.append(windowEl);

  const PAGE = 24;
  let offset = 0;
  let total = 0;
  let loading = false;

  function mount() {
    const host = overlayHost ?? document.querySelector("#webamp");
    if (host && overlay.parentElement !== host) host.append(overlay);
    else if (!host && !overlay.parentElement) document.body.append(overlay);
  }

  function tile(node) {
    const article = el("div", "skins-tile");
    const button = el("button", "skins-pick");
    button.type = "button";
    button.title = `Apply ${skinName(node)}`;

    const img = el("img", "skins-thumb");
    img.loading = "lazy";
    img.decoding = "async";
    img.alt = "";
    img.src = screenshotUrl(node);
    button.append(img);

    const caption = el("span", "skins-name", skinName(node));
    button.append(caption);

    button.addEventListener("click", async () => {
      const name = skinName(node);
      status.textContent = `Applying ${name}...`;
      try {
        await onApply(node);
        storeSkin(node);
        // Let the host add this skin to Webamp's own Skins submenu.
        notifyPicked(node);
        status.textContent = `${name} applied`;
        for (const active of grid.querySelectorAll(".skins-tile.is-active")) {
          active.classList.remove("is-active");
        }
        article.classList.add("is-active");
      } catch (error) {
        // Most failures are Wasabi (Winamp 3/5) skins, which Webamp cannot load.
        status.textContent = `${name} is not a classic Winamp 2 skin`;
      }
    });

    article.append(button);
    return article;
  }

  // Browse the catalogue, or run a museum search when a term is present.
  // Searching uses the classic-only endpoint so every result is loadable.
  async function load() {
    if (loading) return;
    loading = true;
    const term = search.value.trim();
    status.textContent = term ? "Searching..." : "Loading...";

    try {
      const result = term
        ? await searchSkins({ query: term, offset, first: PAGE })
        : await fetchSkins({ offset, first: PAGE, sort: sortSelect.value });

      if (!term) {
        total = result.total;
      }
      grid.replaceChildren(...result.items.map(tile));

      if (term) {
        // The search endpoint does not report a total, so page until it runs dry.
        status.textContent = result.items.length === 0
          ? `No skins match "${term}"`
          : `${result.items.length} result${result.items.length === 1 ? "" : "s"} for "${term}"`;
        pageLabel.textContent = `page ${Math.floor(offset / PAGE) + 1}`;
        prevButton.disabled = offset === 0;
        nextButton.disabled = result.items.length < PAGE;
      } else {
        const page = Math.floor(offset / PAGE) + 1;
        const pages = Math.max(1, Math.ceil(total / PAGE));
        pageLabel.textContent = `${page} / ${pages}`;
        status.textContent = `${total.toLocaleString()} skins`;
        prevButton.disabled = offset === 0;
        nextButton.disabled = offset + PAGE >= total;
      }

      markStored(result.items);
    } catch (error) {
      status.textContent = error?.message || "Skin Museum is unavailable";
    } finally {
      loading = false;
    }
  }

  // Highlight the tile matching the skin that is already applied.
  function markStored(items) {
    const stored = readStoredSkin();
    if (!stored) return;
    const index = items.findIndex((node) => node.md5 === stored.md5);
    if (index >= 0) {
      grid.children[index]?.classList.add("is-active");
    }
  }

  let searchTimer = null;
  search.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      offset = 0;
      void load();
    }, 350);
  });
  search.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      clearTimeout(searchTimer);
      offset = 0;
      void load();
    }
  });

  sortSelect.addEventListener("change", () => { offset = 0; void load(); });
  prevButton.addEventListener("click", () => {
    offset = Math.max(0, offset - PAGE);
    void load();
  });
  nextButton.addEventListener("click", () => {
    if (offset + PAGE < total) {
      offset += PAGE;
      void load();
    }
  });
  closeButton.addEventListener("click", () => { overlay.hidden = true; });
  closeButton.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") overlay.hidden = true;
  });
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) overlay.hidden = true;
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !overlay.hidden) overlay.hidden = true;
  });

  async function show() {
    mount();
    overlay.hidden = false;
    if (grid.childElementCount === 0) {
      await load();
    }
    search.focus();
  }

  return {
    show,
    load,
    element: overlay,
    set onSkinPicked(fn) { notifyPicked = typeof fn === "function" ? fn : () => {}; },
    get downloadUrl() { return downloadUrl; }
  };
}
