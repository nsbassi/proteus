Ext.define("Proteus.util.Client", {
  singleton: true,

  get: function (url, params) {
    return this.request("GET", url, { params });
  },

  post: function (url, jsonData) {
    return this.request("POST", url, { jsonData });
  },

  request: function (method, url, options) {
    return new Promise((resolve, reject) => {
      Ext.Ajax.request({
        url: url,
        method: method,
        ...options,
        timeout: 600000,
        success: function (response) {
          const responseData = Ext.decode(response.responseText);
          resolve({ data: responseData, status: response.status });
        },
        failure: function (response) {
          if (response.status === 401) {
            Ext.Msg.alert(
              "Invalid Session",
              "Your session has expired.",
              function () {
                sessionStorage.removeItem("_proteus_loggged_in_");
                Ext.Viewport.removeAll(true, true);
                Ext.create("Proteus.view.Login", { fullscreen: true });
              }
            );
          }
          reject({
            status: response.status,
            message: response.statusText,
            error: response.responseText,
          });
        },
      });
    });
  },
});
