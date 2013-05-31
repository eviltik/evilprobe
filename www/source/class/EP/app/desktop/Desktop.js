qx.Class.define("EP.app.desktop.Desktop", {

	extend : qx.ui.container.Composite,

    construct:function() {
        this.base(arguments);
        this.set({
        	layout:new qx.ui.layout.Canvas(),
        	padding:0,
        	backgroundColor:'#A0A0A0'
        });


		// Initialize faye manager
		this.__FM = new EP.app.manager.Faye();
		qx.core.Init.getApplication().__FM = this.__FM;

		// Initialize jobs manager
		this.__JM = new EP.app.manager.Jobs();
		qx.core.Init.getApplication().__JM = this.__JM;

        // Create menu bar
		this.__menu = new EP.app.desktop.Menu();

		// Create jobs list
		this.__jobsList = new EP.app.desktop.Jobs({
			FM:this.__FM,
			JM:this.__JM
		})

		// Workspaces container
		this.__tabViewer = new EP.app.desktop.Workspaces();

		// Create main container
		var main = new qx.ui.splitpane.Pane("vertical").set({
			margin:0,
			padding:0,
			backgroundColor:'#B0B0B0'
		});
		main.add(this.__tabViewer,5);
		main.add(this.__jobsList,1);

		// Create status bar
		this.__statusBar = new EP.app.desktop.StatusBar();

		// Add widgets
		this.add(this.__menu,{left:0,top:0,right:0});
		this.add(main,{left:0,top:30,right:0,bottom:35});
		this.add(this.__statusBar,{left:0,bottom:0,right:0});

		var indicator = new qx.ui.core.Widget();
        indicator.setDecorator(new qx.ui.decoration.Decorator().set({
            widthTop: 1,
            styleTop: "solid",
            colorTop: "black"
        }));
        indicator.setHeight(0);
        indicator.setOpacity(0.5);
        indicator.setZIndex(100);
        indicator.setLayoutProperties({left: -1000, top: -1000});
        indicator.setDroppable(true);
        this.add(indicator);
        this.__indicator = indicator;


    },

    members:{

    }
});
