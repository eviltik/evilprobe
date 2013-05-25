var spawn = require('child_process').spawn;
var jsUtils = require('../libs/jsUtils');
var jobManager = require('../libs/job');
var db = require('./db');
var concurrency = 800;
var cmd = '/home/evil/portscanner/scan.js';
var Folder = db.model('Folder');
var log = require('../libs/logger').log;


/* portscan abstract handler */
var portscan = function(opts) {

    var jobTitle = opts.jobTitle;
    var args = opts.args;
    var jobUid = opts.jobUid;
    var nodesCache = {};

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

    var defaultNodeProperties = {
        workspace:opts.metadata.workspaceId,
        creator:opts.userId
    }

    var insertPort = function(metadata,parentId,result)  {
        var nodeProps = JSON.parse(JSON.stringify(defaultNodeProperties));

        var portName = 'unknow';

        if (knownPorts[result.port]) {
            portName = knownPorts[result.port].name||portName;
        }

        nodeProps.parent = parentId;
        nodeProps.opened = true;
        nodeProps.type = 'port';
        nodeProps.name = result.port;
        nodeProps.data = {
            banner:result.response,
            portName: portName,
            protocol: 'tcp'
        }

        Folder.do.create(nodeProps,function(err,r) {
            if (err) throw new err;
            Folder.findOne(r)
                .populate('creator','login')
                .exec(function(err,r) {
                    result.node = Folder.cleanItem(r);
                    bayeuxClient.publish('/jobs/'+jobUid,result);
                    //l.jobUid = jobUid;
                    //l.ts = Date.now();
                    console.log('< '+jobUid+': ',JSON.stringify(result));
                    });
        });
    }

    var insertHost = function(metadata,parentId,result) {
        if (!nodesCache[result.ip]) {
            var nodeProps = JSON.parse(JSON.stringify(defaultNodeProperties));
            nodeProps.parent = parentId;
            nodeProps.opened = true;
            nodeProps.type = 'host';
            nodeProps.name = result.ip;

            Folder.do.create(nodeProps,function(err,r) {
                if (err) throw new err;
                Folder
                    .findOne(r)
                    .populate('creator','login')
                    .exec(function(err,r) {
                        result.node = Folder.cleanItem(r);
                        bayeuxClient.publish('/jobs/'+jobUid,result);
                        insertPort(metadata,r._id,result);
                        nodesCache[result.ip] = r._id;
                        //console.log('< '+jobUid+': ',JSON.stringify(result));
                    });
            });
        } else {
            insertPort(metadata,nodesCache[result.ip],result);
        }
    }

    var parseLine = function(line,b,c) {

        // Empty line, exiting
        if (!line) return;

        // Parse json object
        var obj = JSON.parse(line);


        // Empty object, exiting
        if (!obj) {
            return log.error('Empty object parsed from string '+line);
        }

        if (obj._message||obj._error) {
            /* If _message populated, scan is in progress,
             * but nothing interesting at the moment, except
             * thep progress of the scan
             *
             * If _error populated, an error occured while
             * scanning
             *
             * In both case, notify jobManager for update and
             * return immedialy,
             *
             */
            return global.jobManager.update(jobUid,obj);
        }

        if (opts.metadata.type == 'host') {

            insertPort(opts.metadata,opts.metadata.parent,obj);

        } else if (opts.metadata.type == 'network') {

            insertHost(opts.metadata,opts.metadata.parent,obj);

        }
    }

    proc.stdout.on('data',function(data) {
        data.toString().split('\n').forEach(parseLine);
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
