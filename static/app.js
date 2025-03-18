Ext.Loader.setConfig({
  Ext: ".",
});

Ext.application({
  requires: ["Ext.state.Provider"],
  requires: ["Ext.state.*"],
  views: ["Main"],

  name: "Proteus",

  launch: function () {
    const loggedIn = sessionStorage.getItem("_proteus_loggged_in_");

    if (loggedIn) {
      return Ext.create("Proteus.view.Main", {
        fullscreen: true,
      });
    } else {
      return Ext.create("Proteus.view.Login", {
        fullscreen: true,
      });
    }
  },
});
