 qx.Class.define("EP.app.folder.Page", {

    extend : qx.ui.tabview.Page,

    events : {
    	jobMessage: "qx.event.type.Data"
    },

    construct : function(workspaceData,tabViewer) {

        this.base(arguments,workspaceData.name||'Empty title');

        this.set({
            layout:new qx.ui.layout.VBox(5),
            showCloseButton:true,
            margin:0,
            padding:5
        });

        // menu no longer used for the moment
        // var menu = this.__menu = new EP.app.folder.Menu();

        var tree = this.__tree = new EP.app.folder.Tree(workspaceData);
        var table = this.__table = new EP.app.folder.Table(workspaceData,tree);

        var container = new qx.ui.splitpane.Pane("horizontal");
        container.add(tree);
        container.add(table,3);

        this.add(container,{flex:6});

        this.__button = this.getChildControl('button');
        this.__button.addListener('contextmenu',this.__onContextMenu,this);

        this.__workspaceData = workspaceData;
        this.__tabViewer = tabViewer;

    },

    members : {
        __onContextMenu:function(ev) {
            var contextMenu = new qx.ui.menu.Menu();

            //var menuRename = new qx.ui.menu.Button("Edit",'EP/rename.png');
            //menuRename.addListener('execute',this.__onMenuRename,this);

            var menuDelete = new qx.ui.menu.Button("Delete",'EP/delete.gif');
            menuDelete.addListener('execute',this.__onMenuDelete,this);

            //contextMenu.add(menuRename);
            contextMenu.add(menuDelete);

            contextMenu.placeToMouse(ev);
            contextMenu.show();

            contextMenu.addListenerOnce("disappear", function(e) {
                contextMenu.getChildren().forEach(function(m) {
                    m.dispose();
                });
                contextMenu.dispose();
            });

            return true;
        },

        __onMenuDelete:function() {
            new EP.app.util.Xhr('workspace/mines/delete',{_id:this.__workspaceData._id},function(err,r) {
                this.__tabViewer.setSelection(0);
                this.destroy();
            },this).send();
        },

        __onMenuRename:function() {

        }
    }
});
