const dummyAction = {
  onUpdate: (menu) => {
  },
  onExecute: (uiRoot) => false
};
export const actions = {};
export const findAction = (menuId) => {
  const registeredAction = actions[menuId] || {};
  return {...dummyAction, ...registeredAction};
};
export async function updateActions(popup, uiRoot) {
  return await Promise.all(popup.children.map(async (menuItem) => {
    if (menuItem.type == "menuitem") {
      const action = findAction(menuItem.id);
      action.onUpdate(menuItem, uiRoot);
    } else if (menuItem.type == "popup") {
      await updateActions(menuItem.popup, uiRoot);
    }
  }));
}
export const registerAction = (menuId, action) => {
  actions[menuId] = action;
};
registerAction(40037, {
  onUpdate: (menu, uiRoot) => {
    menu.checked = !uiRoot.audio._timeRemaining;
  },
  onExecute: (uiRoot) => {
    uiRoot.audio._timeRemaining = false;
    return true;
  }
});
registerAction(40038, {
  onUpdate: (menu, uiRoot) => {
    menu.checked = uiRoot.audio._timeRemaining;
  },
  onExecute: (uiRoot) => {
    uiRoot.audio._timeRemaining = true;
    return true;
  }
});
registerAction(40039, {
  onExecute: (uiRoot) => {
    uiRoot.audio.toggleRemainingTime();
    return true;
  }
});
registerAction(40044, {
  onExecute: (uiRoot) => uiRoot.dispatch("prev")
});
registerAction(40045, {
  onExecute: (uiRoot) => uiRoot.dispatch("play")
});
registerAction(40046, {
  onExecute: (uiRoot) => uiRoot.dispatch("pause")
});
registerAction(40047, {
  onExecute: (uiRoot) => uiRoot.dispatch("stop")
});
registerAction(40048, {
  onExecute: (uiRoot) => uiRoot.dispatch("next")
});
registerAction(11111140038, {
  onUpdate: (menu) => {
  }
});
registerAction(40244, {
  onUpdate: (menu, uiRoot) => {
    menu.checked = uiRoot.audio._eqEnabled;
  },
  onExecute: (uiRoot) => {
    uiRoot.eq_toggle();
    return true;
  }
});
registerAction(40040, {
  onUpdate: (menu, uiRoot) => {
    menu.checked = uiRoot.getActionState("toggle", "guid:pl");
  },
  onExecute: (uiRoot) => {
    uiRoot.dispatch("toggle", "guid:pl");
    return true;
  }
});
