qx.Class.define("Zen.ui.tree.VirtualTree", {

    extend : qx.ui.tree.VirtualTree,

    events : {
        nodeCreated:    "qx.event.type.Data",
        nodeUpdated:    "qx.event.type.Data",
        nodeDeleted:    "qx.event.type.Data",
        nodeEmptied:    "qx.event.type.Data",
        nodeSelected:   "qx.event.type.Data",
        dropSomething:  "qx.event.type.Data"
    },

    construct:function() {

        qx.Class.include(qx.ui.treevirtual.TreeVirtual,qx.ui.treevirtual.MNode);
        qx.Class.include(qx.ui.table.Table, qx.ui.table.MTableContextMenu);

        var nodes = {
            name:'root',
            norder:'',
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
        this.setSelectionMode("multi");

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

        this.addListener('dropSomething',this.__dropFromOutside,this);

        /* TODO : drag & drop */
        this.addListener('dragstart', this.__nodeDragStart,this);
        //this.addListener('dragover',this.__nodeDragOver,this);
        this.addListener('dragend',this.__nodeDragEnd,this);
        this.addListener('drag',this.__nodeDrag,this);
        //this.addListener('drop',this.__nodeDrop,this);

        //this.__indicator = qx.core.Init.getApplication().getIndicator();
        //this.__indicator.addListener('drop',this.__indicatorDrop,this);

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
            node.getModel().setUserData("tree", this);
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

        __nodeReorderChilds : function(name,childs) {

            childs.sort(function(a,b) {
                return ((a.getType() < b.getType()) ? -1 : ((a.getType() > b.getType()) ? 1 : 0));
            });


            childs.sort(function(a,b) {
                return ((a.getName() < b.getName()) ? -1 : ((a.getName() > b.getName()) ? 1 : 0));
            });

            childs.sort(function(a,b) {
                var a = parseInt(a.getNorder());
                var b = parseInt(b.getNorder());

                if (!isNaN(a) && !isNaN(b)) return a-b;
                return 0;
            });
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

            var childs = node.getChilds();
            if (!childs.getLength) {
                // no ??
                return;
            }

            this.__nodeReorderChilds(node.getName(),childs);

            var length = childs.getLength();

            // Recursive on childs
            for (var x=0; x < length; x++) {
                this.__configureNode(childs.getItem(x), node);
            }
        },

        __onSelectionChange:function(ev) {
            this.__selected = this.getSelection();
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

        __nodeCreate:function(type,data) {

            var gotData = typeof data === 'object';
            var selected = this.getSelection().getItem(0);
            var parentItem = selected||this.__root;

            if (!data) {
                data = {};
                data.name = this.nodeCreateDefaultValue(type);
                data.type = type || 'default'
            }

            var n = qx.data.marshal.Json.createModel(this.extendDataItem({
                _id:null,
                name: data.name,
                norder:'',
                childs: [],
                type : data.type,
                opened:true
            }));

            var nodeId = parentItem.getChilds().push(n);
            var node = parentItem.getChilds().getItem(nodeId-1);
            this.refresh();
            this.openNode(parentItem);
            this.__configureNode(node,parentItem);
            if (!gotData) {
                this.getSelection().setItem(0,node);
                qx.lang.Function.delay(this.__nodeEdit,10,this);
            }
            return node;
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
            for (var i = 0;i<this.getSelection().getLength();i++) {
                var item = this.getSelection().getItem(i);
                if (item) {
                    var parentNode = item.getUserData('parent');
                    if (parentNode) {
                        this.fireDataEvent('nodeDeleted',item);
                    }
                }
            }
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

            if (this.getSelection().getLength()>1) {
                // More than one node is selected, editing not allowed
                return;
            }

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

                // when answer of the save request is too quick,
                // let's prevent keypressed followed by a blur event,
                // causing to always save a node (we don't want that
                // for Escape key)

                if (blured) {
                    if (item.getUserData('keypressed') === true) {
                        return;
                    }
                } else if (ev.getKeyIdentifier) {
                    if (ev.getKeyIdentifier()=='Enter' || ev.getKeyIdentifier() == 'Escape') {
                        item.setUserData('keypressed',true);
                    }
                }

                // Enter key or click anywhere else
                // Let's save
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

                // Escape key, don't save
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
            var node = ev.getData();
            if (!node.get_id()) {
                return;
            }

            var d = {
                _id:node.get_id(),
                name:node.getName()
            };

            new EP.app.util.Xhr(this.getUrl('update'),d,this.__onNodeUpdated,this).send();
            this.__configureNode(this.__tm);

        },

        __onNodeUpdated:function(err,r) {
            if (!r.ok && r.error) dialog.Dialog.error(r.error);
        },

        __nodeCreated:function(ev) {
            console.log('__nodeCreated');
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

        __getParent:function(node) {
            console.log('__getParent');
            if (!node) return;
            if (!node.get_id()) return;
            if (this.__nodeMap) {
                console.log(node);
                console.log(this.__nodeMap[node.getParent()].getName());
                return this.__nodeMap[node.get_id()];
            }
            return node;
        },

        __onNodeCreated:function(err,r) {
            console.log('__onNodeCreated');
            if (!r.ok && r.error) return dialog.Dialog.error(r.error);
            // scope is created node
            this.node.setUserData('saving',false);
            this.node.set_id(r.node._id);
            this.node.setNorder(r.node.norder);
            this.self.__nodeMap[r.node._id] = this.node;
            this.self.__configureNode(this.node.getUserData('parent'));
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
            ev.addAction("move");
            this.__selected = this.getSelection().toArray();
        },

        __nodeDragOver:function(ev) {
            console.log('__nodeDragOver',ev.getOriginalTarget() instanceof qx.ui.tree.VirtualTreeItem);

            ev.preventDefault();

            // Stop when the dragging comes from outside
            if (ev.getRelatedTarget()) {
                ev.preventDefault();
            }
            return true;
        },

        __nodeDrag:function(ev) {
            var target = ev.getOriginalTarget();

            if (!qx.ui.core.Widget.contains(this, target) && this.__indicator && target != this.__indicator) {
                return false;
            }

            if (target instanceof qx.ui.virtual.core.Pane) {
                this.__droppedOn = this.__root;
                console.log('ici');
                return;
            }

            if (target.getModel && target.getModel()) {
                var tree = target.getModel().getUserData('tree');
                if (!tree) return;
                var model = target.getModel() || null;
                if (!model) {
                    this.__droppedOn = null;
                    return;
                }

                if (model.getType() == 'host') {
                    var model = model.getUserData('parent');
                    target = model.getUserData('qxnode');
                }
                this.__droppedOn = target;
                tree.setSelection(new qx.data.Array([model]));
            }

            if (this.__indicator) {
                var origCoords = target.getContentLocation();
                this.__indicator.setWidth(target.getBounds().width);
                this.__indicator.setDomPosition(origCoords.left, origCoords.top);
            }
        },

        __nodeDragEnd:function(ev) {
                                    console.log(this.__nodeMap);

            var newParentNode = this.__tm;
            if (this.__droppedOn.getModel) {
                newParentNode = this.__droppedOn.getModel();
            }

            if (this.__indicator) {
                this.__indicator.setDomPosition(-1000, -1000);
            }

            var dropParentId = null;
            if (newParentNode && newParentNode.get_id) {
                dropParentId = newParentNode.get_id();
            }

            for (var i = 0;i<this.__selected.length; i++) {
                var selectedParent = null;
                if (this.__selected[i].getParent) {
                    selectedParent = this.__selected[i].getParent();
                }
                if (dropParentId != selectedParent) {
                    var n = this.__selected[i];
                    var actualParentNode = this.__tm;
                    if (n.getParent) {
                        actualParentNode = this.__nodeMap[n.getParent()];
                    }

                    var d = {};
                    d._id = n.get_id();
                    d.newParentId = dropParentId;
                    new EP.app.util.Xhr(this.getUrl('move'),d,function(err,res) {
                        this.actualParentNode.getChilds().remove(this.node);
                        this.newParentNode.getChilds().push(this.node);
                        //console.log(this.self.__nodeMap);
                        //delete this.self.__nodeMap[this.node.get_id()];
                        if (this.node.setParent) {
                            this.node.setParent(this.dropParentId);
                        }
                        if (this.i == this.max) {
                            this.self.__nodeReorderChilds(null,this.newParentNode.getChilds());
                            this.self.setSelection(new qx.data.Array(this.self.__selected));
                        }
                    },{
                        actualParentNode:actualParentNode,
                        newParentNode:newParentNode,
                        self:this,
                        node:n,
                        i:i,
                        max:this.__selected.length-1,
                        dropParentId:dropParentId
                    }).send();
                }

            }
        },

        __indicatorDrop:function(ev) {
            console.log('indicator drop');
        },

        __nodeDrop:function(ev) {
            console.log('__nodeDrop');
        },

        __dropFromOutside:function(ev) {

            //console.log('__dropSomething');

            var data = ev.getData();

            var parent = this.getSelection().getItem(0);
            var parentId = null;
            if (parent) {
                parentId = parent.get_id();
            }

            var items = data.items;

            for (var i = 0;i<items.length;i++) {
                var d = {};
                var node = items[i];
                d.name = node.name;
                d.type = node.type;

                if (parentId) {
                    d.parent = parentId;
                }

                var node = this.__nodeCreate('host',d);
                //console.log('adding',d);
                new EP.app.util.Xhr(this.getUrl('create'),d,this.__onNodeCreated,{self:this,node:node}).send();
            }
        }
    }
});

