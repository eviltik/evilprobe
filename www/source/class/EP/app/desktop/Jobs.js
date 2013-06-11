qx.Class.define("EP.app.desktop.Jobs", {

    extend : qx.ui.container.Composite,

    construct : function(args) {
        this.base(arguments);
        this.setLayout(new qx.ui.layout.VBox);

        this.__FM = qx.core.Init.getApplication().getFayeManager();
        this.__JM = qx.core.Init.getApplication().getJobsManager();

        /*
        var menuFile = new Zen.ui.Menu();
        var menuHelp = new Zen.ui.Menu();

        // Buttons menu
        var buttonFile = new qx.ui.toolbar.MenuButton('File',null,menuFile);
        var buttonHelp = new qx.ui.toolbar.MenuButton('Help',null,menuHelp);
        buttonFile.setMarginLeft(5);

        // Toolbar
        var tb = new qx.ui.toolbar.ToolBar();
        tb.setPadding(0);
        tb.add(buttonFile);
        tb.add(buttonHelp);

        this.add(tb);
        */

        var barRenderer = new canvascell.Renderer(
            new canvascell.plotter.Bar({
                fill   : '#280',
                border : '#290',
                max    : 100
            })
        );

        var timestampRendererHM = new Zen.table.cellrenderer.TimestampHM;

        var columns = [
            {title:'uid',           width:50,   hidden: true, primary: true},
            {title:'Job',           width:300},
            {title:'Last message'},
            {title:'Progress',      width:250,  renderer:barRenderer},
            {title:'Stats',         width:200},
            {title:'Status',        width:60},
            {title:'Start time',    width:60,   renderer:timestampRendererHM},
            {title:'End time',      width:60,   renderer:timestampRendererHM},
            {title:'Elapsed',       width:60}
        ];

        var table = new EP.ui.table.Table({columns:columns}).set({
            showCellFocusIndicator:false,
            statusBarVisible:false,
            decorator:null
        });

        this.__contextMenu = new qx.ui.menu.Menu();
        table.addListener('cellContextmenu',this.__onContextMenu,this);
        this.addListener('mousedown',function() {
            this.__tableJobs.getSelectionModel().resetSelection();
        },this);
        //table.setDataRowRenderer(new EP.ui.table.rowrenderer.Jobs(table));

        this.__tableJobs = table;
        this.add(table,{flex:1});
        this.manageJobs();
    },
    members:{
        __contextMenu : null,

        __onContextMenu:function(ev) {
            this.__contextMenu.removeAll();

            var selected = this.__tableJobs.getSelectionModel().getSelectedCount();
            var focusedRow = this.__tableJobs.getFocusedRow();
            var jobStatus = this.__tableJobs.getTableModel().getRowDataAsMap(focusedRow)['Status'];

            if (jobStatus == 'Running') {

                var pause = new qx.ui.menu.Button('Pause');
                pause.addListener('execute',this.jobPause,this);

            } else if (jobStatus == 'Paused'){

                var pause = new qx.ui.menu.Button('Unpause');
                pause.addListener('execute',this.jobUnpause,this);

            } else {

                var pause = new qx.ui.menu.Button('Pause');
                pause.setEnabled(false);

            }
            this.__contextMenu.add(pause);

            var abort = new qx.ui.menu.Button('Abort');
            abort.addListener('execute',this.jobAbort,this);
            this.__contextMenu.add(abort);
            this.__contextMenu.openAtMouse(ev);

            return true;
        },

        jobPause : function() {
            this.__JM.pause(this.__tableJobs.getSelectedKey());
        },

        jobUnpause : function() {
            this.__JM.unpause(this.__tableJobs.getSelectedKey());
        },

        jobAbort : function() {
            this.__JM.abort(this.__tableJobs.getSelectedKey());
        },

        __onJobsUpdate : function(d) {
            var jobs = [];

            d.forEach(function(theJob) {
                var job = [];
                job.push(theJob._jobUid.toString());
                job.push(theJob._jobTitle);
                job.push(theJob._message);
                job.push(theJob._progress||0);
                job.push((theJob._jobsRunning||0)+' - '+(theJob._jobsDone||0)+'/'+(theJob._jobsTotal||0)+' : '+(theJob._progress||0)+'%');
                job.push(theJob._status);
                job.push(theJob._timeStart);

                if (parseInt(theJob._timeEnd) || theJob._status == 'Finished') {
                    job.push(theJob._timeEnd);
                    this.__JM.end(theJob._jobUid);
                } else {
                    job.push(null);
                }

                job.push(Math.round(theJob._timeElapsed/1000,2)+' sec');
                jobs.push(job);

                if (theJob._status == 'Error') {
                    new Zen.ui.window.Alert(theJob._message);
                    this.__JM.abort(theJob._jobUid);
                }
            },this);
            this.__tableJobs.getTableModel().setData(jobs);
        },

        manageJobs:function() {
            this.__jobsList = {};
            this.__FM.jobsStatusSubscribe(this.__onJobsUpdate,this);
        }
    }
});
