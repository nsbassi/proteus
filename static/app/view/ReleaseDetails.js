Ext.define("Proteus.view.ReleaseDetails", {
  extend: "Ext.Container",
  xtype: "release",
  alias: "widget.release",

  requires: [
    "Proteus.view.ReleaseDetailsViewModel",
    "Proteus.view.ReleaseDetailsController",
  ],

  controller: "release",

  viewModel: {
    type: "release",
  },

  autoSize: true,

  layout: "center",
  scrollable: "y",

  items: [
    {
      xtype: "formpanel",
      reference: "formRelease",
      layout: "vbox",
      bodyPadding: 30,

      items: [
        {
          xtype: "fieldset",
          title: {
            title: "Release Details",
            style: "font-size: 16px;font-weight: bold;",
          },
          reference: "releaseDetails",
          layout: "hbox",
          items: [
            {
              xtype: "combobox",
              reference: "cmbyear",
              allowBlank: false,
              required: true,
              label: "Year",
              name: "year",
              placeholder: "Year",
              errorTarget: "side",
              bind: {
                store: "{years}",
              },
              displayField: "id",
              valueField: "id",
              forceSelection: true,
              listeners: {
                change: "onYearChange",
              },
            },
            {
              xtype: "combobox",
              margin: "0 0 0 20",
              reference: "cmbrelease",
              allowBlank: false,
              required: true,
              label: "Release",
              name: "release",
              placeholder: "Release",
              errorTarget: "side",
              bind: {
                store: "{releases}",
              },
              displayField: "id",
              valueField: "id",
              forceSelection: true,
              listeners: {
                change: "onReleaseChange",
              },
            },
            {
              xtype: "button",
              text: "Get Details",
              margin: "0 0 0 10",
              autoSize: true,
              handler: "getReleaseDetails",
              ui: "action",
            },
          ],
        },
        {
          xtype: "fieldset",
          title: {
            title: "Configuration Transfer",
            style: "font-size: 16px;font-weight: bold;",
          },
          reference: "configTransfer",
          layout: "hbox",
          bind: {
            hidden: "{!acp}",
          },
          hidden: true,
          items: [
            {
              xtype: "combobox",
              reference: "cmbFromEnv",
              allowBlank: false,
              required: true,
              label: "Source Environment",
              labelWidth: 150,
              margin: "0 20 0 0",
              name: "fromEnv",
              placeholder: "From",
              errorTarget: "side",
              displayField: "name",
              valueField: "id",
              store: [
                { name: "PDV", id: "pdv" },
                { name: "PFT", id: "pft" },
                { name: "PQA", id: "pqa" },
              ],
              forceSelection: true,
            },
            {
              xtype: "checkbox",
              reference: "deepCompareCheckbox",
              boxLabel: "Perform Deep Compare",
              boxLabelAlign: "before",
            },
            {
              xtype: "button",
              text: "Execute",
              margin: "0 0 0 20",
              autoSize: true,
              handler: "performConfigurationTransfer",
              ui: "action",
            },
          ],
        },
        {
          xtype: "fieldset",
          title: {
            title: "File Transfer",
            style: "font-size: 16px;font-weight: bold;",
          },
          layout: "hbox",
          reference: "fileTransfer",
          hidden: true,
          bind: {
            hidden: "{!fileTp}",
          },
          items: [
            {
              xtype: "button",
              text: "Transfer Files",
              margin: "0 0 0 10",
              autoSize: true,
              handler: "performFileTransfer",
              ui: "action",
            },
          ],
        },
        {
          xtype: "container",
          reference: "progressContainer",
          layout: "vbox",
          hidden: true,
          items: [],
        },
      ],
    },
  ],
});
