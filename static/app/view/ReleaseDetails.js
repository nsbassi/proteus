Ext.define("Proteus.view.ReleaseDetails", {
  extend: "Ext.Container",
  xtype: "release",
  alias: "widget.release",

  requires: ["Proteus.view.ReleaseDetailsViewModel", "Proteus.view.ReleaseDetailsController"],

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
      width: 600,
      items: [
        {
          xtype: "fieldset",
          title: {
            title: "Release Details",
            style: "font-size: 16px;font-weight: bold;",
          },
          reference: "releaseDetails",
          layout: "vbox",
          defaults: {
            labelWidth: 150,
          },
          items: [
            {
              xtype: "combobox",
              reference: "cmbyear",
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
              reference: "cmbrelease",
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
              autoSize: true,
              cls: "p-button",
              handler: "getReleaseDetails",
              ui: "action",
              style: {
                marginLeft: "auto",
                marginTop: "5px",
                width: "110px",
              },
            },
          ],
        },
        {
          xtype: "container",
          layout: "hbox",
          hidden: true,
          bind: {
            hidden: "{!fileTp}",
          },
          items: [
            {
              xtype: "fieldset",
              flex: 1,
              title: {
                title: "File Transfer",
                style: "font-size: 16px;font-weight: bold;",
              },
              layout: "vbox",
              reference: "fileTransfer",
              defaults: {
                labelWidth: 150,
              },
              items: [
                {
                  xtype: "textfield",
                  label: "Weblogic User",
                  name: "wlUser",
                },
                {
                  xtype: "textfield",
                  label: "Weblogic Password",
                  inputType: "password",
                  placeholder: "Weblogic Password",
                  name: "wlPassword",
                },
                {
                  xtype: "button",
                  text: "Transfer",
                  cls: "p-button",
                  handler: "performFileTransfer",
                  ui: "action",
                  style: {
                    marginLeft: "auto",
                    marginTop: "5px",
                    width: "110px",
                  },
                },
              ],
            },
          ],
        },
        {
          xtype: "container",
          layout: "hbox",
          bind: {
            hidden: "{!acp}",
          },
          hidden: true,
          items: [
            {
              xtype: "fieldset",
              flex: 1,
              title: {
                title: "Configuration Transfer",
                style: "font-size: 16px;font-weight: bold;",
              },
              reference: "configTransfer",
              layout: "vbox",
              defaults: {
                labelWidth: 150,
              },
              items: [
                {
                  xtype: "combobox",
                  reference: "cmbFromEnv",
                  required: true,
                  label: "Source Environment",
                  name: "fromEnv",
                  placeholder: "From",
                  errorTarget: "side",
                  displayField: "name",
                  valueField: "id",
                  bind: { store: "{envs}" },
                  displayField: "id",
                  valueField: "env",
                  forceSelection: true,
                },
                {
                  xtype: "textfield",
                  label: "Source Password",
                  inputType: "password",
                  placeholder: "Source Propagation user password",
                  name: "fromPassword",
                },
                {
                  xtype: "selectfield",
                  reference: "deepCompareCombo",
                  allowBlank: false,
                  required: true,
                  label: "Perform Deep Compare",
                  name: "deepCompare",
                  store: [
                    { id: "Yes", name: "Yes" },
                    { id: "No", name: "No" },
                  ],
                  value: "No",
                  displayField: "name",
                  valueField: "id",
                  forceSelection: true,
                },
                {
                  xtype: "textfield",
                  label: "Target Password",
                  inputType: "password",
                  placeholder: "Target Propagation user password",
                  name: "toPassword",
                },
                {
                  xtype: "button",
                  text: "Export",
                  cls: "p-button",
                  handler: "onCfgExport",
                  ui: "action",
                  style: {
                    marginLeft: "auto",
                    marginTop: "5px",
                    marginBottom: "20px",
                    width: "110px",
                  },
                },
                {
                  xtype: "textfield",
                  label: "Target Environment",
                  bind: { value: "{env.name}" },
                  readOnly: true,
                  name: "toEnv",
                },
                {
                  xtype: "button",
                  text: "Import",
                  bind: {
                    disabled: "{!readyForImport}",
                  },
                  cls: "p-button",
                  handler: "onCfgImport",
                  ui: "action",
                  style: {
                    marginLeft: "auto",
                    marginTop: "5px",
                    marginBottom: "20px",
                    width: "110px",
                  },
                },
                {
                  xtype: "button",
                  text: "Restart Nodes",
                  bind: {
                    disabled: "{!importCompleted}",
                  },
                  cls: "p-button",
                  handler: "restartNodes",
                  ui: "action",
                  style: {
                    marginLeft: "auto",
                    marginTop: "5px",
                    width: "110px",
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
});
