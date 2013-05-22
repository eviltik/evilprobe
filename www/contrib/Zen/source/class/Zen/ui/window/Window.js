qx.Class.define("Zen.ui.window.Window", {
    extend : qx.ui.window.Window,

    properties: {
        fadeInAppear:{
            init:true
        },
        fadeOutClose:{
            init:false
        },
        center:{
            init:true
        }
    },

    construct:function() {

    	this.base(arguments);

        if (this.getCenter()) {
            this.addListener('appear',function(e) {
                this.center();
                if (this.getFadeInAppear()) {
                    this.fadeIn(150);
                }
            });
        }

        if (this.getFadeOutClose()) {
            this.addListener('beforeClose',function(e) {
                this.fadeOut(150);
                e.stop();
            },this);
        }
    },

    members:{

        __effectShake : {
            duration : 200, 
            timing: "linear", 
            repeat: 2,
            keyFrames : {
                25 : {translate : ["-30px",null]},           
                75 : {translate : ["+30px",null]}
            }
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

