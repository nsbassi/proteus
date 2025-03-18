Ext.define("Proteus.view.MainController", {
  extend: "Ext.app.ViewController",
  alias: "controller.main",

  onLogout: function () {
    sessionStorage.removeItem("_proteus_loggged_in_");
    this.getView().destroy();
    return Ext.create("Proteus.view.Login", {
      fullscreen: true,
    });
  },
});
