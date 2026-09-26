import {AUDIO_PAUSED, AUDIO_PLAYING, AUDIO_STOPPED} from "./AudioPlayer.js";
import GuiObj from "./makiClasses/GuiObj.js";
export default class AudioEventedGui extends GuiObj {
  constructor() {
    super(...arguments);
    this._propEvent = {};
  }
  setXmlAttr(_key, value) {
    const key = _key.toLowerCase();
    if (value.startsWith("allowed-to:") || value.startsWith("audio:")) {
      this._propEvent[key] = value;
      return true;
    }
    if (super.setXmlAttr(_key, value)) {
      return true;
    }
    return false;
  }
  init() {
    super.init();
    this._registerAudioEvents();
  }
  _registerAudioEvents() {
    if (Object.keys(this._propEvent).length > 0) {
      if (this._audioEventListeners != null) {
        this._audioEventListeners();
      }
      this._audioEventListeners = this._uiRoot.audio.on("statchanged", () => this._updatePropsByAudioState());
      this._updatePropsByAudioState();
    }
  }
  _updatePropsByAudioState() {
    const pl = this._uiRoot.playlist;
    const plCount = pl.getnumtracks();
    const plIndex = pl.getcurrentindex();
    const canNext = plIndex < plCount - 1;
    const canPrev = plIndex > 0;
    const buttonStates = {
      [AUDIO_PLAYING]: {
        play: false,
        pause: true,
        stop: true,
        next: canNext,
        prev: canPrev
      },
      [AUDIO_PAUSED]: {
        play: true,
        pause: false,
        stop: true,
        next: canNext,
        prev: canPrev
      },
      [AUDIO_STOPPED]: {
        play: true,
        pause: false,
        stop: false,
        next: canNext,
        prev: canPrev
      }
    };
    const nickState = {
      [AUDIO_PLAYING]: "play",
      [AUDIO_PAUSED]: "pause",
      [AUDIO_STOPPED]: "stop"
    };
    const state = this._uiRoot.audio.getState();
    if (!buttonStates[state]) {
      console.warn("unknown audio state:", state);
      return;
    }
    for (const [prop, audioEvent] of Object.entries(this._propEvent)) {
      const [enabled, requestedState] = audioEvent.split(":");
      if (enabled == "allowed-to") {
        this[prop] = buttonStates[state][requestedState];
      } else if (enabled == "audio") {
        this[prop] = requestedState == nickState[state];
      }
    }
  }
}
