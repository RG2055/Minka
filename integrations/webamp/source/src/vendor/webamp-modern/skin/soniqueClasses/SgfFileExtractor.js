import {FileExtractor} from "../FileExtractor.js";
import {navitem} from "./navitem.js";
export default class SgfFileExtractor extends FileExtractor {
  constructor() {
    super(...arguments);
    this._toc = {};
  }
  async prepare(skinPath, response) {
    const buffer = await response.arrayBuffer();
    this._arr = new Uint8Array(buffer);
    this.buildTOC();
    console.log("Sonique!:", Object.keys(this._toc));
  }
  async getFileAsString(filePath) {
    const blob = await this.getFileAsBlob(filePath);
    if (!blob)
      return null;
    return new Promise((resolve, reject) => {
      var reader = new FileReader();
      reader.onload = function() {
        resolve(reader.result);
      };
      reader.onerror = function(e) {
        reject(e);
      };
      reader.readAsBinaryString(blob);
    });
  }
  async getFileAsBytes(filePath) {
    const blob = await this.getFileAsBlob(filePath);
    if (!blob)
      return null;
    return await blob.arrayBuffer();
  }
  async getFileAsBlob(filePath) {
    console.log("getting ", filePath);
    if (filePath == "/png/navitem") {
      return navitem();
    }
    const chunk = this._toc[filePath];
    if (!chunk)
      return null;
    const part = this._arr.slice(chunk.start, chunk.end);
    const blob = new Blob([part]);
    return blob;
  }
  buildTOC() {
    this.seek(12);
    const dataAddress = this.readInt32LE();
    this.seek(16 * 6, true);
    while (this.tell() < dataAddress) {
      const fileName = this.readString(16 * 5);
      this.seek(4, true);
      const chunkStart = this.readInt32LE();
      const chunkSize = this.readInt32LE();
      this._toc[fileName] = {
        start: chunkStart,
        size: chunkSize,
        end: chunkStart + chunkSize
      };
      this.seek(8, true);
    }
  }
  seek(n, relative = false) {
    if (relative) {
      this._i += n;
    } else {
      this._i = n;
    }
  }
  tell() {
    return this._i;
  }
  readInt32LE() {
    const offset = this._i >>> 0;
    this._i += 4;
    return this._arr[offset] | this._arr[offset + 1] << 8 | this._arr[offset + 2] << 16 | this._arr[offset + 3] << 24;
  }
  readString(length) {
    let ret = "";
    const end = Math.min(this._arr.length, this._i + length);
    for (let i = this._i; i < end; ++i) {
      const byte = this._arr[i];
      if (byte != 0) {
        ret += String.fromCharCode(byte);
      }
    }
    this._i += length;
    return ret;
  }
}
