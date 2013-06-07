qx.Class.define("Zen.ui.tree.VirtualTree", {

    extend : qx.ui.tree.VirtualTree,

    events : {
        nodeCreated: "qx.event.type.Data",
        nodeUpdated: "qx.event.type.Data",
        nodeDeleted: "qx.event.type.Data",
        nodeEmptied: "qx.event.type.Data",
        nodeSelected: "qx.event.type.Data"
    },

    construct:function() {

        qx.Class.include(qx.ui.treevirtual.TreeVirtual,qx.ui.treevirtual.MNode);
        qx.Class.include(qx.ui.table.Table, qx.ui.table.MTableContextMenu);

        var nodes = {
            name:'root',
            type:'root',
            _id:'null',
            resume:'',
            childs: [],
            opened:true
        };

        this.__root = qx.data.marshal.Json.createModel(this.extendDataItem(nodes), true);

        this.base(arguments,this.__root,'name','childs');

    	this.set({
            showTopLevelOpenCloseIcons:true,
    		width:500,
            itemHeight:22,
            droppable:true,
            draggable:true,
            hideRoot:true,
            allowGrowX:true
    	});

        this.__tm = this.getModel();

        this.setDelegate(this);
        this.openNode(this.__root);

        this.setIconPath("type");
        this.setIconOptions({converter:this.iconConverter});

        this.__configureNode(this.__tm);

        /* listeners */

        this.addListener('contextmenu',this.__onTreeContextMenu,this);
        this.addListener('click',this.__onTreeClick,this);
        this.addListener('keypress',this.__onTreeKeyPress,this);
        this.addListener('appear',this.__nodesLoad,this);

        this.addListener('nodeUpdated',this.__nodeUpdated,this);
        this.addListener('nodeCreated',this.__nodeCreated,this);
        this.addListener('nodeDeleted',this.__nodeDeleted,this);
        this.addListener('nodeEmptied',this.__nodeEmptied,this);
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
        __editing:false,
        __selected:null,
        __previousSelected:null,
        __previousNodeClicked:null,
        __loaded:false,
        __nodeMap:{},
        __openOrCloseNodeRecursive:false,

        iconConverter:function(value,model) {
            // example
            // if (value == 'network') return "EP/network.png";
        },

        /* override */
        bindItem : function(controller, node, id) {
            controller.bindDefaultProperties(node, id);
            node.getModel().setUserData("qxnode", node);
        },

        createItem : function() {
            return new qx.ui.tree.VirtualTreeItem();
        },

        extendDataItem:function(item) {
            return item;
        },

        __addNode:function(node,parentId) {
            if (this.__nodeMap[parentId]) {
                this.__nodeMap[parentId].getChilds().push(node);
                this.__configureNode(this.__nodeMap[parentId]);
            } else {
                console.log('parent '+parentId+' not found for new child '+node.getName());
            }
        },

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

            if (!this.__nodeMap[node.get_id()]) {
                //console.log('nodeMap: adding ',node.get_id(),node.getName());
                this.__nodeMap[node.get_id()] = node;
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
            this.fireDataEvent('nodeSelected',this.__selected);
        },

        getSelected:function() {
            return this.__selected;
        },

        getUrl:function(more) {
            return 'path/to/webservice/'+more;
        },

        __nodesLoad:function() {
            this.focus();
            new EP.app.util.Xhr(this.getUrl('load'),null,this.__onNodesLoaded,this).send();
        },

        __extendData:function(r) {
            if (r.length) {
                r.forEach(function(item) {
                    this.extendDataItem(item);
                    if (item.childs && item.childs.length) {
                        this.__extendData(item.childs);
                    }
                },this);
            }
        },

        __onNodesLoaded:function(err,r) {
            if (!r || !r.length) {
                // no data
                return;
            }

            this.__extendData(r);

            var nr = qx.data.marshal.Json.createModel(r,true);
            this.__tm.setChilds(nr);
            this.__configureNode(this.__tm);
            this.refresh();
            this.__loaded = true;
        },

        __resetSelectionIfNeeded:function(ev) {

            var isTreeItem = ev.getTarget() instanceof EP.app.folder.TreeItem;
            var isLabel = ev.getTarget() instanceof qx.ui.basic.Label;
            if (isTreeItem || isLabel) {
                return false;
            }
            // click received from empty tree area
            // let's reset selection
            return this.getSelection().removeAll();
        },

        __onTreeClick:function(ev) {

            if (this.__resetSelectionIfNeeded(ev)) return;

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

            if (k == '*') {
                this.__openOrCloseNodeRecursive = true;
                this.__openCloseNodeRecursive(this.getSelection().getItem(0));
                this.__openOrCloseNodeRecursive = false;
            }
        },

        __openCloseNodeRecursive:function(node) {
            if (node.getUserData('qxnode').getOpen()) {
                this.__toggleOpenCloseRecursive(node,false);
            } else {
                this.__toggleOpenCloseRecursive(node,true);
            }
        },

        __toggleOpenCloseRecursive:function(node,open) {
            if (open) {
                this.openNode(node);
            } else {
                this.closeNode(node);
            }
            if (!node.getChilds) return;
            var childs = node.getChilds().toArray();
            if (!childs.length) return;
            for (var i = 0; i<childs.length; i++) {
                this.__toggleOpenCloseRecursive(childs[i],open);
            }
        },

        onTreeContextMenu:function(ev) {
            // example

            /*
            var type = '';
            var item = this.getSelection().getItem(0);
            if (item) type = item.getType();


            var contextMenu = new qx.ui.menu.Menu();

            var menuEdit = new qx.ui.menu.Button('Edit','EP/rename.png');
            var menuDelete = new qx.ui.menu.Button('Delete','EP/delete.gif');
            var menuEmpty = new qx.ui.menu.Button('Empty','EP/empty.png');

            if (type == 'something' || type == 'network') {

                var menuSomething = new qx.ui.menu.Button('Do Something','path/to/picture/scan.png');

                contextMenu.add(menuSomething);
                contextMenu.add(new qx.ui.menu.Separator());

            } else {
                var menuNewFolder = new qx.ui.menu.Button("New folder",'EP/folder_opened.png');
                var menuNewNetwork = new qx.ui.menu.Button("New network",'EP/network.png');
                var menuNewHost = new qx.ui.menu.Button("New host",'EP/host.gif');

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
            */
        },

        __onTreeContextMenu:function(ev) {

            this.__resetSelectionIfNeeded(ev);
            return this.onTreeContextMenu(ev);
        },

        __onMenuNewFolder:function() {
            this.__nodeCreate();
        },

        __onMenuDelete:function() {
            this.__nodeDeleteConfirm();
        },

        __onMenuEmpty:function() {
            this.__nodeEmptyConfirm();
        },

        nodeCreateDefaultValue:function(type) {
            return ''
        },

        __nodeCreate:function(type) {

            var selected = this.getSelection().getItem(0);
            var parentItem = selected||this.__root;

            var defaultValue = this.nodeCreateDefaultValue(type);

            var n = qx.data.marshal.Json.createModel(this.extendDataItem({
                _id:null,
                name: defaultValue,
                childs: [],
                type:type||'default',
                opened:true,
                resume:''
            }));

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
            if (window.confirm("Delete current selection ?")) {
                return this.__nodeDelete();
            }
        },

        __nodeEmptyConfirm:function() {
            // TODO: nice popup
            if (window.confirm("Empty current selection ?")) {
                return this.__nodeEmpty();
            }
        },

        __nodeDelete:function() {
            if (!this.getSelection().getItem(0)) {
                // no selection
                return;
            }

            var item = this.getSelection().getItem(0);
            if (!item) {
                // selection is not an item ????
                return;
            }

            var parentNode = item.getUserData('parent');
            if (!parentNode) {
                // root ???
                return;
            }

            this.fireDataEvent('nodeDeleted',item);
        },

        __nodeEmpty:function() {

            if (!this.getSelection().getItem(0)) {
                // no selection
                return;
            }

            var item = this.getSelection().getItem(0);
            if (!item) {
                // selection is not an item ????
                return;
            }

            var parentNode = item.getUserData('parent');
            if (!parentNode) {
                // root ???
                return;
            }

            this.fireDataEvent('nodeEmptied',item);
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

            popup.addListenerOnce("disappear", function(e) {
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

            var onInputEvent = function(ev) {

                var blured = ev.getType() == 'blur';
                var saving = item.getUserData('saving') == true;
                if (saving) return;

                // prevent keypressed followed by a blur event,
                // causing to always save a node (we don't want that for Escape key)
                if (blured) {
                    if (item.getUserData('keypressed') === true) {
                        return;
                    }
                } else if (ev.getKeyIdentifier) {
                    if (ev.getKeyIdentifier()=='Enter' || ev.getKeyIdentifier() == 'Escape') {
                        item.setUserData('keypressed',true);
                    }
                }

                if (blured || ev.getKeyIdentifier() == 'Enter') {
                    if (!blured && (item.getName() == input.getValue())) {
                        popup.hide();
                        return;
                    }

                    item.setUserData('previousName',item.getName());
                    item.setUserData('saving',true);

                    item.setName(input.getValue());

                    if (item.get('_id') !== null) {
                        this.fireDataEvent('nodeUpdated',item);
                    } else {
                        this.fireDataEvent('nodeCreated',item);
                    }
                    item.setUserData('keypressed',false);
                    return popup.hide();
                }

                if (ev.getKeyIdentifier() == 'Escape') {
                    if (item.get_id() === null) {
                        // was a fresh created node
                        var parent = item.getUserData('parent');
                        parent.getChilds().remove(item);
                        this.refresh();
                        this.getSelection().setItem(0,parent);
                    }
                    return popup.hide();
                }
            }

            input.addListener('keypress',onInputEvent,this);
            input.addListener('blur',onInputEvent,this);

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

            new EP.app.util.Xhr(this.getUrl('update'),d,this.__onNodeUpdated,this).send();
        },

        __onNodeUpdated:function(err,r) {
            if (!r.ok && r.error) dialog.Dialog.error(r.error);
        },

        __nodeCreated:function(ev) {
            var node = ev.getData();
            var parent = node.getUserData('parent');
            var parentIsRoot = parent.getType() === 'root';
            var parentId = parent.get_id();

            var d = {};
            d.name = node.getName()
            d.type = node.getType()||'';

            if (parentId && parentId != "null") {
                d.parent = parentId;
            }
            new EP.app.util.Xhr(this.getUrl('create'),d,this.__onNodeCreated,{self:this,node:node}).send();
        },

        __onNodeCreated:function(err,r) {
            if (!r.ok && r.error) return dialog.Dialog.error(r.error);
            // scope is created node
            this.node.setUserData('saving',false);
            this.node.set_id(r.node._id);
            this.self.__nodeMap[r.node._id] = this.node;
        },

        __nodeDeleted:function(ev) {
            var item = ev.getData();
            var parent = item.getUserData('parent');

            new EP.app.util.Xhr(this.getUrl('delete'),{_id:item.get_id()},function(err,r) {
                parent.getChilds().remove(item);
                this.refresh();
                this.getSelection().setItem(0,parent);
            },this).send();
        },

        __nodeEmptied:function(ev) {
            var item = ev.getData();
            var parent = item;

            new EP.app.util.Xhr(this.getUrl('empty'),{_id:item.get_id()},function(err,r) {
                while (parent.getChilds().length) {
                    var id = parent.getChilds().getItem(0).get_id();
                    parent.getChilds().remove(parent.getChilds().getItem(0));
                    //console.log('nodeMap: deleting '+id);
                    delete this.__nodeMap[id];
                }
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
            if (this.__openOrCloseNodeRecursive) return;

            var _id = item.get_id();
            if (!_id) return;

            new EP.app.util.Xhr(this.getUrl('openClose'),{_id:_id,opened:status},function(err,r) {
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

