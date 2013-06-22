qx.Class.define("EP.app.desktop.StatusBar", {

    extend : qx.ui.container.Composite,

    construct:function() {
        this.base(arguments);
        this.set({
            layout:new qx.ui.layout.Grow(),
            height:32,
            margin:3,
            marginBottom:0,
            padding:2,
            decorator:'menu'
        })

        var tb = new qx.ui.toolbar.ToolBar();
        tb.add(new qx.ui.toolbar.Separator());
        tb.addSpacer();

        this.__initSound();

        tb.add(this.getEarthIcon());
        tb.add(this.getSoundIcon());
        tb.add(this.getNetworkIcon());
        this.add(tb);

        qx.event.message.Bus.subscribe('playSound',this.playSound,this);

    },
    members:{

        __networkIcon:null,
        __networkIconOn : 'EP/net_on.gif',
        __networkIconOff : 'EP/net_off.gif',
        __networkIconTimer:null,

        __earthIcon:null,
        __soundIcon:null,

        __beepUri: null,

        playSound:function() {
            var beep = this.__sounds[this.__soundPointer];
            var v = qx.core.Init.getApplication().getSoundVolume();
            beep.setVolume(v);
            beep.play();
            this.__soundPointer++;
            if (this.__soundPointer == 5) {
                this.__soundPointer = 0;
            }
        },

        __initSound:function() {
            if (qx.core.Environment.get("html.audio.mp3")) {
                var u = qx.util.ResourceManager.getInstance().toUri("EP/sound/6370.mp3");
                this.__sounds = [];
                this.__soundPointer = 0;
                for (var i = 0; i<5 ; i++) {
                    // preload
                    qx.lang.Function.delay(function() {
                        this.__sounds.push(new qx.bom.media.Audio(u));
                    },i*100,this);
                }
            }
        },

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
                value: qx.core.Init.getApplication().getSoundVolume()*100,
                orientation:'vertical',
                decorator:null
            });

            sliderSound.addListener('changeValue',function() {
                var v = sliderSound.getValue();
                soundIcon.setUserData('value',100-v);
                if (v == 100) {
                    this.__soundIcon.setSource('EP/ico_sound_off.png');
                    return qx.core.Init.getApplication().setSoundVolume(0);
                } else {
                    this.__soundIcon.setSource('EP/ico_sound_on.png');
                }
                qx.core.Init.getApplication().setSoundVolume((100 - v)/100);
                qx.event.message.Bus.dispatch(new qx.event.message.Message('playSound'));
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

            soundIcon.setUserData('value',qx.core.Init.getApplication().getSoundVolume()*100);

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