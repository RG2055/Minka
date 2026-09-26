import {parseV1Tag, parseV2Tag} from "../_snowpack/pkg/id3-parser.js";
import {calcTagSize} from "../_snowpack/pkg/id3-parser/lib/parsers/v2parser.js";
import {fetchFileAsBuffer} from "../_snowpack/pkg/id3-parser/lib/universal/helpers.js";
import {assume} from "../utils.js";
export async function parseMetaData(track, callback) {
  try {
    const audioTrackUrl = track.file ? URL.createObjectURL(track.file) : track.filename;
    genMediaDuration(audioTrackUrl).then((duration) => {
      track.duration = duration;
      callback();
    });
    genMetadata(track, audioTrackUrl, callback);
  } catch (e) {
    console.warn("ERROR:", e);
  }
}
async function genMetadata(track, audioTrackUrl, callback) {
  const bytes = await fetchFileAsBuffer(audioTrackUrl);
  let id3;
  const v2data = parseV2Tag(bytes);
  if (v2data) {
    id3 = {...v2data};
  } else {
    const v1data = parseV1Tag(bytes);
    id3 = {...v1data};
  }
  track.metadata = id3;
  callback();
  let start = 0;
  if (v2data) {
    start = 10;
    if (v2data.version.flags.xheader) {
      start += calcTagSize(bytes.slice(10, 14));
    }
    start += calcTagSize(bytes.slice(6, 10));
  }
  const VersionID = [2.5, null, 2, 1];
  const LayerDescription = [0, 3, 2, 1];
  const ChannelMode = ["stereo", "joint_stereo", "dual_channel", "mono"];
  const sampling_rate_freq_index = {
    1: {0: 44100, 1: 48e3, 2: 32e3},
    2: {0: 22050, 1: 24e3, 2: 16e3},
    2.5: {0: 11025, 1: 12e3, 2: 8e3}
  };
  const samplesInFrameTable = [
    [0, 384, 1152, 1152],
    [0, 384, 1152, 576]
  ];
  var header = bytes[start] << 24 | bytes[start + 1] << 16 | bytes[start + 2] << 8 | bytes[start + 3];
  var versionIndex = readBits(header, 11, 2);
  const version = VersionID[versionIndex];
  var layerIndex = readBits(header, 13, 2);
  const layer = LayerDescription[layerIndex];
  var isProtected = readBits(header, 15, 1);
  var bitrateIndex = readBits(header, 16, 4);
  var sampRateFreqIndex = readBits(header, 20, 2);
  const bitrate_index = {
    1: {11: 32, 12: 32, 13: 32, 21: 32, 22: 8, 23: 8},
    2: {11: 64, 12: 48, 13: 40, 21: 48, 22: 16, 23: 16},
    3: {11: 96, 12: 56, 13: 48, 21: 56, 22: 24, 23: 24},
    4: {11: 128, 12: 64, 13: 56, 21: 64, 22: 32, 23: 32},
    5: {11: 160, 12: 80, 13: 64, 21: 80, 22: 40, 23: 40},
    6: {11: 192, 12: 96, 13: 80, 21: 96, 22: 48, 23: 48},
    7: {11: 224, 12: 112, 13: 96, 21: 112, 22: 56, 23: 56},
    8: {11: 256, 12: 128, 13: 112, 21: 128, 22: 64, 23: 64},
    9: {11: 288, 12: 160, 13: 128, 21: 144, 22: 80, 23: 80},
    10: {11: 320, 12: 192, 13: 160, 21: 160, 22: 96, 23: 96},
    11: {11: 352, 12: 224, 13: 192, 21: 176, 22: 112, 23: 112},
    12: {11: 384, 12: 256, 13: 224, 21: 192, 22: 128, 23: 128},
    13: {11: 416, 12: 320, 13: 256, 21: 224, 22: 144, 23: 144},
    14: {11: 448, 12: 384, 13: 320, 21: 256, 22: 160, 23: 160}
  };
  const codecIndex = `${Math.floor(version)}${layer}`;
  id3.bitrate = bitrate_index[bitrateIndex][codecIndex];
  id3.sampleRate = sampling_rate_freq_index[version][sampRateFreqIndex];
  var channels = readBits(header, 24, 2);
  const channelModeIndex = channels;
  id3.channelMode = ChannelMode[channelModeIndex];
  track.metadata = id3;
  callback();
}
function readBits(int, pos, length) {
  var mask = 4294967295 >>> 32 - length << 32 - length - pos;
  return (int & mask) >>> 32 - length - pos;
}
function genMediaDuration(url) {
  assume(typeof url === "string", "Attempted to get the duration of media file without passing a url");
  return new Promise((resolve, reject) => {
    const audio = document.createElement("audio");
    audio.crossOrigin = "anonymous";
    const durationChange = () => {
      resolve(audio.duration);
      audio.removeEventListener("durationchange", durationChange);
      audio.src = "";
    };
    audio.addEventListener("durationchange", durationChange);
    audio.addEventListener("error", (e) => {
      reject(e);
    });
    audio.src = url;
  });
}
