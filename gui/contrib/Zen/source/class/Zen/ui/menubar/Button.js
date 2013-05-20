qx.Class.define("Zen.ui.menubar.Button", {

    extend : qx.ui.menubar.Button,

    construct:function(label, icon, menu) {

    	this.base(arguments, label, icon, menu);

        var e = label.match(/\_(.)/);
        if (!e||!e[1]) return;

        label = label.replace(/\_(.)/, '<u>$1</u>');

        var labelWidget = this.getChildControl("label", true);
        labelWidget.setRich(true);
        labelWidget.setValue(label);

        var key = e[1];

        this.__menuCmd = new qx.ui.core.Command(this.__menuKey+'+'+key);
        this.__menuCmd.addListener("execute", this.__onMenuKey, this);
    },

    members:{

        __menuCmd:null,

        __menuKey:'ALT',

        __onMenuKey:function() {
            this.open();
        },

        setMenuKey:function(key) {
            this.__menuKey = key;
        }

    }
});

