// The SHOUTcast directory genre tree as Winamp's "Internet Radio" library view
// listed it (primary genres with their sub-genres). Each node carries the
// Radio Browser tag it maps onto, since that database is what the online view
// searches now that the SHOUTcast directory API is gone.

const tree = [
  ["Alternative", ["Adult Alternative", "Britpop", "Classic Alternative", "College", "Dancepunk", "Dream Pop", "Emo", "Goth", "Grunge", "Indie Pop", "Indie Rock", "Industrial", "Lo-Fi", "Modern Rock", "New Wave", "Noise Pop", "Post-Punk", "Power Pop", "Punk", "Ska", "Xtreme"]],
  ["Blues", ["Acoustic Blues", "Cajun/Zydeco", "Chicago Blues", "Contemporary Blues", "Country Blues", "Delta Blues", "Electric Blues"]],
  ["Classical", ["Baroque", "Chamber", "Choral", "Classical Period", "Early Classical", "Impressionist", "Modern", "Opera", "Piano", "Romantic", "Symphony"]],
  ["Country", ["Alt-Country", "Americana", "Bluegrass", "Classic Country", "Contemporary Bluegrass", "Contemporary Country", "Honky Tonk", "Hot Country Hits", "Western"]],
  ["Decades", ["30s", "40s", "50s", "60s", "70s", "80s", "90s", "00s"]],
  ["Easy Listening", ["Exotica", "Light Rock", "Lounge", "Orchestral Pop", "Polka", "Space Age Pop"]],
  ["Electronic", ["Acid House", "Ambient", "Big Beat", "Breakbeat", "Dance", "Demo", "Disco", "Downtempo", "Drum and Bass", "Dubstep", "Electro", "Garage", "Hard House", "House", "IDM", "Jungle", "Progressive", "Remixes", "Techno", "Trance", "Tribal", "Trip Hop"]],
  ["Folk", ["Alternative Folk", "Contemporary Folk", "Folk Rock", "New Acoustic", "Traditional Folk", "World Folk"]],
  ["Inspirational", ["Christian", "Christian Metal", "Christian Rap", "Christian Rock", "Classic Christian", "Contemporary Gospel", "Gospel", "Praise/Worship", "Sermons/Services", "Southern Gospel", "Traditional Gospel"]],
  ["International", ["African", "Afrikaans", "Arabic", "Asian", "Brazilian", "Caribbean", "Celtic", "European", "Filipino", "Greek", "Hawaiian/Pacific", "Hindi", "Indian", "Japanese", "Jewish", "Klezmer", "Mediterranean", "Middle Eastern", "North American", "Polskie", "Soca", "South American", "Tamil", "Worldbeat", "Zouk"]],
  ["Jazz", ["Acid Jazz", "Avant Garde", "Big Band", "Bop", "Classic Jazz", "Cool Jazz", "Fusion", "Hard Bop", "Latin Jazz", "Smooth Jazz", "Swing", "Vocal Jazz", "World Fusion"]],
  ["Latin", ["Bachata", "Banda", "Bossa Nova", "Cumbia", "Latin Dance", "Latin Pop", "Latin Rap/Hip-Hop", "Latin Rock", "Mariachi", "Merengue", "Ranchera", "Reggaeton", "Regional Mexican", "Salsa", "Tango", "Tejano", "Tropicalia"]],
  ["Metal", ["Black Metal", "Classic Metal", "Extreme Metal", "Grindcore", "Hair Metal", "Heavy Metal", "Metalcore", "Power Metal", "Progressive Metal", "Rap Metal"]],
  ["Misc", []],
  ["New Age", ["Environmental", "Ethnic Fusion", "Healing", "Meditation", "Spiritual"]],
  ["Pop", ["Adult Contemporary", "Barbershop", "Bubblegum Pop", "Dance Pop", "Idols", "JPOP", "K-Pop", "Oldies", "Soft Rock", "Teen Pop", "Top 40", "World Pop"]],
  ["Public Radio", ["College", "News", "Sports", "Talk"]],
  ["R&B/Urban", ["Classic R&B", "Contemporary R&B", "Doo Wop", "Funk", "Motown", "Neo-Soul", "Quiet Storm", "Soul", "Urban Contemporary"]],
  ["Rap", ["Alternative Rap", "Dirty South", "East Coast Rap", "Freestyle", "Gangsta Rap", "Hip Hop", "Mixtapes", "Old School", "Turntablism", "Underground Hip-Hop", "West Coast Rap"]],
  ["Reggae", ["Contemporary Reggae", "Dancehall", "Dub", "Pop-Reggae", "Ragga", "Reggae Roots", "Rock Steady"]],
  ["Rock", ["Adult Album Alternative", "British Invasion", "Classic Rock", "Garage Rock", "Glam", "Hard Rock", "Jam Bands", "Piano Rock", "Prog Rock", "Psychedelic", "Rock & Roll", "Rockabilly", "Singer/Songwriter", "Surf"]],
  ["Seasonal/Holiday", ["Anniversary", "Birthday", "Christmas", "Halloween", "Hanukkah", "Honeymoon", "Valentine", "Wedding", "Winter"]],
  ["Soundtracks", ["Anime", "Bollywood", "Kids", "Original Score", "Showtunes", "Video Game Music"]],
  ["Talk", ["Comedy", "Community", "Educational", "Government", "News", "Old Time Radio", "Other Talk", "Political", "Public Radio", "Scanner", "Spoken Word", "Sports", "Technology"]],
  ["Themes", ["Adult", "Best Of", "Chill", "Eclectic", "Experimental", "Female", "Hardcore", "Heartache", "Instrumental", "LGBT", "Love/Romance", "Party Mix", "Patriotic", "Rainy Day Mix", "Reality", "Sexy", "Shuffle", "Travel Mix", "Tribute", "Trippy", "Work Mix"]]
];

