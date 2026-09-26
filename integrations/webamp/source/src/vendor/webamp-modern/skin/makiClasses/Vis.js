import {debounce, toBool, unimplemented} from "../../utils.js";
import {AUDIO_PLAYING} from "../AudioPlayer.js";
import GuiObj from "./GuiObj.js";
export class VisPaintHandler {
  constructor(vis) {
    this._vis = vis;
  }
  prepare() {
  }
  paintFrame() {
  }
  dispose() {
  }
  doAction(action, param) {
  }
}
const VISPAINTERS = {};
export function registerPainter(key, painterclass) {
  VISPAINTERS[key] = painterclass;
}
export default class Vis extends GuiObj {
  constructor(uiRoot) {
    super(uiRoot);
    this._canvas = document.createElement("canvas");
    this._displayCanvas = document.createElement("canvas");
    this._dpr = 1;
    this._animationRequest = null;
    this._mode = "1";
    this._colorBands = [];
    this._colorBandPeak = "255,255,255";
    this._colorOsc = [];
    this._coloring = "normal";
    this._peaks = true;
    this._bandwidth = "wide";
    this._realtime = true;
    this._rebuildPainter = debounce(() => {
      if (this._painter) {
        this._painter.prepare();
        this._painter.paintFrame();
        this._blit();
      }
    }, 100);
    this._colorThemeChanged = (newGammaId) => {
      this._rebuildPainter();
    };
    this.audioStatusChanged = () => {
      this._stopVisualizer();
      const playing = this._uiRoot.audio.getState() == AUDIO_PLAYING;
      if (playing) {
        this._startVisualizer();
      }
    };
    this._colorBands = DEFAULT_VISCOLORS.slice(2, 18);
    this._colorOsc = DEFAULT_VISCOLORS.slice(18, 23);
    this._colorBandPeak = DEFAULT_VISCOLORS[23];
    this._painter = new NoVisualizerHandler(this);
    this._uiRoot.audio.on("statchanged", this.audioStatusChanged);
    this._uiRoot.on("colorthemechanged", this._colorThemeChanged);
  }
  setXmlAttr(_key, value) {
    const key = _key.toLowerCase();
    if (super.setXmlAttr(key, value)) {
      return true;
    }
    value = value.toLowerCase();
    switch (key) {
      case "mode":
        this.setmode(value);
        break;
      case "gammagroup":
        this._gammagroup = value;
        break;
      case "colorband1":
      case "colorband2":
      case "colorband3":
      case "colorband4":
      case "colorband5":
      case "colorband6":
      case "colorband7":
      case "colorband8":
      case "colorband9":
      case "colorband10":
      case "colorband11":
      case "colorband12":
      case "colorband13":
      case "colorband14":
      case "colorband15":
      case "colorband16":
        const cobaIndex = parseInt(key.substring(9)) - 1;
        this._colorBands[cobaIndex] = value;
        break;
      case "colorallbands":
        for (var i = 0; i < 16; i++) {
          this._colorBands[i] = value;
        }
        break;
      case "coloring":
        this._coloring = value;
        break;
      case "colorbandpeak":
        this._colorBandPeak = value;
        break;
      case "peaks":
        this._peaks = toBool(value);
        break;
      case "bandwidth":
        this._bandwidth = value;
        break;
      case "colorosc1":
      case "colorosc2":
      case "colorosc3":
      case "colorosc4":
      case "colorosc5":
        const coOcIndex = parseInt(key.substring(8)) - 1;
        this._colorOsc[coOcIndex] = value;
        break;
      case "colorallosc":
        for (var i = 0; i < 5; i++) {
          this._colorOsc[i] = value;
        }
        break;
      case "oscstyle":
        this._oscStyle = value;
        break;
      case "others":
        break;
      default:
        return false;
    }
    this._rebuildPainter();
    return true;
  }
  init() {
    this.setmode(this._mode);
    super.init();
    this.audioStatusChanged();
  }
  dispose() {
    super.dispose();
    this._stopVisualizer();
  }
  setmode(mode) {
    this._mode = mode;
    const painterClass = VISPAINTERS[mode] || VISPAINTERS["0"];
    this._setPainter(painterClass);
  }
  getmode() {
    return parseInt("0" + this._mode);
  }
  nextmode() {
    let newMode = this.getmode() + 1;
    if (newMode > 2) {
      newMode = 0;
    }
    this.setmode(String(newMode));
  }
  _setPainter(PainterType) {
    const oldPainter = this._painter;
    this._painter = new PainterType(this);
    this.audioStatusChanged();
    if (oldPainter) {
      oldPainter.dispose();
    }
  }
  _startVisualizer() {
    this._rebuildPainter();
    const loop = () => {
      this._painter.paintFrame();
      this._blit();
      this._animationRequest = window.requestAnimationFrame(loop);
    };
    loop();
  }
  _syncDisplayCanvas() {
    this._dpr = Math.max(1, Math.round(window.devicePixelRatio || 1));
    const w = this._canvas.width;
    const h = this._canvas.height;
    if (this._displayCanvas.width !== w * this._dpr || this._displayCanvas.height !== h * this._dpr) {
      this._displayCanvas.width = w * this._dpr;
      this._displayCanvas.height = h * this._dpr;
    }
    this._displayCanvas.style.width = this._canvas.style.width;
    this._displayCanvas.style.height = this._canvas.style.height;
  }
  _blit() {
    const ctx = this._displayCanvas.getContext("2d");
    if (!ctx)
      return;
    if (this._displayCanvas.width !== this._canvas.width * this._dpr) {
      this._syncDisplayCanvas();
    }
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, this._displayCanvas.width, this._displayCanvas.height);
    ctx.drawImage(this._canvas, 0, 0, this._displayCanvas.width, this._displayCanvas.height);
  }
  _stopVisualizer() {
    if (this._animationRequest != null) {
      window.cancelAnimationFrame(this._animationRequest);
      this._animationRequest = null;
    }
  }
  setrealtime(onoff) {
    this._realtime = unimplemented(onoff);
  }
  getrealtime() {
    return this._realtime;
  }
  _renderWidth() {
    super._renderWidth();
    this._canvas.style.width = this._div.style.width;
    this._canvas.setAttribute("width", `${parseInt(this._div.style.width)}`);
    this._syncDisplayCanvas();
  }
  _renderHeight() {
    super._renderHeight();
    this._canvas.style.height = this._div.style.height;
    this._canvas.setAttribute("height", `${parseInt(this._div.style.height)}`);
    this._syncDisplayCanvas();
  }
  draw() {
    super.draw();
    this._displayCanvas.setAttribute("id", this.getId() + "-canvas");
    this._syncDisplayCanvas();
    this._div.appendChild(this._displayCanvas);
  }
}
Vis.GUID = "ce4f97be4e1977b098d45699276cc933";
class NoVisualizerHandler extends VisPaintHandler {
  prepare() {
    const ctx = this._vis._canvas.getContext("2d");
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }
}
registerPainter("0", NoVisualizerHandler);
export const DEFAULT_VISCOLORS = [
  "0,0,0",
  "24,33,41",
  "239,49,16",
  "206,41,16",
  "214,90,0",
  "214,102,0",
  "214,115,0",
  "198,123,8",
  "222,165,24",
  "214,181,33",
  "189,222,41",
  "148,222,33",
  "41,206,16",
  "50,190,16",
  "57,181,16",
  "49,156,8",
  "41,148,0",
  "24,132,8",
  "255,255,255",
  "214,214,222",
  "181,189,189",
  "160,170,175",
  "148,156,165",
  "150,150,150"
];
const NUM_BARS = 19;
const BAR_GAP = 2;
const PIXEL_DENSITY = 1;
const BAR_PEAK_DROP_RATE = 0.01;
function octaveBucketsForBufferLength(bufferLength, barCount = NUM_BARS) {
  const octaveBuckets = new Array(barCount).fill(0);
  const minHz = 200;
  const maxHz = 22050;
  const octaveStep = Math.pow(maxHz / minHz, 1 / barCount);
  octaveBuckets[0] = 0;
  octaveBuckets[1] = minHz;
  for (let i = 2; i < barCount - 1; i++) {
    octaveBuckets[i] = octaveBuckets[i - 1] * octaveStep;
  }
  octaveBuckets[barCount - 1] = maxHz;
  for (let i = 0; i < barCount; i++) {
    const octaveIdx = Math.floor(octaveBuckets[i] / maxHz * bufferLength);
    octaveBuckets[i] = octaveIdx;
  }
  return octaveBuckets;
}
class BarPaintHandler extends VisPaintHandler {
  constructor(vis) {
    super(vis);
    this._color = "rgb(255,255,255)";
    this._colorPeak = "rgb(255,255,255)";
    this._bar = document.createElement("canvas");
    this._peak = document.createElement("canvas");
    this._barPeaks = new Array(NUM_BARS).fill(-1);
    this._barPeakFrames = new Array(NUM_BARS).fill(0);
    this._analyser = this._vis._uiRoot.audio.getAnalyser();
    this._bufferLength = this._analyser.frequencyBinCount;
    this._octaveBuckets = octaveBucketsForBufferLength(this._bufferLength);
    this._dataArray = new Uint8Array(this._bufferLength);
  }
  prepare() {
    const vis = this._vis;
    const groupId = vis._gammagroup;
    const gammaGroup = this._vis._uiRoot._getGammaGroup(groupId);
    this._barWidth = vis._canvas.width / NUM_BARS;
    this._peak.height = 1;
    this._peak.width = 1;
    var ctx = this._peak.getContext("2d");
    ctx.fillStyle = `rgb(${this._vis._colorBandPeak})`;
    ctx.fillRect(0, 0, 1, 1);
    this._bar.height = vis._canvas.height;
    this._bar.width = 1;
    var ctx = this._bar.getContext("2d");
    const grd = ctx.createLinearGradient(0, 0, 0, vis._canvas.height);
    const n = vis._colorBands.length;
    for (let i = 0; i < n; i++) {
      const color = gammaGroup.transformColor(vis._colorBands[i]);
      grd.addColorStop(i / n, color);
      grd.addColorStop(Math.max(i / n, (i + 1) / n - 1e-4), color);
    }
    ctx.strokeStyle = this._color;
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 1, vis._canvas.height);
    ctx.imageSmoothingEnabled = false;
    this._ctx = this._vis._canvas.getContext("2d");
    if (this._vis._bandwidth == "wide") {
      this.paintFrame = this.paintFrameWide.bind(this);
      this._octaveBuckets = octaveBucketsForBufferLength(this._bufferLength, NUM_BARS + 1);
      this._barPeaks = new Array(NUM_BARS).fill(-1);
      this._barPeakFrames = new Array(NUM_BARS).fill(0);
    } else {
      const w = this._vis._canvas.width;
      this._barPeaks = new Array(w).fill(-1);
      this._barPeakFrames = new Array(w).fill(0);
      this._octaveBuckets = octaveBucketsForBufferLength(this._bufferLength, w);
      this.paintFrame = this.paintFrameThin.bind(this);
    }
    if (this._vis._coloring == "fire") {
      this.paintBar = this.paintBarFire.bind(this);
    } else {
      this.paintBar = this.paintBarNormal.bind(this);
    }
  }
  paintFrameWide() {
    if (!this._ctx)
      return;
    const ctx = this._ctx;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = this._color;
    this._analyser.getByteFrequencyData(this._dataArray);
    const heightMultiplier = h / 256;
    for (let j = 0; j < NUM_BARS; j++) {
      const start = this._octaveBuckets[j];
      const end = this._octaveBuckets[j + 1];
      let amplitude = 0;
      for (let k = start; k < end; k++) {
        amplitude = Math.max(amplitude, this._dataArray[k]);
      }
      this._advancePeak(j, amplitude);
      const barPeak = this._barPeaks[j];
      var x1 = Math.round(this._barWidth * j);
      var x2 = Math.round(this._barWidth * (j + 1)) - BAR_GAP;
      this.paintBar(ctx, x1, x2, amplitude * heightMultiplier, barPeak * heightMultiplier);
    }
  }
  paintFrameThin() {
    if (!this._ctx)
      return;
    const ctx = this._ctx;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = this._color;
    this._analyser.getByteFrequencyData(this._dataArray);
    const heightMultiplier = h / 256;
    for (let j = 0; j < w - 1; j++) {
      const start = this._octaveBuckets[j];
      const end = this._octaveBuckets[j + 1];
      let amplitude = 0;
      amplitude /= end - start;
      for (let k = start; k < end; k++) {
        amplitude = Math.max(amplitude, this._dataArray[k]);
      }
      this._advancePeak(j, amplitude);
      const barPeak = this._barPeaks[j];
      this.paintBar(ctx, j, j, amplitude * heightMultiplier, barPeak * heightMultiplier);
    }
  }
  _advancePeak(j, amplitude) {
    if (this._barPeaks[j] < 0) {
      this._barPeaks[j] = amplitude;
      this._barPeakFrames[j] = 0;
      return;
    }
    let barPeak = this._barPeaks[j] - BAR_PEAK_DROP_RATE * Math.pow(this._barPeakFrames[j], 2);
    if (barPeak < amplitude) {
      barPeak = amplitude;
      this._barPeakFrames[j] = 0;
    } else {
      this._barPeakFrames[j] += 1;
    }
    this._barPeaks[j] = Math.max(0, barPeak);
  }
  paintBarNormal(ctx, x, x2, barHeight, peakHeight) {
    const h = ctx.canvas.height;
    var y = h - barHeight;
    ctx.drawImage(this._bar, 0, y, 1, h - y, x, y, x2 - x + 1, h - y);
    if (this._vis._peaks && peakHeight > 0) {
      const peakY = Math.max(0, Math.round(h - peakHeight) - 1);
      ctx.drawImage(this._peak, 0, 0, 1, 1, x, peakY, x2 - x + 1, 1);
    }
  }
  paintBarFire(ctx, x, x2, barHeight, peakHeight) {
    const h = ctx.canvas.height;
    var y = h - barHeight;
    ctx.drawImage(this._bar, 0, 0, this._bar.width, h - y, x, y, x2 - x + 1, h - y);
    if (this._vis._peaks && peakHeight > 0) {
      const peakY = Math.max(0, Math.round(h - peakHeight) - 1);
      ctx.drawImage(this._peak, 0, 0, 1, 1, x, peakY, x2 - x + 1, 1);
    }
  }
}
registerPainter("1", BarPaintHandler);
function sliceAverage(dataArray, sliceWidth, sliceNumber) {
  const start = sliceWidth * sliceNumber;
  const end = start + sliceWidth;
  let sum = 0;
  for (let i = start; i < end; i++) {
    sum += dataArray[i];
  }
  return sum / sliceWidth;
}
function slice1st(dataArray, sliceWidth, sliceNumber) {
  const start = sliceWidth * sliceNumber;
  return dataArray[start];
}
class WavePaintHandler extends VisPaintHandler {
  constructor(vis) {
    super(vis);
    this._lastX = 0;
    this._lastY = 0;
    this._bar = document.createElement("canvas");
    this._16h = document.createElement("canvas");
    this._datafetched = false;
    this._analyser = this._vis._uiRoot.audio.getAnalyser();
    this._bufferLength = this._analyser.fftSize;
    this._dataArray = new Uint8Array(this._bufferLength);
    this._pixelRatio = window.devicePixelRatio || 1;
  }
  prepare() {
    const vis = this._vis;
    const groupId = vis._gammagroup;
    const gammaGroup = this._vis._uiRoot._getGammaGroup(groupId);
    this._16h.width = 1;
    this._16h.height = 16;
    this._16h.setAttribute("width", "72");
    this._16h.setAttribute("height", "16");
    this._bar.width = 1;
    this._bar.height = 5;
    this._bar.setAttribute("width", "1");
    this._bar.setAttribute("height", "5");
    var ctx = this._bar.getContext("2d");
    for (let y = 0; y < 5; y++) {
      ctx.fillStyle = gammaGroup.transformColor(vis._colorOsc[y]);
      ctx.fillRect(0, y, 1, y + 1);
    }
    this._ctx = vis._canvas.getContext("2d");
    this._ctx.imageSmoothingEnabled = false;
    this._ctx.mozImageSmoothingEnabled = false;
    this._ctx.webkitImageSmoothingEnabled = false;
    this._ctx.msImageSmoothingEnabled = false;
    if (this._vis._oscStyle == "dots") {
      this.paintWav = this.paintWavDot.bind(this);
    } else if (this._vis._oscStyle == "solid") {
      this.paintWav = this.paintWavSolid.bind(this);
    } else {
      this.paintWav = this.paintWavLine.bind(this);
    }
    this._datafetched = false;
  }
  paintFrame() {
    if (!this._ctx)
      return;
    this._analyser.getByteTimeDomainData(this._dataArray);
    this._dataArray = this._dataArray.slice(0, 576);
    const bandwidth = this._dataArray.length;
    if (!this._datafetched) {
      this._datafetched = true;
    }
    const using16temporaryCanvas = this._vis._canvas.height != 16;
    if (using16temporaryCanvas) {
      this._ctx = this._16h.getContext("2d");
    }
    let width = this._ctx.canvas.width;
    const height = this._ctx.canvas.height;
    this._ctx.clearRect(0, 0, width, height);
    const sliceWidth = Math.floor(bandwidth / width);
    for (let j = 0; j <= width; j++) {
      const amplitude = slice1st(this._dataArray, sliceWidth, j);
      const [y, colorIndex] = this.rangeByAmplitude(amplitude);
      const x = j * PIXEL_DENSITY;
      this.paintWav(x, y, colorIndex);
    }
    if (using16temporaryCanvas) {
      const canvas = this._vis._canvas;
      const visCtx = canvas.getContext("2d");
      visCtx.clearRect(0, 0, canvas.width, canvas.height);
      visCtx.drawImage(this._16h, 0, 0, 72, 16, 0, 0, canvas.width, canvas.height);
    }
  }
  rangeByAmplitude(amplitude) {
    if (amplitude >= 184) {
      return [0, 3];
    }
    if (amplitude >= 176) {
      return [1, 3];
    }
    if (amplitude >= 168) {
      return [2, 2];
    }
    if (amplitude >= 160) {
      return [3, 2];
    }
    if (amplitude >= 152) {
      return [4, 1];
    }
    if (amplitude >= 144) {
      return [5, 1];
    }
    if (amplitude >= 136) {
      return [6, 0];
    }
    if (amplitude >= 128) {
      return [7, 0];
    }
    if (amplitude >= 120) {
      return [8, 1];
    }
    if (amplitude >= 112) {
      return [9, 1];
    }
    if (amplitude >= 104) {
      return [10, 2];
    }
    if (amplitude >= 96) {
      return [11, 2];
    }
    if (amplitude >= 88) {
      return [12, 3];
    }
    if (amplitude >= 80) {
      return [13, 3];
    }
    if (amplitude >= 72) {
      return [14, 4];
    }
    return [15, 4];
  }
  paintWavLine(x, y, colorIndex) {
    if (x === 0)
      this._lastY = y;
    let top = y;
    let bottom = this._lastY;
    this._lastY = y;
    if (bottom < top) {
      [bottom, top] = [top, bottom];
    }
    for (y = top; y <= bottom; y++) {
      this._ctx.drawImage(this._bar, 0, colorIndex, 1, 1, x, y, 1, 1);
    }
  }
  paintWavDot(x, y, colorIndex) {
    this._ctx.drawImage(this._bar, 0, colorIndex, 1, 1, x, y, 1, 1);
  }
  paintWavSolid(x, y, colorIndex) {
    var top, bottom;
    if (y >= 8) {
      top = 8;
      bottom = y;
    } else {
      top = y;
      bottom = 7;
    }
    for (y = top; y <= bottom; y++) {
      this._ctx.drawImage(this._bar, 0, colorIndex, 1, 1, x, y, 1, 1);
    }
  }
}
registerPainter("2", WavePaintHandler);
