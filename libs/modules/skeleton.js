var jobManager = require('../job');
var log = require('../logger').log;

// jobManager is a global object
var JM = global.jobManager;

var myJob = function(opts) {

    // notify jobManager for this new job
    var job = JM.add(opts,this);

    // arguments are store in 'args' object
    var args = opts.args;

    /*
     * real code of your job goes here
     */

    // when finish, notify jobManager
    JM.terminate(opts._jobUid);

}

module.exports = myJob;
