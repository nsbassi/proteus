Ext.Loader.setConfig({
  enabled: true,
  paths: {
    Proteus: "/static/app",
  },
});

Ext.application({
  requires: ["Ext.state.Provider", "Ext.state.*"],
  views: ["Main"],

  name: "Proteus",

  launch: async function () {
    const loggedIn = sessionStorage.getItem("_proteus_loggged_in_");

    if (loggedIn) {
      try {
        const response = await Ext.Ajax.request({
          url: Proteus.util.Client.buildURL("/restoreSession"),
          method: "GET",
        });

        if (response.status === 200) {
          return this.initApp(Ext.decode(response.responseText));
        } else {
          throw new Error("Invalid session");
        }
      } catch (error) {
        if (error.status === 401) {
          Ext.Msg.alert("Invalid Session", "Your session is invalid. Please log in again.", () => {
            sessionStorage.removeItem("_proteus_loggged_in_");
            location.reload();
          });
        } else {
          return this.initLogin();
        }
      }
    } else {
      return this.initLogin();
    }
  },

  initLogin: function () {
    sessionStorage.removeItem("_proteus_loggged_in_");
    return Ext.create("Proteus.view.Login", {
      fullscreen: true,
    });
  },

  initApp: function (data) {
    return Ext.create("Proteus.view.Main", {
      viewModel: {
        data: {
          env: data.env,
          osuser: data.osuser,
          gituser: data.gituser,
          logs: [
            {
              id: Ext.id(),
              msg: `Successfully connected to ${data.env.name} environment.`,
              type: "info",
              details: `Welcome ${data.gituser}! You are now connected to the ${data.env.name} environment.`,
            },
          ],
        },
      },
      fullscreen: true,
    });
  },
});
