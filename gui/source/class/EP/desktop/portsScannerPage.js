 qx.Class.define("EP.desktop.portsScannerPage", {

    extend : qx.ui.tabview.Page,

    events : {
    	jobMessage: "qx.event.type.Data"
    },

    construct : function(workspaceData) {

        this.base(arguments,workspaceData.name||'Empty title');

        this.set({
                layout:new qx.ui.layout.VBox(5),
                showCloseButton:true,
                margin:0,
                padding:0
            });

        //this.__faye = qx.core.Init.getApplication().getFayeManager();
        //this.addListener('jobMessage',this.__onJobMessage,this);

        var menu = this.__menu = new EP.desktop.portsScannerMenu();
        var container = new qx.ui.container.Composite();
        container.setLayout(new qx.ui.layout.HBox());

        var tree = this.__tree = new EP.desktop.portsScannerTree(workspaceData);

        container.add(tree);

        this.add(menu);
        this.add(container,{flex:5});

    },

    members : {

    }
});
