var log = require('./logger').log;
var db = require('./db');
var express = require('express');
var bcrypt = require('bcrypt');

var app = express();

var init = function() {
    /* start classical express webserver */
    app.use(express.bodyParser());

    app.get('*',function(req,res,next) {
        if(req.url.match(/\.(png|gif|jpg)/)) {
            res.setHeader("Cache-Control", "public, max-age=345600"); // 4 days
            res.setHeader("Expires", new Date(Date.now() + 345600000).toUTCString());
        }
        next();
    });

    app.post('*',function(req,res,next) {
        if (!req.session||!req.session.user||!req.session.user._id) {
            if (!req.url.match(/\/auth\//)) {
                return res.send({error:'Please authenticate'});
            }
        }
        next();
    })

    app.use(express.static(__dirname+'/../www/'));

    /* faye error occured when browser is asking for favicon */
    app.get('/favicon.ico',function(req,res,next) {
    });

    /* redirect to "source" or "build" version of the GUI */
    /*
    app.get('/',function(req,res,next) {
            res.redirect(global.redirect);
    });
    */

    var User = db.model('User');
    var Workspace = db.model('Workspace');
    var Folder = db.model('Folder');

    app.post('/ws/auth/check',User.ws.check);
    app.post('/ws/auth/login',User.ws.login);

    app.post('/ws/workspace/search',Workspace.ws.search);
    app.post('/ws/workspace/mines/exist',Workspace.ws.mines.exist);
    app.post('/ws/workspace/mines/create',Workspace.ws.mines.create);
    app.post('/ws/workspace/mines/load',Workspace.ws.mines.load);
    app.post('/ws/workspace/mines/recent',Workspace.ws.mines.recent)
    app.post('/ws/workspace/mines/close',Workspace.ws.mines.close);
    app.post('/ws/workspace/mines/select',Workspace.ws.mines.select);
    app.post('/ws/workspace/mines/delete',function(req,res,next) {
        log.debug('Workspace.ws.mines.delete '+JSON.stringify(req.body));

        if (!req.body._id) {
            return res.send({ok:false,error:'no workspace specified'});
        }

        Folder.do.dropWorkspace(req,req.body._id,function(err) {
            Workspace.do.dropWorkspace(req,req.body._id,function(err) {
                return res.send({ok:true});
            });
        });
    });

    app.all('/ws/folder/:workspaceId/load',Folder.ws.load);
    app.all('/ws/folder/:workspaceId/create',Folder.ws.create);
    app.all('/ws/folder/:workspaceId/update',Folder.ws.update);
    app.all('/ws/folder/:workspaceId/delete',Folder.ws.delete);
    app.all('/ws/folder/:workspaceId/deleteAll',Folder.ws.deleteAll);
    app.all('/ws/folder/:workspaceId/empty',Folder.ws.empty);
    app.all('/ws/folder/:workspaceId/openClose',Folder.ws.openClose);
    app.listen(global.port||80);
}

var start = function() {

    app.use(express.cookieParser());
    app.use(express.session({ secret: 'nothingSecretHere' }));

    if (global.bayeux) {
        // always use first param of use to isolate faye mount point
        // bodyParser must always be initialized after bayeux
        app.use('/faye',global.bayeux);
    }
    welcome();
    init();
}

var welcome = function() {
    console.log('>--------------------------------------<');
    console.log('>>>>>>>  EvilProbe GUI WebServer <<<<<<<');
    console.log('>--------------------------------------<');
    console.log('>   Please check for ulimit -n 65535   <');
    console.log('>                                      <');
    console.log('> Listening on http://localhost:81/    <');
    console.log('>--------------------------------------<');
    console.log('');
}

module.exports = app;
module.exports.start = start;
