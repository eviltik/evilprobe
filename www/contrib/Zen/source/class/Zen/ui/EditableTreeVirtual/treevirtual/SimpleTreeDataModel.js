qx.Mixin.define("Zen.ui.EditableTreeVirtual.treevirtual.SimpleTreeDataModel", {
  members :  {
    isColumnEditable : function(columnIndex) {

      // Patch to handle editable treevirtual

      // The tree column is not editable
      /*
      if (columnIndex == this._treeColumn) {
      {
        return false;
      }
      */
      // End of patch

      return (this.__editableColArr
             ? this.__editableColArr[columnIndex] == true
             : false);
    },

    // overridden
    setValue : function(columnIndex, rowIndex, value)
    {
        //console.log('Mixin: setValue');
    if (columnIndex == this._treeColumn)
      {
        // Ignore requests to set the tree column data using this method
        return;
      }

      // convert from rowArr to nodeArr, and get the requested node
      var node = this.getNodeFromRow(rowIndex);

      if (node.columnData[columnIndex] != value)
      {
        node.columnData[columnIndex] = value;
        this.setData();

        // Inform the listeners
        if (this.hasListener("dataChanged"))
        {
          var data =
          {
            firstRow    : rowIndex,
            lastRow     : rowIndex,
            firstColumn : columnIndex,
            lastColumn  : columnIndex
          };

          this.fireDataEvent("dataChanged", data);
        }
      }
    }
  }
});
