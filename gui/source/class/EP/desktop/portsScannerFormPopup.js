qx.Class.define("EP.view.portsScannerFormPopup", {
    extend : qx.ui.window.Window,
    construct:function() {

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

    	var f = new EP.view.portsScannerForm({popup:this})
    	f.addListener('done',function() {
    		this.close();
    	},this);

    	this.add(f);
    }
});