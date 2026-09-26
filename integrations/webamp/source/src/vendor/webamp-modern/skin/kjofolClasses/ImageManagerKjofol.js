import ImageManager from "../ImageManager.js";
export class ImageManagerKjofol extends ImageManager {
  async getBlob(filePath) {
    if (!filePath.toLowerCase().endsWith(".png")) {
      return await super.getBlob(filePath);
    }
    const blobPart = [];
    const rawData = await this._uiRoot.getFileAsBytes(filePath);
    const arr = new Uint8Array(rawData);
    let i = 0;
    const readInt32BE = () => {
      const offset = i >>> 0;
      i += 4;
      return arr[offset + 3] | arr[offset + 2] << 8 | arr[offset + 1] << 16 | arr[offset + 0] << 24;
    };
    const chr = String.fromCharCode;
    const readChunk = () => {
      const offset = i >>> 0;
      i += 4;
      return chr(arr[offset + 0]) + chr(arr[offset + 1]) + chr(arr[offset + 2]) + chr(arr[offset + 3]);
    };
    const allowedChunks = ["IHDR", "IDAT", "IEND", "PLTE"];
    let start = 0;
    i = 8;
    blobPart.push(arr.slice(start, i));
    while (i < arr.length) {
      start = i;
      const data_size = readInt32BE();
      const chunk_sign = readChunk();
      i += data_size;
      i += 4;
      if (allowedChunks.includes(chunk_sign)) {
        blobPart.push(arr.slice(start, i));
      }
    }
    const blob = new Blob(blobPart);
    return blob;
  }
}
