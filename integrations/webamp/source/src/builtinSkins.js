// Skins shipped with the app. The Modern ones are the three from the Winamp
// source tree (Src/resources/skins), packed by tools/pack-winamp-skins.sh into
// public/skins/modern/ (dist-embed/skins/modern/ in the library build).
// `variant` names the skin folder inside an archive that holds several
// (bento.zip: Bento + Big Bento).
//
// `privateDefaults` is the skin's initial private config (what Winamp's
// studio.xnf would hold), applied until the user changes it in the skin:
// Bento and Big Bento open with the lower panel collapsed ("Component" =
// "Hidden"; its expand button brings the Media Library back).
//
// `base` is where the host serves the runtime files (see mountWebampRadio's
// `assetsBase`); default: next to the page.
export function builtinModernSkins(base = document.baseURI) {
  const dir = new URL("skins/modern/", base).href;
  return [
    { id: "winamp-modern", label: "Winamp Modern", url: `${dir}winamp-modern.wal` },
    { id: "bento", label: "Bento", url: `${dir}bento.zip`, variant: "Bento", privateDefaults: { Bento: { Component: "Hidden", "Hidden Component": "Media Library", nomax_h: 492 } } },
    { id: "big-bento", label: "Big Bento", url: `${dir}bento.zip`, variant: "Big Bento", privateDefaults: { "Big Bento": { Component: "Hidden", "Hidden Component": "Media Library", nomax_h: 492 } } },
    { id: "nokia-edition", label: "Nokia Edition", url: `${dir}nokia-edition.wal` }
  ];
}
