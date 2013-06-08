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

        tb.add(this.getEarthIcon());
        tb.add(this.getSoundIcon());
        tb.add(this.getNetworkIcon());
        this.add(tb);
    },
    members:{

        __networkIcon:null,
        __networkIconOn : 'EP/net_on.gif',
        __networkIconOff : 'EP/net_off.gif',
        __networkIconTimer:null,

        __earthIcon:null,
        __soundIcon:null,

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
        },

        getEarthIcon:function() {
            /* earth map */
            this.__earthIcon = new qx.ui.form.MenuButton(null,"EP/ico_earth.png",null).set({
                padding:0,
                decorator : null,
                alignY : 'middle',
                focusable:false
            });
            return this.__earthIcon;
        },

        getSoundIcon:function() {
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
                    this.__soundIcon.setIcon('EP/ico_sound_off.png');
                    return qx.core.Init.getApplication().__soundVolume = 0;
                } else {
                    this.__soundIcon.setIcon('EP/ico_sound_on.png');
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

            var soundIcon = this.__soundIcon = new qx.ui.form.MenuButton(null,"EP/ico_sound_on.png",null).set({
                decorator : null,
                alignY : 'middle',
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

            return soundIcon;
        },

        getNetworkIcon:function() {
            // network indicator
            this.__networkIcon = new qx.ui.form.MenuButton(null,"EP/net_off.gif",null).set({
                padding : 0,
                decorator : null,
                alignY : 'middle',
                paddingRight : 6,
                focusable:false
            });
            qx.event.message.Bus.subscribe('networkActivity',this.networkIconFlash,this);
            return this.__networkIcon;
        }
    }
});