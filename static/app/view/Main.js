Ext.define("Proteus.view.Main", {
  extend: "Ext.Panel",
  alias: "widget.main",

  requires: [
    "Proteus.view.MainController",
    "Proteus.view.MainViewModel",
    "Proteus.view.Login",
    "Proteus.view.ReleaseDetails",
    "Proteus.view.ActionLog",
    "Proteus.util.Client",
  ],

  viewModel: {
    type: "main",
  },
  scrollable: true,
  flex: 1,
  controller: "main",
  id: "main",
  reference: "mainpanel",
  layout: "hbox",
  title: "Biogen PLM Change request Deployment",
  header: {
    style: {
      "background-color": "black",
    },
  },
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
      layout: "vbox",
      flex: 1.5,
      scrollable: true,
      items: [
        {
          xtype: "container",
          layout: "center",
          tpl: new Ext.XTemplate(
            '<div class="copy-container" style="margin: 20px 0 10px 0;">',
            '<div class="copy-content">',
            "<strong>Environment: </strong> <em>{environment}</em><br>",
            '<tpl for="nodes">',
            "<strong>{name}: </strong> <em>{ip}</em><br>",
            "</tpl>",
            "<strong>Privileged User: </strong> <em>{sudouser}</em><br>",
            "<strong>GitHub User: </strong> <em>{gituser}</em>",
            "</div>",
            '<span class="fa fa-copy copy-icon" title="Copy"></span>',
            "</div>"
          ),
          bind: {
            data: {
              environment: "{env.name}",
              nodes: "{env.nodes}",
              osuser: "{osuser}",
              gituser: "{gituser}",
              sudouser: "{env.sudoUser}",
            },
          },
          listeners: {
            initialize: "addCopyIcon",
          },
        },
        {
          xtype: "release",
          id: "releasePanel",
          reference: "release",
        },
      ],
    },
    {
      xtype: "panel",
      flex: 1,
      scrollable: true,
      title: {
        text: "Action Log",
        style: {
          "font-size": "14px",
          "font-weight": "bold",
          "font-style": "italic",
        },
      },
      header: {
        style: {
          "font-size": "14px",
          "font-weight": "bold",
          "font-style": "italic",
          "background-color": "grey",
        },
      },
      layout: "vbox",
      bodyPadding: 10,
      bodyStyle: {
        backgroundColor: "#f5f5f5",
      },
      items: [
        {
          xtype: "actionLog",
          id: "actionLog",
          reference: "actionLog",
          items: [],
          bind: { items: "{logs}" },
        },
      ],
    },
  ],
});
