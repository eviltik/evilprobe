#!/usr/bin/env node

// Node libs
var spawn = require('child_process').spawn;
var db = require('./libs/db');
var argv = require('optimist').argv;

// Evilprobe's libs
var jsUtils = require('./libs/jsUtils');
var app = require('./libs/app');
var portscan = require('./libs/portscan');

// Job manager
global.jobManager = require('./libs/job');
global.jobManager.setDebug(argv.debug||false);

// Webserver setup
global.port = 81;
global.host = 'localhost';

// Qooxdoo redirect, can be /source/ or /build/
global.redirect = '/source/';

// Background tasks
global.procs = {}

// Faye/bayeux setup
global.bayeux = require('./libs/bayeux');
global.bayeuxClient = new bayeux.Client('http://localhost:'+port+'/faye');

app.start();

if (global.bayeuxClient) {
    bayeuxClient.subscribe('/jobs/manage', function(d) {
        if (!d.jobCmd) {
            console.log('Error: received something without cmd !',JSON.stringify(d));
            return;
        }
        if (d.jobCmd == 'portscan') {
            return portscan(d);
        }

        if (!d.jobUid||!global.procs[d.jobUid]) {
            console.log(d.jobUid+' not in processus list');
            process.exit();
            return;
        }

        if (d.jobCmd == 'pause'||d.jobCmd == 'unpause') {
            console.log('< GUI: '+d.jobCmd+' wanted for job '+d.jobUid);
            return global.procs[d.jobUid].kill('SIGUSR1');
        }

        if (d.jobCmd == 'abort') {
            console.log('< GUI: '+d.jobCmd+' wanted for job '+d.jobUid);
            return global.procs[d.jobUid].kill();
        }
    });
}