/* ************************************************************************
   Copyright: zenetik
   License: WTFPL
   Authors: zenetik
************************************************************************ */

/* ***
 #asset(EP/*)
 #asset(qx/icon/Tango/16/apps/utilities-terminal.png)
 #asset(qx/icon/Tango/16/actions/list-add.png)
 #asset(qx/icon/Tango/32/actions/help-faq.png)
 */
 
/**
 * @lint ignoreUndefined(CIDR,objectForEach,Faye)
 */

window.objectForEach = function(obj,cb,caller) {
    var i = -1;
    for (var prop in obj) {
        if (!obj.hasOwnProperty(prop)||typeof obj[prop]=='function') continue;
        cb.bind(caller,prop.toString(),obj[prop],++i)();
    }
}

qx.Class.define("EP.Application", {
    extend : qx.application.Standalone,
    properties:{
        fayeManager:{nullable : true},
        jobsManager:{nullable : true},
        tabView:{nullable:true}
    },    
    members : {
        main : function() {
            this.base(arguments);

            // Enable logging in debug variant
            if (qx.core.Environment.get("qx.debug")) {
                qx.log.appender.Native;
                qx.log.appender.Console;
            }

            this.getRoot().set({
               blockerColor: '#000000',
               blockerOpacity: 0.6
            });

            this.setFayeManager(new EP.utils.fayeManager());;
            this.setJobsManager(new EP.utils.jobsManager(this.getFayeManager()));

            var container = new qx.ui.container.Composite(new qx.ui.layout.Canvas());
            container.setPadding(0);
            container.set({backgroundColor:'#A0A0A0'});
            container.add(this.getMenu(),{left:0,top:0,right:0});
            container.add(this.getStatusBar(),{left:0,bottom:0,right:0});
            //container.add(this.getLogo(),{top:0,right:5});
            container.add(this.getMainContainer(),{left:0,top:30,right:0,bottom:20});

            this.getRoot().add(container, {edge:0});
            container.addListener('appear',this.onAppear,this);
        },

        onAppear : function() {
           
        },

        getLogo : function() {
            this.logo = new qx.ui.basic.Image('EP/logo.png');
            this.logo.setScale(true);
            return this.logo;
        },

        getMenu : function() {
            
            /*
            var bar = new qx.ui.container.Composite(new qx.ui.layout.Grow());
            var buttonPortsScanner = new Zen.ui.toolbar.Button('Ports Scanner');
            buttonPortsScanner.addListener('execute',function() {
                if (this.__winPortsScanner) {
                    this.__winPortsScanner.show();
                    return;
                }
                var w = new EP.view.portsScannerFormPopup();
                w.show();
                this.__winPortsScanner = w;
                
            },this);

            var part1 = new qx.ui.toolbar.Part();
            part1.add(buttonPortsScanner);
            
            var tb = new qx.ui.toolbar.ToolBar();
            tb.setPadding(0);
            tb.add(part1);

            bar.add(tb);
            */

            var workspaceMenu = new qx.ui.menubar.Button('Workspace',null,this.getMenuWorkspace());
            var mbar = new qx.ui.menubar.MenuBar().set({height:32});
            mbar.add(workspaceMenu);
            return mbar;
        },

        getMenuWorkspace : function() {
            var m = new qx.ui.menu.Menu();
            var newButton = new qx.ui.menu.Button('New');
            var openButton = new qx.ui.menu.Button('Open');
            var recentButton = new qx.ui.menu.Button('Recents');
            m.add(newButton);
            m.add(openButton);
            m.add(recentButton);
            return m;
        },

        getStatusBar : function() {
            this.__barBottom = new qx.ui.container.Composite(new qx.ui.layout.Grow);
            var tb = new qx.ui.toolbar.ToolBar();
            tb.add(new qx.ui.toolbar.Separator());
            tb.addSpacer();

            // network indicator
            this.__networkIndicator = new qx.ui.form.MenuButton(null,"EP/net_off.gif",null).set({
                padding : 0,
                decorator : null,
                alignY : 'middle',
                paddingRight : 6
            })
            this.__networkIndicator.setFocusable(false);
            tb.add(this.__networkIndicator);

            this.__barBottom.add(tb);
            return this.__barBottom;
        },

        getMainContainer : function() {
            var main = new qx.ui.splitpane.Pane("vertical").set({
                margin:0,
                padding:0,
                backgroundColor:'#B0B0B0'
            });
            main.add(this.getContainers(),3);
            main.add(new EP.view.jobsList(),1);
            return main;
        },

        getContainers : function() {

            return new qx.ui.core.Widget();

            var main = new qx.ui.splitpane.Pane("horizontal").set({
                margin:0,
                padding:0,
                backgroundColor:'#B0B0B0'
            });
            //main.add(new EP.ui.Collapsible('bla'));
            main.add(new EP.view.favoritesTree(),1);
            main.add(this.getTabContainer(),5);
            return main;
        },

        getTabContainer : function() {
            var tabView = new qx.ui.tabview.TabView().set({backgroundColor:'#B0B0B0'}); 
            var page = new qx.ui.tabview.Page("Welcome");
            page.setLayout(new qx.ui.layout.VBox());
            page.setShowCloseButton(false);
            tabView.add(page);
            this.setTabView(tabView);
            return tabView;
        },

        getScannerContainer : function(show) {
            var main = new qx.ui.splitpane.Pane("horizontal");
            main.add(this.getScannerTable(['IPv4','Country','City','Port']),6);
            if (!show) main.hide();
            this.__scannerContainer = main;
            return main;
        },

        getScannerTable : function(cols) {

            if (this.__tableScan) this.__tableScan.destroy();

            // --------------------------------------------------------------------
            // Table

            var tableModel = new qx.ui.table.model.Simple();
            this.__scannerColumns=cols;
            tableModel.setColumns(this.__scannerColumns);

            var custom = {
                tableColumnModel : function(obj) {
                    return new qx.ui.table.columnmodel.Resize(obj);
                }
            };

            var table = new qx.ui.table.Table(tableModel,custom);
            table.getSelectionModel().setSelectionMode(qx.ui.table.selection.Model.MULTIPLE_INTERVAL_SELECTION);
            table.set({decorator:null})

            var tcm = table.getTableColumnModel();

            // Obtain the behavior object to manipulate
            var resizeBehavior = tcm.getBehavior();

            // This uses the set() method to set all attriutes at once; uses flex
            resizeBehavior.set(this.__scannerColumns.length-1 , { width:"1*", minWidth:40});


            this.__tableScan = table;

            var c = new qx.ui.container.Composite(new qx.ui.layout.VBox);
            c.add(table,{flex:1});
            return c;
        }
    }
});
