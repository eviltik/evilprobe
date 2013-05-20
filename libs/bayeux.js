var faye = require('faye');

var bayeux = new faye.NodeAdapter({
    mount: '/faye',
    timeout: 45
});

/* bayeux handlers */
bayeux.bind('subscribe', function(clientId,channel) {
    console.log('subscribe',clientId,channel);
})

bayeux.bind('unsubscribe', function(clientId,channel) {
    console.log('unsubscribe',clientId);
})

bayeux.bind('disconnect', function(clientId) {
    console.log('disconnect',clientId);
})


module.exports = bayeux;
module.exports.Client = faye.Client;

