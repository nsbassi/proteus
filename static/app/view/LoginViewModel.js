Ext.define("Proteus.view.LoginViewModel", {
  extend: "Ext.app.ViewModel",
  alias: "viewmodel.login",

  data: {
    loading: false,
  },

  stores: {
    Environments: {
      autoLoad: true,
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
    },
  },
});
