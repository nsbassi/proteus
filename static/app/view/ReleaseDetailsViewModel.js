Ext.define("Proteus.view.ReleaseDetailsViewModel", {
  extend: "Ext.app.ViewModel",
  alias: "viewmodel.release",
  data: {
    acp: false,
    fileTp: false,
  },
  stores: {
    years: {
      fields: ["id"],
      proxy: {
        type: "ajax",
        actionMethods: {
          read: "POST",
        },
        paramsAsJson: true,
        url: "http://127.0.0.1:5000/getYears",
        reader: {
          type: "json",
          rootProperty: "",
        },
        extraParams: {
          token: "{gittoken}",
          env: "{env}",
        },
      },
      autoLoad: false,
    },
    releases: {
      fields: ["id"],
      proxy: {
        type: "ajax",
        actionMethods: {
          read: "POST",
        },
        paramsAsJson: true,
        url: "http://127.0.0.1:5000/getReleases",
        reader: {
          type: "json",
          rootProperty: "",
        },
        extraParams: {
          token: "{gittoken}",
          env: "{env}",
          year: "{year}",
        },
      },
      autoLoad: false,
    },
  },
});
