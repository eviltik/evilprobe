qx.Class.define("EP.app.util.Xhr", {

    extend : qx.core.Object,

    construct: function(url,data,cb,caller) {

        this.__cb = cb;
        //console.log(cb);
        this.__caller = caller;

        url = '/ws/'+url;

        this.req = new qx.io.request.Xhr(url,'POST');
        if (data) this.req.setRequestData(data);

        this.req.addListener("success",this.__onSuccess,this);
        this.req.addListener("fail",this.__onFail,this);

    },

    members:{
        __cb:null,
        __caller:null,
        __desktop:null,
        __statusBar:null,

        __onFail : function(e) {

            //console.log('__onFail',e);
            /*
            e=e.getTarget();
            if (e.getStatus()!=200) {
                var msg = "An error occured :<br/>";
                msg+=e.getStatus()+" "+e.getStatusText()+"<br/><br/>";
                msg+="The server respond: ";
                msg+="<br/>"+e.getResponseText();
                dialog.Dialog.error(msg);
            }
            */
            if (!this.__cb) return;
            qx.lang.Function.bind(this.__cb,this.__caller)(e.getTarget(),null);
        },

        __onSuccess : function(e) {

            //console.log('__onSuccess',e);

            e=e.getTarget();
            if (!e.getResponse()) {
                dialog.Dialog.error("Error: the server sent an empty response (200)");
            } else {
                var o=e.getResponse();
                if (o && o.clienterror&&o.clienterror.stack) {
                    dialog.Dialog.error("Internal error:<br/><br/>"+o.clienterror.stack);
                    return;
                }
                if (o && o.sqlerror) {
                    dialog.Dialog.error("Internal error:<br/><br/>"+o.sqlerror);
                    return;
                }
                if (typeof o == 'string') {
                    dialog.Dialog.error("Internal error:<br/><br/>"+o);
                    return;
                }

                if (!this.__cb) return;
                qx.lang.Function.bind(this.__cb,this.__caller)(null,o);
            }
        },

        send:function() {
            qx.event.message.Bus.dispatch(new qx.event.message.Message('networkActivity'));
            this.req.send();
        }

    }
});

