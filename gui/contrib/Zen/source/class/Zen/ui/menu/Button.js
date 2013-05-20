qx.Class.define("Zen.ui.menu.Button", {

    extend : qx.ui.menu.Button,

    construct:function(label, icon, command, menu, menuOpener) {

    	this.base(arguments, label, icon, command, menu);

        var e = label.match(/\_(.)/);
        if (e && e[1]) {
            label = label.replace(/\_(.)/, '<u>$1</u>');
            var key = e[1];
        }

        var labelWidget = this.getChildControl("label", true);
        labelWidget.setRich(true);
        labelWidget.setValue(label);

        if (!key) return;
        this.__menuCmd = new qx.ui.core.Command(this.__menuKey+'+'+key);
        //console.log('Adding shortcut '+this.__menuKey+'+'+key);
        this.__menuCmd.addListener("execute", this.__onCmd, this);

        this.__menuOpener = menuOpener;
        this.__menuCmdShortcut = new qx.ui.core.Command(key);
        this.__menuCmdShortcut.addListener("execute", this.__onCmdShorcut,this);
        this.__menuCmdShortcut.setEnabled(false);

        this.__menuOpener.addListener('appear',function() {
            if (!this.__menuCmdShortcut.getEnabled()) {
                this.__menuCmdShortcut.setEnabled(true);
            }
        },this);

        this.__menuOpener.addListener('disappear',function() {
            if (this.__menuCmdShortcut.getEnabled()) {
                this.__menuCmdShortcut.setEnabled(false);
            }            
        },this);        
    },

    members:{

        __menuCmd:null,
        __menuCmdShortcut:null,

        __menuKey:'ALT',

        __onCmdShorcut:function(ev) {
            if (this.__menuOpener.getOpener().getMenu().getVisibility() == 'visible') {
                this.fireEvent('execute',ev);
                if (!this.getMenu()) {
                    this.__menuOpener.getOpener().getMenu().hide();
                } else {
                    this.getMenu().open();
                }
            }
        },

        __onCmd:function(ev) {
            if (this.getMenu()&&this.__menuOpener.getOpener()) {
                this.__menuOpener.getOpener().open();
                qx.lang.Function.delay(this.getMenu().open,10,this.getMenu());
            }
            this.fireEvent('execute',ev);
        },

        setMenuKey:function(key) {
            this.__menuKey = key;
        }

    }
});

