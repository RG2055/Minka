export class IniSection {
  constructor(section) {
    this._tree = section;
  }
  getString(key) {
    return this._tree[key.toLowerCase()];
  }
  getInt(key) {
    const v = this.getString(key).toLowerCase();
    let i = parseInt(v);
    if (isNaN(i) && !!this._tree[v]) {
      i = this.getInt(v);
    }
    return i;
  }
  getRGBA(key) {
    const i = this.getInt(key);
    const r = i & 255;
    const g = (i & 65280) >> 8;
    const b = (i & 16711680) >> 16;
    const a = (i & 16711680) >> 24;
    return {r, g, b, a};
  }
}
export default class IniFile {
  section(name) {
    return new IniSection(this._tree[name.toLowerCase()]);
  }
  readString(content) {
    const ini = this._tree || {};
    let section = "root";
    content = content.replace(/\r/g, "");
    const lines = content.split("\n");
    for (var line of lines) {
      if (!line || line.startsWith(";"))
        continue;
      if (line.startsWith("[")) {
        console.log(line);
        line = line.replace(/\[/, "").replace(/\]/, "");
        section = line.toLowerCase();
        if (!ini[section]) {
          ini[section] = {};
        }
        continue;
      }
      if (line.includes("=")) {
        let [key, value] = line.split("=");
        key = strip(key).toLowerCase();
        value = strip(value);
        console.log(" -", line);
        ini[section][key] = value;
      }
    }
    this._tree = ini;
  }
  getString(section, key) {
    const ksection = this._tree[section.toLowerCase()];
    if (!ksection)
      return null;
    return ksection[key.toLowerCase()];
  }
  has(section, key) {
    return this.getString(section, key) != null;
  }
  getInt(section, key) {
    return parseInt(this.getString(section, key));
  }
}
function strip(s) {
  return s.replace(/^\s+|\s+$/g, "");
}
