qx.Class.define("EP.app.popup.randomHost", {

    extend : Zen.ui.window.Window,

    construct:function() {

        this.base(arguments);

    	this.set({
    		contentPadding:5,
    		resizable:true,
    		showMinimize:false,
    		showMaximize:true,
            showClose:true,
    		margin:0,
    		relativeWidth:'70%',
    		caption:'Generate random hosts',
    		layout:new qx.ui.layout.Grow,
    		modal:true,
            fadeInAppear:true,
            fadeOutClose:true,
            centered:true
    	})

        this.add(this.__getContent());
        this.open();
    },

    members:{

        __table :null,

        __getContent:function() {
            var v = this.__form = new qx.ui.container.Composite();
            v.setLayout(new qx.ui.layout.VBox(5));

            var content = new qx.ui.container.Composite();
            content.setLayout(new qx.ui.layout.HBox(5));

            content.add(this.__getForm());

            var right = new qx.ui.container.Composite();
            right.setLayout(new qx.ui.layout.Grow);
            right.add(this.__getHostList());
            content.add(right,{flex:5});

            var buttonContainer = new qx.ui.container.Composite();
            buttonContainer.set({
                layout:new qx.ui.layout.Canvas(0,0),
                decorator:'group-css',
                padding:5
            });
            buttonContainer.add(this.__getButtonCancel(),{left: 0});
            buttonContainer.add(this.__getButtonOk(),{right: 0});

            v.add(content);
            //v.add(this.__getWarning());
            v.add(new qx.ui.core.Spacer(10));
            v.add(buttonContainer);
            return v;
        },

        __getForm:function() {
            var left = new qx.ui.container.Composite();
            left.set({
                layout:new qx.ui.layout.VBox(2),
                decorator:'group-css',
                padding:5
            });
            left.add(this.__getNumberOfHostTextfield(),{flex:5});
            left.add(this.__getGenerateButton());
            left.add(this.__getPingCheckbox());
            left.add(this.__getAutoScrollCheckbox());
            left.add(this.__getInfoButton());
            return left;
        },

        __getPingCheckbox:function() {
            return this.__pingCheckbox = new qx.ui.form.CheckBox('Ping (slower)').set({margin:4, value:false});
        },

        __getAutoScrollCheckbox:function() {
            return this.__autoScrollCheckBox = new qx.ui.form.CheckBox('Autoscroll').set({margin:4, value:true});
        },

        __generateButtonClick:function() {
            var max = parseInt(this.__numberOfHostTextfield.getValue());
            var data = [];
            for (var i = 0; i<max; i++) {
                var ip = CIDR.long2ip(Math.random()*4294967296);
                data.push([ip,'','',''])
            }
            this.__table.getTableModel().setData([]);
            this.__table.getTableModel().setData(data);
            this.__tableModel = this.__table.getTableModel();
            this.__infoButton.setEnabled(true);
        },

        __infoButtonClick:function() {
            /*
            var ips = [];
            this.__table.getTableModel().getData().forEach(function(rowData,idrow) {
                ips.push(rowData[0]);
            });
            new EP.app.util.Xhr('ipInfos',{ips:ips},this.__onIpInfo,this).send();
            */
            var ips = [];
            this.__resolvedMax = this.__table.getTableModel().getData().length;
            this.__resolved = 0;
            this.__infoButton.setEnabled(false);
            this.__generateButton.setEnabled(false);
            var ping = this.__pingCheckbox.getValue();
            this.__table.getTableModel().getData().forEach(function(rowData,idrow) {
                new EP.app.util.Xhr('ipInfo/'+rowData[0],{idrow:idrow,ping:ping},this.__onIpInfo,this).send();
            },this);
            window.t = this.__table;
        },

        __onIpInfo:function(err,res) {
            this.__resolved++;
            var rid = parseInt(res.data.idrow);
            this.__tableModel.setValue(2,rid,res.data.reverse);
            this.__tableModel.setValue(1,rid,res.data.up);
            this.__tableModel.setValue(3,rid,res.data.country);
            this.__tableModel.setValue(4,rid,res.data.city);

            this.__table.scrollCellVisible(0,res.data.idrow);

            if (this.__resolved == this.__resolvedMax) {
                this.__infoButton.setEnabled(true);
                this.__generateButton.setEnabled(true);
                this.__table.setAdditionalStatusBarText(', fetching information '+this.__resolved+'/'+this.__resolvedMax+': done.');
            } else {
                this.__table.setAdditionalStatusBarText(', fetching information '+this.__resolved+'/'+this.__resolvedMax);
            }
        },

        __getNumberOfHostTextfield:function() {

            var input = this.__numberOfHostTextfield = new qx.ui.form.TextField();
            input.set({
                height:25,
                value:'100'
            });
            input.addListener('keyup',this.__checkSpecialKeys,this);
            input.addListener('appear',function() {
                qx.lang.Function.delay(input.focus,1,input);
            },this);

            return input;
        },

        __getGenerateButton:function() {
            var bt = this.__generateButton = new qx.ui.form.Button("Generate randoms IPv4",'EP/search.png');
            bt.addListener('execute',this.__generateButtonClick,this);
            return bt;
        },

        __getInfoButton:function() {
            var bt = this.__infoButton = new qx.ui.form.Button("Get infos",'EP/search.png');
            bt.setEnabled(false);
            bt.addListener('execute',this.__infoButtonClick,this);
            return bt;
        },

        __getWarning:function() {
            var text ='<b><font color="darkred">Warning ! Use this at your own risk ! Author and contributors of this software are not responsible of what you are doing now.</font></b>';
            var h = new qx.ui.embed.Html(text);
            h.set({
                padding:10,
                decorator:'border-invalid',
                height:35
            })
            return h;
        },

        __getHostList:function() {

            var columns = [{
                title:'IPv4',
                id:'name',
                width:150
            },{
                title:'Ping',
                id:'ping'
            },{
                title:'Reverse',
                id:'reverse'
            },{
                title:'Country',
                id:'country',
                width:170
            },{
                title:'City',
                id:'country',
                width:170
            }];

            var table = this.__table = new EP.ui.table.Table({
                columns:columns
            }).set({
                showCellFocusIndicator:false,
                additionalStatusBarText:''
            });

            table.getSelectionModel().addListener('changeSelection',this.__onTableChangeSelection,this);
            this.__tableModel= table.getTableModel();
            return table;
        },

        __onTableChangeSelection:function() {
            if (this.__table.getSelectionModel().getSelectedCount()===0) {
                return this.__buttonOk.setEnabled(false);
            }
            this.__buttonOk.setEnabled(true);
        },

        __checkSpecialKeys : function(ev) {
            if (ev.getKeyCode() == 27) {
                return this.__doCancel();
            }

            if (ev.getKeyCode() == 13) {
                this.__generate();
            }
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

        __doCancel:function() {
            this.close();
        },

        __doSave:function() {
            // save data here
            this.close();
        }
    }
});

