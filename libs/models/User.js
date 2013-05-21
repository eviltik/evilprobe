var log = require('../logger.js').log;
var mongoose =  require('mongoose');
var bcrypt = require('bcrypt');
var SALT_WORK_FACTOR = 10;


/* schema */
var schema = mongoose.Schema({
    login: String,
    pass: String
})

schema.index({login:1});

/* model */
var User = mongoose.model('User',schema);

/* hooks */
schema.pre('save',function(next) {
    // No pass ? not creating a new user, exiting
    if (!this.pass) return next();

    // Pass ? let's hash it !
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if (err) log.fatalError(err);
        bcrypt.hash(this.pass, salt, function(err, hash) {
            if (err) log.fatalError(err);
            this.pass = hash;
            next();
        }.bind(this));
   }.bind(this));
});

/* private methods */
var __createFirstUser = function () {
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if (err) throw new Error(err);
        bcrypt.hash('admin', salt, function(err, hash) {
            if (err) throw new Error(err);
            User.create({login:'admin',pass:'admin'},function() {
                log.info('No user found in database, create first one (admin/admin)');
            });
        });
   });
}

/* if no user create the first one */
User.count(function(err,nbUser) {
    if (nbUser === 0) {
        log.warn('TODO: move first user creating in the GUI ...');
        __createFirstUser();
    }
});

/* public methods */
User.ws = {}

User.ws.check = function(req,res,next) {
    var authenticated = false;
    if (req.session && req.session.authenticated) {
        authenticated = true;
    }
    res.send({
        authenticated:authenticated,
        session:req.session.id
    });
}

User.ws.login = function(req,res,next) {
    var authenticated = false;
    User.findOne({login:req.body.login},function(err,user) {
        if (err) {
            res.send({authenticated:false});
            throw err;
        }
        if (!user) {
            return res.send({authenticated:false});
        }
        bcrypt.compare(req.body.password, user.pass, function(err, isMatch) {
            if (err) throw err;
            if (isMatch) {
                req.session.user = {
                    _id:user._id,
                    login:user.login
                }
                req.session.authenticated = Date.now();
                authenticated = true;
            }
            res.send({
                authenticated:authenticated,
                session:req.session.id
            });
        });
    });
}


module.exports.User = User;
