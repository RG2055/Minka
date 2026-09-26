// The bundled themes: a classic skin plus the CSS layer that dresses the parts
// a skin bitmap cannot reach (the Media Library, the Skin Museum, the dock's
// own switch button).
//
// A theme is applied on mount (`theme: "spotify"`) or later
// (`radio.setTheme("spotify")` / `radio.setTheme(null)`). Setting one loads the
// bundled .wsz as the classic skin and puts the theme's class on the window
// that carries Webamp's skin CSS (`#webamp`), which is also the only element
// the generated windows and their `gen-*` chrome live under.

export const DEFAULT_THEME = "spotify";

export const THEMES = {
  spotify: {
    id: "spotify",
    label: "Spotify",
    // classic skin archive, relative to `assetsBase`
    skin: "skins/spotify.wsz",
    // class added to the elements that carry Webamp's skinned chrome
    className: "webamp-theme-spotify"
  },

  classic: {
    id: "classic",
    label: "Classic Winamp",
    skin: null,
    className: null
  }
};

export function themeById(id) {
  if (id == null) return null;
  return THEMES[id] ?? null;
}

/** Every theme the player can switch to, in menu order. */
export function themeList() {
  return Object.values(THEMES).filter((theme) => theme.id !== "classic");
}

/** Resolves a theme's skin URL against the runtime base. */
export function themeSkinUrl(theme, base) {
  return theme?.skin ? new URL(theme.skin, base).href : null;
}
