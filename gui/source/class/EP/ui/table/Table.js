qx.Class.define("EP.ui.table.Table", {

    extend : qx.ui.table.Table,

    construct : function(data) {

        // Include mixin for cell contextmenu
        //qx.Class.include(qx.ui.table.Table, qx.ui.table.MTableContextMenu);

        // Always use Resize column model to be able to have specific size
        var tableColumnModelResize = {
            tableColumnModel : function(obj) {
                return new qx.ui.table.columnmodel.Resize(obj);
            }
        };

        // use simple table model
        var tableModel = new qx.ui.table.model.Simple();

        // Push columns
        var arr = [];
        var ids = [];

        Zen.Utils.objectForEach(data.columns,function(i,col) {
            arr.push(col.title);
            ids.push(col.id||col.title);
        },this);

        tableModel.setColumns(arr,ids);

        // Call qx.ui.table.Table with ours args
        this.base(arguments,tableModel,tableColumnModelResize);

        // selection model
        this.getSelectionModel().setSelectionMode(qx.ui.table.selection.Model.MULTIPLE_INTERVAL_SELECTION);

        var resizeBehavior = this.getTableColumnModel().getBehavior();
        Zen.Utils.objectForEach(data.columns,function(i,col) {
            i = parseInt(i);

            // Set columns width
            if (col.width) resizeBehavior.set(i, {width:col.width});

            // Set columns renderer
            if (col.renderer) this.getTableColumnModel().setDataCellRenderer(i,col.renderer);

            // Set visibility
            if (col.hidden) this.getTableColumnModel().setColumnVisible(i,false);

            if (col.primary) this.__primaryCol = i;

        },this);

    },
    members:{
        __primaryCol : null,

        getSelectedKey : function() {
            if (this.__primaryCol === null) return;
            var uid = this.getTableModel().getRowData(this.getFocusedRow())[this.__primaryCol];
            return uid;
        }
    }
});
