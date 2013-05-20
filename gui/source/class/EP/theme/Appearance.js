/* ************************************************************************

   Copyright:

   License:

   Authors:

************************************************************************ */

qx.Theme.define("EP.theme.Appearance", {
	extend : qx.theme.modern.Appearance,
  	appearances : {
		"tree-folder" : {
    		include : "tree-item",
    		alias : "tree-item",

    		style : function(states) {
       			var icon, iconOpened;
       			if (states.small) {
       				icon = states.opened ? "EP/folder_opened.png" : "EP/folder_closed.png";
       				iconOpened = "EP/folder_opened.png";
       			} else if (states.large) {
       				icon = states.opened ? "icon/32/places/folder-open.png" : "icon/32/places/folder.png";
       				iconOpened = "icon/32/places/folder-open.png";
       			} else {
       				icon = states.opened ? "EP/folder_opened.png" : "EP/folder_closed.png";
       				iconOpened = "EP/folder_opened.png";
       			}

       			return {
       				icon : icon,
       				iconOpened : iconOpened
       			};
    		}
    	},
    	"treevirtual-folder" : {
      		style : function(states) {
        		return {
          			icon : states.opened ?
            		"EP/folder_opened.png" :
            		"EP/folder_closed.png"
        		};
      		}
    	}    	
  	}
});