import ImageManager from "../ImageManager.js";
export class WmzImageManager extends ImageManager {
  async getBlob(filePath) {
    return await this._uiRoot.getFileAsBlobZip(filePath);
  }
}
