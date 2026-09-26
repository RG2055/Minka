import {assume} from "../../utils.js";
import BaseObject from "./BaseObject.js";
let TIMER_IDS = 0;
export default class Timer extends BaseObject {
  constructor(uiRoot) {
    super();
    this._delay = 5e3;
    this._timeout = null;
    this._onTimer = null;
    this._uiRoot = uiRoot;
    TIMER_IDS += 1;
    this._id = `timer_${TIMER_IDS}`;
  }
  setdelay(millisec) {
    const running = this.isrunning();
    if (running)
      this.stop();
    this._delay = millisec;
    if (running)
      this.start();
  }
  stop() {
    if (this._timeout != null) {
      clearTimeout(this._timeout);
      this._timeout = null;
    }
  }
  start() {
    if (!this._delay) {
      return false;
    }
    const self = this;
    try {
      assume(this._delay != null, "Tried to start a timer without a delay");
      if (this.isrunning()) {
        this.stop();
      }
      this._timeout = setInterval(() => {
        self.doTimer();
      }, this._delay);
      return true;
    } catch (err) {
      return false;
    }
    return false;
  }
  doTimer() {
    if (this._onTimer != null) {
      this._onTimer();
    } else {
      this._uiRoot.vm.dispatch(this, "ontimer");
    }
  }
  ontimer() {
    this._uiRoot.vm.dispatch(this, "ontimer");
  }
  setOnTimer(callback) {
    const handler = () => {
      callback();
    };
    this._onTimer = handler;
  }
  isrunning() {
    return this._timeout != null;
  }
  getdelay() {
    return this._delay;
  }
  getskipped() {
    return 0;
  }
}
Timer.GUID = "5d0c5bb64b1f7de1168d0fa741199459";
