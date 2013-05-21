var log = require('./logger').log;
var faye = require('faye');

var bayeux = new faye.NodeAdapter({
    mount: '/faye',
    timeout: 45
});

/* bayeux handlers */

bayeux.bind('subscribe', function(clientId,channel) {
    log.debug('faye: subscribe',clientId,channel);
});

bayeux.bind('unsubscribe', function(clientId,channel) {
    log.debug('faye: unsubscribe',clientId);
});

bayeux.bind('disconnect', function(clientId) {
    log.debug('faye: disconnect',clientId);
});

bayeux.bind('handshake', function(clientId) {
    log.debug('faye: handshake',clientId);
});

bayeux.bind('publish',function(clientId,channel,data) {
	log.debug('faye: publish',clientId,channel);
})

module.exports = bayeux;
module.exports.Client = faye.Client;

