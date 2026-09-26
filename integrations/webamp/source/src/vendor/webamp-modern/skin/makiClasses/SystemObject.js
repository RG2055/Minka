import {getClass} from "../../maki/objects.js";
import BaseObject from "./BaseObject.js";
import {clamp, integerToTime, unimplemented} from "../../utils.js";
import PRIVATE_CONFIG from "../PrivateConfig.js";
import Config from "./Config.js";
import WinampConfig from "./WinampConfig.js";
import {
  AUDIO_PAUSED,
  AUDIO_STOPPED,
  AUDIO_PLAYING
} from "../AudioPlayer.js";
import Application from "./Application.js";
const MOUSE_POS = {x: 0, y: 0};
document.addEventListener("mousemove", (e) => {
  MOUSE_POS.x = e.pageX;
  MOUSE_POS.y = e.pageY;
});
export default class SystemObject extends BaseObject {
  constructor(uiRoot, parsedScript, param, id) {
    super();
    this._uiRoot = uiRoot;
    this._parsedScript = parsedScript;
    this._param = param;
    this._id = id;
    this._uiRoot.audio.onSeek(() => {
      this._uiRoot.vm.dispatch(this, "onseek", [
        {
          type: "INT",
          value: this._uiRoot.audio.getCurrentTimePercent() * 255
        }
      ]);
    });
    this._uiRoot.audio.on("play", () => this._uiRoot.vm.dispatch(this, "onplay", []));
    this._uiRoot.audio.on("pause", () => this._uiRoot.vm.dispatch(this, "onpause", []));
    this._uiRoot.audio.on("stop", () => this._uiRoot.vm.dispatch(this, "onstop", []));
    this._uiRoot.audio.onVolumeChanged(() => {
      this._uiRoot.vm.dispatch(this, "onvolumechanged", [
        {type: "INT", value: this._uiRoot.audio.getVolume() * 255}
      ]);
    });
    const EqBandHandle = (band) => {
      this._uiRoot.vm.dispatch(this, "oneqbandchanged", [
        {type: "INT", value: band - 1},
        {
          type: "INT",
          value: this._uiRoot.audio.getEq(String(band)) * 255 - 127
        }
      ]);
    };
    this._uiRoot.audio.onEqChange("1", () => EqBandHandle(1));
    this._uiRoot.audio.onEqChange("2", () => EqBandHandle(2));
    this._uiRoot.audio.onEqChange("3", () => EqBandHandle(3));
    this._uiRoot.audio.onEqChange("4", () => EqBandHandle(4));
    this._uiRoot.audio.onEqChange("5", () => EqBandHandle(5));
    this._uiRoot.audio.onEqChange("6", () => EqBandHandle(6));
    this._uiRoot.audio.onEqChange("7", () => EqBandHandle(7));
    this._uiRoot.audio.onEqChange("8", () => EqBandHandle(8));
    this._uiRoot.audio.onEqChange("9", () => EqBandHandle(9));
    this._uiRoot.audio.onEqChange("10", () => EqBandHandle(10));
    this._uiRoot.audio.onEqChange("preamp", () => {
      this._uiRoot.vm.dispatch(this, "oneqpreampchanged", [
        {type: "INT", value: this._uiRoot.audio.getEq("preamp") * 255 - 127}
      ]);
    });
  }
  init() {
    const initialVariable = this._parsedScript.variables[0];
    if (initialVariable.type !== "OBJECT") {
      throw new Error("First variable was not SystemObject.");
    }
    initialVariable.value = this;
    for (const vari of this._parsedScript.variables) {
      if (vari.type == "OBJECT") {
        if (vari.guid == Config.GUID) {
          vari.value = this._uiRoot.CONFIG;
        } else if (vari.guid == WinampConfig.GUID) {
          vari.value = this._uiRoot.WINAMP_CONFIG;
        } else if (vari.guid == Application.GUID) {
          vari.value = this._uiRoot.APPLICATION;
        }
      }
    }
    this._uiRoot.vm.addScript(this._parsedScript);
    this._uiRoot.vm.dispatch(this, "onscriptloaded");
  }
  dispose() {
    this._uiRoot.vm.dispatch(this, "onscriptunloading");
  }
  setParentGroup(group) {
    this._parentGroup = group;
  }
  hasvideosupport() {
    return unimplemented(0);
  }
  getruntimeversion() {
    return 5.666;
  }
  getskinname() {
    return this._uiRoot.getSkinName();
  }
  getwinampversion() {
    return this._uiRoot.APPLICATION.getversionstring();
  }
  getmouseposx() {
    return unimplemented(MOUSE_POS.x);
  }
  getmouseposy() {
    return unimplemented(MOUSE_POS.y);
  }
  getprivateint(section, item, defvalue) {
    return PRIVATE_CONFIG.getPrivateInt(section, item, defvalue);
  }
  stringtointeger(str) {
    if (str == "")
      return 0;
    return Math.floor(parseFloat(str));
  }
  floattostring(value, ndigits) {
    return value.toFixed(ndigits);
  }
  stringtofloat(str) {
    return Number(str);
  }
  integertolongtime(value) {
  }
  datetotime(datetime) {
  }
  datetolongtime(datetime) {
  }
  formatdate(datetime) {
  }
  formatlongdate(datetime) {
  }
  getdateyear(datetime) {
  }
  getdatemonth(datetime) {
  }
  getdateday(datetime) {
  }
  getdatedow(datetime) {
  }
  getdatedoy(datetime) {
  }
  getdatehour(datetime) {
  }
  getdatemin(datetime) {
  }
  getdatesec(datetime) {
  }
  getdatedst(datetime) {
  }
  getdate() {
  }
  strmid(str, start, len) {
    return str.slice(start, start + len);
  }
  strleft(str, nchars) {
    return str.slice(0, nchars);
  }
  strright(str, nchars) {
    return str.slice(str.length - nchars);
  }
  strsearch(str, substr) {
    return str.indexOf(substr);
  }
  strlen(str) {
    return str ? str.length : 0;
  }
  strupper(str) {
    return str.toUpperCase();
  }
  strlower(str) {
    return str.toLowerCase();
  }
  urlencode(url) {
  }
  urldecode(url) {
  }
  setprivatestring(section, item, value) {
  }
  setprivateint(section, item, value) {
    PRIVATE_CONFIG.setPrivateInt(section, item, value);
  }
  getprivatestring(section, item, defvalue) {
    return PRIVATE_CONFIG.getPrivateString(section, item, defvalue);
  }
  setpublicstring(item, value) {
    PRIVATE_CONFIG.setPrivateString("_public_", item, value);
  }
  setpublicint(item, value) {
    PRIVATE_CONFIG.setPrivateInt("_public_", item, value);
  }
  getpublicstring(item, defvalue) {
    return PRIVATE_CONFIG.getPrivateString("_public_", item, defvalue);
  }
  getpublicint(item, defvalue) {
    return PRIVATE_CONFIG.getPrivateInt("_public_", item, defvalue);
  }
  getparam() {
    return this._param;
  }
  getscriptgroup() {
    return this._parentGroup;
  }
  gettimeofday() {
    const date = new Date();
    const dateTime = date.getTime();
    const dateCopy = new Date(dateTime);
    return dateTime - dateCopy.setHours(0, 0, 0, 0);
  }
  getcontainer(containerId) {
    const lower = containerId.toLowerCase();
    for (const container of this._uiRoot.getContainers()) {
      if (container.getId() === lower) {
        return container;
      }
    }
    throw new Error(`Could not find a container with the id; "${containerId}"`);
  }
  newdynamiccontainer(container_id) {
    return unimplemented(null);
  }
  newgroup(group_id) {
    return this._parentGroup.findobject(group_id);
  }
  newgroupaslayout(group_id) {
  }
  getnumcontainers() {
    return this._uiRoot.getContainers().length;
  }
  enumcontainer(num) {
    return this._uiRoot._containers[num];
  }
  enumembedguid(num) {
  }
  getwac(wac_guid) {
  }
  getleftvumeter() {
    return this._uiRoot.audio._vuMeter * 255;
  }
  getrightvumeter() {
    return this._uiRoot.audio._vuMeter * 255;
  }
  getvolume() {
    return this._uiRoot.audio.getVolume() * 255;
  }
  setvolume(_vol) {
    const vol = clamp(_vol, 0, 255);
    this._uiRoot.audio.setVolume(vol / 255);
  }
  play() {
    this._uiRoot.audio.play();
  }
  stop() {
    this._uiRoot.audio.stop();
  }
  pause() {
    this._uiRoot.audio.pause();
  }
  next() {
    this._uiRoot.next();
  }
  previous() {
    this._uiRoot.previous();
  }
  eject() {
    this._uiRoot.eject();
  }
  messagebox(message, msgtitle, flag, notanymore_id) {
  }
  _currentTrack() {
    return this._uiRoot.playlist.currentTrack();
  }
  getplayitemstring() {
    return unimplemented("Niente da Caprie");
  }
  getplaylistlength() {
    return this._uiRoot.playlist.getnumtracks();
  }
  getplaylistindex() {
    return this._uiRoot.playlist.getcurrentindex();
  }
  getplayitemmetadatastring(metadataname) {
    const info = this._uiRoot.audio.getTrackInfo?.() ?? {};
    const audio = this._uiRoot.audio;
    switch (String(metadataname).toLowerCase()) {
      case "title":
        return info.title ?? "";
      case "artist":
        return info.artist ?? "";
      case "album":
        return info.album ?? "";
      case "albumartist":
        return info.albumArtist ?? "";
      case "genre":
        return info.genre ?? "";
      case "year":
        return info.year != null ? String(info.year) : "";
      case "track":
        return info.track != null ? String(info.track) : "";
      case "disc":
        return info.disc != null ? String(info.disc) : "";
      case "comment":
        return info.comment ?? "";
      case "publisher":
        return info.publisher ?? "";
      case "composer":
        return info.composer ?? "";
      case "length": {
        const seconds = audio.getLength?.() ?? 0;
        return seconds > 0 ? String(Math.round(seconds * 1e3)) : "";
      }
      case "bitrate":
        return info.bitrate ? String(Math.round(info.bitrate)) : "";
      case "srate":
        return info.sampleRate ? String(Math.round(info.sampleRate)) : "";
      case "streamtype":
        return info.isStream ? "1" : "0";
      case "streamname":
        return info.streamName ?? "";
      case "streamtitle":
        return info.streamTitle ?? "";
      case "type":
        return info.isStream ? "0" : "0";
      default:
        return "";
    }
  }
  getmetadatastring(filename, metadataname) {
    return this.getplayitemmetadatastring(metadataname);
  }
  getplayitemdisplaytitle() {
    return unimplemented("playitemdisplaytitle");
  }
  getcurrenttrackrating() {
    return unimplemented(1);
  }
  oncurrenttrackrated(rating) {
  }
  setcurrenttrackrating(rating) {
  }
  getextfamily(ext) {
    return unimplemented("Audio");
  }
  getdecodername(playitem) {
    return "Nullsoft MPEG Decoder v4.103";
  }
  downloadmedia(url, destinationPath, wantAddToML, notifyDownloadsList) {
  }
  downloadurl(url, destination_filename, progress_dialog_title) {
  }
  ondownloadfinished(url, success, filename) {
  }
  getdownloadpath() {
    return unimplemented("C:\\CD Rips");
  }
  setdownloadpath(new_path) {
  }
  enqueuefile(playitem) {
  }
  playfile(playitem) {
  }
  getfilesize(fullfilename) {
    return unimplemented(100);
  }
  getalbumart(playitem) {
    return unimplemented(1);
  }
  getplayitemlength() {
    return this._uiRoot.audio.getLength();
  }
  seekto(pos) {
    this._uiRoot.audio.seekTo(pos);
  }
  chr(charnum) {
    return String.fromCharCode(charnum);
  }
  integer(d) {
    return Math.round(Number(d));
  }
  frac(d) {
    const i = Math.floor(d);
    return d - i;
  }
  integertostring(value) {
    return String(Math.round(value));
  }
  integertotime(value) {
    return integerToTime(value);
  }
  getviewportwidth() {
    return this._uiRoot.getDesktopRect().width;
  }
  getviewportwidthfromguiobject(g) {
    return this._uiRoot.getDesktopRect().width;
  }
  getviewportwidthfrompoint(x, y) {
    return this._uiRoot.getDesktopRect().width;
  }
  getmonitorwidth() {
    return this._uiRoot.getDesktopRect().width;
  }
  getmonitorwidthfrompoint(x, y) {
    return this._uiRoot.getDesktopRect().width;
  }
  getmonitorwidthfromguiobject(g) {
    return this._uiRoot.getDesktopRect().width;
  }
  getextension(str) {
    return unimplemented("mp3");
  }
  gettoken(str, separator, tokennum) {
    const commas = str.split(separator);
    return commas[tokennum] || "";
  }
  removepath(str) {
    return unimplemented("test.mp3");
  }
  getpath(str) {
    return unimplemented("c:\\music\\mp3");
  }
  getposition() {
    return String(this._uiRoot.audio.getCurrentTime() * 1e3);
  }
  getstatus() {
    const audioState = this._uiRoot.audio.getState();
    switch (audioState) {
      case AUDIO_PLAYING:
        return 1;
      case AUDIO_PAUSED:
        return -1;
      case AUDIO_STOPPED:
        return 0;
      default:
        console.warn("Unknown audio state:", audioState);
    }
  }
  getviewportheight() {
    return this._uiRoot.getDesktopRect().height;
  }
  getviewportheightfromguiobject(g) {
    return this._uiRoot.getDesktopRect().height;
  }
  getviewportheightfrompoint(x, y) {
    return this._uiRoot.getDesktopRect().height;
  }
  getmonitorheight() {
    return this._uiRoot.getDesktopRect().height;
  }
  getmonitorheightfrompoint(x, y) {
    return this._uiRoot.getDesktopRect().height;
  }
  getmonitorheightfromguiobject(g) {
    return this._uiRoot.getDesktopRect().height;
  }
  getmonitorleft() {
    return this._uiRoot.getDesktopRect().left;
  }
  getmonitorleftfromguiobject(g) {
    return this._uiRoot.getDesktopRect().left;
  }
  getmonitorleftfrompoint(x, y) {
    return this._uiRoot.getDesktopRect().left;
  }
  getmonitortop() {
    return this._uiRoot.getDesktopRect().top;
  }
  getviewporttop() {
    return this._uiRoot.getDesktopRect().top;
  }
  getmonitortopfromguiobject(g) {
    return this._uiRoot.getDesktopRect().top;
  }
  getmonitortopfrompoint(x, y) {
    return this._uiRoot.getDesktopRect().top;
  }
  getviewportleft() {
    return this._uiRoot.getDesktopRect().left;
  }
  getviewportleftfromguiobject(g) {
    return this._uiRoot.getDesktopRect().left;
  }
  getviewportleftfrompoint(x, y) {
    return this._uiRoot.getDesktopRect().left;
  }
  getviewporttopfromguiobject(g) {
    return this._uiRoot.getDesktopRect().top;
  }
  getviewporttopfrompoint(x, y) {
    return this._uiRoot.getDesktopRect().top;
  }
  debugstring(str, severity) {
    console.log("Wasabi Console:", str);
  }
  ddesend(application, command, mininterval) {
  }
  getcurappleft() {
    return 0;
  }
  getcurapptop() {
    return 0;
  }
  getcurappwidth() {
    return 1e3;
  }
  getcurappheight() {
    return unimplemented(100);
  }
  geteq() {
    return unimplemented(1);
  }
  geteqpreamp() {
    return unimplemented(0);
  }
  seteq(onoff) {
  }
  seteqpreamp(value) {
    this._uiRoot.audio.setEq("preamp", (value + 127) / 255);
  }
  seteqband(band, value) {
    this._uiRoot.audio.setEq(String(band + 1), (value + 127) / 255);
  }
  geteqband(band) {
    return this._uiRoot.audio.getEq(String(band + 1)) * 255 - 127;
  }
  oneqbandchanged(band, value) {
    this._uiRoot.vm.dispatch(this, "oneqbandchanged", [
      {type: "INT", value: band},
      {type: "INT", value}
    ]);
  }
  getvisband(channel, band) {
    return unimplemented(0);
  }
  tan(value) {
    return Math.tan(value);
  }
  sin(value) {
    return Math.sin(value);
  }
  cos(value) {
    return Math.cos(value);
  }
  asin(value) {
    return Math.asin(value);
  }
  acos(value) {
    return Math.acos(value);
  }
  atan(value) {
    return Math.atan(value);
  }
  atan2(y, x) {
    return Math.atan2(y, x);
  }
  pow(value, pvalue) {
    return Math.pow(value, pvalue);
  }
  sqr(value) {
    return value * value;
  }
  log10(value) {
    return Math.log10(value);
  }
  ln(value) {
    throw new Error("Unimplemented");
  }
  sqrt(value) {
    return Math.sqrt(value);
  }
  random(max) {
    return Math.random() * max;
  }
  oneqfreqchanged(isiso) {
  }
  getsonginfotext() {
    return this._uiRoot.getSongInfoText();
  }
  getsonginfotexttranslated() {
    return this.getplayitemstring();
  }
  lockui() {
  }
  unlockui() {
  }
  isobjectvalid(o) {
    return o != null;
  }
  istransparencyavailable() {
    return true;
  }
  translate(str) {
    return unimplemented(str);
  }
  isvideo() {
    return unimplemented(0);
  }
  isvideofullscreen() {
    return unimplemented(0);
  }
  setvideofullscreen(fullscreen) {
  }
  iskeydown(vk) {
    return unimplemented(0);
  }
  isminimized() {
    return unimplemented(0);
  }
  isdesktopalphaavailable() {
    return true;
  }
  isproversion() {
    return true;
  }
}
SystemObject.GUID = "d6f50f6449b793fa66baf193983eaeef";
function dumpScriptDebug(script) {
  for (const [i, binding] of script.bindings.entries()) {
    const method = script.methods[binding.methodOffset];
    const guid = script.classes[method.typeOffset];
    const klass = getClass(guid);
    console.log(`${i}. ${klass.name}.${method.name} => ${binding.commandOffset}`);
  }
}
