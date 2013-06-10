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

        // World map
        this.__popupEarth = new EP.app.popup.Earth();

		// Add all
		this.add(this.__menu,{left:0,top:0,right:0});
		this.add(main,{left:0,top:30,right:0,bottom:35});
		this.add(this.__statusBar,{left:0,bottom:0,right:0});

        /* drag & drop indicator, used by tree when dragging nodes */
		var ddi = new qx.ui.core.Widget().set({
            height:0,
            opacity:0.5,
            zIndex:100,
            droppable:true
        })
        ddi.setLayoutProperties({left: -1000, top: -1000});
        ddi.setDecorator(new qx.ui.decoration.Decorator().set({
            widthTop: 1,
            styleTop: "solid",
            colorTop: "black"
        }));
        this.add(ddi);
        this.__indicator = ddi;

    },

    members:{

    }
});
