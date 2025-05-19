Ext.define("Proteus.view.ReleaseDetailsViewModel", {
  extend: "Ext.app.ViewModel",
  alias: "viewmodel.release",
  data: {
    acp: false,
    fileTp: false,
    lastLoadedYear: null,
    readyForImport: false,
    importCompleted: false,
  },
  stores: {
    envs: {
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
    years: {
      fields: ["id"],
      proxy: {
        type: "ajax",
        url: "/getYears",
        reader: {
          type: "json",
          rootProperty: "",
        },
        listeners: {
          exception: function (proxy, response, operation) {
            Ext.Msg.alert("Error", "Failed to fetch list of years from Github.");
          },
        },
      },
      autoLoad: false,
      listeners: {
        beforeload: function (store) {
          if (store.isLoaded() && store.count() > 0) {
            return false;
          }
        },
      },
    },
    releases: {
      fields: ["id"],
      proxy: {
        type: "ajax",
        url: "/getReleases",
        reader: {
          type: "json",
          rootProperty: "",
        },
        extraParams: {
          year: "{year}",
        },
        listeners: {
          exception: function (proxy, response, operation) {
            Ext.Msg.alert("Error", "Failed to fetch list of releases from Github.");
          },
        },
      },
      autoLoad: false,
      listeners: {
        beforeload: function (store) {
          var vm = Ext.ComponentQuery.query("release")[0]?.getViewModel();
          if (vm && vm.get("lastLoadedYear") === vm.get("year") && store.count() > 0) {
            return false;
          }
          vm?.set("lastLoadedYear", vm.get("year"));
          return true;
        },
      },
    },
  },
});