// Where the SHOUTcast label and the most common Radio Browser tag differ.
const tagOverrides = new Map([
  ["R&B/Urban", "rnb"],
  ["Classic R&B", "classic rnb"],
  ["Contemporary R&B", "rnb"],
  ["Rap", "hip hop"],
  ["Hip Hop", "hip hop"],
  ["Underground Hip-Hop", "underground hip hop"],
  ["Latin Rap/Hip-Hop", "latin hip hop"],
  ["Seasonal/Holiday", "holiday"],
  ["Praise/Worship", "worship"],
  ["Sermons/Services", "sermons"],
  ["Cajun/Zydeco", "zydeco"],
  ["Hawaiian/Pacific", "hawaiian"],
  ["Love/Romance", "love"],
  ["Singer/Songwriter", "singer-songwriter"],
  ["Rock & Roll", "rock n roll"],
  ["Drum and Bass", "drum and bass"],
  ["Trip Hop", "trip-hop"],
  ["Lo-Fi", "lofi"],
  ["JPOP", "jpop"],
  ["K-Pop", "kpop"],
  ["Video Game Music", "video game"],
  ["Old Time Radio", "old time radio"],
  ["Misc", ""],
  ["Public Radio", "public radio"],
  ["Polskie", "polish"],
  ["Decades", "oldies"],
  ["Themes", ""],
  ["Talk", "talk"],
  ["International", "world music"],
  ["Inspirational", "christian"],
  ["Easy Listening", "easy listening"],
  ["Electronic", "electronic"],
  ["Alternative", "alternative"],
  ["Classical", "classical"],
  ["Soundtracks", "soundtrack"],
  ["Modern", "contemporary classical"],
  ["Progressive", "progressive house"],
  ["Demo", "demoscene"],
  ["Xtreme", "extreme"],
  ["Idols", "idol"],
  ["Remixes", "remix"],
  ["Sports", "sports"],
  ["News", "news"]
]);

export function tagFor(label) {
  if (tagOverrides.has(label)) {
    return tagOverrides.get(label);
  }
  return label.toLowerCase().replace(/\s*\/.*$/, "").trim();
}

/** The genre tree: [{ name, tag, children: [{ name, tag }] }]. */
export const genreTree = tree.map(([name, children]) => ({
  name,
  tag: tagFor(name),
  children: children.map((child) => ({ name: child, tag: tagFor(child) }))
}));

const titleCase = (text) => text
  .split(/(\s+|-)/)
  .map((part) => (part ? part[0].toLocaleUpperCase() + part.slice(1) : part))
  .join("");

/** Present a raw tag the way the directory listed genres. */
export function genreLabel(tag) {
  const normalized = String(tag ?? "").trim().toLowerCase();
  if (!normalized) {
    return "";
  }
  for (const primary of genreTree) {
    if (primary.tag === normalized) {
      return primary.name;
    }
    const child = primary.children.find((node) => node.tag === normalized);
    if (child) {
      return child.name;
    }
  }
  return titleCase(normalized);
}
