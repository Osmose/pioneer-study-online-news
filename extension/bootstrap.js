/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { utils: Cu } = Components;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyModuleGetter(
  this, "ActiveURIService", "resource://pioneer-study-online-news/lib/ActiveURIService.jsm",
);

const REASON_APP_STARTUP = 1;
const UI_AVAILABLE_NOTIFICATION = "sessionstore-windows-restored";

this.Bootstrap = {
  install() {},

  startup(data, reason) {
    // If the app is starting up, wait until the UI is available before finishing
    // init.
    if (reason === REASON_APP_STARTUP) {
      Services.obs.addObserver(this, UI_AVAILABLE_NOTIFICATION);
    } else {
      this.finishStartup();
    }
  },

  observe(subject, topic, data) {
    if (topic === UI_AVAILABLE_NOTIFICATION) {
      Services.obs.removeObserver(this, UI_AVAILABLE_NOTIFICATION);
      this.finishStartup();
    }
  },

  finishStartup() {
    ActiveURIService.startup();
    ActiveURIService.addListener(this);
    this.onFocusURI(ActiveURIService.focusedURI);
  },

  onFocusURI(uri) {
    Cu.reportError(`New focused URI: ${uri ? uri.spec : "Browser Chrome"}`);
  },

  shutdown(data, reason) {
    // In case the observer didn't run, clean it up.
    try {
      Services.obs.removeObserver(this, UI_AVAILABLE_NOTIFICATION);
    } catch (err) {
      // It must already be removed!
    }

    ActiveURIService.removeListener(this);
    ActiveURIService.shutdown();

    Cu.unload("resource://pioneer-study-online-news/lib/ActiveURIService.jsm");
  },

  uninstall() {},
};

// Expose bootstrap methods on the global
for (const methodName of ["install", "startup", "shutdown", "uninstall"]) {
  this[methodName] = Bootstrap[methodName].bind(Bootstrap);
}
