var spawn = require('child_process').spawn;
var rl = require('readline');
var jsUtils = require('../jsUtils');
var jobManager = require('../job');
var db = require('../db');
var log = require('../logger').log;

var concurrency = 800;
var cmd = '/home/evil/portscanner/scan.js';
var Folder = db.model('Folder');


/* portscan abstract handler */
var portscan = function(opts) {

    var jobTitle = opts.jobTitle;
    var args = opts.args;
    var jobUid = opts.jobUid;
    var nodesCache = {};
    var nbLines = 0;

    var cmdArgs = [];
    jsUtils.objectForEach(args,function(arg,value) {

        // Ignore args which begin with __
        if (arg.match(/^\_\_/)) return;

        // geoip country
        if (arg == 'country') {
            if (value == true) cmdArgs.push('--country');
            return;
        }

        // geoip city
        if (arg == 'city') {
            if (value == true) cmdArgs.push('--city');
            return;
        }

        // reverse dns
        if (arg == 'reverse') {
            if (value == true) cmdArgs.push('--reverse');
            return;
        }

        // other ?
        if (value == false) return;
        cmdArgs.push('--'+arg);
        if (value != true) cmdArgs.push(value);

    },this);

    // defaults
    cmdArgs.push('--progress');
    cmdArgs.push('--opened');
    cmdArgs.push('--json');
    cmdArgs.push(concurrency);

    console.log('Starting',cmd,JSON.stringify(cmdArgs));

    var j = {
        _id:jobUid,
        jobTitle:jobTitle
    };

    var proc = spawn(cmd,cmdArgs);
    var linereader = rl.createInterface(proc.stdout, proc.stdin);

    var job = global.jobManager.add(jobUid,jobTitle,proc);

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
            nodeProps.opened = false;
            nodeProps.type = 'host';
            nodeProps.name = result.ip;
            nodeProps.data = {
                country:result.country,
                city:result.city,
                hostname:result.reverse
            }

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
                        console.log('< '+jobUid+': ',JSON.stringify(result));
                    });
            });
        } else {
            insertPort(metadata,nodesCache[result.ip],result);
        }
    }

    var parseLine = function(line,b,c) {

        // Empty line, exiting
        if (!line) return;

        log.debug('portScan: '+line);

        // Parse json object
        var obj = JSON.parse(line);

        // Empty object, exiting
        if (!obj) {
            log.error('Empty object parsed from string '+line);
            process.exit();
        }

        if (obj._message||obj._error) {
            /* If _message populated, scan is in progress,
             * but nothing interesting at the moment, except
             * the progress of the scan
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

    linereader.on('line',parseLine);

    proc.on('close',function() {
        global.jobManager.terminate(jobUid);
        log.info(nbLines+' processed');
    });
}


var setMaxConcurrency = function(max) {
    concurrency = max;
}

module.exports = portscan;
module.exports.setMaxConcurrency = setMaxConcurrency;
