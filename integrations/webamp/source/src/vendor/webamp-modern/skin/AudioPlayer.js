import {clamp, Emitter} from "../utils.js";
const BANDS = [60, 170, 310, 600, 1e3, 3e3, 6e3, 12e3, 14e3, 16e3];
export const AUDIO_PAUSED = "paused";
export const AUDIO_STOPPED = "stopped";
export const AUDIO_PLAYING = "playing";
export class AudioPlayer {
  constructor() {
    this._audio = document.createElement("audio");
    this._bands = [];
    this._balance = 0;
    this._eqEnabled = true;
    this._eqValues = {};
    this._eqNodes = {};
    this._eqEmitter = new Emitter();
    this._isStop = true;
    this._albumArtUrl = null;
    this._timeRemaining = false;
    this._eventListener = new Emitter();
    this._vuMeter = 0;
    this._last_itime = 0;
    this._context = this._context = new (window.AudioContext || window.webkitAudioContext)();
    if (this._context.state === "suspended") {
      const resume = async () => {
        await this._context.resume();
        if (this._context.state === "running") {
          document.body.removeEventListener("touchend", resume, false);
          document.body.removeEventListener("click", resume, false);
          document.body.removeEventListener("keydown", resume, false);
        }
      };
      document.body.addEventListener("touchend", resume, false);
      document.body.addEventListener("click", resume, false);
      document.body.addEventListener("keydown", resume, false);
    }
    this._source = this._context.createMediaElementSource(this._audio);
    this.__preamp = this._context.createGain();
    this._volumeNode = this._context.createGain();
    this._analyser = this._context.createAnalyser();
    this._analyser.fftSize = 1024;
    this._analyser.smoothingTimeConstant = 0;
    this._balanceNode = new StereoPannerNode(this._context, {pan: 0});
    const connectionNodes = [
      this._source,
      this.__preamp
    ];
    const analyserNode = this._analyser;
    const pcmData = new Float32Array(analyserNode.fftSize);
    const onFrame = () => {
      analyserNode.getFloatTimeDomainData(pcmData);
      let sumSquares = 0;
      for (let i = 0; i < pcmData.length; i++) {
        const amplitude = pcmData[i];
        sumSquares += amplitude * amplitude;
      }
      this._vuMeter = Math.sqrt(sumSquares / pcmData.length);
      window.requestAnimationFrame(onFrame);
    };
    window.requestAnimationFrame(onFrame);
    BANDS.forEach((band, i) => {
      const filter = this._context.createBiquadFilter();
      this._bands.push(filter);
      if (i === 0) {
        filter.type = "lowshelf";
      } else if (i === BANDS.length - 1) {
        filter.type = "highshelf";
      } else {
        filter.type = "peaking";
      }
      filter.frequency.value = band;
      filter.gain.value = 0;
      connectionNodes.push(filter);
    });
    connectionNodes.push(this._balanceNode);
    connectionNodes.push(this._volumeNode);
    connectionNodes.push(this._context.destination);
    let current = connectionNodes[0];
    for (let i = 1; i < connectionNodes.length; i++) {
      let next = connectionNodes[i];
      current.connect(next);
      current = next;
    }
    this._balanceNode.connect(this._analyser);
    this._audio.addEventListener("ended", () => this.stop());
    this._audio.addEventListener("timeupdate", () => this.doTimeUpdate());
  }
  doTimeUpdate() {
    const i = this._audio.currentTime << 0;
    if (i != this._last_itime) {
      this._last_itime = i;
      this.trigger("timeupdate");
    }
  }
  setEqEnabled(enable) {
    this._eqEnabled = enable;
    this._source.disconnect();
    if (enable) {
      this._source.connect(this.__preamp);
    } else {
      this._source.connect(this._balanceNode);
    }
  }
  getEqEnabled() {
    return this._eqEnabled;
  }
  getAnalyser() {
    return this._analyser;
  }
  on(event, callback) {
    return this._eventListener.on(event, callback);
  }
  trigger(event, ...args) {
    this._eventListener.trigger(event, ...args);
  }
  off(event, callback) {
    this._eventListener.off(event, callback);
  }
  setAudioSource(url) {
    this._audio.src = url;
  }
  getVolume() {
    return this._volumeNode.gain.value;
  }
  setVolume(volume) {
    if (volume != this._volumeNode.gain.value) {
      this._volumeNode.gain.value = volume;
      this.trigger("volumechanged");
    }
  }
  getBalance() {
    return this._balance;
  }
  setBalance(balance) {
    this._balanceNode.pan.value = balance;
    this._balance = balance;
    this.trigger("balancechange");
  }
  getPlaybackRate() {
    return this._audio.playbackRate;
  }
  setPlaybackRate(value) {
    this._audio.playbackRate = clamp(value, 0.5, 4);
    this.trigger("playbackratechange");
  }
  play() {
    this._isStop = false;
    this.trigger("timeupdate");
    this._audio.play();
    this.trigger("play");
    this.trigger("statchanged");
  }
  stop() {
    this._isStop = true;
    if (this._audio.paused) {
      this._audio.play();
    }
    this._audio.pause();
    this._audio.currentTime = 0;
    this.trigger("stop");
    this.trigger("statchanged");
  }
  pause() {
    this._isStop = false;
    this._audio.pause();
    this.trigger("pause");
    this.trigger("statchanged");
  }
  seekTo(secs) {
    this._audio.currentTime = secs;
  }
  seekToPercent(percent) {
    this._audio.currentTime = this._audio.duration * percent;
  }
  toggleRemainingTime() {
    this._timeRemaining = !this._timeRemaining;
  }
  getCurrentTime() {
    return this._timeRemaining ? this._audio.currentTime - this._audio.duration : this._audio.currentTime;
  }
  getCurrentTimePercent() {
    return this._audio.currentTime / this._audio.duration;
  }
  getState() {
    if (this._isStop) {
      return AUDIO_STOPPED;
    }
    const audio = this._audio;
    if (!audio.ended && !audio.paused) {
      return AUDIO_PLAYING;
    } else if (audio.ended) {
      return AUDIO_STOPPED;
    } else if (audio.paused) {
      return AUDIO_PAUSED;
    }
  }
  getEq(kind) {
    kind = String(kind).toLowerCase();
    switch (kind) {
      case "preamp":
        const a = this.__preamp.gain.value;
        const c = Math.log(a) / Math.log(10);
        const n = c * 20;
        return (n + 12) / 24;
      case "1":
      case "2":
      case "3":
      case "4":
      case "5":
      case "6":
      case "7":
      case "8":
      case "9":
      case "10":
        const bandIndex = Number(kind) - 1;
        const filter = this._bands[bandIndex];
        const value = (filter.gain.value + 12) / 24;
        return value;
      default:
        console.warn(`Tried to get unknown EQ kind: ${kind}`);
        return 0;
    }
  }
  setEq(kind, value) {
    kind = String(kind).toLowerCase();
    const db = value * 24 - 12;
    switch (kind) {
      case "preamp": {
        this.__preamp.gain.value = Math.pow(10, db / 20);
        this._eqValues[kind] = db;
        this._eqEmitter.trigger(kind);
        break;
      }
      case "1":
      case "2":
      case "3":
      case "4":
      case "5":
      case "6":
      case "7":
      case "8":
      case "9":
      case "10":
        const bandIndex = Number(kind) - 1;
        const filter = this._bands[bandIndex];
        filter.gain.value = db;
        this._eqEmitter.trigger(kind);
        break;
      default:
        console.warn(`Tried to set unknown EQ kind: ${kind}`);
    }
  }
  onEqChange(kind, cb) {
    kind = String(kind).toLowerCase();
    switch (kind) {
      case "preamp":
      case "1":
      case "2":
      case "3":
      case "4":
      case "5":
      case "6":
      case "7":
      case "8":
      case "9":
      case "10":
        return this._eqEmitter.on(kind, cb);
      default:
        console.warn(`Tried to bind to an unknown EQ kind: ${kind}`);
    }
  }
  onCurrentTimeChange(cb) {
    return this.on("timeupdate", cb);
  }
  onSeek(cb) {
    const handler = () => cb();
    this._audio.addEventListener("seeked", handler);
    const dispose = () => {
      this._audio.removeEventListener("seeked", handler);
    };
    return dispose;
  }
  onVolumeChanged(cb) {
    return this.on("volumechanged", cb);
  }
  onAlbumArtChange(cb) {
    return this.on("albumartchanged", cb);
  }
  onBalanceChanged(cb) {
    const handler = () => cb();
    const dispose = this.on("balancechange", handler);
    return dispose;
  }
  getLength() {
    return this._audio.duration;
  }
  getTrackInfo() {
    return {};
  }
}
let AUDIO_PLAYER = null;
export function getDefaultAudioPlayer() {
  if (AUDIO_PLAYER == null) {
    AUDIO_PLAYER = new AudioPlayer();
  }
  return AUDIO_PLAYER;
}
export default getDefaultAudioPlayer;
