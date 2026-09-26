import BitmapFont from "./BitmapFont.js";
const DEFAULT_IMAGE_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==";
export default class ImageManager {
  constructor(uiRoot) {
    this._imagePlaceholder = false;
    this._urlCache = {};
    this._imgCache = {};
    this._uiRoot = uiRoot;
  }
  dispose() {
  }
  async getUrl(filePath) {
    if (!this._urlCache.hasOwnProperty(filePath)) {
      const imgBlob = await this.getBlob(filePath);
      if (imgBlob == null) {
        this._urlCache[filePath] = null;
        return null;
      }
      const imgUrl = await getUrlFromBlob(imgBlob);
      this._urlCache[filePath] = imgUrl;
    }
    return this._urlCache[filePath];
  }
  getCachedUrl(filePath) {
    return this._urlCache[filePath];
  }
  async getBlob(filePath) {
    return await this._uiRoot.getFileAsBlob(filePath);
  }
  async loadUniquePaths() {
    const bitmaps = [];
    const filesPath = [];
    for (const bitmap of Object.values(this._uiRoot.getBitmaps())) {
      if (!bitmap.loaded()) {
        if (!filesPath.includes(bitmap.getFile())) {
          filesPath.push(bitmap.getFile());
          bitmaps.push(bitmap);
        }
      }
    }
    const fonts = this._uiRoot.getFonts();
    for (let i = fonts.length - 1; i >= 0; i--) {
      const font = fonts[i];
      if (font instanceof BitmapFont && !font.useExternalBitmap() && !font.getImg()) {
        if (!filesPath.includes(font.getFile())) {
          filesPath.push(font.getFile());
          bitmaps.push(font);
        }
      }
    }
    await Promise.all(filesPath.map(async (filePath) => {
      return await this.getImage(filePath);
    }));
    return bitmaps;
  }
  async ensureBitmapsLoaded() {
    const bitmaps = await this.loadUniquePaths();
    return await Promise.all(bitmaps.map(async (bitmap) => {
      return bitmap.ensureImageLoaded(this);
    }));
  }
  async getImage(filePath) {
    if (!this._imgCache.hasOwnProperty(filePath)) {
      const url = await this.getUrl(filePath);
      if (url != null) {
        const img = await loadImage(url);
        this._imgCache[filePath] = img;
      } else if (this._imagePlaceholder) {
        const img = await loadImage(DEFAULT_IMAGE_URL);
        this._imgCache[filePath] = img;
      } else {
        this._imgCache[filePath] = null;
      }
    }
    return this._imgCache[filePath];
  }
}
async function getUrlFromBlob(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      resolve(e.target.result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
export async function loadImage(imgUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => {
      resolve(img);
    });
    img.addEventListener("error", (e) => {
      console.warn("cant load empty image:", imgUrl);
      reject(e);
    });
    img.src = imgUrl;
  });
}
