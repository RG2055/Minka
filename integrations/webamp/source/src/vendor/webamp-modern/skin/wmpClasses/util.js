export function runInlineScript(script, context = {}) {
  for (const [key, value] of Object.entries(context)) {
    window[key] = value;
  }
  for (var expression of script.split(";")) {
    if (expression == "")
      continue;
    console.log(`/${expression}/`);
    if (expression.endsWith("()")) {
      expression = expression.replace(/\(\)/, "");
      try {
        window[expression]();
      } catch (error) {
        console.log("failed to run expression:", `|${expression}|`, "@", script);
        console.warn(error);
      }
    }
  }
}
export function solvePendingProps(component, pendingProps) {
  for (const [key, script] of Object.entries(pendingProps)) {
    const z = [];
    const regex = /\w+\.\w+|[\+-]+|[0-9]+/gm;
    let m = null;
    while ((m = regex.exec(script)) !== null) {
      if (m.index === regex.lastIndex) {
        regex.lastIndex++;
      }
      m.forEach((match, groupIndex) => {
        if (match != null) {
          z.push(match);
        }
      });
    }
    let sign = "+";
    let num;
    if (z.length) {
      let result = 0;
      let msg = "";
      z.forEach((s, index) => {
        if (s == null) {
          return;
        } else if (s.indexOf(".") > 0) {
          const [id, attr] = s.split(".");
          const el = component.findobject(id);
          if (el) {
            num = el["get" + attr]();
            if (!isNaN(num)) {
              if (sign == "-") {
                num *= -1;
              }
              result += num;
            }
          }
          msg += `[${id}.${attr}=${num}]`;
        } else if (s == "+" || s == "-") {
          sign = s;
          msg += s;
        } else {
          num = parseInt(s);
          if (!isNaN(num)) {
            if (sign == "-") {
              num *= -1;
            }
            result += num;
            msg += String(num);
          } else {
            msg += ` [Failed to process: ${s}]`;
          }
        }
      });
      component.setXmlAttr(key, result.toString());
    }
  }
}
