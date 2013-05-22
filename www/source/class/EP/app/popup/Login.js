qx.Class.define("EP.app.popup.Login", {

    extend : Zen.ui.window.Window,

    events : {
        "authenticated"   : "qx.event.type.Data"
    },

    construct:function() {

        this.base(arguments);

    	this.set({
    		contentPadding:5,
    		resizable:false,
    		showMinimize:false,
    		showMaximize:false,
            showClose:false,
    		margin:0,
    		width:300,
    		caption:'EvilProbe Authentication',
    		layout:new qx.ui.layout.Grow,
    		modal:true, // If true, key events will not be handled by textFields
            fadeInAppear:true,
            fadeOutClose:true,
            center:true
    	})

        this.add(this.__getWait());
        this.add(this.__getForm());
        this.open();

        qx.lang.Function.delay(function() {
            new EP.utils.xhr(this.__urlAuthCheck,null,this.__onAuthCheck,this).send();
        },500,this);

    },
    members:{
        __data:{},
        __logo:null,
        __inputLogin:null,
        __inputPassword:null,
        __wait:null,
        __form:null,
        __buttonOk:null,
        __labelResponse:null,
        __labelWait:null,
        __urlAuthLogin:'auth/login',
        __urlAuthCheck:'auth/check',

        __onAuthCheck:function(err,res) {
            if (!res||res.authenticated == 'undefined') {
                dialog.Dialog.error("Fatal error while verifying session<br/>Please check server side if all is ok.");
                return;
            }

            if (!res.authenticated) {
                this.__wait.setVisibility('hidden');
                this.__form.setVisibility('visible');
                return;
            }
            this.close();
            this.fireDataEvent('authenticated',res);
        },

        __getWait:function() {
            var f = new qx.ui.container.Composite();
            f.setLayout(new qx.ui.layout.VBox);

            var c = new qx.ui.container.Composite(new qx.ui.layout.HBox).set({marginTop:10});
            c.add(this.__getLogo(),{flex:1});

            var h = new qx.ui.container.Composite(new qx.ui.layout.VBox);
            h.add(this.__getLabelWait());

            c.add(new qx.ui.core.Spacer(10));
            c.add(h,{flex:1});
            f.add(c);
            this.__wait = f;
            return f;
        },

        __getForm:function() {
            var f = new qx.ui.container.Composite();
            f.setLayout(new qx.ui.layout.VBox);

            var c = new qx.ui.container.Composite(new qx.ui.layout.HBox).set({marginTop:10});
            c.add(this.__getLogo(),{flex:1});

            var h = new qx.ui.container.Composite(new qx.ui.layout.VBox);
            h.add(this.__getInputLogin());
            h.add(this.__getInputPassword());
            h.add(this.__getLabelResponse());
            c.add(new qx.ui.core.Spacer(10));
            c.add(h,{flex:1});
            f.add(c);

            var c = new qx.ui.container.Composite(new qx.ui.layout.Canvas(0,0));
            c.setDecorator('group-css');
            c.setPadding(5);
            c.add(this.__getButtonOk(),{right: 0});
            f.add(new qx.ui.core.Spacer(10));
            f.add(c);
            f.hide();

            this.__form = f;
            return f;
        },

        __getLogo : function() {
            this.__logo = new qx.ui.basic.Image('EP/logo.png');
            this.__logo.setScale(true);
            this.__logo.setHeight(50);
            this.__logo.setWidth(50);
            this.__logo.setMarginTop(8);
            this.__logo.setMarginLeft(8);
            return this.__logo;
        },

        __getInputLogin : function() {
            var input = new qx.ui.form.TextField().set({
                margin:5,
                placeholder:'Login',
                invalidMessage:'Invalid login',
                value:'admin'
            })

            input.addListener('appear',function() {
                qx.lang.Function.delay(input.focus,1,input);
                this.__doLogin();
            },this);

            input.addListener('keyup',this.__checkForm,this);
            this.__inputLogin = input;
            return input;
        },

        __getInputPassword : function() {
            var input = new qx.ui.form.PasswordField().set({
                margin:5,
                placeholder:'Password',
                invalidMessage:'Invalid password',
                value:'admin'
            })

            input.addListener('keyup', this.__checkForm,this);
            this.__inputPassword = input;
            return input;
        },

        __getLabelResponse : function() {
            this.__labelResponse = new qx.ui.basic.Label().set({rich:true,marginLeft:4});
            return this.__labelResponse;
        },

        __getLabelWait : function() {
            this.__labelWait = new qx.ui.basic.Label().set({rich:true,marginLeft:4});
            this.__labelWait.setValue('<b>Checking session, please wait.</b>');
            return this.__labelWait;
        },

        __getButtonOk:function() {
            var bt = new qx.ui.form.Button("OK", "EP/check.png");
            bt.setEnabled(false);
            bt.addListener('execute',this.__doLogin,this);
            this.__buttonOk =bt;
            return bt;
        },

        __isValid : function() {
            var ok = true;
            var c = this.__inputLogin.getValue();
            if (!c) {
                ok = false;
                this.__inputLogin.setValid(true);
            } else {
                this.__data.login = c;
                this.__inputLogin.setValid(true);
            }

            var c = this.__inputPassword.getValue();
            if (!c) {
                ok = false;
                this.__inputPassword.setValid(true);
            } else {
                this.__data.password = c;
                this.__inputPassword.setValid(true);
            }
            return ok;
        },

        __checkForm : function(ev) {

            if (!this.__isValid()) return this.__buttonOk.setEnabled(false);

            this.__buttonOk.setEnabled(true);
            if (ev.getKeyCode()==13) this.__doLogin();
        },

        __doLogin : function() {
            if (!this.__isValid()) return;
            new EP.utils.xhr(this.__urlAuthLogin,this.__data,this.__onLogin,this).send();
        },

        __onLogin : function(err,res) {

            if (err) {
                this.__labelResponse.setValue('<font color="red"><b>&gt; '+err.getResponseText()+' &lt;</b></font>');
                return;
            }

            if (!res||res.authenticated == 'undefined') {
                this.__labelResponse.setValue('<font color="red"><b>&gt; Authentication error !&lt;</b></font>');
                return;
            }

            if (!res.authenticated) {
                this.__labelResponse.setValue('<font color="red"><b>&gt; Authentication failed &lt;</b></font>');
                this.__inputLogin.focus();
                this.animShake();
                return;
            }

            this.__labelResponse.setValue('<font color="green"><b>&gt; Access granted &lt;</b></font>');
            this.fireDataEvent('authenticated',res);
            this.close();
        }
    }
});

