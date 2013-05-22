qx.Class.define("EP.desktop.portsScannerTree", {

    extend : qx.ui.tree.VirtualTree,

    events : {
        nodeCreated: "qx.event.type.Data",
        nodeUpdated: "qx.event.type.Data",
        nodeDeleted: "qx.event.type.Data"
    },

    construct:function(workspaceData) {

        qx.Class.include(qx.ui.treevirtual.TreeVirtual,qx.ui.treevirtual.MNode);
        qx.Class.include(qx.ui.table.Table, qx.ui.table.MTableContextMenu);

        this.__workspaceData = workspaceData;

        var nodes = {
            name:'root',
            type:'root',
            _id:'null',
            childs: [],
            opened:true
        };

        this.__root = qx.data.marshal.Json.createModel(nodes, true);

        this.base(arguments,this.__root,'name','childs');

    	this.set({
            showTopLevelOpenCloseIcons:true,
    		width:300,
            itemHeight:22,
            droppable:true,
            draggable:true,
            hideRoot:true
    	});

        this.__tm = this.getModel();


        var delegateTree = {
            bindItem : function(controller, node, id) {
                controller.bindDefaultProperties(node, id);
                node.getModel().setUserData("qxnode", node);
            }
        }

        this.setDelegate(delegateTree);
        this.openNode(this.__root);

        this.setIconPath("type");
        this.setIconOptions({
            converter : function(value, model){
                if (value == 'network') return "EP/network.png";
                if (value == 'host') return "EP/host.png";
                if (value == 'port') return "EP/port.png";
            }
        });

        this.__configureNode(this.__tm);

        /* listeners */

        this.addListener('contextmenu',this.__onTreeContextMenu,this);
        this.addListener('click',this.__onTreeClick,this);
        this.addListener('keypress',this.__onTreeKeyPress,this);
        this.addListener('appear',this.__nodesLoad,this);

        this.addListener('nodeUpdated',this.__nodeUpdated,this);
        this.addListener('nodeCreated',this.__nodeCreated,this);
        this.addListener('nodeDeleted',this.__nodeDeleted,this);
        this.addListener('open',this.__nodeOpened,this);
        this.addListener('close',this.__nodeClosed,this);

        /* TODO : drag & drop
        this.addListener('dragstart', this.__nodeDragStart,this);
        this.addListener('dragover',this.__nodeDragOver,this);
        this.addListener('dragend',this.__nodeDragEnd,this);
        this.addListener('drag',this.__nodeDrag,this);
        this.addListener('drop',this.__nodeDrop,this);

        this.__indicator = qx.core.Init.getApplication().__desktop.__indicator;
        this.__indicator.addListener('drop',this.__indicatorDrop,this);
        */

        this.getSelection().addListener("change", this.__onSelectionChange,this);

    },

    members:{
        __sm:null,
        __workspaceData:null,
        __editing:false,
        __selected:null,
        __previousSelected:null,
        __previousNodeClicked:null,
        __loaded:false,

        __configureNode:function(node,parent) {

            if (parent) {
                node.setUserData('parent',parent);
            }

            if (node.getType() === undefined) {
                node.setType('');
                node.setChilds([]);
            }

            if (node.getOpened && node.getOpened()) {
                this.openNode(node);
            }

            // got childs ?
            if (!node.getChilds) {
                // no
                return;
            }

            var children = node.getChilds();
            if (!children.getLength) {
                // no ??
                return;
            }

            var length = children.getLength();

            // Recursive on childs
            for (var x=0; x < length; x++) {
                this.__configureNode(children.getItem(x), node);
            }
        },

        __onSelectionChange:function(ev) {
            this.__selected = this.getSelection().getItem(0);
        },

        __getUrl:function(more) {
            return 'folder/'+this.__workspaceData._id+'/'+more;
        },

        __nodesLoad:function() {
            this.focus();
            new EP.utils.xhr(this.__getUrl('load'),null,this.__onNodesLoaded,this).send();
        },

        __onNodesLoaded:function(err,r) {
            if (!r || !r.length) {
                // no data
                return;
            }

            var nr = qx.data.marshal.Json.createModel(r,true);
            this.__tm.setChilds(nr);
            this.__configureNode(this.__tm);
            this.refresh();
            this.__loaded = true;
        },

        __onTreeClick:function(ev) {
            var c = ev.getTarget().classname;
            if (!c) return;

            if (c == 'qx.ui.virtual.core.Pane') {

                // qx.ui.virtual.core.Pane
                // click received from empty tree area
                // let's reset selection
                this.getSelection().removeAll();

            } else if (c == 'qx.ui.tree.VirtualTreeItem') {
                var node = this.getSelection().getItem(0);
                if (!node) return;

                if (node != this.__previousNodeClicked) {
                    // Prevent edit a node which was
                    // not previously selected
                    this.__previousNodeClicked = node;
                    return;
                }
                if (node.getUserData('clickTimer')) {
                    var diff = Date.now()-node.getUserData('clickTimestamp');
                    // Double click (open node, ignoring)
                    if (diff <= 200) return;
                    // Edit node
                    return this.__nodeEdit();
                }
                node.setUserData('clickTimestamp',Date.now());
                node.setUserData('clickTimer',qx.lang.Function.delay(function() {
                    node.setUserData('clickTimer',null);
                    node.setUserData('clickTimestamp',null);
                },1000),this);
            }
        },

        __onTreeKeyPress:function(ev) {
            if (this.__editing) return false;

            var k = ev.getKeyIdentifier();

            if (k == 'Insert') {
                return this.__nodeCreate();
            }

            if (k == 'Delete') {
                return this.__nodeDeleteConfirm();
            }
        },

        __onTreeContextMenu:function(ev) {

            var type = '';
            var item = this.getSelection().getItem(0);
            if (item) type = item.getType();


            var contextMenu = new qx.ui.menu.Menu();

            if (type == 'host') {

                var menuPortScan = new qx.ui.menu.Button('TCP ports scan','EP/scan.png');
                menuPortScan.addListener('execute',function() {
                    var meta = {
                        value:item.getName(),
                        parent:item.get_id(),
                        workspaceId:this.__workspaceData._id,
                        type:type
                    };
                    new EP.desktop.portsScannerPopup(this,meta).open();
                },this);
                contextMenu.add(menuPortScan);

            } else {
                var menuNewFolder = new qx.ui.menu.Button("New folder",'EP/folder_opened.png');
                menuNewFolder.addListener('execute',this.__onMenuNewFolder,this);

                var menuNewNetwork = new qx.ui.menu.Button("New network",'EP/network.png');
                menuNewNetwork.addListener('execute',this.__onMenuNewNetwork,this);

                var menuNewHost = new qx.ui.menu.Button("New host",'EP/host.gif');
                menuNewHost.addListener('execute',this.__onMenuNewHost,this);

                var menuEdit = new qx.ui.menu.Button('Edit','EP/rename.png');
                menuEdit.addListener('execute',this.__nodeEdit,this);

                var menuDelete = new qx.ui.menu.Button('Delete','EP/delete.gif');
                menuDelete.addListener('execute',this.__onMenuDelete,this);

                contextMenu.add(menuNewFolder);
                contextMenu.add(menuNewNetwork);
                contextMenu.add(menuNewHost);
                contextMenu.add(new qx.ui.menu.Separator());
                contextMenu.add(menuEdit);
                contextMenu.add(menuDelete);
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

        __onMenuNewFolder:function() {
            this.__nodeCreate();
        },

        __onMenuNewNetwork:function() {
            this.__nodeCreate('network');
        },

        __onMenuNewHost:function() {
            this.__nodeCreate('host');
        },

        __onMenuDelete:function() {
            this.__nodeDeleteConfirm();
        },

        __nodeCreate:function(type) {

            var selected = this.getSelection().getItem(0);
            var parentItem = selected||this.__root;

            var defaultValue = 'New folder';

            if (type == 'host') {
                defaultValue = 'New host';
            }
            if (type == 'network') {
                defaultValue = 'New network';
            }

            var n = qx.data.marshal.Json.createModel({
                _id:null,
                name: defaultValue,
                childs: [],
                type:type||'default',
                opened:true
            });

            var nodeId = parentItem.getChilds().push(n);
            var node = parentItem.getChilds().getItem(nodeId-1);
            this.refresh();
            this.openNode(parentItem);
            this.__configureNode(node,parentItem);
            this.getSelection().setItem(0,node);
            qx.lang.Function.delay(this.__nodeEdit,10,this);
        },

        __nodeDeleteConfirm:function() {
            // TODO: nice popup
            if (window.confirm("Delete selection ?")) {
                return this.__nodeDelete();
            }
        },

        __nodeDelete:function() {
            if (!this.getSelection().getItem(0)) return;

            var item = this.getSelection().getItem(0);
            if (!item) return;

            var parentNode = item.getUserData('parent');
            if (!parentNode) return;

            this.fireDataEvent('nodeDeleted',item);
        },

        __nodeEdit:function(node) {

            this.__editing = true;

            var item = this.getSelection().getItem(0);
            var qxnode = item.getUserData("qxnode");

            // Values below depend of the theme :(
            var cal = (qxnode.getLevel() + 2) * qxnode.getIndent() + 8;
            var padding = 5;

            var popup = new qx.ui.popup.Popup(new qx.ui.layout.Grow()).set({
                offsetLeft: cal,
                offsetTop: -23,
                paddingLeft:padding,
                allowGrowX:true
            });

            popup.addListenerOnce("disappear", function(e){
                this.__editing = false;
                popup.destroy();
                input.destroy();
                this.focus();
            },this);

            var input = new qx.ui.form.TextField().set({
                decorator:null,
                allowGrowX:true,
                value:item.get('name'),
                width:qxnode.getBounds().width - cal - (padding*2)
            });

            input.addListener('keypress',function(ev) {
                if (ev.getKeyIdentifier() == 'Escape') {
                    popup.hide();
                    this.fireDataEvent('nodeDeleted',item);
                }
                if (ev.getKeyIdentifier() == 'Enter') {
                    if (item.getName() == input.getValue()) {
                        popup.hide();
                        return;
                    }
                    item.setUserData('previousName',item.getName());
                    item.setName(input.getValue());
                    if (item.get('_id') !== null) {
                        this.fireDataEvent('nodeUpdated',item);
                    } else {
                        this.fireDataEvent('nodeCreated',item);
                    }
                    popup.hide();
                }
            },this);

            input.setUserData('item',item);
            input.selectAllText();
            popup.add(input);
            popup.placeToWidget(qxnode, true);
            popup.show();
        },

        __nodeUpdated:function(ev) {
            var data = ev.getData();
            if (!data.get_id()) {
                return;
            }

            var d = {
                _id:data.get_id(),
                name:data.getName()
            };

            new EP.utils.xhr(this.__getUrl('update'),d,this.__onNodeUpdated,this).send();
        },

        __onNodeUpdated:function(err,r) {
            if (!r.ok && r.error) dialog.Dialog.error(r.error);
        },

        __nodeCreated:function(ev) {
            var data = ev.getData();
            var parent = data.getUserData('parent');
            var parentIsRoot = parent.getType() === 'root';
            var parentId = parent.get_id();

            var d = {};
            d.name = data.getName()
            d.type = data.getType()||'';

            if (parentId && parentId != "null") {
                d.parent = parentId;
            }
            new EP.utils.xhr(this.__getUrl('create'),d,this.__onNodeCreated,this).send();
        },

        __onNodeCreated:function(err,r) {
            if (!r.ok && r.error) return dialog.Dialog.error(r.error);
            this.getSelection().getItem(0).set_id(r.node._id);
        },

        __nodeDeleted:function(ev) {
            var item = ev.getData();
            var parent = item.getUserData('parent');
            if (item.get_id() === null) {
                // was a fresh created node
                parent.getChilds().remove(item);
                this.refresh();
                this.getSelection().setItem(0,parent);
                return;
            }

            new EP.utils.xhr(this.__getUrl('delete'),{_id:item.get_id()},function(err,r) {
                parent.getChilds().remove(item);
                this.refresh();
                this.getSelection().setItem(0,parent);
            },this).send();
        },

        __nodeOpened:function(ev) {
            this.__nodeToggleOpenClose(ev.getData(),true);
        },

        __nodeClosed:function(ev) {
            this.__nodeToggleOpenClose(ev.getData(),false);
        },

        __nodeToggleOpenClose:function(item,status) {
            if (!this.__loaded) return;
            var _id = item.get_id();
            if (!_id) return;

            new EP.utils.xhr(this.__getUrl('openClose'),{_id:_id,opened:status},function(err,r) {
                item.setOpened(status);
            },this).send();
        },

        /*
         * TODO: drag & drop
         */

        __nodeDragStart:function(ev) {
            //ev.addType("item")
            ev.addAction("move");
            this.__nodeDragging = ev.getOriginalTarget();
        },

        __nodeDragOver:function(ev) {
            console.log('__nodeDragOver',ev.getOriginalTarget() instanceof qx.ui.tree.VirtualTreeItem);

            ev.preventDefault();

            // Stop when the dragging comes from outside
            if (ev.getRelatedTarget()) {
                ev.preventDefault();
            }
        },

        __nodeDrag:function(ev) {
            var target = ev.getOriginalTarget();

            if (target instanceof qx.ui.tree.VirtualTreeItem) {
                this.__droppedOn = target;
            }

            if (!qx.ui.core.Widget.contains(this, target) && target != this.__indicator) {
                return;
            }

            var origCoords = target.getContentLocation();

            this.__indicator.setWidth(target.getBounds().width);
            this.__indicator.setDomPosition(origCoords.left, origCoords.top);
        },

        __nodeDragEnd:function(ev) {
            console.log('__nodeDragEnd',ev);
            var src = this.__nodeDragging.getModel();
            var dst = this.__droppedOn.getModel();
            console.log(src.getName()+' has been dropped on '+dst.getName());

            this.__indicator.setDomPosition(-1000, -1000);
        },

        __indicatorDrop:function(ev) {
        },

        __nodeDrop:function(ev) {
        }
    }
});

