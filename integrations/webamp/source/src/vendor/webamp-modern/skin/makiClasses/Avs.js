import {VisPaintHandler, registerPainter} from "./Vis.js";
import Vis from "./Vis.js";
let butterchurnLoader = null;
function loadButterchurn() {
  if (!butterchurnLoader) {
    butterchurnLoader = Promise.all([
      import("../../_snowpack/pkg/butterchurn.js").then((m) => m.default),
      import("../../_snowpack/pkg/butterchurn-presets.js").then((m) => m.default)
    ]);
  }
  return butterchurnLoader;
}
import {AUDIO_PLAYING} from "../AudioPlayer.js";
import {circular} from "../../utils.js";
export default class Avs extends Vis {
  init() {
    this._mode = "milkdrop";
    super.init();
    this._uiRoot._avss.push(this);
  }
  handleAction(action, param = null, actionTarget = null, source = null) {
    action = action.toLowerCase();
    if (["vis_prev", "vis_next", "vis_f5"].includes(action)) {
      this._painter.doAction(action, param);
      return true;
    }
    return false;
  }
}
Avs.GUID = "OFFICIALLY-NO-GUID";
class ButterchurnPaintHandler extends VisPaintHandler {
  constructor() {
    super(...arguments);
    this._visualizer = null;
    this._butterchurn = null;
    this._presets = null;
    this._loading = false;
    this._presetIndex = 10;
  }
  prepare() {
  }
  _buildButterchurn() {
    const audio = this._vis._uiRoot.audio;
    const canvas = this._vis._canvas;
    const width = canvas.width;
    const height = canvas.height;
    this._visualizer = this._butterchurn.createVisualizer(audio._context, canvas, {
      width,
      height
    });
    this._visualizer.connectAudio(audio._analyser);
    this._visualizer.setRendererSize(width, height);
    this.loadPreset();
  }
  paintFrame() {
    if (!this._visualizer) {
      if (!document.getElementById(this._vis._canvas.id))
        return;
      if (!(this._vis._uiRoot.audio.getState() == AUDIO_PLAYING))
        return;
      if (!this._butterchurn) {
        if (!this._loading) {
          this._loading = true;
          loadButterchurn().then(([bc, presets]) => {
            this._butterchurn = bc;
            this._presets = presets;
          });
        }
        return;
      }
      this._buildButterchurn();
    }
    this._visualizer.render();
  }
  doAction(action, param) {
    switch (action) {
      case "vis_prev":
        this._presetIndex--;
        this.loadPreset();
        break;
      case "vis_next":
        this._presetIndex++;
        this.loadPreset();
        break;
      case "vis_f5":
        break;
    }
  }
  loadPreset() {
    if (!this._visualizer)
      return;
    const presets = this._presets.getPresets();
    const presetNames = Object.keys(presets);
    this._presetIndex = circular(this._presetIndex, 0, presetNames.length - 1);
    const presetName = this._presetIndex == 0 ? "Flexi, martin + geiss - dedicated to the sherwin maxawow" : presetNames[this._presetIndex];
    const preset = presets[presetName];
    this._visualizer.loadPreset(preset, 1);
    const canvas = this._vis._canvas;
    const bound = canvas.getBoundingClientRect();
    const width = Math.max(bound.width, 10);
    const height = Math.max(bound.height, 10);
    canvas.width = width;
    canvas.height = height;
    this._visualizer.setRendererSize(width, height);
    this._visualizer.launchSongTitleAnim(`Preset:[${this._presetIndex}] : ${presetName}`);
    this._visualizer.renderer.supertext.duration = 7;
    this._visualizer.render();
  }
}
registerPainter("milkdrop", ButterchurnPaintHandler);
