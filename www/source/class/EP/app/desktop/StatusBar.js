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
                this.__networkIcon.setSource(this.__networkIconOn);
            }
            this.__networkIconTimer = qx.lang.Function.delay(function() {
                this.__networkIcon.setSource(this.__networkIconOff);
                this.__networkIconTimer = null;
            },400,this);
        },

        getEarthIcon:function() {
            /* earth map */

            this.__earthIcon = new qx.ui.basic.Image("EP/ico_earth_anim.gif").set({
                marginRight:10,
                decorator:null,
                alignY:'middle',
                focusable:false,
                height:16,
                width:16,
                scale:true,
                cursor:'pointer'
            });

            this.__earthIcon.addListener('click',function(ev) {
                var w = qx.core.Init.getApplication().getDesktop().__popupEarth;
                if (w.isVisible()) {
                    w.hide();
                } else {
                    w.show();
                }
            });

            this.__earthIcon.addListener('appear',function(ev) {
                qx.core.Init.getApplication().getDesktop().__popupEarth.show();
                qx.lang.Function.delay(function() {
                    qx.core.Init.getApplication().getDesktop().__popupEarth.hide();
                },500,this);
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
                    this.__soundIcon.setSource('EP/ico_sound_off.png');
                    return qx.core.Init.getApplication().__soundVolume = 0;
                } else {
                    this.__soundIcon.setSource('EP/ico_sound_on.png');
                }
                qx.core.Init.getApplication().__soundVolume = (100 - v)/100;
            },this);

            var sliderContainer = new qx.ui.popup.Popup();
            sliderContainer.set({
                padding:2,
                layout:new qx.ui.layout.Canvas(),
                height:100,
                width:20
            })
            sliderContainer.add(sliderSound,{top:0,left:0,right:0,bottom:0});

            var soundIcon = this.__soundIcon = new qx.ui.basic.Image("EP/ico_sound_on.png").set({
                marginRight:10,
                decorator : null,
                alignY : 'middle',
                focusable:false,
                cursor:'pointer'
            });

            soundIcon.addListener('click',function(ev) {
                sliderSound.setValue(100-this.getUserData('value'));
                sliderContainer.setPosition('bottom-center');
                sliderContainer.placeToWidget(soundIcon);
                sliderContainer.show();
            })

            soundIcon.setUserData('value',100);
            qx.core.Init.getApplication().__soundVolume = 1;

            return soundIcon;
        },

        getNetworkIcon:function() {
            // network indicator
            this.__networkIcon = new qx.ui.basic.Image("EP/net_off.gif").set({
                marginRight:10,
                decorator : null,
                alignY : 'middle',
                focusable:false,
                cursor:'pointer'
            });
            qx.event.message.Bus.subscribe('networkActivity',this.networkIconFlash,this);
            return this.__networkIcon;
        }
    }
});