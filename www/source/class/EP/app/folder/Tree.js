qx.Class.define("EP.app.folder.Tree", {

    extend : Zen.ui.tree.VirtualTree,

    events: {
        jobMessage: "qx.event.type.Data"
    },

    construct:function(workspaceData) {
        this.__workspaceData = workspaceData;
        this.base(arguments);
        this.addListener('jobMessage',this.onJobMessage,this);

        if (qx.core.Environment.get("html.audio.mp3")) {
            var u = qx.util.ResourceManager.getInstance().toUri("EP/sound/6370.mp3");
            this.__sounds = [];
            this.__soundPointer = 0;
            for (var i = 0; i<10 ; i++) {
                // preload
                qx.lang.Function.delay(function() {
                    this.__sounds.push(new qx.bom.media.Audio(u));
                },i*100,this);
            }
        }

    },

    members:{
        __workspaceData:null,
        __beepUri: null,

        playSound:function() {
            var beep = this.__sounds[this.__soundPointer];
            var v = qx.core.Init.getApplication().__soundVolume;
            beep.setVolume(v);
            beep.play();
            this.__soundPointer++;
            if (this.__soundPointer == 10) {
                this.__soundPointer = 0;
            }
        },

        onJobMessage:function(ev) {
            this.playSound();

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
            controller.bindProperty("resume", "resume", null, node, id);
            node.getModel().setUserData("qxnode", node);
        },

        createItem : function() {
            return new EP.app.folder.TreeItem();
        },

        extendDataItem:function(r) {
            r.resume = '';
            if (r.type == 'port') {
                r.resume = r.data.banner;
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

            } else if (type == 'port') {

                menuEdit.setEnabled(false);

            } else {
                var menuNewFolder = new qx.ui.menu.Button("New folder",'EP/folder_opened.png');
                var menuNewNetwork = new qx.ui.menu.Button("New network",'EP/network.png');
                var menuNewHost = new qx.ui.menu.Button("New host",'EP/host.gif');
                var menuRandomHost = new qx.ui.menu.Button("Random hosts",'EP/host.gif');

                menuNewFolder.addListener('execute',this.__onMenuNewFolder,this);
                menuNewNetwork.addListener('execute',this.__onMenuNewNetwork,this);
                menuNewHost.addListener('execute',this.__onMenuNewHost,this);
                menuRandomHost.addListener('execute',this.__onMenuRandomHost,this);

                contextMenu.add(menuNewFolder);
                contextMenu.add(menuNewNetwork);
                contextMenu.add(menuNewHost);
                contextMenu.add(menuRandomHost);
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

        __onMenuRandomHost:function() {
            //CIDR.long2ip(Math.random()*4294967296);
            var w = new EP.app.popup.randomHost();
            w.show();
        },

        nodeCreateDefaultValue:function(type) {
            if (type == 'host') return 'New host';
            if (type == 'network') return 'New network';
            return '';
        }
    }
});

