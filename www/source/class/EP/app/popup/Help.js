qx.Class.define("EP.app.popup.Help", {

    extend : Zen.ui.window.Window,

    construct:function() {

        this.base(arguments);

    	this.set({
    		contentPadding:20,
    		resizable:false,
    		showMinimize:false,
    		showMaximize:false,
            showClose:true,
    		margin:0,
    		caption:'Ressources',
    		layout:new qx.ui.layout.Grow,
    		modal:false, // If true, key events will not be handled by textFields
            fadeInAppear:true,
            fadeOutClose:true,
            centered:true
    	})

        this.add(this.__getContent());
        this.open();
    },
    members:{

        __getContent:function() {
            var f = new qx.ui.container.Composite();
            f.setLayout(new qx.ui.layout.VBox(5));

            var l = new qx.ui.basic.Label('<a href="http://www.exploit-db.com/" target="new">www.exploit-db.com</a>').set({rich:true});
            f.add(l);

            var l = new qx.ui.basic.Label('<a href="http://www.idcloak.com/proxylist/proxy-list.html" target="new">Proxy list</a>').set({rich:true});
            f.add(l);

            var l = new qx.ui.basic.Label('<a href="http://www.di.fm/" target="new">Pure zik</a>').set({rich:true});
            f.add(l);

            var l = new qx.ui.basic.Label('<a href="https://github.com/kissjs/node-mongoskin/tree/master/examples" target="new">Mongoskin</a>').set({rich:true});
            f.add(l);

            return f;
        }
    }
});

