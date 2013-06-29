var EventEmitter = require('events').EventEmitter;
var log = require('./logger').log;
var portscan = require('./modules/portscan');
var ipv4Random = require('./modules/ipv4Random');
var ipv4Info = require('./modules/ipv4Info');

var objectForEach = function(obj,cb) {
    var i = -1;
    for (prop in obj) {
        if (!obj.hasOwnProperty(prop)||typeof obj[prop]=='function') continue;
        cb.bind(this,prop.toString(),obj[prop],++i)();
    }
}

var jobs = global.jobs;

var debug = true;

var toGui = function(job) {
    var j = {};
    j._jobTitle = job._jobTitle;
    j._jobUid = job._jobUid;
    j._status = job._status;
    j._message = job._message;
    j._progress = job._progress;
    j._jobsRunning = job._jobsRunning;
    j._jobsDone = job._jobsDone;
    j._jobsTotal = job._jobsTotal;
    j._timeStart = job._timestart;
    j._timeEnd = job._timeEnd;
    j._timeElapsed =job._timeElapsed;
    return j;
}

var add = function(opts,myJob) {
    var job = JSON.parse(JSON.stringify(opts));
    job._status = 'Starting';
	jobs[job._jobUid] = opts;
	if (debug) log.debug('add #'+job._jobUid,JSON.stringify(job));
    global.procs[opts._jobUid] = myJob;
    refreshJobs();
	module.exports.emit('jobAdded', job);
	return opts;
}

var say = function(jobUid,what) {
    global.bayeuxClient.publish('/jobs/'+jobUid,what);
}

var error = function(jobUid,message) {
    var job = get(jobUid);
    job._status = 'Error';
    job._message = message;
    job._timeElapsed = 0;
    job._progress = 100;
    log.error(job._jobCmd+' not implemented');
}

var del = function(jobUid) {
	var job = JSON.stringify(jobs[jobUid]);
    if (debug) log.debug('del #'+jobUid,job);
	delete jobs[jobUid];
	job = JSON.parse(job);
	module.exports.emit('jobDeleleted', job);
}

var get = function(jobUid) {
	return jobs[jobUid];
}

var update = function(jobUid,args) {
    var j = jobs[jobUid];
    if (!j) return;
    if (j._timeStart) {
        j._timeElapsed = Date.now() - j._timestart;
    }
    objectForEach(args,function(key,val) {
		j[key]=val;
	},this);
	if (debug) log.debug('update #'+jobUid,JSON.stringify(j));
	module.exports.emit('jobUpdated', j);
}

var terminate = function(jobUid,args) {
	var now = new Date().getTime();
    var j = jobs[jobUid];
    if (!j) return;
	j._status = 'Finished';
    refreshJobs();
	if (debug) log.debug('terminate #'+jobUid,JSON.stringify(j));
	module.exports.emit('jobUpdated', j);
    delete global.procs[jobUid];
}

var pauseToggle =  function(d) {
    if (!d._jobUid) return log.error(d._jobCmd+' without jobUid '+d._jobUid);
    log.info('< GUI: pauseToggle: '+d._jobCmd+' wanted for job '+d._jobUid);
    var p = global.procs[d._jobUid];
    if (p.q) {
        if (p.q.paused) {
            p.q.pause(false);
        } else {
            p.q.pause(true);
        }
    } else {
        log.info('< GUI: pauseToggle: '+d._jobCmd+' wanted for job '+d._jobUid);
        p.kill('SIGUSR1');
    }
}

var abort = function(d) {
    if (!d._jobUid) return log.error('Abort without '+d._jobUid);
    log.info('< GUI: abort: '+d._jobCmd+' wanted for job '+d._jobUid);
    var p = global.procs[d._jobUid];
    if (p.q) {
        p.q.abort();
    } else {
        global.procs[d._jobUid].kill();
    }
    terminate(d._jobUid);
}

var setDebug = function(d) {
	debug = d;
}

var getJobs = function(clean) {
	var j = [];
	objectForEach(global.jobs,function(jobUid,job) {
		j.push(toGui(job));
		if (clean && job._status == 'Finished') delete jobs[jobUid];
	});
	return j;
}

/* publish jobs list if changes occured so the GUI can display it */
var previousJobs =[];
var refreshJobs = function() {
    if (!global.bayeuxClient) {
    	return console.log('> No bayeux client, ignoring');
    	clearInterval(refreshJobsTimer);
    }
    var jobs = getJobs(true);
    if (JSON.stringify(jobs) != previousJobs) {
        previousJobs = JSON.stringify(jobs);
        global.bayeuxClient.publish('/jobs/status',jobs);
        log.info('> GUI: refreshJobs: '+JSON.stringify(jobs));
    }
}
var refreshJobsTimer = setInterval(refreshJobs,1000);

var onMessage = function(d,channel) {

    log.info('< GUI: onMessage: '+JSON.stringify(d));

    if (!d) {
        log.error('Received null message');
        return;
    }

    if (!d.userSessionId) {
        log.error('Received something without userSessionId !',JSON.stringify(d));
        return;
    }

    var userId = global.sessions[d.userSessionId];
    if (!userId) {
        log.error('Unknow user with session ',d.userSessionId);
        return;
    }

    d.userId = userId;

    if (!d._jobCmd) {
        log.error('Received something without cmd !',JSON.stringify(d));
        return;
    }

    var allowedJobs = {

        /* allowed jobs */
        'portscan':portscan,
        'ipv4Random':ipv4Random,
        'ipv4Info':ipv4Info,

        /* action on jobs */
        'pause':pauseToggle,
        'unpause':pauseToggle,
        'abort':abort
    }

    if (!allowedJobs[d._jobCmd]) {
        add(d,this);
        return error(d._jobUid,'Module '+d._jobCmd+' not available');
    }
    new allowedJobs[d._jobCmd](d);
}

var init = function() {
    if (!global.bayeuxClient) return;

    var s = bayeuxClient.subscribe('/jobs/manage/*', onMessage);

    s.callback(function() {
        log.info('Channel /jobs/manage initialized');
    });

    s.errback(function(error) {
        log.error(error.message);
        process.exit(0);
    });

}

module.exports = new EventEmitter();
module.exports.add = add;
module.exports.del = del;
module.exports.update = update;
module.exports.terminate = terminate;
module.exports.say = say;
module.exports.setDebug = setDebug;
module.exports.getJobs = getJobs;
module.exports.init = init;