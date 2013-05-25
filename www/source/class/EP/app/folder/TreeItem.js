qx.Class.define("EP.app.folder.TreeItem", {
  extend : qx.ui.tree.VirtualTreeItem,

  properties : {
    resume : {
      check:'String',
      event:'changeResume',
      nullable:true
    }
  },

  members : {

    _addWidgets : function() {

      this.addSpacer();
      this.addOpenButton();

      this.addIcon();

      // The label
      this.addLabel()
      this.getChildControl("label").setWidth(200);

      // All else should be right justified
      this.addWidget(new qx.ui.core.Spacer(20));

      var text = this.__size = new qx.ui.basic.Label();
      this.bind("resume", text, "value");
      this.addWidget(text);

    }
  }
});
