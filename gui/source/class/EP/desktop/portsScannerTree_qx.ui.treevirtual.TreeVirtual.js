qx.Class.define("EP.desktop.portsScannerTree", {

    extend : qx.ui.treevirtual.TreeVirtual,

    construct:function(workspaceData) {

        this.__workspaceData = workspaceData;

        qx.Class.include(qx.ui.treevirtual.TreeVirtual,qx.ui.treevirtual.MNode);
        qx.Class.include(qx.ui.table.Table, qx.ui.table.MTableContextMenu);
        //qx.Class.patch(qx.ui.table.pane.Scroller, Zen.ui.EditableTreeVirtual.table.pane.Scroller);
        //qx.Class.patch(qx.ui.treevirtual.TreeVirtual, Zen.ui.EditableTreeVirtual.treevirtual.TreeVirtual);
        //qx.Class.patch(qx.ui.treevirtual.SimpleTreeDataModel, Zen.ui.EditableTreeVirtual.treevirtual.SimpleTreeDataModel);

        this.base(arguments,'');

    	this.set({
            //iconPath:'icons',
    		width:300,
            useTreeLines:true,
            droppable:true,
            draggable:true,
            alwaysShowOpenCloseSymbol:true
    	});

        this.addListener('contextmenu',this.__onTreeContextMenu,this);

        this.__tm = this.getDataModel();

        // create the controller
        var controller = new qx.data.controller.Tree(null, this, "children", "name");

        var url = '/ws/folder/'+workspaceData._id+'/load';
        var store = this.__store = new qx.data.store.Json(url);
        store.bind("model", controller, "model")
        store.addListener("loaded", function(ev) {
            this.getRoot().setOpen(true);
      }, this);

        //this.setContextMenuHandler(0, this.__onTreeContextMenu,this);
        //this.setContextMenuFromDataCellsOnly(false);

    },

    members:{
        __sm:null,
        __workspaceData:null,

        __onTreeContextMenu:function(ev) {

            var contextMenu = new qx.ui.menu.Menu();

            var menuCreateFolder = new qx.ui.menu.Button("Create a folder");
            menuCreateFolder.addListener('execute',this.__onMenuCreateFolder,this);
            contextMenu.add(menuCreateFolder);

            var menuAddNetwork = new qx.ui.menu.Button("Add a network");
            //menuAddNetwork.addListener('execute',this.onMenuAddNetwork,this);
            contextMenu.add(menuAddNetwork);

            var sn = this.getSelectedNodes();

            if (sn && sn.length>1) {
                // Multiple selection, disable everything
                menuCreateFolder.setEnabled(false);
                menuAddNetwork.setEnabled(false);
            }

            contextMenu.placeToMouse(ev);
            contextMenu.show();

            return true;
        },

        __onMenuCreateFolder:function() {

            console.log(this.getSelectedNodes());

            var selected = this.getSelectedNodes()[0];
            var parentItem = selected||this.__root;

            var n = qx.data.marshal.Json.createModel({
                "name": "New folder",
                "children": [],
                vtitem:null
            });

            var nodeId = parentItem.getChildren().push(n);
            //this.refresh();
            //this.openNode(parentItem);
            //this.__onNodeEdit(nodeId);

            //this.setSelection(new qx.data.Array([1])); 
            this.__tm.setData();
            console.log(nodeId);

        },

        __onNodeEdit:function(node) {

            var item = this.getSelection().getItem(0);
            if (!item) return;
            
            var vtitem = item.get("vtitem");

            console.log(this.getLevel(node));

            var cal = (this.getLevel(node) + 2) * vtitem.getIndent() + 2;
    
            var popup = new qx.ui.popup.Popup(new qx.ui.layout.Canvas()).set({
                offsetLeft : cal,
                offsetTop : -30
            });

            popup.addListenerOnce("disappear", function(e){
                popup.destroy();
            });
    
            var txtNodo = new qx.ui.form.TextField();
            txtNodo.setWidth(vtitem.getBounds().width - cal);
            txtNodo.setValue(item.get("name"));
            txtNodo.selectAllText();
            txtNodo.setPaddingLeft(0);
            popup.add(txtNodo);
            popup.placeToWidget(vtitem, false);
            popup.show();      
        }
    }
});

