qx.Class.define("EP.desktop.StatusBar", {

    extend : qx.ui.container.Composite,

    construct:function() {
        this.base(arguments);
        this.set({
            layout:new qx.ui.layout.Grow(),
            height:32
        })

        var tb = new qx.ui.toolbar.ToolBar();
        tb.add(new qx.ui.toolbar.Separator());
        tb.addSpacer();

        // network indicator
        this.__networkIcon = new qx.ui.form.MenuButton(null,"EP/net_off.gif",null).set({
            padding : 0,
            decorator : null,
            alignY : 'middle',
            paddingRight : 6,
            focusable:false
        })
        tb.add(this.__networkIcon);

        this.add(tb);

        qx.event.message.Bus.subscribe('networkActivity',this.networkIconFlash,this);
    },
    members:{

        __networkIcon:null,
        __networkIconOn : 'EP/net_on.gif',
        __networkIconOff : 'EP/net_off.gif',
        __networkIconTimer:null,

        networkIconFlash:function() {
            if (this.__networkIconTimer) {
                clearTimeout(this.__networkIconTimer)
            } else {
                this.__networkIcon.setIcon(this.__networkIconOn);
            }
            this.__networkIconTimer = qx.lang.Function.delay(function() {
                this.__networkIcon.setIcon(this.__networkIconOff);
                this.__networkIconTimer=null;
            },400,this);
        }
    }
});