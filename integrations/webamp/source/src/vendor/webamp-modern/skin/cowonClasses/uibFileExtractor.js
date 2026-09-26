import {FileExtractor} from "../FileExtractor.js";
export default class UibFileExtractor extends FileExtractor {
  constructor() {
    super(...arguments);
    this._toc = {};
  }
  async prepare(skinPath, response) {
    const buffer = await response.arrayBuffer();
    this._arr = new Uint8Array(buffer);
    this.buildTOC();
    const info = Object.values(this._toc);
    console.log("Cowon-JetAudio!:", info);
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
    const chunk = this._toc[filePath];
    if (!chunk)
      return null;
    const part = this._arr.slice(chunk.start, chunk.size + chunk.start - 1);
    const magic = "BM";
    const fileSize = Uint32Array.from([chunk.size + 14, 0, 1078]);
    const blob = new Blob([magic, fileSize, part], {type: "image/bmp"});
    return blob;
  }
  buildTOC() {
    const block = this._arr;
    const fileSize = block.length;
    this.seek(1108);
    this.readInt32LE();
    while (this.tell() < fileSize) {
      const at = this.tell();
      const start2 = this.readInt32LE();
      const size2 = this.readInt32LE();
      if (size2 == 0) {
        break;
      }
      const fileName2 = at.toString(16);
      this._toc[fileName2] = {
        at,
        fileName: fileName2,
        size: size2,
        start: start2
      };
    }
    let start = 0;
    while (this._i < fileSize && this.read() != 60) {
    }
    start = this.tell() - 1;
    while (this._i < fileSize && this.readInt32LE() != 0) {
      this._i += 16 * 8;
    }
    const size = this.tell() - start;
    const fileName = "main.jsc";
    this._toc[fileName] = {
      fileName,
      size,
      start
    };
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
  read() {
    return this._arr[this._i++];
  }
  reads(length) {
    const result = [];
    for (var i = 0; i < length; i++) {
      result.push(this._arr[this._i]);
      this._i++;
    }
    return result;
  }
  readInt32LE(increment = true) {
    const offset = this._i >>> 0;
    if (increment) {
      this._i += 4;
    }
    return this._arr[offset] | this._arr[offset + 1] << 8 | this._arr[offset + 2] << 16 | this._arr[offset + 3] << 24;
  }
  readString(length) {
    let ret = "";
    const end = Math.min(this._arr.length, this._i + length);
    for (let i = this._i; i < end; ++i) {
      const byte = this._arr[i];
      if (byte != 0) {
        ret += String.fromCharCode(byte);
      } else {
        break;
      }
    }
    this._i += length;
    return ret;
  }
}
