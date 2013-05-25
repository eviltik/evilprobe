qx.Class.define("EP.app.folder.TreeItem", {
  extend : qx.ui.tree.VirtualTreeItem,

  properties : {
    resume : {
      check:'String',
      event:'changeResume',
      nullable:true
    }
    /*
    leadIcon : {
      check : "String",
      event: "changeLeadIcon",
      nullable : true
    },
    checked : {
      check : "Boolean",
      event: "changeChecked",
      nullable : true
    },
    size : {
      check : "String",
      event: "changeSize",
      nullable : true
    },
    date : {
      check : "String",
      event: "changeDate",
      nullable : true
    },
    mode : {
      check : "String",
      event: "changeMode",
      nullable : true
    }
    */
  },

  members : {
    __leadIcon : null,
    __checkbox : null,
    __size : null,
    __date : null,
    __mode : null,

    /* override */
    addLabelx : function(text) {

      var label = this.getChildControl("label");

      if (this.__labelAdded) {
        this._remove(label);
      }

      if (text) {
        this.setLabel(text);
      } else {
        label.setValue('bla');
      }

      label.setWidth(200);

      this._add(label);
      this.__labelAdded = true;
    },

    _addWidgets : function() {
      /*
      var leadIcon = this.__leadIcon = new qx.ui.basic.Image();
      this.bind("leadIcon", leadIcon, "source");
      leadIcon.setWidth(16);
      this.addWidget(leadIcon);
      */

      // Here's our indentation and tree-lines
      this.addSpacer();
      this.addOpenButton();

      // The standard tree icon follows
      this.addIcon();
      //this.setIcon("icon/16/places/user-desktop.png");

      /*
      // A checkbox comes right after the tree icon
      var checkbox = this.__checkbox = new qx.ui.form.CheckBox();
      this.bind("checked", checkbox, "value");
      checkbox.bind("value", this, "checked");
      checkbox.setFocusable(false);
      checkbox.setTriState(true);
      checkbox.setMarginRight(4);
      this.addWidget(checkbox);
      */

      // The label
      this.addLabelx();

      // All else should be right justified
      this.addWidget(new qx.ui.core.Spacer(20));
      //this.addWidget(new qx.ui.core.Spacer(20), {flex: 1});

      var text = this.__size = new qx.ui.basic.Label();
      this.bind("resume", text, "value");
      //text.setWidth(500);
      this.addWidget(text);

      /*
      text = this.__date = new qx.ui.basic.Label();
      this.bind("date", text, "value");
      text.setWidth(150);
      this.addWidget(text);

      text = this.__mode = new qx.ui.basic.Label();
      this.bind("mode", text, "value");
      text.setWidth(80);
      this.addWidget(text);
      */
    }
  }
});
