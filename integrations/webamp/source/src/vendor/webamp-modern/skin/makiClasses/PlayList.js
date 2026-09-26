import {Emitter, integerToTime, num, toBool} from "../../utils.js";
import {parseMetaData} from "../AudioMetadata.js";
export class PlEdit {
  constructor(uiRoot, provider = null) {
    this._tracks = [];
    this._trackCounter = 1;
    this._currentIndex = -1;
    this._selection = [];
    this._repeat = 0;
    this._eventListener = new Emitter();
    this._provider = null;
    this._shuffleChanged = () => {
      const sshuffle = this._shuffleAttrib.getdata();
      this._shuffle = toBool(sshuffle);
      console.log("shuffle:", this._shuffle);
    };
    this._repeatChanged = () => {
      const srepeat = this._repeatAttrib.getdata();
      this._repeat = num(srepeat);
      console.log("repeat:", this._repeat);
    };
    this._uiRoot = uiRoot;
    this._listenShuffleRepeat();
    if (provider) {
      this.setProvider(provider);
    }
  }
  setProvider(provider) {
    this._provider = provider;
    if (provider) {
      provider.onChange(() => this.trigger("trackchange"));
    }
    this.trigger("trackchange");
  }
  init() {
    this._shuffleChanged();
    this._repeatChanged();
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
  _listenShuffleRepeat() {
    const guid = "{45F3F7C1-A6F3-4EE6-A15E-125E92FC3F8D}";
    const configItem = this._uiRoot.CONFIG.getitem(guid);
    this._shuffleAttrib = configItem.getattribute("shuffle");
    this._repeatAttrib = configItem.getattribute("repeat");
    this._shuffleAttrib.on("datachanged", this._shuffleChanged);
    this._repeatAttrib.on("datachanged", this._repeatChanged);
  }
  getnumtracks() {
    if (this._provider)
      return this._provider.getNumTracks();
    return this._tracks.length;
  }
  getcurrentindex() {
    if (this._provider)
      return this._provider.getCurrentIndex();
    return this._currentIndex;
  }
  getnumselectedtracks() {
    return this._selection.length;
  }
  getnextselectedtrack(i) {
    const current = this._selection.indexOf(i);
    const next = this._selection[current + 1];
    return next;
  }
  showcurrentlyplayingtrack() {
  }
  showtrack(item) {
  }
  addTrack(track) {
    if (!track.id) {
      this._trackCounter++;
      track.id = this._trackCounter;
    }
    this._tracks.push(track);
    if (this._tracks.length == 1) {
      this.playtrack(0);
    }
    this.trigger("trackchange");
    if (!track.metadata) {
      parseMetaData(track, () => {
        this.trigger("trackchange");
      });
    }
  }
  enqueuefile(file) {
    const newTrack = {filename: file};
    this.addTrack(newTrack);
  }
  clear() {
    this._selection = [];
    this._tracks = [];
    this._currentIndex = null;
  }
  removetrack(item) {
  }
  swaptracks(item1, item2) {
  }
  moveup(item) {
  }
  movedown(item) {
  }
  moveto(item, pos) {
  }
  currentTrack() {
    if (this._provider) {
      const index = this._provider.getCurrentIndex();
      return index < 0 ? null : {filename: "", title: this._provider.getTitle(index)};
    }
    if (this._currentIndex < 0) {
      return null;
    }
    return this._tracks[this._currentIndex];
  }
  playtrack(item) {
    if (this._provider) {
      this._provider.playTrack(item);
      return;
    }
    this._currentIndex = item;
    const track = this._tracks[item];
    const url = track.file ? URL.createObjectURL(track.file) : track.filename;
    this._uiRoot.audio.setAudioSource(url);
    this.trigger("trackchange");
  }
  getCurrentTrackTitle() {
    const index = this.getcurrentindex();
    if (index == null || index < 0 || index >= this.getnumtracks()) {
      return "";
    }
    return this.gettitle(index);
  }
  getrating(item) {
    return this._tracks[item].rating ?? 0;
  }
  setrating(item, rating) {
    this._tracks[item].rating = rating;
  }
  gettitle(item) {
    if (this._provider)
      return this._provider.getTitle(item) ?? "";
    const track = this._tracks[item];
    if (track.metadata) {
      return `${track.metadata.artist} - ${track.metadata.title}`;
    }
    return this._tracks[item].filename.split("/").pop();
  }
  getlength(item) {
    if (this._provider)
      return this._provider.getLength(item) ?? "";
    return integerToTime(this._tracks[item].duration || 0);
  }
  onpleditmodified() {
  }
}
PlEdit.GUID = "345beebc49210229b66cbe90d9799aa4";
PlEdit.guid = "{345BEEBC-0229-4921-90BE-6CB6A49A79D9}";
export class PlDir {
  showcurrentlyplayingentry() {
  }
  refresh() {
  }
  renameitem(item, name) {
  }
  enqueueitem(item) {
  }
  playitem(item) {
  }
}
PlDir.GUID = "61a7abad41f67d7980e1d0b1f4a40386";
