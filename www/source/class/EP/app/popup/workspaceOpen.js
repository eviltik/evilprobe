qx.Class.define("EP.app.popup.workspaceOpen", {

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
    		width:800,
    		caption:'Open Workspace',
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

        __table :null,

        __getForm:function() {
            var mainContainer = this.__form = new qx.ui.container.Composite();
            mainContainer.set({
                layout:new qx.ui.layout.VBox(5)
            });

            var topContainer = new qx.ui.container.Composite();
            topContainer.set({
                layout:new qx.ui.layout.HBox(2)
            });
            topContainer.add(this.__getWorkspaceInputName(),{flex:5});
            topContainer.add(this.__getButtonSearch());

            var buttonContainer = new qx.ui.container.Composite();
            buttonContainer.set({
                layout:new qx.ui.layout.Canvas(0,0),
                decorator:'group-css',
                padding:5
            });
            buttonContainer.add(this.__getButtonCancel(),{left: 0});
            buttonContainer.add(this.__getButtonOk(),{right: 0});

            mainContainer.add(topContainer);
            mainContainer.add(this.__getWorkspaceList(),{flex:5});
            mainContainer.add(new qx.ui.core.Spacer(10));
            mainContainer.add(buttonContainer);
;
            return mainContainer;
        },

        __search:function() {
            var w = this.__workspaceInputName.getValue();
            var data = {};
            if (w) data.q = w;
            new EP.utils.xhr('workspace/search',data,this.__onSearch,this).send();
        },

        __onSearch:function(err,r) {
            if (err) return new dialog.Dialog.error("Error:<br/>"+err.getStatus()+' '+err.getResponseText());
            if (!r.ok) return;
            this.__table.getTableModel().setData([]);
            if (!r.workspaces||!r.workspaces.length) return;
            this.__table.getTableModel().setDataAsMapArray(r.workspaces);
        },

        __getWorkspaceInputName:function() {

            var input = this.__workspaceInputName = new qx.ui.form.TextField();
            input.setHeight(25);
            input.addListener('keyup',this.__checkSpecialKeys,this);
            input.addListener('appear',function() {
                qx.lang.Function.delay(input.focus,1,input);
            },this);

            return input;
        },

        __getButtonSearch:function() {
            var bt = new qx.ui.form.Button(null,'EP/search.png');
            bt.addListener('execute',this.__search,this);
            return bt;
        },

        __getWorkspaceList:function() {

            var columns = [{
                title:'uid',
                id:'_id',
                width:50,
                hidden:true,
                primary:true
            },{
                title:'Workspace',
                id:'name'
            },{
                title:'Creator',
                id:'creator',
                width:150
            },{
                title:'Created',
                id:'tsCreated',
                width:150
            }];

            var table = this.__table = new EP.ui.table.Table({columns:columns}).set({
                showCellFocusIndicator:false
            });

            table.getSelectionModel().addListener('changeSelection',this.__onTableChangeSelection,this);
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
                this.__search();
            }
        },

        __getButtonOk:function() {
            var bt = new qx.ui.form.Button("OK", "EP/ok.png");
            bt.setEnabled(false);
            bt.addListener('execute',this.__doOpen,this);
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

        __doOpen:function() {
            this.__table.getSelectionModel().iterateSelection(function(s,a) {
                var w = this.__table.getTableModel().getRowDataAsMap(s);
                qx.event.message.Bus.dispatch(new qx.event.message.Message('workspaceSearchAndOpen',w));
            },this);
            this.close();
        }
    }
});

