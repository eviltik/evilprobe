qx.Class.define("EP.desktop.portsScannerFormPopup", {
    extend : qx.ui.window.Window,
    construct:function(args) {

    	this.base(arguments);

    	this.set({
    		contentPadding:0,
    		resizable:false,
    		showMinimize:false,
    		showMaximize:false,
    		margin:0,
    		width:300,
    		caption:'Ports Scanner',
    		layout:new qx.ui.layout.Grow,
    		modal:true
    	})

    	this.addListener('appear',function() {
    		this.center();
    	});

        if (!args) args = {};
        args.popup = this;

    	var f = new EP.desktop.portsScannerForm(args)
    	f.addListener('done',function() {
    		this.close();
    	},this);

    	this.add(f);
    }
});