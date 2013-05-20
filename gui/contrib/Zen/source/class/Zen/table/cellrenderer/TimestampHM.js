/**
 * A data cell renderer for boolean values.
 */
qx.Class.define("Zen.table.cellrenderer.TimestampHM", {
    extend : qx.ui.table.cellrenderer.Conditional,
    members : {
        _formatD:function(n) {
            if (parseInt(n)<10) n='0'+n;
            return n;
        },
        _getContentHtml : function(cellInfo) {
            if (!cellInfo.value) return '';

            var da = new Date(parseInt(cellInfo.value));
            var y = da.getFullYear();
            var m = this._formatD(da.getMonth());
            var d = this._formatD(da.getDate());

            var h = this._formatD(da.getHours());
            var mn = this._formatD(da.getMinutes());

            return h+':'+mn;
            //return y+'/'+m+'/'+d+' '+h+':'+mn;
        }
    }
});