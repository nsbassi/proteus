Ext.define("Proteus.view.ReleaseDetailsController", {
  extend: "Ext.app.ViewController",
  alias: "controller.release",

  initViewModel: async function (vm) {
    const vmMain = Ext.getCmp("main").getViewModel(),
      envName = vmMain.get("environment");

    vm.set("gittoken", vmMain.get("gittoken"));
    vm.set(
      "env",
      envName == "PDV" || envName == "PFT"
        ? "dev"
        : envName == "PQA"
        ? "qa"
        : "master"
    );
  },

  onYearChange: function (cmb, newValue) {
    var me = this,
      vm = me.getViewModel(),
      cmbRel = me.lookup("cmbrelease");

    vm.set("year", newValue);
    cmbRel.clearValue();
  },

  onReleaseChange: function (cmb, newValue) {
    var vm = this.getViewModel();
    vm.set("release", newValue);
  },

  getReleaseDetails: function (btn) {
    var me = this,
      form = me.lookup("formRelease"),
      vm = me.getViewModel(),
      view = me.getView();

    form.disable();

    if (form.validate()) {
      var values = form.getValues();

      Ext.Ajax.request({
        url: "http://127.0.0.1:5000/getReleaseDetails",
        method: "POST",
        jsonData: {
          token: vm.get("gittoken"),
          env: vm.get("env"),
          year: values.year,
          release: values.release,
        },
        timeout: 60000,
        success: function (response) {
          const result = Ext.decode(response.responseText),
            acpCon = me.lookupReference("configTransfer"),
            fileCon = me.lookupReference("fileTransfer");

          vm.set("acp", result.acp || false);
          vm.set("fileTp", result.iq || false);
        },
        failure: function () {
          Ext.Msg.alert("Error", "Failed to get release details.");
        },
        callback: function () {
          form.enable();
        },
      });
    } else {
      sessionStorage.removeItem("_proteus_loggged_in_");
      Ext.Msg.alert("Error", "Failed to get release details.");

      form.getFields(false).forEach(function (field) {
        var error;

        if (!field.validate() && (error = field.getError())) {
          errors.push({
            errors: error,
            name: field.getLabel(),
          });
        }
      });
      form.enable();
    }
  },

  performConfigurationTransfer: function (btn) {
    var me = this,
      form = me.lookup("formRelease"),
      vm = me.getViewModel(),
      vmMain = Ext.getCmp("main").getViewModel(),
      view = me.getView();

    form.disable();

    if (form.validate()) {
      var values = form.getValues();

      Ext.Ajax.request({
        url: "http://127.0.0.1:5000/runACP",
        method: "POST",
        jsonData: {
          token: vm.get("gittoken"),
          env: vm.get("env"),
          nodes: vmMain.get("nodes"),
          username: vmMain.get("osuser"),
          password: vmMain.get("ospassword"),
          sudoUser: vmMain.get("sudoUser"),
          year: values.year,
          release: values.release,
          fromEnv: values.fromEnv,
          deepCompare: values.deepCompare,
        },
        timeout: 60000,
        success: function (response) {
          const result = Ext.decode(response.responseText),
            acpCon = me.lookupReference("configTransfer"),
            fileCon = me.lookupReference("fileTransfer");

          vm.set("acp", result.acp || false);
          vm.set("fileTp", result.iq || false);
        },
        failure: function () {
          Ext.Msg.alert("Error", "Failed to get release details.");
        },
        callback: function () {
          form.enable();
        },
      });
    } else {
      sessionStorage.removeItem("_proteus_loggged_in_");
      Ext.Msg.alert("Error", "Failed to get release details.");

      form.getFields(false).forEach(function (field) {
        var error;

        if (!field.validate() && (error = field.getError())) {
          errors.push({
            errors: error,
            name: field.getLabel(),
          });
        }
      });
      form.enable();
    }
  },

  performFileTransfer: function (btn) {
    // Implement the logic for file transfer
  },
});
