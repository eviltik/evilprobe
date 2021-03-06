qx.Class.define("EP.app.folder.Tree", {

    extend : Zen.ui.tree.VirtualTree,

    events: {
        jobMessage: "qx.event.type.Data"
    },

    construct:function(workspaceData) {
        this.__workspaceData = workspaceData;
        this.base(arguments);
        this.addListener('jobMessage',this.onJobMessage,this);
    },

    members:{
        __workspaceData:null,

        onJobMessage:function(ev) {
            var node = JSON.parse(JSON.stringify(ev.getData().message.node));
            var parentId = node.parent;
            node = this.extendDataItem(node);
            var node = qx.data.marshal.Json.createModel(node,false);
            this.__addNode(node,parentId);
        },

        /* override */
        iconConverter:function(value,model) {
            if (value == 'network') return "EP/network.png";
            if (value == 'host') return "EP/host.png";
            if (value == 'port') return "EP/port.png";
        },

        bindItem : function(controller, node, id) {
            controller.bindDefaultProperties(node, id);
            node.getModel().setUserData("qxnode", node);
            node.getModel().setUserData("tree", this);
        },

        createItem : function() {
            return new EP.app.folder.TreeItem();
        },

        extendDataItem:function(r) {
            r.resume = '';
            if (r.type == 'port') {
                if (!r.data.protocol) r.data.protocol='tcp';
                r.name = r.name+'/'+r.data.protocol+' '+r.data.portName.toLowerCase();
            }
            if (r.type == 'host' || r.type == 'network') {
                if (!r.childs) r.childs = [];
            }
            return r;
        },

        getUrl:function(action) {
            return 'folder/'+this.__workspaceData._id+'/'+action;
        },

        onTreeContextMenu:function(ev) {

            var type = '';
            var item = this.getSelection().getItem(0);
            if (item) type = item.getType();
            var multi = this.getSelection().getLength()>1;

            var contextMenu = new qx.ui.menu.Menu();

            var menuEdit = new qx.ui.menu.Button('Edit','EP/rename.png');
            var menuDelete = new qx.ui.menu.Button('Delete','EP/delete.gif');
            var menuEmpty = new qx.ui.menu.Button('Empty','EP/empty.png');

            if (type == 'host' || type == 'network') {

                var menuPortScan = new qx.ui.menu.Button('TCP ports scan','EP/scan.png');
                menuPortScan.addListener('execute',function() {
                    var meta = {
                        value:item.getName(),
                        parent:item.get_id(),
                        workspaceId:this.__workspaceData._id,
                        type:type
                    };
                    new EP.app.popup.portScanner(this,meta).open();
                },this);

                contextMenu.add(menuPortScan);
                contextMenu.add(new qx.ui.menu.Separator());

                if (type == 'network') {
                    var menuNewHost = new qx.ui.menu.Button("New host",'EP/host.png');
                    menuNewHost.addListener('execute',this.__onMenuNewHost,this);
                    contextMenu.add(menuNewHost);

                    contextMenu.add(new qx.ui.menu.Separator());
                }

                if (multi) menuEdit.setEnabled(false);

            } else if (type == 'port' || multi) {

                menuEdit.setEnabled(false);

            } else {
                var menuNewFolder = new qx.ui.menu.Button("New folder",'EP/folder_opened.png');
                var menuNewNetwork = new qx.ui.menu.Button("New network",'EP/network.png');
                var menuNewHost = new qx.ui.menu.Button("New host",'EP/host.png');

                menuNewFolder.addListener('execute',this.__onMenuNewFolder,this);
                menuNewNetwork.addListener('execute',this.__onMenuNewNetwork,this);
                menuNewHost.addListener('execute',this.__onMenuNewHost,this);

                contextMenu.add(menuNewFolder);
                contextMenu.add(menuNewNetwork);
                contextMenu.add(menuNewHost);
                contextMenu.add(new qx.ui.menu.Separator());

            }

            menuEdit.addListener('execute',this.__nodeEdit,this);
            menuDelete.addListener('execute',this.__onMenuDelete,this);
            menuEmpty.addListener('execute',this.__onMenuEmpty,this);

            if (item && item.getChilds && item.getChilds().length == 0) {
                menuEmpty.setEnabled(false);
            }

            if (item) {
                contextMenu.add(menuEdit);
                contextMenu.add(menuDelete);
                contextMenu.add(menuEmpty);
            }

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

        __onMenuNewNetwork:function() {
            this.__nodeCreate('network');
        },

        __onMenuNewHost:function() {
            this.__nodeCreate('host');
        },

        nodeCreateDefaultValue:function(type) {
            if (type == 'host') return 'New host';
            if (type == 'network') return 'New network';
            return '';
        }
    }
});

