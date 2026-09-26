// HLS (.m3u8) playback inside Webamp.
//
// Webamp hands every track to one <audio> element. Chrome and Firefox cannot
// play HLS through that element natively, so this swaps in hls.js (MSE) for
// HLS addresses by wrapping the element source's loadUrl. Safari plays HLS
// natively and is left alone. hls.js (npm dependency) is a lazy chunk,
// loaded on first HLS station; a host page that already has window.Hls is
// used as-is.

export const isHlsUrl = (url) => /\.m3u8(?:[?#]|$)|\.isml\//i.test(String(url ?? ""));

let hlsLoader = null;

function loadHls() {
  if (window.Hls) {
    return Promise.resolve(window.Hls);
  }
  if (!hlsLoader) {
    hlsLoader = import("hls.js").then((mod) => mod.default ?? mod.Hls ?? mod).catch((error) => {
      hlsLoader = null;
      throw error;
    });
  }
  return hlsLoader;
}

export function installHlsSupport(webamp, { onMetadata } = {}) {
  const source = webamp.media?._source;
  const audio = source?._audio;
  if (!source || !audio || source.__hlsInstalled) {
    return;
  }
  source.__hlsInstalled = true;

  const loadUrl = source.loadUrl.bind(source);
  const seekToTime = source.seekToTime.bind(source);
  const nativeHls = Boolean(audio.canPlayType("application/vnd.apple.mpegurl"));
  let hls = null;

  const dropHls = () => {
    if (hls) {
      hls.destroy();
      hls = null;
    }
  };
  // Another source taking the element over (youtube/source.js) ends the
  // hls.js session the same way a new loadUrl would.
  source.__dropHls = dropHls;

  source.loadUrl = async (url) => {
    dropHls();
    if (!isHlsUrl(url) || nativeHls) {
      return loadUrl(url);
    }
    let Hls;
    try {
      Hls = await loadHls();
    } catch {
      return loadUrl(url);
    }
    if (!Hls?.isSupported()) {
      return loadUrl(url);
    }
    hls = new Hls({ enableWorker: true, lowLatencyMode: true, backBufferLength: 0 });
    if (onMetadata) {
      // Timed ID3 (song titles on Radio Record and other HLS radios).
      hls.on(Hls.Events.FRAG_PARSING_METADATA, (_event, data) => {
        for (const sample of data?.samples ?? []) {
          if (sample?.data) {
            onMetadata(sample.data);
          }
        }
      });
    }
    await new Promise((resolve) => {
      hls.once(Hls.Events.MANIFEST_PARSED, resolve);
      hls.once(Hls.Events.ERROR, (_event, data) => {
        if (data?.fatal) {
          resolve();
        }
      });
      hls.attachMedia(audio);
      hls.loadSource(url);
    });
  };

  // Webamp rewinds to 0 on play; a live stream has nowhere to rewind to, and
  // seeking a live HLS window to 0 stalls it.
  source.seekToTime = (time) => {
    if (audio.duration === Infinity || hls) {
      return;
    }
    seekToTime(time);
  };
}
