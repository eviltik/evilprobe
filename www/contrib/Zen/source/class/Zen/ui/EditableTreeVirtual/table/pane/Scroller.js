qx.Mixin.define("Zen.ui.EditableTreeVirtual.table.pane.Scroller", {
  members : {
    startEditing : function() {
        //console.log('Mixin: starEditing');
      var table = this.getTable();
      var tableModel = table.getTableModel();
      var col = this.__focusedCol;

      if (
        !this.isEditing() &&
        (col != null) &&
        tableModel.isColumnEditable(col)
      ) {
        var row = this.__focusedRow;
        var xPos = this.getTablePaneModel().getX(col);
        var value = tableModel.getValue(col, row);

        // Patch to handle editable treevirtual
        if (typeof value=='object' && value.label) {
            value = value.label;
        }
        // End of patch

        // scroll cell into view
        this.scrollCellVisible(xPos, row);

        this.__cellEditorFactory = table.getTableColumnModel().getCellEditorFactory(col);

        var cellInfo =
        {
          col   : col,
          row   : row,
          xPos  : xPos,
          value : value,
          table : table
        };

        // Get a cell editor
        this.__cellEditor = this.__cellEditorFactory.createCellEditor(cellInfo);

        // We handle two types of cell editors: the traditional in-place
        // editor, where the cell editor returned by the factory must fit in
        // the space of the table cell; and a modal window in which the
        // editing takes place.  Additionally, if the cell editor determines
        // that it does not want to edit the particular cell being requested,
        // it may return null to indicate that that cell is not editable.
        if (this.__cellEditor === null)
        {
          // This cell is not editable even though its column is.
          return false;
        }
        else if (this.__cellEditor instanceof qx.ui.window.Window)
        {
          // It's a window.  Ensure that it's modal.
          this.__cellEditor.setModal(true);

          // At least for the time being, we disallow the close button.  It
          // acts differently than a cellEditor.close(), and invokes a bug
          // someplace.  Modal window cell editors should provide their own
          // buttons or means to activate a cellEditor.close() or equivalently
          // cellEditor.hide().
          this.__cellEditor.setShowClose(false);

          // Arrange to be notified when it is closed.
          this.__cellEditor.addListener(
            "close",
            this._onCellEditorModalWindowClose,
            this);

          // If there's a pre-open function defined for the table...
          var f = table.getModalCellEditorPreOpenFunction();
          if (f != null) {
            f(this.__cellEditor, cellInfo);
          }

          // Open it now.
          this.__cellEditor.open();
        }
        else
        {
          // The cell editor is a traditional in-place editor.
          var size = this.__focusIndicator.getInnerSize();
          this.__cellEditor.setUserBounds(0, 0, size.width, size.height);

          // prevent click event from bubbling up to the table
          this.__focusIndicator.addListener("mousedown", function(e)
          {
            this.__lastMouseDownCell = {
              row : this.__focusedRow,
              col : this.__focusedCol
            };
            e.stopPropagation();
          }, this);

          this.__focusIndicator.add(this.__cellEditor);
          this.__focusIndicator.addState("editing");
          this.__focusIndicator.setKeepActive(false);

          // Make the focus indicator visible during editing
          this.__focusIndicator.setDecorator("table-scroller-focus-indicator");

          this.__cellEditor.focus();
          this.__cellEditor.activate();
        }

        return true;
      }

      return false;
    },


    /**
     * Writes the editor's value to the model.
     */
    flushEditor : function()
    {
        //console.log('Mixin: flushEditor');
      if (this.isEditing())
      {

        var value = this.__cellEditorFactory.getCellEditorValue(this.__cellEditor);
        var oldValue = this.getTable().getTableModel().getValue(this.__focusedCol, this.__focusedRow);

        // Patch to handle editable treevirtual
        if (typeof oldValue == 'object' && oldValue.label) {
            oldValue.label = value;
            value = oldValue;
        }
        // End of patch

        this.getTable().getTableModel().setValue(this.__focusedCol, this.__focusedRow, value);

        this.__table.focus();

        // Fire an event containing the value change.
        this.__table.fireDataEvent("dataEdited",
                                   {
                                     row      : this.__focusedRow,
                                     col      : this.__focusedCol,
                                     oldValue : oldValue,
                                     value    : value
                                   });
      }
    }
  }
});
