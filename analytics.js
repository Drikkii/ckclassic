(function () {
  "use strict";

  window.CK_reachGoal = function (goalName, params) {
    if (!goalName || typeof window.ym !== "function") {
      return;
    }
    const metrikaId = Number(
      window.CK_SITE_CONFIG?.yandexMetrikaId || 110539365,
    );
    if (!metrikaId) {
      return;
    }
    window.ym(metrikaId, "reachGoal", goalName, params || {});
  };
})();
