Ext.define("Proteus.view.LoginController", {
  extend: "Ext.app.ViewController",
  alias: "controller.login",

  onLogin: function (btn) {
    var me = this,
      errorCmp = me.lookup("formLoginFailure"),
      form = me.lookup("formLogin"),
      view = me.getView(),
      vm = me.getViewModel(),
      errors = [],
      data = {
        errors: errors,
      };

    vm.set("loading", true);
    if (form.validate()) {
      var values = form.getValues();
      Ext.Ajax.request({
        url: "http://127.0.0.1:5000/login",
        method: "POST",
        jsonData: values,
        timeout: 60000,
        success: function (response) {
          sessionStorage.setItem("_proteus_loggged_in_", true);
          var responseData = Ext.decode(response.responseText);

          view.destroy();

          return Ext.create("Proteus.view.Main", {
            viewModel: {
              data: {
                environment: values.environment.name || "xxxx",
                nodes: values.environment.nodes || [],
                gittoken: values.token || "xxxx",
                osuser: values.username || "xxxx",
                ospassword: values.password || "xxxx",
                gituser: responseData.user || "xxxx",
                sudouser: values.environment.sudoUser || "xxxx",
              },
            },
            fullscreen: true,
          });
        },
        failure: function () {
          sessionStorage.removeItem("_proteus_loggged_in_");
          Ext.Msg.alert(
            "Login Failure",
            "The username/password provided is invalid."
          );
          vm.set("loading", false);
        },
      });
    } else {
      sessionStorage.removeItem("_proteus_loggged_in_");
      Ext.Msg.alert(
        "Login Failure",
        "The username/password provided is invalid."
      );

      form.getFields(false).forEach(function (field) {
        var error;

        if (!field.validate() && (error = field.getError())) {
          errors.push({
            errors: error,
            name: field.getLabel(),
          });
        }
      });
      vm.set("loading", false);
    }
  },
});
