qx.Class.define("Zen.ui.window.Alert", {
    extend : Zen.ui.window.Window,

    construct:function(message) {
    	this.base(arguments);

        this.__message = message;

        this.set({
            contentPadding:5,
            resizable:true,
            showMinimize:false,
            showMaximize:false,
            showClose:true,
            margin:0,
            caption:'Error',
            layout:new qx.ui.layout.Grow,
            modal:true,
            fadeOutClose:true,
            centered:true
        })

        this.add(this.__getContent());

        this.addListener('appear',function() {
            this.center();
            this.animShake();
            this.__buttonOk.focus();
        });

        this.addListener('keypress',function(ev) {
            var k = ev.getKeyIdentifier();

            if (k == 'Enter' || k == 'Escape' || k == 'Space') {
                this.__buttonOk.focus();
                this.close();
            }
        });

        this.show();
    },

    members:{
        __getContent:function() {
            var f = new qx.ui.container.Composite();
            f.setLayout(new qx.ui.layout.VBox);

            var c = new qx.ui.container.Composite(new qx.ui.layout.HBox);
            c.add(this.__getImage(),{flex:1});

            var h = new qx.ui.container.Composite(new qx.ui.layout.VBox);
            h.add(this.__getHtmlArea());
            c.add(new qx.ui.core.Spacer(10));
            c.add(h,{flex:1});
            f.add(c);

            var c = new qx.ui.container.Composite(new qx.ui.layout.Canvas(0,0));
            c.setDecorator('group-css');
            c.setPadding(5);
            c.add(this.__getButtonOk(),{right: 0});
            f.add(new qx.ui.core.Spacer(10));
            f.add(c);
            return f;
        },

        __getImage:function() {
            var i = new qx.ui.basic.Image('EP/stop.png');
            i.setScale(true);
            i.setHeight(50);
            i.setWidth(50);
            i.setMargin(8);
            return i;
        },

        __getHtmlArea:function() {
            var h = new qx.ui.basic.Label(this.__message).set({
                marginTop:10,
                marginRight:10,
                rich:true
            });
            return h;
        },

        __getButtonOk:function() {
            var bt = new qx.ui.form.Button("OK", "EP/check.png");
            bt.addListener('execute',this.__clickButtonOk,this);
            this.__buttonOk =bt;
            return bt;
        },

        __clickButtonOk:function() {
            this.close();
        }
    }
});

