qx.Class.define("EP.desktop.favoritesTree", {
    extend : qx.ui.treevirtual.TreeVirtual,
    construct:function() {
        qx.Class.include(qx.ui.treevirtual.TreeVirtual,qx.ui.treevirtual.MNode);
        qx.Class.include(qx.ui.table.Table, qx.ui.table.MTableContextMenu);
        qx.Class.patch(qx.ui.table.pane.Scroller, Zen.ui.EditableTreeVirtual.table.pane.Scroller);
        qx.Class.patch(qx.ui.treevirtual.TreeVirtual, Zen.ui.EditableTreeVirtual.treevirtual.TreeVirtual);
        qx.Class.patch(qx.ui.treevirtual.SimpleTreeDataModel, Zen.ui.EditableTreeVirtual.treevirtual.SimpleTreeDataModel);

        this.base(arguments,['Favorites']);

        this.set({
            alwaysShowOpenCloseSymbol:true,
            statusBarVisible:false
        })

        var resizeBehavior = this.getTableColumnModel().getBehavior();
        resizeBehavior.set(0, { width:"1*", minWidth:180  });

        var dataModel = this.getDataModel();

        var te = dataModel.addBranch(null, "Jobs history", true);

        /*
        var te = dataModel.addBranch(null, "Country", true);
        for (var i = 1; i < 3000; i++) {
            dataModel.addLeaf(te, "Spam Message #" + i);
        };
        */

        dataModel.setColumnEditable(0,true);
        dataModel.setData();
        this.getSelectionModel().setSelectionMode(qx.ui.treevirtual.TreeVirtual.SelectionMode.MULTIPLE_INTERVAL);
        this.addListener('dataEdited',function(a,b) {
            this.__tree.cancelEditing();
            console.log(a);
        },this);

        this.setModalCellEditorPreOpenFunction(function(v) {
            console.log(v);
        });

        this.setUseTreeLines(true);
        this.setAlwaysShowOpenCloseSymbol(false);
        this.setContextMenuHandler(0, this.__treeContextMenu,this);
        this.setContextMenuFromDataCellsOnly(false);

        this.__FM = qx.core.Init.getApplication().getFayeManager();
        
        return this;
        
    },
    members:{

        __treeContextMenu:function(col,row, table, dataModel, contextMenu) {

            var menuCreateFolder = new qx.ui.menu.Button("Create a folder");
            menuCreateFolder.addListener('execute',this.onMenuCreateFolder,this);
            contextMenu.add(menuCreateFolder);

            var menuAddNetwork = new qx.ui.menu.Button("Add a network");
            menuAddNetwork.addListener('execute',this.onMenuAddNetwork,this);
            contextMenu.add(menuAddNetwork);

            var sm = this.__tree.getSelectionModel();

            if (row === null) {
                // Right click outside any item
                sm.resetSelection();
                return true;
            }

            if (sm.getSelectedCount()>1) {
                // Multiple selection, disable everything
                menuCreateFolder.setEnabled(false);
                menuAddNetwork.setEnabled(false);
            }

            return true;
        },

        onMenuCreateFolder:function() {

            var sn = this.__tree.getSelectedNodes();
            var nodeBase = null;
            if (sn.length) {
                nodeBase = sn[0].nodeId;
            }
            var te = this.__tree.getDataModel().addBranch(nodeBase,"New folder",false);
            this.__tree.getDataModel().setData();
            if (nodeBase) this.__tree.nodeSetOpened(nodeBase);
        },

        onMenuAddNetwork:function() {
            dialog.Dialog.prompt("Please enter the root password for your server",function(result){
                dialog.Dialog.alert("Your answer was: " + result );
            });
        }
    }
});
