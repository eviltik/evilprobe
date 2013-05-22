qx.Class.define("Zen.ui.form.Icon", {

    extend : qx.ui.container.Composite,

    construct:function(msg) {
    	this.base(arguments);
    	this.set({
    		layout:new qx.ui.layout.HBox(5)
       	});

		this.__icon = new qx.ui.basic.Image('Zen/w.gif').set({
			scale:false,
			height:16,
			width:16,
			alignY:'middle'
		});

		if (msg) {
			this.__firstMsg = msg;
			this.__icon.setSource('Zen/info.png');
		}

		this.__tooltip = new qx.ui.tooltip.ToolTip(msg||'');
		this.__tooltip.set({
			appearance:'tooltip-error',
			opener:this.__icon
		})
		this.__icon.setToolTip(this.__tooltip);
		this.add(this.__icon);
    },

    members:{
        __ok : false,

    	setLoading:function(msg) {
            this.__ok = false;
            if (!this.__icon||!this.__tooltip) return;
    		this.__icon.setSource('Zen/load.gif');
			if (msg) {
				this.__tooltip.setAppearance('tooltip');
    			this.__tooltip.setLabel(msg);
				this.__tooltip.placeToWidget(this.__icon,true);
				this.__tooltip.show();
			}
    	},

    	setError:function(msg) {
            this.__ok = false;            
            if (!this.__icon) return;
    		this.__icon.setSource('Zen/error.png');
    		this.__tooltip.setLabel(msg);
    		this.__tooltip.setAppearance('tooltip-error');
			this.__tooltip.placeToWidget(this.__icon,true);
			this.__tooltip.show();
    	},

    	setOk:function(msg) {
            this.__ok = true;
            if (!this.__icon) return;
    		this.__tooltip.hide();
    		this.__icon.setSource('Zen/check.png');
    		if (msg) {
    			this.__tooltip.setLabel(msg);
    			this.__tooltip.setAppearance('tooltip');
				this.__tooltip.placeToWidget(this.__icon,true);
				this.__tooltip.show();
			}
    	},

    	reset:function() {
            this.__ok = false;
            if (!this.__icon) return;
    		this.__tooltip.hide();
    		this.__icon.setSource('Zen/info.png');
			this.__tooltip.setAppearance('tooltip');
    		this.__tooltip.setLabel(this.__firstMsg);
    	},

        close:function() {
            qx.lang.Function.delay(this.__tooltip.hide,50,this.__tooltip);
        },
        
        getOk:function() {
            return this.__ok;
        }
    }
});
