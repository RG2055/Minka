// Title / artist cleaning for YouTube music results, ported from the Lācītis
// player (integrations/lacitis/player/index.html cleanMusicMeta) so the same
// song reads the same in Webamp as it did in the old console.

const GENERIC_MUSIC_CHANNEL = /^(?:worldstar(?:hiphop)?|wshh|lyrical lemonade|trap nation|chill nation|rap nation|wave music|cloudkid|7clouds|proximity|majestic casual|mrsuicidesheep|selected|various artists)$/i;

export function cleanMusicMeta(rawTitleValue, rawAuthorValue = "") {
  const rawTitle = String(rawTitleValue || "").replace(/\s+/g, " ").trim();
  const rawAuthor = String(rawAuthorValue || "").replace(/\s+/g, " ").trim();
  let title = rawTitle;
  const isVevoChannel = /VEVO\s*$/i.test(rawAuthor);
  let author = rawAuthor.replace(/\s+-\s+Topic\s*$/i, "").replace(/\s*VEVO\s*$/i, "").trim();
  if (isVevoChannel && !/\s/.test(author)) author = author.replace(/([a-zāčēģīķļņšūž])([A-ZĀČĒĢĪĶĻŅŠŪŽ])/g, "$1 $2");

  // Promotional labels, wherever uploaders put them; real qualifiers such as
  // "(feat. X)", remixes and live versions stay.
  title = title.replace(/\b(?:official(?:\s+music)?\s+video|music\s+video|official\s+audio|lyrics?\s+video|visuali[sz]er)\b/gi, " ");
  title = title.replace(/\s*[[(][^\])]{0,180}(?:official|music\s+video|lyrics?|visuali[sz]er|wshh\s+exclusive|audio\s+only|premiere|\b(?:audio|video|4k|hd|hq)\b)[^\])]{0,180}[\])]\s*/gi, " ");
  title = title.replace(/\s*(?:[-–—|•]\s*)?(?:official(?:\s+music)?\s+(?:video|audio)|music\s+video|official\s+(?:video|audio)|lyrics?(?:\s+video)?|visuali[sz]er|wshh\s+exclusive|audio\s+only|premiere|\b(?:4k|hd|hq)\b)\s*$/gi, " ");
  title = title.replace(/\s*[[(]\s*[\])]\s*/g, " ");
  title = title.replace(/\s+(?:featuring|ft\.?|feat\.?)\s+([^()[\]]+)$/i, " (feat. $1)");
  title = title.replace(/\s+/g, " ").trim();

  const quoted = title.match(/^(.{2,80}?)\s+["“”]([^"“”]{1,180})["“”](?:\s|$)/);
  if (quoted) {
    author = quoted[1].trim();
    title = quoted[2].trim();
  } else {
    const pipeSplit = title.match(/^(.{2,90}?)\s*\|\s*(.{1,200})$/);
    const split = pipeSplit || title.match(/^(.{2,90}?)\s+[-–—]\s+(.{1,200})$/);
    if (split) {
      const inferredArtist = split[1].trim();
      title = split[2].trim();
      if (pipeSplit || !author || GENERIC_MUSIC_CHANNEL.test(author) || author.toLowerCase().includes(inferredArtist.toLowerCase())) author = inferredArtist;
    }
  }

  title = title.replace(/\s*[[(]\s*[\])]\s*$/, "").replace(/^[\s"“”]+|[\s"“”]+$/g, "").replace(/\s+/g, " ").trim();
  if (GENERIC_MUSIC_CHANNEL.test(author)) {
    const split = rawTitle.match(/^(.{2,90}?)\s+[-–—]\s+/);
    if (split) author = split[1].trim();
  }
  if (/^(?:unknown|unknown artist|nezināms)$/i.test(author)) author = "Nezināms izpildītājs";
  return { title: title || rawTitle || "Nezināma dziesma", artist: author || rawAuthor };
}

export function parseDuration(duration) {
  if (typeof duration === "number") return duration;
  const parts = String(duration || "").split(":").map(Number).filter((n) => Number.isFinite(n));
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0] || 0;
  return 0;
}

export const thumbnailFor = (id, quality = "mqdefault") => `https://i.ytimg.com/vi/${id}/${quality}.jpg`;

/** Same song under two ids (video vs "- Topic" upload): artist+title key. */
export function trackIdentity(artist, title) {
  const clean = (value) => String(value || "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const a = clean(artist);
  const t = clean(title);
  return a && t ? `${a}\u0000${t}` : "";
}
