qx.Mixin.define("Zen.ui.EditableTreeVirtual.treevirtual.TreeVirtual", {
  members : {
    _onKeyPress : function(evt)
    {
    //console.log('Mixin: _onKeyPress');

      if (!this.getEnabled())
      {
        return;
      }

      // Patch to handle editable treevirtual
      if (this.isEditing()) {
          //console.log('Mixin: Editing mode !');
          //this.base(arguments, evt);
          arguments.callee.base.base.call(this,evt);
          return;
      }
      // End of patch

      var identifier = evt.getKeyIdentifier();

      var consumed = false;
      var modifiers = evt.getModifiers();

      if (modifiers == 0)
      {
        switch(identifier)
        {
          case "Enter":
            // Get the data model
            var dm = this.getDataModel();

            var focusedCol = this.getFocusedColumn();
            var treeCol = dm.getTreeColumn();

            if (focusedCol == treeCol)
            {
              // Get the focused node
              var focusedRow = this.getFocusedRow();
              var node = dm.getNode(focusedRow);

              if (! node.bHideOpenClose &&
                  node.type != qx.ui.treevirtual.SimpleTreeDataModel.Type.LEAF)
              {
                dm.setState(node, { bOpened : ! node.bOpened });
              }

              consumed = true;
            }
            break;

          case "Left":
            this.moveFocusedCell(-1, 0);
            break;

          case "Right":
            this.moveFocusedCell(1, 0);
            break;
        }
      }
      else if (modifiers == qx.event.type.Dom.CTRL_MASK)
      {
        switch(identifier)
        {
          case "Left":
            // Get the data model
            var dm = this.getDataModel();

            // Get the focused node
            var focusedRow = this.getFocusedRow();
            var treeCol = dm.getTreeColumn();
            var node = dm.getNode(focusedRow);

            // If it's an open branch and open/close is allowed...
            if ((node.type ==
                 qx.ui.treevirtual.SimpleTreeDataModel.Type.BRANCH) &&
                ! node.bHideOpenClose &&
                node.bOpened)
            {
              // ... then close it
              dm.setState(node, { bOpened : ! node.bOpened });
            }

            // Reset the focus to the current node
            this.setFocusedCell(treeCol, focusedRow, true);

            consumed = true;
            break;

          case "Right":
            // Get the data model
            var dm = this.getDataModel();

            // Get the focused node
            focusedRow = this.getFocusedRow();
            treeCol = dm.getTreeColumn();
            node = dm.getNode(focusedRow);

            // If it's a closed branch and open/close is allowed...
            if ((node.type ==
                 qx.ui.treevirtual.SimpleTreeDataModel.Type.BRANCH) &&
                ! node.bHideOpenClose &&
                ! node.bOpened)
            {
              // ... then open it
              dm.setState(node, { bOpened : ! node.bOpened });
            }

            // Reset the focus to the current node
            this.setFocusedCell(treeCol, focusedRow, true);

            consumed = true;
            break;
        }
      }
      else if (modifiers == qx.event.type.Dom.SHIFT_MASK)
      {
        switch(identifier)
        {
          case "Left":
            // Get the data model
            var dm = this.getDataModel();

            // Get the focused node
            var focusedRow = this.getFocusedRow();
            var treeCol = dm.getTreeColumn();
            var node = dm.getNode(focusedRow);

            // If we're not at the top-level already...
            if (node.parentNodeId)
            {
              // Find out what rendered row our parent node is at
              var rowIndex = dm.getRowFromNodeId(node.parentNodeId);

              // Set the focus to our parent
              this.setFocusedCell(this._focusedCol, rowIndex, true);
            }

            consumed = true;
            break;

          case "Right":
            // Get the data model
            var dm = this.getDataModel();

            // Get the focused node
            focusedRow = this.getFocusedRow();
            treeCol = dm.getTreeColumn();
            node = dm.getNode(focusedRow);

            // If we're on a branch and open/close is allowed...
            if ((node.type ==
                 qx.ui.treevirtual.SimpleTreeDataModel.Type.BRANCH) &&
                ! node.bHideOpenClose)
            {
              // ... then first ensure the branch is open
              if (! node.bOpened)
              {
                dm.setState(node, { bOpened : ! node.bOpened });
              }

              // If this node has children...
              if (node.children.length > 0)
              {
                // ... then move the focus to the first child
                this.moveFocusedCell(0, 1);
              }
            }

            consumed = true;
            break;
        }
      }

      // Was this one of our events that we handled?
      if (consumed)
      {
        // Yup.  Don't propagate it.
        evt.preventDefault();
        evt.stopPropagation();
      }
      else
      {
        // It's not one of ours.  Let our superclass handle this event
        this.base(arguments, evt);
      }
    }
  }
});
