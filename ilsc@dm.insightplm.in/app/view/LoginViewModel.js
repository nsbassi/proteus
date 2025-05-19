Ext.define("Proteus.view.LoginViewModel", {
  extend: "Ext.app.ViewModel",
  alias: "viewmodel.login",

  data: {
    loading: false,
  },

  stores: {
    Environments: {
      autoLoad: false,
      fields: ["id", "env"],
      sorters: ["id"],
      proxy: {
        type: "ajax",
        url: "data/environments.json",
        reader: {
          type: "json",
          rootProperty: "environments",
        },
      },
      listeners: {
        beforeload: function (store) {
          if (store.isLoaded() && store.count() > 0) {
            return false;
          }
        },
      },
    },
  },
});
