qx.Class.define("EP.ui.table.rowrenderer.Jobs", {
  extend : qx.ui.table.rowrenderer.Default,
  members : {

        /** Overridden to handle our custom logic for row colouring */
        updateDataRowElement : function(rowInfo, rowElem) {

            // Call super first
            this.base(arguments, rowInfo, rowElem);

            // Get the current style
            var style = rowElem.style;

            // Don't overwrite the style on the focused / selected row
            if (!(rowInfo.focusedRow && this.getHighlightFocusRow()) && !rowInfo.selected) {

                // Apply our rule for row colouring
                style.backgroundColor = (rowInfo.rowData[1] > 5000) ? this._colors.bgcolEven : this._colors.bgcolOdd;

            }

        },

        /** Overridden to handle our custom logic for row colouring */
        createRowStyle : function(rowInfo) {

            this._colors.bgcolFocusedSelected='red';
            this._colors.bgcolFocused='green';

            // Create some style
            var rowStyle = [];
            rowStyle.push(";");
            rowStyle.push(this.__fontStyleString);
            rowStyle.push("background-color:");

            // Are we focused? 
            if (rowInfo.focusedRow && this.getHighlightFocusRow()) {

                // Handle the focused / selected row as normal
                rowStyle.push(rowInfo.selected ? this._colors.bgcolFocusedSelected : this._colors.bgcolFocused);

            } else {

                // Aew we selected?
                if (rowInfo.selected) {

                    // Handle the selected row as normal
                    rowStyle.push(this._colors.bgcolSelected);

                } else {

                    // Apply our rule for row colouring
                    rowStyle.push((rowInfo.rowData[1] > 5000) ? this._colors.bgcolEven : this._colors.bgcolOdd);

                }

            }

            // Finish off the style string
            rowStyle.push(';color:');
            rowStyle.push(rowInfo.selected ? this._colors.colSelected : this._colors.colNormal);
            rowStyle.push(';border-bottom: 1px solid ', this._colors.horLine);
            return rowStyle.join("");

        }

    }

});