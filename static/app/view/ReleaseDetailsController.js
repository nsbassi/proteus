Ext.define("Proteus.view.ReleaseDetailsController", {
  extend: "Ext.app.ViewController",
  alias: "controller.release",

  onYearChange: function (cmb, newValue) {
    const vm = this.getViewModel(),
      cmbRel = this.lookup("cmbrelease");

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
      vm = me.getViewModel();

    form.disable();
    if (form.validate()) {
      var values = form.getValues();
      Proteus.util.Client.post("/getReleaseDetails", values)
        .then(({ data: result }) => {
          vm.set("acp", result.acp || false);
          vm.set("fileTp", result.iq || false);
        })
        .catch(() => {
          Ext.Msg.alert("Error", "Failed to get release details.");
        })
        .finally(() => {
          form.enable();
        });
    } else {
      Ext.Msg.alert("Error", "Failed to get release details.");
      form.enable();
    }
  },

  onCfgExport: function (btn) {
    const me = this,
      vm = me.getViewModel(),
      form = me.lookup("formRelease");

    if (form.validate()) {
      vm.set("readyForImport", false);
      const values = form.getValues(),
        data = {
          year: values.year,
          release: values.release,
          fromEnv: values.fromEnv.name,
          deepCompare: values.deepCompare,
          fromPass: values.fromPassword,
          toPass: values.toPassword,
          toEnv: values.toEnv,
        };

      form.setMasked({ xtype: "loadmask", cls: "custom-mask", message: "" });
      const id = me.logAction("pending", `Exporting configuration from ${data.fromEnv}`);

      Proteus.util.Client.post("/exportCfg", data)
        .then(({ data: result }) => {
          const msg =
            result.outcome === "success"
              ? `Configuration exported successfully from ${result.fromEnv}`
              : result.outcome === "warning"
              ? `Configuration exported from ${result.fromEnv} with warnings`
              : `Failed to export configuration from ${result.fromEnv}`;

          me.logAction(result.outcome, msg, result.output, id);
          if (result.outcome === "success") {
            vm.set("readyForImport", true);
            if (values.deepCompare == "Yes") me.runCompare(data);
          }
        })
        .catch(({ status: status, message: msg, error: err }) => {
          me.logAction(
            "error",
            `Failed to export configuration from ${data.fromEnv}`,
            `Status: ${status}\nMessage: ${msg}\nError: ${err}`,
            id
          );
        })
        .finally(() => {
          form.setMasked(false);
        });
    } else {
      Ext.Msg.alert("Error", "Invalid form data.");
    }
  },

  runCompare: function (data) {
    const me = this,
      form = me.lookup("formRelease");

    const id = me.logAction(
      "pending",
      `Running deep compare between ${data.fromEnv.toUpperCase()} and ${data.toEnv}`
    );

    Proteus.util.Client.post("/deepCmp", data)
      .then(({ data: result }) => {
        const msg =
          result.outcome === "success"
            ? `Comparison completed between ${result.fromEnv} and ${result.toEnv}`
            : result.outcome === "warning"
            ? `Comparison completed with warnings between ${result.fromEnv} and ${result.toEnv}`
            : `Failed to compare configuration between ${result.fromEnv} and ${result.toEnv}`;

        me.logAction(result.outcome, msg, result.output, id);
      })
      .catch(({ status: status, message: msg, error: err }) => {
        me.logAction(
          "error",
          `Failed to compare configuration between environments.`,
          `Status: ${status}\nMessage: ${msg}\nError: ${err}`,
          id
        );
      })
      .finally(() => {
        form.setMasked(false);
      });
  },

  onCfgImport: function (btn) {
    const me = this,
      vm = me.getViewModel(),
      form = me.lookup("formRelease");

    if (form.validate()) {
      var values = form.getValues(),
        data = {
          year: values.year,
          release: values.release,
          fromEnv: values.fromEnv.name,
          toPass: values.toPassword,
          toEnv: values.toEnv,
        };

      form.setMasked({ xtype: "loadmask", cls: "custom-mask", message: "" });
      const id = me.logAction(
        "pending",
        `Importing configuration from ${data.fromEnv} to ${data.toEnv}`
      );

      Proteus.util.Client.post("/importCfg", data)
        .then(({ data: result }) => {
          const msg =
            result.outcome === "success"
              ? `Configuration imported successfully to ${data.toEnv}`
              : result.outcome === "warning"
              ? `Configuration imported to ${data.toEnv} with warnings`
              : `Failed to import configuration to ${data.toEnv}`;

          me.logAction(result.outcome, msg, result.output, id);
          if (result.outcome === "success") vm.set("importCompleted", true);
        })
        .catch(({ status: status, message: msg, error: err }) => {
          me.logAction(
            "error",
            `Failed to import configuration to ${data.toEnv}`,
            `Status: ${status}\nMessage: ${msg}\nError: ${err}`,
            id
          );
        })
        .finally(() => {
          form.setMasked(false);
        });
    } else {
      Ext.Msg.alert("Error", "Invalid form data.");
    }
  },

  performFileTransfer: function (btn) {
    const me = this,
      vmMain = Ext.getCmp("main").getViewModel(),
      form = me.lookup("formRelease"),
      values = form.getValues(),
      data = {
        year: values.year,
        release: values.release,
        wbUser: values.wlUser,
        wbPass: values.wlPassword,
      };

    const idSetup = me.logAction(
      "pending",
      `Performing file deployment setup for ${data.release} release`
    );
    Proteus.util.Client.post("/setupFileIQ", data).then(({ data: result }) => {
      if (result.outcome === "success") {
        me.logAction(
          result.outcome,
          `File deployment setup completed for ${data.release} release`,
          result.output,
          idSetup
        );
        vmMain.get("env").nodes.forEach((node) => {
          const id = me.logAction(
            "pending",
            `Starting file deployment on ${node.name}(${node.ip})`
          );
          data.node = node;
          Proteus.util.Client.post("/deployFiles", data)
            .then(({ data: result }) => {
              const msg =
                result.outcome === "success"
                  ? `File deployment completed successfully on ${node.name}(${node.ip}).`
                  : `File deployment failed on ${node.name}(${node.ip}).`;
              me.logAction(result.outcome, msg, result.output, id);
            })
            .catch(({ status: status, message: msg, error: err }) => {
              me.logAction(
                "error",
                `File deployment failed on ${node.name}(${node.ip}).`,
                `Status: ${status}\nMessage: ${msg}\nError: ${err}`,
                id
              );
            })
            .finally(() => {
              // Optional: Add any finalization logic here
            });
        });
      } else {
        me.logAction(
          result.outcome,
          `File deployment setup failed for ${data.release} release`,
          result.output,
          idSetup
        );
      }
    });
  },

  restartNodes: function (btn) {
    const me = this,
      vmMain = Ext.getCmp("main").getViewModel();

    vmMain.get("env").nodes.forEach((node) => {
      const id = me.logAction(
        "pending",
        `Stopping Agile Managed Server on ${node.name}(${node.ip})`
      );
      Proteus.util.Client.post("/stopNode", node)
        .then(({ data: result }) => {
          const msg =
            result.outcome === "success"
              ? `Stopped Agile Managed Server on ${node.name}(${node.ip}) successfully`
              : `Failed to stop Agile Managed Server on ${node.name}(${node.ip})`;
          me.logAction(result.outcome, msg, result.output, id);
          if (result.outcome === "success") {
            const id1 = me.logAction(
              "pending",
              `Starting Agile Managed Server on ${node.name}(${node.ip})`
            );
            Proteus.util.Client.post("/startNode", node)
              .then(({ data: result }) => {
                const msg1 =
                  result.outcome === "success"
                    ? `Started Agile Managed Server on ${node.name}(${node.ip}) successfully`
                    : `Failed to start Agile Managed Server on ${node.name}(${node.ip})`;

                me.logAction(result.outcome, msg1, result.output, id1);

                if (result.outcome === "success" && node.isWFHost) {
                  me.startWebforms();
                }
              })
              .catch(({ status: status, message: msg, error: err }) => {
                me.logAction(
                  "error",
                  `Failed to start Agile Managed Server on ${node.name}(${node.ip})`,
                  `Status: ${status}\nMessage: ${msg}\nError: ${err}`,
                  id1
                );
              });
          }
        })
        .catch(({ status: status, message: msg, error: err }) => {
          me.logAction(
            "error",
            `Failed to stop Agile Managed Server on ${node.name}(${node.ip})`,
            `Status: ${status}\nMessage: ${msg}\nError: ${err}`,
            id
          );
        })
        .finally(() => {
          // Optional: Add any finalization logic here
        });
    });
  },

  startWebforms: function () {
    console.log("Starting Webforms...");
  },

  logAction: function (type, msg, details, id) {
    const vmMain = Ext.getCmp("main").getViewModel(),
      logs = vmMain.get("logs"),
      log = { id: id || Ext.id(), msg: msg, type: type };

    if (details) log.details = details;

    const index = logs.findIndex((log) => log.id === id);
    if (index !== -1) {
      logs[index] = log;
    } else {
      logs.push(log);
    }
    vmMain.set("logs", logs);

    Ext.getCmp("actionLog").updateItems(logs);

    return log.id;
  },
});
