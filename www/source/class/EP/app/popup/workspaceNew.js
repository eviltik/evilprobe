qx.Class.define("EP.app.popup.workspaceNew", {

    extend : Zen.ui.window.Window,

    construct:function() {

        this.base(arguments);

    	this.set({
    		contentPadding:5,
    		resizable:false,
    		showMinimize:false,
    		showMaximize:false,
            showClose:true,
    		margin:0,
    		width:400,
    		caption:'New Workspace',
    		layout:new qx.ui.layout.Grow,
    		modal:true,
            fadeInAppear:true,
            fadeOutClose:true,
            center:true
    	})

        this.add(this.__getForm());
        this.open();
    },

    members:{
        __data:{},
        __inputWorkspaceName:null,
        __form:null,
        __labelResponse:null,
        __buttonOk:null,
        __buttonCancel:null,
        __previousWorkspaceName:'',

        __getForm:function() {
            var f = new qx.ui.container.Composite();
            f.setLayout(new qx.ui.layout.VBox);

            var h = new qx.ui.container.Composite(new qx.ui.layout.VBox(5));
            h.add(this.__getInputWorkspaceName());
            h.add(this.__getLabelResponse());
            f.add(h);

            var c = new qx.ui.container.Composite(new qx.ui.layout.Canvas(0,0));
            c.setDecorator('group-css');
            c.setPadding(5);
            c.add(this.__getButtonCancel(),{left: 0});
            c.add(this.__getButtonOk(),{right: 0});
            f.add(new qx.ui.core.Spacer(10));
            f.add(c);

            /*
            var c = new qx.ui.container.Composite(new qx.ui.layout.HBox(5));
            c.add(new qx.ui.core.Widget().set({height:20}),{flex:2});
            c.add(this.__getButtonCancel());
            c.add(this.__getButtonOk());
            f.add(new qx.ui.core.Spacer(10));
            */

            this.__form = f;
            return f;
        },

        __getInputWorkspaceName : function() {
            var c  = new qx.ui.container.Composite(new qx.ui.layout.HBox(5));

            var input = new qx.ui.form.TextField().set({
                placeholder:'Workspace display name'
            })

            input.addListener('appear',function() {
                qx.lang.Function.delay(input.focus,1,input);
            },this);

            input.addListener('keyup',this.__checkForm,this);

            var message = new Zen.ui.form.Icon('Give a name');

            c.add(input,{flex:5});
            c.add(message);

            this.__inputWorkspaceName = input;
            this.__inputWorkspaceNameMessage = message;

            return c;
        },

        __getLabelResponse : function() {
            this.__labelResponse = new qx.ui.basic.Label().set({
                rich:true,
                marginLeft:4
            });
            return this.__labelResponse;
        },

        __getButtonOk:function() {
            var bt = new qx.ui.form.Button("OK", "EP/ok.png");
            bt.setEnabled(false);
            bt.addListener('execute',this.__doSave,this);
            this.__buttonOk = bt;
            return bt;
        },

        __getButtonCancel:function() {
            var bt = new qx.ui.form.Button("Cancel", "EP/cancel.png");
            bt.setEnabled(true);
            bt.addListener('execute',this.__doCancel,this);
            this.__buttonCancel = bt;
            return bt;
        },

        __isValid : function() {

            var c = this.__inputWorkspaceName.getValue();

            if (c) {
                // Remove space at the beginning
                c = c.replace(/^ */,'');
                this.__inputWorkspaceName.setValue(c);
            }

            if (!c) {

                this.__inputWorkspaceNameMessage.reset();
                this.__inputWorkspaceName.setValid(true);
                this.__previousWorkspaceName='';
                this.__buttonOk.setEnabled(false);

            } else if (this.__previousWorkspaceName!=c) {

                this.__data.workspaceName = c;
                this.__inputWorkspaceNameMessage.setLoading();
                this.__buttonOk.setEnabled(false);
                new EP.utils.xhr('workspace/mines/exist',this.__data,this.__onCheck,this).send();
                this.__previousWorkspaceName = c;
            }
        },

        __checkForm : function(ev) {
            if (ev.getKeyCode() == 27) {
                return this.__doCancel();
            }

            if (ev.getKeyCode() == 13 &&this.__buttonOk.getEnabled()) {
                return this.__doSave();
            }

            this.__isValid();
        },

        __doSave : function() {
            new EP.utils.xhr('workspace/mines/create',this.__data,this.__onSave,this).send();
        },

        __doCancel : function() {
            this.__inputWorkspaceNameMessage.close();
            this.close();
        },

        __onCheck:function(err,res) {
            if (err) {
                this.__buttonOk.setEnabled(false);
                return this.__inputWorkspaceNameMessage.setError(err.getResponseText());
            }
            if (res.error) {
                this.__buttonOk.setEnabled(false);
                return this.__inputWorkspaceNameMessage.setError(res.error);
            }
            this.__buttonOk.setEnabled(true);
            this.__inputWorkspaceNameMessage.setOk();
        },

        __onSave : function(err,res) {
            if (err) {
                this.__labelResponse.setValue('<font color="red"><b>'+err.getStatus()+' '+err.getResponseText()+'</b></font>');
                return;
            }

            this.__labelResponse.setValue('<font color="green"><b>Saved successfully</b></font>');
            this.close();
            qx.event.message.Bus.dispatch(new qx.event.message.Message('workspacesLoad',[{_id:res.workspace._id}]));
        }
    }
});

