var jobManager = require('../job');
var log = require('../logger').log;
var net = require('net');
var CIDR = require('../cidr');

// jobManager is a global object

var ipv4Random = function(opts) {

    var JM = global.jobManager;

    // notify jobManager for this new job
    var job = JM.add(opts,this);

    // arguments are store in 'args' object
    var args = opts.args;

    /*
     * real code of your job goes here
     */

    var ips = [];
    var i = 0;
    while (i < args.max) {
        var ip = CIDR.long2ip(Math.random()*4294967296);
        if (net.isIPv4(ip)) {
            JM.say(opts._jobUid,{ip:ip});
            i++;
        } else {
            log.debug('ipv4random: '+ip+' is not a valid ipv4');
        }
    }

    // when finish, notify jobManager
    JM.terminate(opts._jobUid);

}

module.exports = ipv4Random;
