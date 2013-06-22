qx.Class.define("EP.app.desktop.Menu", {

    extend : qx.ui.menubar.MenuBar,

    construct:function() {

        this.base(arguments);

        this.set({
            height:32,
            margin:2,
            padding:2
        });

        this.add(this.__getMenuWorkspace());
        this.add(this.__getMenuPreferences());
        this.add(this.__getMenuHelp());
        this.add(new qx.ui.toolbar.Separator());
        this.add(this.__getButtonRandomHost());

        qx.event.message.Bus.subscribe('workspaceRecentsReload',this.__workspaceRecentsLoad,this);

        this.__windowRandomHost = new EP.app.popup.randomHost();

    },

    members: {

        __workspaceMenu:null,
        __workspaceMenuBtNew:null,
        __workspaceMenuBtOpen:null,
        __workspaceMenuBtRecents:null,
        __helpMenu:null,
        __preferenceMenu:null,
        __windowRandomHost:null,

        __getButtonRandomHost:function() {
            var m = this.__buttonRandomHost = new qx.ui.form.Button('Random Host');
            m.addListener('execute',function() {
                this.__windowRandomHost.show();
            },this)
            return m;
        },

        __getMenuWorkspace:function() {
            var m = this.__workspaceMenu = new Zen.ui.menubar.Button('_Workspace',null,this.__getMenuWorkspaceItems());
            return m;
        },

        __getMenuPreferences:function() {
            var m = this.__preferenceMenu = new Zen.ui.menubar.Button('_Preferences',null,this.__getMenuPreferencesItems());
            return m;
        },

        __getMenuHelp:function() {
            var m = this.__helpMenu = new Zen.ui.menubar.Button('_Help',null,this.__getMenuHelpItems());
            return m;
        },

        __getMenuWorkspaceItems:function() {
            var m = new qx.ui.menu.Menu();

            // Sub menus
            this.__workspaceMenuRecents = new qx.ui.menu.Menu();

            var btNew = new Zen.ui.menu.Button('_New',null,null,null,m);
            var btOpen = new Zen.ui.menu.Button('_Open',null,null,null,m);
            var btRecents = new Zen.ui.menu.Button('_Recents',null,null,this.__workspaceMenuRecents,m);

            btNew.addListener('execute',this.__onWorkspaceNew);
            btOpen.addListener('execute',this.__onWorkspaceOpen);

            this.__workspaceMenuBtNew = btNew;
            this.__workspaceMenuBtOpen = btOpen;
            this.__workspaceMenuBtRecents = btRecents;

            m.add(btNew);
            m.add(btOpen);
            m.add(btRecents);

            this.__workspaceRecentsLoad();

            return m;
        },

        __getMenuHelpItems:function() {
            var m = new qx.ui.menu.Menu();

            var btRessources = new qx.ui.menu.Button('Ressources');
            btRessources.addListener('execute',this.__onHelpRessources);
            this.__helpMenuBtRessources = btRessources;

            var btAbout = new qx.ui.menu.Button('About');
            btAbout.addListener('execute',this.__onHelpAbout);
            this.__helpMenuBtAbout = btAbout;

            m.add(btRessources);
            //m.add(btAbout);

            return m;
        },

        __getMenuPreferencesItems:function() {
            var m = new qx.ui.menu.Menu();
            var btTheme = new Zen.ui.menu.Button("The_me", "icon/22/apps/utilities-color-chooser.png", null,this.__getThemeMenu(),m);
            m.add(btTheme);
            return m;
        },

        __getThemeMenu:function() {
            var t1 = new qx.ui.menu.RadioButton("Modern Theme");
            var t2 = new qx.ui.menu.RadioButton("Classic Theme");
            var t3 = new qx.ui.menu.RadioButton("Simple Theme");
            var t4 = new qx.ui.menu.RadioButton("Indigo Theme");

            t1.setUserData("value", qx.theme.Modern);
            t1.setValue(true);
            t2.setUserData("value", qx.theme.Classic);
            t3.setUserData("value", qx.theme.Simple);
            t4.setUserData("value", qx.theme.Indigo);

            var group = new qx.ui.form.RadioGroup(t1, t2, t3, t4);
            group.addListener("changeSelection", this.__onChangeTheme, this);

            var themeMenu = new qx.ui.menu.Menu;
            themeMenu.add(t4);
            themeMenu.add(t1);
            themeMenu.add(t2);
            themeMenu.add(t3);

            return themeMenu;
        },

        __onWorkspaceNew:function() {
            new EP.app.popup.workspaceNew();
        },

        __onWorkspaceOpen:function() {
            new EP.app.popup.workspaceOpen();
        },

        __onHelpRessources:function() {
            new EP.app.popup.Help();
        },

        __onHelpAbout:function() {

        },

        __workspaceRecentsLoad:function() {

            // Server side: load array of last opened workspaces

            new EP.app.util.Xhr('workspace/mines/recent',null,function(err,r) {

                this.__workspaceMenuRecents.removeAll();

                if (err) {
                    return new dialog.Dialog.error("Error:<br/>"+err.getStatus()+' '+err.getResponseText());
                }

                if (!r||!r.workspaces||!r.workspaces.length) {
                    // No workspace ..
                    return;
                }

                r.workspaces.forEach(function(o) {
                    var me = new qx.ui.menu.Button(o.name);
                    me.setUserData('workspace',o);
                    me.addListener('execute',this.__onWorkspaceRecent,this);
                    this.__workspaceMenuRecents.add(me);
                },this);

                this.__loaded = true;
            },this).send();
        },

        __onWorkspaceRecent:function(ev) {
            var w = ev.getTarget().getUserData('workspace');
            qx.event.message.Bus.dispatch(new qx.event.message.Message('workspaceSearchAndOpen',w));
        },

        __onChangeTheme:function(ev) {
            var theme = ev.getData()[0].getUserData('value');
            qx.theme.manager.Meta.getInstance().setTheme(theme);
        }
    }
});