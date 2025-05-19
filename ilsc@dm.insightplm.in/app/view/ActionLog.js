Ext.define("Proteus.view.ActionLog", {
  extend: "Ext.Component",
  alias: "widget.actionLog",

  config: {
    items: [],
  },

  tpl: [
    '<tpl for="items">',
    '<div class="action-log">',
    '  <div class="log-entry">',
    '    <div class="icon-container">',
    '      <tpl if="values.details">',
    '        <span class="fa toggle-details fa-plus" data-index="{[xindex - 1]}" onclick="Proteus.view.ActionLog.toggleDetails(event)"></span>',
    "      <tpl else>",
    '        <span class="fa toggle-details fa-plus" style="color: #f5f5f5"></span>',
    "      </tpl>",
    "      <span class=\"fa {[this.getIconClass(values.type || 'info')]}\"></span>",
    "    </div>",
    '    <div class="message">{msg}</div>',
    "  </div>",
    '  <tpl if="values.details">',
    '    <pre class="details hidden">{details}</pre>',
    "  </tpl>",
    "</div>",
    "</tpl>",
    {
      getIconClass: function (type) {
        if (type) {
          switch (type) {
            case "success":
              return "fa-check-circle icon success";
            case "info":
              return "fa-info-circle icon info";
            case "warning":
              return "fa-exclamation-triangle icon warning";
            case "error":
              return "fa-times-circle icon danger";
            case "pending":
              return "fa-hourglass-half icon info";
            default:
              return "fa-question-circle icon muted";
          }
        } else return "fa-question-circle icon muted";
      },
    },
  ],

  updateItems: function (newItems) {
    this.setData({ items: newItems });
  },

  statics: {
    toggleDetails: function (event) {
      const target = event.currentTarget;

      const logEntry = target.closest(".log-entry");
      if (!logEntry) return;

      const detailsElement = logEntry.nextElementSibling;

      if (detailsElement && detailsElement.classList.contains("details")) {
        detailsElement.classList.toggle("hidden");
        target.classList.toggle("fa-plus");
        target.classList.toggle("fa-minus");
      }
    },
  },
});
