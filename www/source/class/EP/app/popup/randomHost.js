qx.Class.define("EP.app.popup.randomHost", {

    extend : Zen.ui.window.Window,

    events: {
        jobMessage: "qx.event.type.Data",
        jobStart:   "qx.event.type.Data",
        jobEnd:     "qx.event.type.Data",
        jobAbort:   "qx.event.type.Data"
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
    		modal:false,
            fadeInAppear:true,
            fadeOutClose:true,
            centered:true
    	})
        this.addListener('jobMessage',this.onJobMessage,this);
        this.addListener('jobStart',this.onJobStart,this);
        this.addListener('jobEnd',this.onJobEnd,this);
        this.addListener('jobAbort',this.onJobAbort,this);

        this.addListener('close',this.__onClose,this);

        //this.__indicator = qx.core.Init.getApplication().getIndicator();
        //this.__indicator.addListener('drop',this.__indicatorDrop,this);

        this.add(this.__getContent());
    },

    members:{

        __indicator:null,
        __table :null,

        __onClose:function() {
            //this.__table.removeListener('drop');
        },

        onJobMessage:function(ev) {
            if (ev.getData().data.job._jobCmd == 'ipv4Info') {
                var res = ev.getData().message;
                var rid = parseInt(res.row);
                this.__tableModel.setValue(2,rid,res.reverse);
                this.__tableModel.setValue(1,rid,res.up);
                this.__tableModel.setValue(3,rid,res.country);
                this.__tableModel.setValue(4,rid,res.city);
                this.__tableModel.setValue(5,rid,res.longitude);
                this.__tableModel.setValue(6,rid,res.latitude);
                this.__table.scrollCellVisible(0,res.row);
                qx.event.message.Bus.dispatch(new qx.event.message.Message('mapUpdate',JSON.parse(JSON.stringify(res))));
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
            this.__table.setEnabled(true);
            this.__left.setEnabled(true);
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

            /*
            var buttonContainer = new qx.ui.container.Composite();
            buttonContainer.set({
                layout:new qx.ui.layout.Canvas(0,0),
                decorator:'group-css',
                padding:5
            });
            buttonContainer.add(this.__getButtonCancel(),{left: 0});
            buttonContainer.add(this.__getButtonOk(),{right: 0});
            */

            v.add(content,{flex:1});
            v.add(new qx.ui.core.Spacer(10));
            //v.add(buttonContainer);
            return v;
        },

        __getForm:function() {
            var left = this.__left = new qx.ui.container.Composite();
            left.set({
                layout:new qx.ui.layout.VBox(2),
                decorator:'group',
                padding:5
            });
            left.add(this.__getNumberOfHostTextfield(),{flex:5});
            left.add(this.__getButtonGenerate());
            left.add(this.__getCheckboxReset());
            left.add(this.__getCheckboxPing());
            left.add(this.__getCheckboxReverse());
            left.add(this.__getAutoScrollCheckbox());
            left.add(this.__getButtonInfo());
            return left;
        },

        __getCheckboxReset:function() {
            var c = this.__checkboxReset = new qx.ui.form.CheckBox('Reset').set({margin:4, value:true});
            return c;
        },

        __getCheckboxPing:function() {
            var c = this.__checkboxPing = new qx.ui.form.CheckBox('Ping (slower)').set({margin:4, value:false});
            c.addListener('changeValue',this.__onCheckboxPingChangeValue,this);
            return c;
        },

        __onCheckboxPingChangeValue:function(ev) {
            this.__table.getTableColumnModel().setColumnVisible(1,ev.getData());
        },

        __getCheckboxReverse:function() {
            var c = this.__checkboxReverse = new qx.ui.form.CheckBox('Reverse DNS lookup').set({margin:4, value:false});
            c.addListener('changeValue',this.__onCheckboxReverseChangeValue,this);
            return c;
        },

        __onCheckboxReverseChangeValue:function(ev) {
            this.__table.getTableColumnModel().setColumnVisible(2,ev.getData());
        },

        __getAutoScrollCheckbox:function() {
            var c = this.__autoScrollCheckBox = new qx.ui.form.CheckBox('Autoscroll').set({margin:4, value:true});
            return c;
        },

        __onIpInfo:function(err,res) {
            this.__Reversed++;
            var rid = parseInt(res.data.idrow);
            this.__tableModel.setValue(2,rid,res.data.reverse);
            this.__tableModel.setValue(1,rid,res.data.up);
            this.__tableModel.setValue(3,rid,res.data.country);
            this.__tableModel.setValue(4,rid,res.data.city);

            this.__table.scrollCellVisible(0,res.data.idrow);

            if (this.__Reversed == this.__ReversedMax) {
                this.__infoButton.setEnabled(true);
                this.__generateButton.setEnabled(true);
                this.__table.setAdditionalStatusBarText(', fetching information '+this.__Reversed+'/'+this.__ReversedMax+': done.');
            } else {
                this.__table.setAdditionalStatusBarText(', fetching information '+this.__Reversed+'/'+this.__ReversedMax);
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
                id:'ping',
                width:70,
                hidden:true
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
            },{
                title:'Longitude',
                id:'longitude',
                hidden:true
            },{
                title:'Latitude',
                id:'latitude',
                hidden:true
            }];

            var table = this.__table = new EP.ui.table.Table({
                columns:columns
            }).set({
                showCellFocusIndicator:false,
                additionalStatusBarText:''
            });

            table.getSelectionModel().addListener('changeSelection',this.__onTableChangeSelection,this);

            table.setDraggable(true);
            this.setDroppable(false);

            table.addListener('dragstart', this.__itemDragStart,this);
            //table.addListener('dragover',this.__itemDragOver,this);
            table.addListener('dragend',this.__itemDragEnd,this);
            table.addListener('drag',this.__itemDrag,this);
            table.addListener('drop',this.__itemDrop,this);

            this.__tableModel= table.getTableModel();
            return table;
        },

        __onTableChangeSelection:function() {

            if (!this.__buttonOk) return;

            if (this.__table.getSelectionModel().getSelectedCount()===0) {
                return this.__buttonOk.setEnabled(false);
            }
            this.__buttonOk.setEnabled(true);
        },

        __checkSpecialKeys : function(ev) {
            if (ev.getKeyCode() == 27) {
                return this.__clickButtonCancel();
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
            if (this.__checkboxReset.getValue()) {
                this.__tableModel.setData([]);
            }

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
            this.__ReversedMax = this.__tableModel.getData().length;
            this.__Reversed = 0;
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
            job.args.ping = this.__checkboxPing.getValue();
            job.args.reverse = this.__checkboxReverse.getValue();
            qx.core.Init.getApplication().getJobsManager().start(job,this);
            qx.core.Init.getApplication().getDesktop().__popupEarth.show();
            qx.event.message.Bus.dispatch(new qx.event.message.Message('mapReset'));

        },

        /* drag & drop */

        __itemDragStart:function(ev) {
            this.setOpacity(0.5);
            ev.addAction("move");
        },

        /*
        __itemDragOver:function(ev) {
            console.log('__itemDragOver',ev.getOriginalTarget() instanceof qx.ui.tree.VirtualTreeItem);

            ev.preventDefault();

            // Stop when the dragging comes from outside
            if (ev.getRelatedTarget()) {
                ev.preventDefault();
            }
        },
        */

        __itemDrag:function(ev) {
            var target = ev.getOriginalTarget();

            if (
                !(target instanceof qx.ui.tree.VirtualTreeItem)
                &&
                !(target instanceof qx.ui.virtual.core.Pane)
            ) {
                this.__droppedOn = null;
                return false;
            }

            if (target.getModel) {
                var tree = target.getModel().getUserData('tree');
                if (!tree) return;
                var model = target.getModel() || null;
                if (model && model.getType() == 'host') {
                    var parent = model.getUserData('parent');
                    model = parent;
                }
                this.__droppedOn = target;
                tree.setSelection(new qx.data.Array([model]));
            }
        },

        __itemDragEnd:function(ev) {
            this.setOpacity(1);
            if (!ev.getRelatedTarget()) return;

            var ranges = this.__table.getSelectionModel().getSelectedRanges();
            var items = [];
            while (ranges.length) {
                var r = ranges.shift();
                while (r.minIndex <= r.maxIndex) {
                    items.push({
                        name:this.__tableModel.getValue(0,r.minIndex++),
                        type:'host'
                    });
                }
            }

            if (!items.length) return;

            ev.getRelatedTarget().fireDataEvent('dropSomething',{
                parent:this.__droppedOn,
                items:items
            });
        },

        __indicatorDrop:function(ev) {
            console.log('__indicatorDrop');
        },

        __itemDrop:function(ev) {
            console.log('__itemDrop');
        }
    }
});

