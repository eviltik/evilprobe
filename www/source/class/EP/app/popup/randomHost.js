qx.Class.define("EP.app.popup.randomHost", {

    extend : Zen.ui.window.Window,

    events: {
        jobMessage: "qx.event.type.Data",
        jobStart: "qx.event.type.Data",
        jobEnd: "qx.event.type.Data",
        jobAbort: "qx.event.type.Data"
    },

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
        this.addListener('jobMessage',this.onJobMessage,this);
        this.addListener('jobStart',this.onJobStart,this);
        this.addListener('jobEnd',this.onJobEnd,this);
        this.addListener('jobAbort',this.onJobAbort,this);

        this.add(this.__getContent());
        this.open();
    },

    members:{

        __table :null,

        onJobMessage:function(ev) {
            if (ev.getData().data.job._jobCmd == 'ipv4Info') {
                var res = ev.getData().message;
                var rid = parseInt(res.row);
                this.__tableModel.setValue(2,rid,res.reverse);
                this.__tableModel.setValue(1,rid,res.up);
                this.__tableModel.setValue(3,rid,res.country);
                this.__tableModel.setValue(4,rid,res.city);
                this.__table.scrollCellVisible(0,res.row);
            } else {
                var ip = ev.getData().message.ip;
                var data = [ip,'','','',''];
                this.__tableModel.addRows([data]);
            }
        },

        onJobStart:function(ev) {
            var jobInfo = ev.getData().job;
            if (jobInfo._jobCmd == 'ipv4Info') {
                this.__table.setEnabled(false);
            }
            this.__left.setEnabled(false);
        },

        onJobEnd:function(ev) {
            var jobInfo = ev.getData().job;
            if (jobInfo._jobCmd == 'ipv4Random') {
                this.__buttonInfo.show();
            }
            this.__table.setEnabled(true);
            this.__left.setEnabled(true);
        },

        onJobAbort:function(ev) {
            this.close();
        },

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

            v.add(content,{flex:1});
            v.add(new qx.ui.core.Spacer(10));
            v.add(buttonContainer);
            return v;
        },

        __getForm:function() {
            var left = this.__left = new qx.ui.container.Composite();
            left.set({
                layout:new qx.ui.layout.VBox(2),
                decorator:'group-css',
                padding:5
            });
            left.add(this.__getNumberOfHostTextfield(),{flex:5});
            left.add(this.__getButtonGenerate());
            left.add(this.__getResetCheckbox());
            left.add(this.__getPingCheckbox());
            left.add(this.__getAutoScrollCheckbox());
            left.add(this.__getButtonInfo());
            return left;
        },

        __getResetCheckbox:function() {
            return this.__resetCheckbox = new qx.ui.form.CheckBox('Reset').set({margin:4, value:true});
        },

        __getPingCheckbox:function() {
            return this.__pingCheckbox = new qx.ui.form.CheckBox('Ping (slower)').set({margin:4, value:false});
        },

        __getAutoScrollCheckbox:function() {
            return this.__autoScrollCheckBox = new qx.ui.form.CheckBox('Autoscroll').set({margin:4, value:true});
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

        __getButtonGenerate:function() {
            var bt = this.__buttonGenerate = new qx.ui.form.Button("Generate randoms IPv4",'EP/search.png');
            bt.addListener('execute',this.__clickButtonGenerate,this);
            return bt;
        },

        __getButtonInfo:function() {
            var bt = this.__buttonInfo = new qx.ui.form.Button("Get infos",'EP/search.png');
            bt.hide();
            bt.addListener('execute',this.__clickButtonInfo,this);
            return bt;
        },

        __getButtonOk:function() {
            var bt = new qx.ui.form.Button("OK", "EP/ok.png");
            bt.setEnabled(false);
            bt.addListener('execute',this.__clickButtonOk,this);
            this.__buttonOk = bt;
            return bt;
        },

        __getButtonCancel:function() {
            var bt = new qx.ui.form.Button("Cancel", "EP/cancel.png");
            bt.setEnabled(true);
            bt.addListener('execute',this.__clickButtonCancel,this);
            this.__buttonCancel = bt;
            return bt;
        },

        __clickButtonCancel:function() {
            this.close();
        },

        __clickButtonOk:function() {
            // save data here
            this.close();
        },

        __clickButtonGenerate:function() {
            if (this.__resetCheckbox.getValue()) {
                this.__table.getTableModel().setData([]);
            }
            this.__tableModel = this.__table.getTableModel();

            var job = {};
            job._jobCmd = 'ipv4Random';
            job._jobTitle = 'Generating random IPv4';
            job._jobUid = Date.now();

            // Command arguments
            job.args = {};
            job.args.max = parseInt(this.__numberOfHostTextfield.getValue());
            qx.core.Init.getApplication().getJobsManager().start(job,this);

            this.__buttonInfo.hide();
        },

        __clickButtonInfo:function() {
            var ips = [];
            this.__resolvedMax = this.__table.getTableModel().getData().length;
            this.__resolved = 0;
            this.__left.setEnabled(false);

            var job = {};
            job._jobCmd = 'ipv4Info';
            job._jobTitle = 'Gathering IPv4 infos';
            job._jobUid = Date.now();

            // Command arguments
            job.args = {};
            var ips = [];
            this.__tableModel.getData().forEach(function(row,i) {
                ips.push({row:i,ip:row[0]});
            })
            job.args.ips = ips;
            job.args.ping = this.__pingCheckbox.getValue();
            qx.core.Init.getApplication().getJobsManager().start(job,this);

        }
    }
});

