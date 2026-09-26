import {parseIni} from "./utils.js";
export function pointPairs(arr) {
  const pairedValues = [];
  for (let i = 0; i < arr.length; i += 2) {
    pairedValues.push(`${arr[i]},${arr[i + 1]}`);
  }
  return pairedValues;
}
export default function regionParser(regionStr) {
  const iniData = parseIni(regionStr);
  const data = {};
  Object.keys(iniData).forEach((section) => {
    const {numpoints, pointlist} = iniData[section];
    if (!numpoints || !pointlist) {
      return;
    }
    const pointCounts = numpoints.split(/\s*,\s*/).filter((val) => val !== "");
    const points = pointPairs(pointlist.split(/\s*[, ]\s*/).filter((val) => val !== ""));
    let pointIndex = 0;
    const polygons = pointCounts.map((numStr) => {
      const num = Number(numStr);
      if (num < 3) {
        pointIndex += num;
        return null;
      }
      const polygon = points.slice(pointIndex, pointIndex + num).join(" ");
      if (!polygon.length) {
        return null;
      }
      pointIndex += num;
      return polygon;
    });
    const validPolygons = polygons.filter((polygon) => polygon != null);
    if (validPolygons.length) {
      data[section] = validPolygons;
    }
  });
  return data;
}
