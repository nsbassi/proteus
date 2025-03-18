Ext.define("Proteus.view.Main", {
  extend: "Ext.Panel",
  alias: "widget.main",

  requires: [
    "Proteus.view.MainController",
    "Proteus.view.MainViewModel",
    "Proteus.view.Login",
    "Proteus.view.ReleaseDetails",
  ],

  viewModel: {
    type: "main",
  },

  controller: "main",
  id: "main",
  layout: "vbox",
  reference: "mainpanel",
  title: "Biogen PLM Change request Deployment",
  tools: [
    {
      iconCls: "x-fa fa-sign-out-alt",
      tooltip: "Logout",
      handler: "onLogout",
    },
  ],
  items: [
    {
      xtype: "container",
      layout: "center",
      tpl: new Ext.XTemplate(
        '<div style="margin: 20px 0 10px 0">',
        "<strong>Environment: </strong> <em>{environment}</em><br>",
        '<tpl for="nodes">',
        "<strong> {name}: </strong> <em>{ip}</em><br>",
        "</tpl>",
        "<strong> sudo User: </strong> <em>{sudouser}</em>",
        "<strong> GitHub User: </strong> <em>{gituser}</em>",
        "</div>"
      ),
      bind: {
        data: {
          environment: "{environment}",
          nodes: "{nodes}",
          osuser: "{osuser}",
          gituser: "{gituser}",
        },
      },
    },
    {
      xtype: "release",
      reference: "release",
    },
  ],
});
