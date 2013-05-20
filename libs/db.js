var log = require('./logger').log;
var mongoose = require('mongoose');
var dbPath = 'mongodb://localhost/evilprobe';

log.debug('Connecting to '+dbPath);
mongoose.connect(dbPath);

var db = mongoose.connection;

db.on('error', function() {
    throw new Error('Can not connect to '+dbPath);
});

db.once('open', function() {
    log.info('Connected to '+dbPath);
});

mongoose.model('User', require('./models/User').User);
mongoose.model('Workspace', require('./models/Workspace').Workspace);
mongoose.model('Folder', require('./models/Folder').Folder);
module.exports = mongoose;