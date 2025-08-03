Ext.define("Proteus.view.MainController", {
  extend: "Ext.app.ViewController",
  alias: "controller.main",

  onLogout: function () {
    sessionStorage.removeItem("_proteus_loggged_in_");
    this.getView().destroy();
    return Ext.create("Proteus.view.Login", {
      fullscreen: true,
    });
  },

  downloadFile: function (fileName) {
    const release = Ext.getCmp("releasePanel").getViewModel().get("release");
    const link = document.createElement("a");
    link.href =
      Proteus.util.Client.buildURL("/downloadFile") +
      "?release=" +
      release +
      "&filename=" +
      fileName;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  createNode: function (text) {
    const node = document.createElement("pre");
    node.style.width = "1px";
    node.style.height = "1px";
    node.style.position = "fixed";
    node.style.top = "5px";
    node.textContent = text;
    return node;
  },

  copyNode: function copyNode(node) {
    if ("clipboard" in navigator) {
      return navigator.clipboard.writeText(node.textContent || "");
    }

    const selection = getSelection();
    if (selection == null) {
      return Promise.reject(new Error());
    }

    selection.removeAllRanges();

    const range = document.createRange();
    range.selectNodeContents(node);
    selection.addRange(range);

    document.execCommand("copy");
    selection.removeAllRanges();
    return Promise.resolve();
  },

  copyText: function (text) {
    if ("clipboard" in navigator) {
      return navigator.clipboard.writeText(text);
    }

    const body = document.body;
    if (!body) {
      return Promise.reject(new Error());
    }

    const node = this.createNode(text);
    body.appendChild(node);
    this.copyNode(node);
    body.removeChild(node);
    return Promise.resolve();
  },

  addCopyIcon: function (cmp) {
    const me = this;
    cmp.el.on("click", function (e, t) {
      if (t.classList.contains("copy-icon")) {
        const content = t.parentElement.querySelector(".copy-content");
        if (content) {
          const text = content.innerText;
          me.copyText(text);
          Ext.toast({
            message: "Copied to clipboard",
            align: "t",
            autoClose: true,
            timeout: 2000,
          });
        }
      }
      if (t.classList.contains("save-icon")) {
        me.downloadFile(t.dataset.file);
      }
    });
  },
});
