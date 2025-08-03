Ext.define("Proteus.view.Login", {
  extend: "Ext.Container",
  xtype: "login",
  alias: "widget.login",
  controller: "login",

  autoSize: true,
  requires: ["Proteus.view.LoginController", "Proteus.view.LoginViewModel"],

  viewModel: {
    type: "login",
  },

  layout: "center",
  scrollable: "y",

  items: [
    {
      xtype: "formpanel",
      width: 340,
      reference: "formLogin",
      layout: {
        type: "vbox",
        align: "middle",
      },
      bodyPadding: 30,

      bind: {
        disabled: "{loading}",
      },
      defaults: {
        labelTextAlign: 'right',
        labelWidth: 150,
        width: 330
      }
      items: [
        {
          xtype: "component",
          height: 27,
          html: "Login",
          style: {
            "font-size": "20px",
            "text-align": "center",
            margin: "auto",
          },
        },
        {
          xtype: "component",
          reference: "formLoginFailure",
          tpl:
            '<tpl if="errors.length">' +
            '<span class="x-fa fa-exclamation-circle" style="color: red;">' +
            " Login Failure</span>" +
            "</tpl>",
          height: 26,
          style: {
            "font-size": "20px",
            "text-align": "center",
            margin: "auto",
          },
        },
        {
          xtype: "textfield",
          validateOnInit: false,
          required: true,
          label: "Linux OS User",
          name: "username",
          placeholder: "OS username",
          errorTarget: "side",
          style: {
            margin: "auto",
          },
        },
        {
          xtype: "passwordfield",
          validateOnInit: false,
          required: true,
          label: "Password",
          name: "password",
          placeholder: "Password",
          errorTarget: "side",
          style: {
            margin: "auto",
          },
        },
        {
          xtype: "passwordfield",
          validateOnInit: false,
          required: true,
          label: "GitHub Token",
          name: "token",
          placeholder: "Auth Token",
          errorTarget: "side",
          style: {
            margin: "auto",
          },
        },
        {
          xtype: "combobox",
          validateOnInit: false,
          required: true,
          label: "Target Environment",
          name: "environment",
          placeholder: "Environment QA/Prod",
          errorTarget: "side",
          bind: {
            store: "{Environments}",
          },
          displayField: "id",
          valueField: "env",
          value: "PFT",
          forceSelection: true,
        },
        {
          xtype: "button",
          cls: "p-button",
          text: "LOG IN",
          autoSize: true,
          handler: "onLogin",
          ui: "action",
          margin: "30 0 0 0",
          bind: {
            disabled: "{loading}",
          },
          style: {
            "text-align": "center",
            "letter-spacing": "1.25px",
            "font-size": "14px",
          },
        },
        {
          xtype: "image",
          src: "resources/images/1496.gif",
          margin: "10 0 0 0",
          bind: {
            hidden: "{!loading}",
          },
          width: 40,
          height: 40,
        },
      ],
    },
  ],
});
