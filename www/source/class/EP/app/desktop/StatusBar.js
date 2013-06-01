qx.Class.define("EP.app.desktop.StatusBar", {

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

        /* sound volume */
        var sliderSound = new qx.ui.form.Slider().set({
            minimum: 0,
            maximum: 100,
            singleStep: 5,
            pageStep: 10,
            value: 100,
            orientation:'vertical',
            decorator:null
        });

        sliderSound.addListener('changeValue',function() {
            var v = sliderSound.getValue();
            soundIcon.setUserData('value',100-v);
            if (v == 100) {
                this.__soundIcon.setIcon('EP/sound_delete_gray.gif');
                return qx.core.Init.getApplication().__soundVolume = 0;
            } else {
                this.__soundIcon.setIcon('EP/sound_gray.gif');
            }
            qx.core.Init.getApplication().__soundVolume = (100 - v)/100;
        },this);

        var sliderContainer = new qx.ui.popup.Popup();
        sliderContainer.set({
            marginLeft:5,
            padding:2,
            layout:new qx.ui.layout.Canvas(),
            height:100,
            width:20
        })
        sliderContainer.add(sliderSound,{top:0,left:0,right:0,bottom:0});

        var soundIcon = this.__soundIcon = new qx.ui.form.MenuButton(null,"EP/sound_gray.gif",null).set({
            decorator : null,
            alignY : 'middle',
            paddingRight : 10,
            focusable:false
        });

        soundIcon.addListener('click',function(ev) {
            sliderSound.setValue(100-this.getUserData('value'));
            sliderContainer.setPosition('bottom-left');
            sliderContainer.placeToWidget(soundIcon);
            sliderContainer.show();
        })

        soundIcon.setUserData('value',100);
        qx.core.Init.getApplication().__soundVolume = 1;

        tb.add(soundIcon);
        //tb.add(sliderContainer);

        // network indicator
        this.__networkIcon = new qx.ui.form.MenuButton(null,"EP/net_off.gif",null).set({
            padding : 0,
            decorator : null,
            alignY : 'middle',
            paddingRight : 6,
            focusable:false
        });

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
                this.__networkIconTimer = null;
            },400,this);
        }
    }
});