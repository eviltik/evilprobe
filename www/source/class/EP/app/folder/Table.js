 qx.Class.define("EP.app.folder.Table", {

    extend : qx.ui.container.Composite,

    events : {
        jobMessage: "qx.event.type.Data"
    },

    construct:function(workspaceData,tree) {
        this.__workspaceData = workspaceData;
        this.__tree = tree;

        tree.addListener('nodeSelected',this.onTreeSelectionChange,this);

        this.base(arguments);
        this.setLayout(new qx.ui.layout.VBox);

        //var timestampRendererHM = new Zen.table.cellrenderer.TimestampHM;

        var columns = [
            {title:'uid',           width:50,   hidden: true, primary: true},
            {title:'IP Address',    width:120},
            {title:'Hostname',      width:180},
            {title:'Port',          width:100},
            {title:'Banner'},
            {title:'Country',       width:150,  hidden:true},
            {title:'City',          width:150}
        ];

        var table = this.__table = new EP.ui.table.Table({columns:columns}).set({
            showCellFocusIndicator:false,
            statusBarVisible:false,
            decorator:null
        });

        //this.__contextMenu = new qx.ui.menu.Menu();
        //table.addListener('cellContextmenu',this.__onContextMenu,this);
        //this.addListener('mousedown',function() {
        //    this.__tableJobs.getSelectionModel().resetSelection();
        //},this);
        //table.setDataRowRenderer(new EP.ui.table.rowrenderer.Jobs(table));

        this.add(table,{flex:1});
    },

    members: {
        __table:null,
        __data:[],

        refreshDatastoreRecursive:function(node,parent) {
            if (!node) return;
            if (!node.getChilds) return;
            if (!node.getChilds()) return;
            if (parent && parent.getType() == 'host') {
                this.__data.push([
                    '',
                    parent.getName(),
                    parent.getData().getHostname()||'N/A',
                    node.getName(),
                    node.getData().getBanner()||'',
                    parent.getData().getCountry(),
                    parent.getData().getCity()
                ])
            }
            for (var i = 0;i<node.getChilds().getLength();i++) {
                this.refreshDatastoreRecursive(node.getChilds().getItem(i),node);
            }
            if (!parent) {
                this.__table.getTableModel().setData(this.__data);
            }
        },

        onTreeSelectionChange:function(ev) {
            //console.log(ev.getData());
            this.__data = [];
            this.__table.getTableModel().setData([]);
            this.refreshDatastoreRecursive(ev.getData(),null)
        }
    }

})