import {interpret} from "../maki/interpreter.js";
import {classResolver} from "./resolver.js";
export default class Vm {
  constructor(uiRoot) {
    this._scripts = [];
    this._uiRoot = uiRoot;
  }
  dispatch1(object, event, args = []) {
    const reversedArgs = [...args].reverse();
    let executed = 0;
    for (const script of this._scripts) {
      for (const binding of script.bindings) {
        if (script.methods[binding.methodOffset].name === event && (script.variables[binding.variableOffset].value === object || script.variables[binding.variableOffset].isClass && script.variables[binding.variableOffset].members.find((vari) => script.variables[vari].value == object))) {
          if (event.startsWith("onleftbu")) {
            console.log("EXEC EVENT:", event, binding);
          }
          this.interpret(script, binding.commandOffset, event, reversedArgs);
          executed++;
        }
      }
    }
    if (event.startsWith("onleft")) {
      console.log("dispatched", executed, "x :", event, object._id);
    }
    return 0;
  }
  async dispatch(object, event, args = []) {
    const reversedArgs = [...args].reverse();
    let executed = 0;
    for (const script of this._scripts) {
      for (const binding of script.bindings) {
        if (script.methods[binding.methodOffset].name === event) {
          let match = false;
          const binding_var = script.variables[binding.variableOffset];
          if (binding_var.isClass) {
            const found = binding_var.members.find((var_index) => {
              const member_var = script.variables[var_index];
              return member_var.value == object;
            });
            if (found != null) {
              binding_var.value = object;
              match = true;
            }
          } else if (binding_var.type === "OBJECT" && binding_var.value === object) {
            match = true;
          }
          if (match) {
            await this.interpret(script, binding.commandOffset, event, reversedArgs);
            executed++;
          }
        }
      }
    }
    return executed;
  }
  addScript(maki) {
    const index = this._scripts.length;
    this._scripts.push(maki);
    return index;
  }
  async interpret(script, commandOffset, eventName, args) {
    await interpret(commandOffset, script, args, classResolver, eventName, this._uiRoot);
  }
}
