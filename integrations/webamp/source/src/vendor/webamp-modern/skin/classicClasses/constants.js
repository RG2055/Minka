import baseSkin from "./baseSkin.json.proxy.js";
export const WINDOWS = {
  MAIN: "main",
  PLAYLIST: "playlist",
  EQUALIZER: "equalizer",
  MILKDROP: "milkdrop"
};
export const UTF8_ELLIPSIS = "…";
export const CHARACTER_WIDTH = 5;
export const WINDOW_RESIZE_SEGMENT_WIDTH = 25;
export const WINDOW_RESIZE_SEGMENT_HEIGHT = 29;
export const WINDOW_HEIGHT = 116;
export const WINDOW_WIDTH = 275;
export const TRACK_HEIGHT = 13;
export const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
export const DEFAULT_SKIN = baseSkin;
export const VISUALIZERS = {
  OSCILLOSCOPE: "OSCILLOSCOPE",
  BAR: "BAR",
  NONE: "NONE",
  MILKDROP: "MILKDROP"
};
export const VISUALIZER_ORDER = [
  VISUALIZERS.BAR,
  VISUALIZERS.OSCILLOSCOPE,
  VISUALIZERS.NONE
];
