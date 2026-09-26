import {DEFAULT_SKIN} from "./constants.js";
export const parseViscolors = (text) => {
  const entries = text.split("\n");
  const regex = /^\s*(\d+)\s*,?\s*(\d+)\s*,?\s*(\d+)/;
  const colors = [...DEFAULT_SKIN.colors];
  entries.map((line) => regex.exec(line)).filter(Boolean).map((matches) => matches.slice(1, 4).join(",")).map((rgb, i) => {
    colors[i] = `rgb(${rgb})`;
  });
  return colors;
};
const SECTION_REGEX = /^\s*\[(.+?)\]\s*$/;
const PROPERTY_REGEX = /^\s*([^;][^=]*)\s*=\s*(.*)\s*$/;
export const parseIni = (text) => {
  let section, match;
  return text.split(/[\r\n]+/g).reduce((data, line) => {
    if ((match = line.match(PROPERTY_REGEX)) && section != null) {
      const key = match[1].trim().toLowerCase();
      const value = match[2].replace(/\=.*$/g, "").trim().replace(/(^")|("$)|(^')|('$)/g, "");
      data[section][key] = value;
    } else if (match = line.match(SECTION_REGEX)) {
      section = match[1].trim().toLowerCase();
      data[section] = {};
    }
    return data;
  }, {});
};
