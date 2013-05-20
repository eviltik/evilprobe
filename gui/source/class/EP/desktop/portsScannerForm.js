/**
 * @lint ignoreUndefined(CIDR,objectForEach,Faye)
 */

 qx.Class.define("EP.view.portsScannerForm", {

    extend : qx.ui.container.Composite,

    events : {
        "done"   : "qx.event.type.Event"
    },

    construct : function(args) {
        this.base(arguments);
        this.setLayout(new qx.ui.layout.VBox);
        this.set({
            padding:0,
            margin:0
        });

        this.add(this.getInputCidr());
        this.add(this.getInputPortsList());
        this.add(this.getCheckboxResolveCountry());
        this.add(this.getCheckboxResolveCity());
        this.add(this.getCheckboxResolveDns());

        if (args.popup) {
            this.popup = args.popup;
            var c = new qx.ui.container.Composite(new qx.ui.layout.Canvas(0,0)).set({margin:5});
            c.add(this.getButtonCancel(),{left: 0});
            c.add(this.getButtonScan(),{right: 0});
            this.add(new qx.ui.core.Spacer(500));
            this.add(c);
        } else {
            this.add(this.getButtonScan());
        }
    },

    members:{

        getInputCidr : function() {
            var input = new qx.ui.form.TextField().set({
                margin:5,
                placeholder:'IPv4 or CIDR Range',
                filter:/[0-9\.\/]/,
                invalidMessage:'Invalid CIDR Range',
                value:'122.99.128.0/17'
            })

            var t = new qx.ui.tooltip.ToolTip("Type an IP Address or a CIDR Range.",null);
            t.setShowTimeout(50);
            input.setToolTip(t);

            input.addListener('appear',function() {
                input.focus();
            },this);

            input.addListener('keypress',function(ev) {
                if (ev.getKeyCode()==13) {
                    this.onEnter().bind(this);
                }
            },this);

            this.inputCidr = input;

            return input;
        },

        getInputPortsList : function() {
            var input = new qx.ui.form.TextField().set({
                margin:5,
                placeholder:'Ports list',
                filter:/[0-9,]/,
                invalidMessage:'Single or multiple port',
                value:'21,22,23,79,80,110,113,119,143,443,1002,1720,5000,5900,8080'
            })

            /*
            http://www.agnitum.com/support/kb/article.php?id=1000146&lang=en

            System:
            TCP: 21-23, 79, 80, 110, 113, 119, 143, 443, 1002, 1720, 5000, 8080
            UDP: 1900
            Both TCP and UDP: 0, 25, 135, 137, 139, 389, 445, 1024-1050

            Trojan:
            TCP: 21, 23, 25, 80, 113, 137, 139, 555, 666, 1001, 1025, 1026, 1028, 1243, 2000, 5000, 6667, 6670, 6711, 6776, 6969, 7000, 8080, 12345, 12346, 21554, 22222, 27374, 29559
            Both TCP and UDP: 31337, 31338
            */

            var t = new qx.ui.tooltip.ToolTip("Type a single port or multiple port, separated by a comma.",null);
            t.setShowTimeout(50);
            input.setToolTip(t);

            this.inputPortsList = input;

            return input;
        },

        getCheckboxResolveCountry:function() {
            return this.checkboxResolveCountry = new qx.ui.form.CheckBox('Resolve country').set({margin:4, value:true});
        },

        getCheckboxResolveCity:function(){
            return this.checkboxResolveCity = new qx.ui.form.CheckBox('Resolve city').set({margin:4, value:true});
        },

        getCheckboxResolveDns:function() {
            return this.checkboxResolveDns = new qx.ui.form.CheckBox('Reverse lookup').set({margin:4, value:true});
        },

        getButtonScan:function() {
            var bt = new qx.ui.form.Button("OK", "icon/16/actions/dialog-ok.png");
            bt.addListener('execute',this.startScan,this);
            return bt;
        },

        getButtonCancel:function() {
            var bt = new qx.ui.form.Button("Cancel","icon/16/actions/dialog-cancel.png");
            bt.addListener('execute',function() {
                this.fireEvent('done');
            },this);
            return bt;
        },

        isValid : function() {
            var c = this.inputCidr.getValue();
            if (!c) {
                this.inputCidr.setValid(true);
                return false;
            }

            var ips = CIDR.get(c);
            if (!ips||!ips.length) {
                this.inputCidr.setValid(false);
                return false;
            }

            this.inputCidr.setValid(true);
            return ips;
        },

        onEnter : function() {
            var ips = this.isValid();
            if (!ips) return;
        },

        startScan : function() {

            //buttonScan.setEnabled(false);

            var job = {};
            job.jobCmd = 'portscan';
            job.jobTitle = 'Scanning '+this.inputCidr.getValue();
            job.jobUid = Date.now();

            // Command arguments
            job.args = {};
            job.args.cidr = this.inputCidr.getValue();
            job.args.port = this.inputPortsList.getValue();
            this.checkboxResolveCountry.getValue() ? job.args.country = true : job.args.country = false;
            this.checkboxResolveCity.getValue() ? job.args.city = true : job.args.city = false;
            this.checkboxResolveDns.getValue() ? job.args.reverse = true : job.args.reverse = false;

            // Ask the server to start the job
            qx.core.Init.getApplication().getJobsManager().push(job,new EP.view.portsScannerPage(job));

            this.fireEvent('done');
        }
    }
});
