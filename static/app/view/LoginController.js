Ext.define("Proteus.view.LoginController", {
  extend: "Ext.app.ViewController",
  alias: "controller.login",

  onLogin: function (btn) {
    var me = this,
      form = me.lookup("formLogin"),
      vm = me.getViewModel(),
      errors = [];

    vm.set("loading", true);
    if (form.validate()) {
      const values = form.getValues();
      Proteus.util.Client.post("/login", values)
        .then(({ data: responseData }) => {
          sessionStorage.setItem("_proteus_loggged_in_", true);
          return Proteus.getApplication().initApp({
            env: values.environment,
            osuser: values.username,
            gituser: responseData.user,
          });
        })
        .catch((res) => {
          sessionStorage.removeItem("_proteus_loggged_in_");
          let msg = res.message || "Login failed. Please try again.";
          if (res.error) msg = Ext.decode(res.error).error;
          Ext.Msg.alert("Login Failure", msg);
        })
        .finally(() => {
          vm.set("loading", false);
        });
    } else {
      sessionStorage.removeItem("_proteus_loggged_in_");
      form.getFields(false).forEach(function (field) {
        var error;
        if (!field.validate() && (error = field.getError())) {
          errors.push({ errors: error, name: field.getLabel() });
        }
      });
      vm.set("loading", false);
    }
  },
});
