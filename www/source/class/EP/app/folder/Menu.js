qx.Class.define("EP.app.folder.Menu", {

    extend : qx.ui.menubar.MenuBar,

    construct:function() {

        // menu under each workspace, no longer used atm

        this.base(arguments);
        this.set({height:32,padding:5});
        this.add(this.__getMenuWorkspace());
    },

    members: {

        __workspaceMenu:null,
        __workspaceMenuBtNew:null,
        __workspaceMenuBtOpen:null,
        __workspaceMenuBtRecents:null,
        __helpMenu:null,
        __preferenceMenu:null,
        __windowRandomHost:null,

        __getMenuWorkspace:function() {
            var m = new qx.ui.form.Button('Random hosts');
            m.addListener('execute',function() {
                this.__windowRandomHost.show();
            },this);

            this.__workspaceMenu = m;
            return m;
        },

        __getMenuWorkspaceItems:function() {
            var m = new qx.ui.menu.Menu();

            // Sub menus
            this.__workspaceMenuRecents = new qx.ui.menu.Menu();

            var btNew = new Zen.ui.menu.Button('New',null,null,null,m);
            var btOpen = new Zen.ui.menu.Button('Open',null,null,null,m);

            this.__workspaceMenuBtNew = btNew;
            this.__workspaceMenuBtOpen = btOpen;

            m.add(btNew);
            m.add(btOpen);

            return m;
        }
    }
});
