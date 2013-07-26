qx.Class.define("EP.app.desktop.Workspaces", {

    extend : qx.ui.tabview.TabView,

    construct:function() {
        this.base(arguments);
        this.set({
            backgroundColor:'#B0B0B0',
            contentPadding:5
        });
        this.addListener('changeSelection',this.__tabChange,this);

        // Add a welcome page

        var welcomePage = new qx.ui.tabview.Page("Welcome");
        welcomePage.setLayout(new qx.ui.layout.VBox());
        welcomePage.setShowCloseButton(false);
        this.add(welcomePage);

        //var page = new Zen.page.editor();
        //welcomePage.add(page);

        // Subscribe global Evilprobe events

        qx.event.message.Bus.subscribe('workspacesLoad',this.workspacesLoad,this);
        qx.event.message.Bus.subscribe('workspaceSearchAndOpen',this.__workspaceSearchAndOpen,this);
        // Let's load workspaces for the user

        this.__loaded = false;
        this.workspacesLoad();
    },

    members: {

        /*******************/
        /* private members */
        /*******************/

        __loaded:null,

        __tabAdd:function(workspaceData,forceSelection) {

            var page = new EP.app.folder.Page(workspaceData,this);
            page.set({
                layout:new qx.ui.layout.VBox(5),
                showCloseButton:true,
                margin:0,
                padding:0
            });
            page.setUserData('workspace',workspaceData);
            page.addListener('close',this.__tabClose,this);
            this.add(page);

            if (workspaceData.selected||forceSelection) {
                this.setSelection([page]);
            }
        },

        __tabClose:function(ev) {
            var d = ev.getTarget().getUserData('workspace');
            if (!d||!d._id) return;

            // Server side : set current workspace has "not opened"
            new EP.app.util.Xhr('workspace/mines/close',{_id:d._id}).send();
            qx.event.message.Bus.dispatch(new qx.event.message.Message('workspaceRecentsReload'));

        },

        __tabChange:function(ev) {

            // load workspaces fire changeSelection events,
            // so ignore it when it's the first load
            if (!this.__loaded) {
                return;
            }

            var currentTab = ev.getData()[0];
            if (!currentTab) return;
            var currentData = currentTab.getUserData('workspace');
            if (currentData && currentData._id) {
                new EP.app.util.Xhr('workspace/mines/select',{selectId:currentData._id}).send();
            }
        },

        __workspaceSearchAndOpen:function(busData) {
            var alreadyOpened = false;
            var workspaceId = busData.getData()._id;
            if (workspaceId) {
                // Existing workspace (menu -> workspace -> recent)
                // First look at opened tabs
                this.getChildren().forEach(function(tab) {
                    var tabData = tab.getUserData('workspace');
                    if (!tabData) return;
                    if (tabData._id == workspaceId) {
                        alreadyOpened = true;
                        return this.setSelection([tab]);
                    }
                },this);
            }

            if (!alreadyOpened) {
                this.workspacesLoad([{_id:workspaceId}]);
            }
        },

        /*******************/
        /* public members  */
        /*******************/

        workspacesLoad:function(arr) {
            if (arr && arr.getData) arr = arr.getData();

            // Server side: load array of opened workspaces
            var url = 'workspace/mines/load';

            var data = null;
            if (arr) {
                data = {filters:JSON.stringify(arr)}
            }

            new EP.app.util.Xhr(url,data,function(err,r) {

                if (err) {
                    this.__loaded = true;
                    return new dialog.Dialog.error("Error:<br/>"+err.getStatus()+' '+err.getResponseText());
                }

                if (!r||!r.workspaces||!r.workspaces.length) {
                    this.__loaded = true;
                    // No workspace ..
                    return;
                }

                r.workspaces.forEach(function(o) {
                    var alreadyOpened = false;

                    this.getChildren().forEach(function(tab) {
                        var tabData = tab.getUserData('workspace');
                        if (!tabData) return;
                        if (tabData._id == o._id) {
                            alreadyOpened = true;
                            return this.setSelection([tab]);
                        }
                    },this);

                    if (!alreadyOpened) {
                        if (arr) o.selected = true;
                        this.__tabAdd(o);
                    }
                },this);

                this.__loaded = true;

            },this).send();
        }
    }
});