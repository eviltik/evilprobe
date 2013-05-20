var db = require('./db');
var express = require('express');
var bcrypt = require('bcrypt');

var app = express();

/* start classical express webserver */
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.session({ secret: 'nothingSecretHere' }));

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

app.use(express.static(__dirname+'/../gui/'));

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
app.post('/ws/auth/check',User.ws.check);
app.post('/ws/auth/login',User.ws.login);

var Workspace = db.model('Workspace');
app.post('/ws/workspace/search',Workspace.ws.search);
app.post('/ws/workspace/mines/exist',Workspace.ws.mines.exist);
app.post('/ws/workspace/mines/create',Workspace.ws.mines.create);
app.post('/ws/workspace/mines/load',Workspace.ws.mines.load);
app.post('/ws/workspace/mines/recent',Workspace.ws.mines.recent)
app.post('/ws/workspace/mines/close',Workspace.ws.mines.close);
app.post('/ws/workspace/mines/select',Workspace.ws.mines.select);

var Folder = db.model('Folder');
app.all('/ws/folder/:workspaceId/load',Folder.ws.load);
app.all('/ws/folder/:workspaceId/create',Folder.ws.create);
app.all('/ws/folder/:workspaceId/update',Folder.ws.update);
app.all('/ws/folder/:workspaceId/delete',Folder.ws.delete);
app.all('/ws/folder/:workspaceId/openClose',Folder.ws.openClose);

var start = function() {
    if (global.bayeux) app.use(global.bayeux);
    app.use(express.bodyParser());
    app.listen(global.port||80);
    welcome();
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
