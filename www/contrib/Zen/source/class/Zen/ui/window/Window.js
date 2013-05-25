qx.Class.define("Zen.ui.window.Window", {
    extend : qx.ui.window.Window,

    properties: {
        fadeInAppear:{
            init:true
        },
        fadeOutClose:{
            init:false
        },
        centered:{
            init:true
        },
        relativeWidth:{
            init:null,
            nullable:true
        },
        relativeHeight:{
            init:null,
            nullable:true
        }
    },

    construct:function() {

    	this.base(arguments);

        this.__desktop = qx.core.Init.getApplication().getRoot();

        this.addListener('appear',function(e) {
            if (this.getFadeInAppear()) {
                this.fadeIn(150);
            }
            if (this.getRelativeWidth()) {
                this.setMinWidth(400);
                this.setRelativeW();
                if (!this.__resizeListener) {
                    this.__resizeListener = this.__desktop.addListener('resize',this.setRelative,this);
                }
            }
            if (this.getRelativeHeight()) {
                this.setMinHeight(200);
                this.setRelativeH();
                if (!this.__resizeListener) {
                    this.__resizeListener = this.__desktop.addListener('resize',this.setRelative,this);
                };
            }
            if (this.getCentered()) {
                qx.lang.Function.delay(this.center,1,this);
            }
        });

        if (this.getFadeOutClose()) {
            this.addListener('beforeClose',function(e) {
                this.fadeOut(150);
                e.stop();
            },this);
        }
    },

    members:{
        __desktop:null,
        __resizeListener:null,

        __effectShake : {
            duration : 200,
            timing: "linear",
            repeat: 2,
            keyFrames : {
                25 : {translate : ["-30px",null]},
                75 : {translate : ["+30px",null]}
            }
        },

        setRelative:function() {
            this.setRelativeW();
            this.setRelativeH();
            if (this.getCentered()) {
                qx.lang.Function.delay(this.center,1,this);
            }
        },

        setRelativeW : function() {
            var rw = this.getRelativeWidth();
            if (!rw.match(/%/)) {
                return qx.log.Logger.error(Zen.ui.window.Window,"Relative width "+rw+" doesn't contain '%'");
            }
            rw = Math.round((parseInt(rw) * qx.bom.Document.getWidth())/100);
            this.setWidth(rw);
        },

        setRelativeH : function() {
            var rh = this.getRelativeHeight();
            if (!rh.match(/%/)) {
                return qx.log.Logger.error(Zen.ui.window.Window,"Relative width "+rh+" doesn't contain '%'");
            }
            rh = Math.round((parseInt(rh) * qx.bom.Document.getHeight())/100);
            this.setHeight(rh);
        },

        animFadeIn:function() {
            var el = this.getContentElement().getDomElement();
            var ef = qx.bom.element.Animation.animate(el,this.__effectFade);
        },

        animFadeOut:function() {
            var el = this.getContentElement().getDomElement();
            var ef = qx.bom.element.Animation.animateReverse(el,this.__effectFade);
            ef.addListener('end',function(e){
                this.setOpacity(0);
                this.setVisibility('hidden');
                if (this.getDestroyOnClose()) {
                    this.destroy();
                } else {
                    this.close();
                }
            },this);
        },

        animShake:function() {
            var el = this.getContentElement().getDomElement();
            var effect = qx.bom.element.Animation.animate(el,this.__effectShake);
        }
    }
});

