qx.Class.define("Zen.ui.toolbar.Button", {
    extend : qx.ui.toolbar.Button,
    construct:function(label,icon,command) {
    	this.base(arguments,label,icon,command);
    	this.setCursor('pointer');
    }
});