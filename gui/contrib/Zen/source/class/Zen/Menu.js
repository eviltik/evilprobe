qx.Class.define("Zen.Menu", {
    extend : qx.ui.menu.Menu,
    construct : function() {

        this.base(arguments);

        this.addListener('appear',this.iframeUpdate,this);
        this.addListener('resize',this.iframeUpdate,this);
    },
    members:{
        iframeCreate:function() {
            var c=this.getContainerElement();
            if (!c) return;

            c=c.getDomElement();
            if (!c) return;

            var frame=document.createElement('iframe');
            frame.src='about:blank';
            frame.setAttribute('frameborder',0);
            frame.setAttribute('border',0);
            c.insertBefore(frame);
            return frame;
        },
        iframeStyle:function() {
            var c=this.getContainerElement();
            if (!c) return;

            c=c.getDomElement();
            if (!c) return;

            if (!this.__iframe) this.__iframe=this.iframeCreate();
            if (!this.__iframe) return;

            this.__iframe.setAttribute('style',c.style.cssText);
            this.__iframe.style.zIndex=-1;
            this.__iframe.style.top=0;
            this.__iframe.style.left=0;
        },
        iframeUpdate:function() {
            qx.lang.Function.delay(this.iframeStyle,10,this);
        }
    }
});

