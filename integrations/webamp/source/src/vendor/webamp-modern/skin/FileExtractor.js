import JSZip from "../_snowpack/pkg/jszip.js";
import {getCaseInsensitiveFile, normalizeSkinPath} from "../utils.js";
export class FileExtractor {
}
export class ZipFileExtractor {
  constructor() {
    this._root = "";
  }
  async prepare(skinPath, response) {
    const skinZipBlob = await response.blob();
    this._zip = await JSZip.loadAsync(skinZipBlob);
  }
  setRoot(root) {
    this._root = root ? root.replace(/\\/g, "/").replace(/\/?$/, "/") : "";
  }
  listSkinRoots() {
    if (!this._zip)
      return [];
    return Object.keys(this._zip.files).filter((name) => !this._zip.files[name].dir && /(^|\/)skin\.xml$/i.test(name)).map((name) => name.slice(0, name.length - "skin.xml".length)).sort((a, b) => a.split("/").length - b.split("/").length || a.localeCompare(b));
  }
  async getFileAsString(filePath) {
    if (!filePath)
      return null;
    const zipObj = getCaseInsensitiveFile(this._zip, filePath, this._root);
    if (!zipObj)
      return null;
    return await zipObj.async("text");
  }
  async getFileAsBytes(filePath) {
    if (!filePath)
      return null;
    const zipObj = getCaseInsensitiveFile(this._zip, filePath, this._root);
    if (!zipObj)
      return null;
    return await zipObj.async("arraybuffer");
  }
  async getFileAsBlob(filePath) {
    if (!filePath)
      return null;
    const zipObj = getCaseInsensitiveFile(this._zip, filePath, this._root);
    if (!zipObj)
      return null;
    return await zipObj.async("blob");
  }
}
export class PathFileExtractor {
  async prepare(skinPath, response) {
    if (!skinPath.endsWith("/"))
      skinPath += "/";
    this._skinDir = skinPath;
  }
  async getFileAsString(filePath) {
    const response = await fetch(this._skinDir + normalizeSkinPath(filePath));
    return await response.text();
  }
  async getFileAsBytes(filePath) {
    const response = await fetch(this._skinDir + normalizeSkinPath(filePath));
    return await response.arrayBuffer();
  }
  async getFileAsBlob(filePath) {
    const response = await fetch(this._skinDir + normalizeSkinPath(filePath));
    return await response.blob();
  }
}
