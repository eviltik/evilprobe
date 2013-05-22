var spawn = require('child_process').spawn;
var jsUtils = require('../libs/jsUtils');
var jobManager = require('../libs/job');
var db = require('./db');
var concurrency = 800;
var cmd = '/home/evil/portscanner/scan.js';
var Folder = db.model('Folder');

/* portscan abstract handler */
var portscan = function(opts) {

    var jobTitle = opts.jobTitle;
    var args = opts.args;
    var jobUid = opts.jobUid;

    var cmdArgs = [];
    jsUtils.objectForEach(args,function(arg,value) {

        // Ignore args which begin with __
        if (arg.match(/^\_\_/)) return;

        // geoip country
        if (arg == 'country') {
            if (value == false) cmdArgs.push('--nocountry');
            return;
        }

        // geoip city
        if (arg == 'city') {
            if (value == false) cmdArgs.push('--nocity');
            return;
        }

        // reverse dns
        if (arg == 'reverse') {
            if (value == false) cmdArgs.push('--noreverse');
            return;
        }

        // other ?
        if (value == false) return;
        cmdArgs.push('--'+arg);
        if (value != true) cmdArgs.push(value);

    },this);

    // defaults
    cmdArgs.push('--progress');
    cmdArgs.push('--ignore');
    cmdArgs.push('--concurrency');
    cmdArgs.push(concurrency);

    console.log('Starting',cmd,JSON.stringify(cmdArgs));

    var j = {
        _id:jobUid,
        jobTitle:jobTitle
    };

    //db.collection('jobs').insert(j);

    var proc = spawn(cmd,cmdArgs);
    global.procs[jobUid] = proc;

    var job = global.jobManager.add(jobUid,{
        _jobUid:jobUid,
        _jobTitle:jobTitle
    });

    global.bayeuxClient.publish('/jobs/status',[job]);

    // STDOUT
    proc.stdout.on('data',function(data) {
        data.toString().split('\n').forEach(function(l) {
            if (!l) return;
            l = JSON.parse(l);
            if (l) {
                if (l._message||l._error) {
                    return global.jobManager.update(jobUid,l);
                }
                bayeuxClient.publish('/jobs/'+jobUid,l);
                l.jobUid = jobUid;
                l.ts = Date.now();
                console.log('< '+jobUid+': ',JSON.stringify(l));

                var o = {
                    workspace:opts.metadata.workspaceId,
                    parent:opts.metadata.parent,
                    creator:opts.userId
                }
                if (opts.metadata.type == 'host') {
                    o.name = l.port;
                    o.type = 'port';
                }
                Folder.do.create(o,function(err,r) {
                    if (err) throw new err;
                });
                //console.log(o,l);
                //db.collection('portscan').insert(l);
            }
        });
    });

    proc.on('close',function() {
        global.jobManager.terminate(jobUid);
        delete global.procs[jobUid];
    });
}


var setMaxConcurrency = function(max) {
    concurrency = max;
}

module.exports = portscan;
module.exports.setMaxConcurrency = setMaxConcurrency;
