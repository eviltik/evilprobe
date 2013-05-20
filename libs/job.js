var EventEmitter = require('events').EventEmitter;

var objectForEach = function(obj,cb) {
    var i = -1;
    for (prop in obj) {
        if (!obj.hasOwnProperty(prop)||typeof obj[prop]=='function') continue;
        cb.bind(this,prop.toString(),obj[prop],++i)();
    }
}

var jobs = {};
var debug = false;

var add = function(jobUid,job) {
	job._jobUid = jobUid;
    job._status = 'Starting';
	jobs[jobUid] = job;
	log('add #'+jobUid,JSON.stringify(jobs[jobUid]));
	module.exports.emit('jobAdded', jobs[jobUid]);
	return job;
}

var del = function(jobUid) {
	var job = JSON.stringify(jobs[jobUid]);
    log('del #'+jobUid,job);
	delete jobs[jobUid];
	job = JSON.parse(job);
	module.exports.emit('jobDeleleted', job);
}

var get = function(jobUid) {
	return jobs[jobUid];
}

var update = function(jobUid,args) {
    var j = jobs[jobUid];
    objectForEach(args,function(key,val) {
		j[key]=val;
	},this);
	log('update #'+jobUid,JSON.stringify(j));
	module.exports.emit('jobUpdated', j);
}

var terminate = function(jobUid,args) {
	var now = new Date().getTime();
    var j = jobs[jobUid];
	j._status = 'Finished';
	log('terminate #'+jobUid,JSON.stringify(j));
	module.exports.emit('jobUpdated', j);
}

var setDebug = function(d) {
	debug = d;
}

var log = function(a,b) {
	if (debug === true) console.log(a,b);
}

var getJobs = function(clean) {
	var j = [];
	objectForEach(jobs,function(jobUid,job) {
		j.push(job);
		if (clean && job._status == 'Finished' && !job._message.match(/^Error/)) {
			delete jobs[jobUid];
		}
	});
	return j;
}

/* publish jobs list if changes occured so the GUI can display it */
var previousJobs =[];
var refreshJobs = setInterval(function() {
    if (!global.bayeuxClient) return;
    var jobs = getJobs(true);
    if (JSON.stringify(jobs) != previousJobs) {
        global.bayeuxClient.publish('/jobs/status',jobs);
        log('> GUI: ',JSON.stringify(jobs));
        previousJobs = JSON.stringify(jobs);
    }
},1000);

module.exports = new EventEmitter();
module.exports.add = add;
module.exports.del = del;
module.exports.update = update;
module.exports.terminate = terminate;
module.exports.setDebug = setDebug;
module.exports.getJobs = getJobs;
