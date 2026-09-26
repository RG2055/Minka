import {
  PathFileExtractor,
  ZipFileExtractor
} from "./skin/FileExtractor.js";
import {classResolver} from "./skin/resolver.js";
import {
  getSkinEngineClass,
  getSkinEngineClassByContent
} from "./skin/SkinEngine.js";
import {UIRoot} from "./UIRoot.js";
import {WebAmpModern} from "./WebampModernInteface.js";
function hack() {
  classResolver("A funny joke about why this is needed.");
}
const DEFAULT_OPTIONS = {
  skin: "assets/WinampModern566.wal",
  tracks: []
};
let DIV_UNIQUER = 0;
export class Webamp5 extends WebAmpModern {
  constructor(parent, options = {}) {
    super(parent, options);
    this._parent = parent || document.body;
    this._options = {...DEFAULT_OPTIONS, ...options};
    DIV_UNIQUER++;
    this._uiRoot = new UIRoot(`ui-root-${DIV_UNIQUER}`, {
      audio: this._options.audio,
      playlistProvider: this._options.playlistProvider,
      desktop: this._options.desktop,
      assetsBase: this._options.assetsBase,
      privateDefaults: this._options.privateDefaults,
      onAction: this._options.onAction,
      isActionActive: this._options.isActionActive,
      holdWindow: this._options.holdWindow,
      releaseWindow: this._options.releaseWindow,
      onLayoutSnapAdjustChanged: this._options.onLayoutSnapAdjustChanged
    });
    parent.appendChild(this._uiRoot.getRootDiv());
    this._ready = this.switchSkin(this._options.skin);
    for (const song of this._options.tracks) {
      this._uiRoot.playlist.enqueuefile(song);
    }
  }
  ready() {
    return this._ready;
  }
  getUIRoot() {
    return this._uiRoot;
  }
  dispose() {
    this._uiRoot.destroy();
  }
  async switchSkin(skin) {
    const isBlob = typeof Blob !== "undefined" && skin instanceof Blob;
    const skinPath = isBlob ? URL.createObjectURL(skin) : skin;
    try {
      await this._switchSkinPath(skinPath, isBlob);
    } finally {
      if (isBlob)
        URL.revokeObjectURL(skinPath);
    }
    this._applyContainerFilter();
  }
  _applyContainerFilter() {
    const wanted = this._options.containers;
    if (!wanted)
      return;
    const ids = wanted.map((id) => id.toLowerCase());
    for (const container of this._uiRoot.getContainers()) {
      const id = (container.getId() || "").toLowerCase();
      if (ids.includes(id)) {
        if (!container.getVisible())
          container.show();
      } else if (container.getVisible()) {
        container.hide();
      }
    }
  }
  async _switchSkinPath(skinPath, isBlob) {
    this._uiRoot.reset();
    this._parent.appendChild(this._uiRoot.getRootDiv());
    let skinFetched = false;
    let SkinEngineClass = null;
    let SkinEngineClasses = await getSkinEngineClass(isBlob ? "skin.wal" : skinPath);
    if (SkinEngineClasses.length > 1) {
      await this._loadSkinPathToUiroot(skinPath, this._uiRoot, null);
      skinFetched = true;
      SkinEngineClass = await getSkinEngineClassByContent(SkinEngineClasses, skinPath, this._uiRoot);
    } else {
      SkinEngineClass = SkinEngineClasses[0];
    }
    if (SkinEngineClass == null) {
      throw new Error(`Skin not supported`);
    }
    this._uiRoot.SkinEngineClass = SkinEngineClass;
    const parser = new SkinEngineClass(this._uiRoot);
    if (!skinFetched)
      await this._loadSkinPathToUiroot(skinPath, this._uiRoot, parser);
    await parser.buildUI();
  }
  async _loadSkinPathToUiroot(skinPath, uiRoot, skinEngine) {
    let response;
    let fileExtractor;
    if (skinPath.endsWith("/")) {
      fileExtractor = new PathFileExtractor();
    } else {
      response = await fetch(skinPath);
      if (response.status == 404) {
        throw new Error(`Skin does not exist`);
      }
      if (skinEngine != null) {
        fileExtractor = skinEngine.getFileExtractor();
      }
    }
    if (fileExtractor == null) {
      const contentType = response.headers.get("content-type") || "";
      const looksLikeZip = contentType.startsWith("application/") || skinPath.startsWith("blob:") || /\.(wal|wmz|wsz|zip|kjofol|face|acs5|uib)$/i.test(skinPath);
      fileExtractor = looksLikeZip ? new ZipFileExtractor() : new PathFileExtractor();
    }
    await fileExtractor.prepare(skinPath, response);
    if (fileExtractor instanceof ZipFileExtractor) {
      const roots = fileExtractor.listSkinRoots();
      const wanted = this._options.skinRoot;
      if (wanted) {
        const match = roots.find((r) => r.replace(/\/$/, "").toLowerCase() === wanted.replace(/[\\/]$/, "").toLowerCase());
        fileExtractor.setRoot(match ?? wanted);
      } else if (roots.length && roots[0] !== "") {
        fileExtractor.setRoot(roots[0]);
      }
    }
    uiRoot.setFileExtractor(fileExtractor);
  }
  playSong(songurl) {
  }
  onLogMessage(callback) {
    this._uiRoot.on("onlogmessage", callback);
  }
}
async function main() {
  window.WebampModern = Webamp5;
}
main();
