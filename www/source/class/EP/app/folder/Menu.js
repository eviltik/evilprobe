qx.Class.define("EP.app.folder.Menu", {

    extend : qx.ui.menubar.MenuBar,

    construct:function() {
        this.base(arguments);
        this.set({height:32})
        this.add(this.__getMenuWorkspace());
    },

    members: {

        __workspaceMenu:null,
        __workspaceMenuBtNew:null,
        __workspaceMenuBtOpen:null,
        __workspaceMenuBtRecents:null,
        __helpMenu:null,
        __preferenceMenu:null,


        __getMenuWorkspace:function() {
            var m = new Zen.ui.menubar.Button('Bla',null,this.__getMenuWorkspaceItems());
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