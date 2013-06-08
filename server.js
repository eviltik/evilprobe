#!/usr/bin/env node

var log = require('./libs/logger').log;
log.info('Initializing ...')

var spawn = require('child_process').spawn;
var argv = require('optimist').argv;

// Evilprobe's libs
global.knownPorts = require('./libs/portlist');
var jsUtils = require('./libs/jsUtils');
var db = require('./libs/db');
var app = require('./libs/app');

// Webserver setup
global.port = 81;
global.host = 'localhost';

// Qooxdoo redirect, can be /source/ or /build/
global.redirect = '/source/';

// Background tasks
global.procs = {}

// session
// TODO: but that in mongodb with TTL !
global.sessions = {}

// Faye/bayeux setup
global.bayeux = require('./libs/bayeux');


app.start();

global.bayeuxClient = new bayeux.Client('http://'+host+':'+port+'/faye');

// Job manager
global.jobs = {};
global.jobManager = require('./libs/job');
global.jobManager.setDebug(argv.debug||false);
global.jobManager.init();
