import Layer from "./Layer.js";
export default class AlbumArt extends Layer {
  constructor(uiRoot) {
    super(uiRoot);
    this._trackId = -1;
    this._hasPicture = false;
    this._albumArtSubscription = null;
    this._trackChanged = () => {
      let track;
      if (track = this._uiRoot.playlist.currentTrack()) {
        if (this._trackId != track.id || !this._hasPicture && track.metadata && track.metadata.image) {
          this._trackId = track.id;
          if (track.metadata && track.metadata.image) {
            const image = track.metadata.image;
            this._hasPicture = image != null;
            const albumArtUrl = URL.createObjectURL(new Blob([image.data], {type: image.mime}));
            this._div.style.backgroundImage = `url(${albumArtUrl})`;
          } else {
            this._hasPicture = false;
            this._div.style.removeProperty("background-image");
          }
        }
      }
    };
    this._w = 0;
    this._h = 0;
    this._relatw = "1";
    this._relath = "1";
  }
  init() {
    super.init();
    this._uiRoot.playlist.on("trackchange", this._trackChanged);
    this._albumArtSubscription = this._uiRoot.audio.onAlbumArtChange(this.refresh.bind(this));
  }
  dispose() {
    this._albumArtSubscription?.();
    this._albumArtSubscription = null;
    super.dispose();
  }
  draw() {
    super.draw();
  }
  refresh() {
    const albumArtUrl = this._uiRoot.audio._albumArtUrl;
    if (albumArtUrl != null) {
      this._div.style.pointerEvents = "all";
      this._div.style.backgroundImage = `url(${albumArtUrl})`;
      this._div.style.backgroundSize = "cover";
    } else {
      this._div.style.removeProperty("background-image");
    }
  }
  isloading() {
    return 1;
  }
  onAlbumArtLoaded(success) {
    return true;
  }
  isinvalid() {
    return !this._hasPicture;
  }
}
AlbumArt.GUID = "6dcb05e448c28ac4f04993b14af50e91";
