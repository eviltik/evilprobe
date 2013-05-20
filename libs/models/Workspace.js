var log = require('../logger.js').log;
var mongoose =  require('mongoose');
//mongoose.set('debug', true)


/* schema */
var schema = mongoose.Schema({
    name:       String,
    selected:   Boolean,
    opened:     Boolean,
    tsOpened:   Date,
    tsCreated:  Date,
    tsClosed:   Date,
    creator:    { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }
})

schema.index({opened:1,name:1,tsOpened:1})

/* model */
var Workspace = mongoose.model('Workspace',schema);

Workspace.ws = {};
Workspace.ws.mines = {};
Workspace.do = {};

Workspace.do.load = function(args,cb) {
    var filters = args.filters||{};
    var columns = args.columns||'_id';
    var options = args.options||{};

    var doExec = function(err,r) {
            if (!r||!r.length) {
                return cb(null,{});
            }
            var ws=[];
            r.forEach(function(w) {
                w = JSON.parse(JSON.stringify(w)+'');
                if (w.creator) {
                    w.creator = w.creator.login;
                }

                // TODO: make an array of _id 
                // rather than loop foreach
                if (r.length == 1) {
                    var wargs = {
                        filters:{
                            _id:w._id
                        },
                        fields:{
                            opened:true,
                            tsOpened:Date.now()
                        },
                        options:{
                            multi:true
                        }
                    }
                    Workspace.do.update(wargs);
                }

                ws.push(w);
            });
            cb(null,ws);
    } 

    if (columns.match(/creator/)) {
        Workspace
            .find(filters,columns,options)
            .populate('creator','login')
            .exec(doExec);
    } else {
        Workspace
            .find(filters,columns,options)
            .exec(doExec);        
    }
}

Workspace.do.update = function(args,cb) {
    var filters = args.filters||{};
    if (!args.fields) return cb('No fields specified');
    var fields = args.fields;
    var options = args.options;

    Workspace.update(filters,fields,options,cb||function() {});
}

Workspace.do.delete = function(args,cb) {
    var filters = args.filters||{};
    Workspace.remove(filters,cb||function() {});
}

Workspace.do.dropWorkspace = function(req,workspaceId,cb) {

    log.debug('Workspace.do.dropWorkspace '+workspaceId);

    var filters = {
        creator:req.session.user._id,
        _id:workspaceId
    }

    Workspace.remove(filters,cb||function() {});
}


Workspace.ws.mines.load = function(req,res,next) {
    log.debug('Workspace.ws.mines.load '+JSON.stringify(req.body));

    var args = {
        filters:{
            creator:req.session.user._id
        },
        columns:'_id name selected creator',
        options:{
            sort:{tsOpened:1},
            limit:50
        },
        setOpened:true
    };

    if (req.body.filters) {
        var rfilters = JSON.parse(req.body.filters);
        var mor = [];
        rfilters.forEach(function(f) {
            if (f._id) {
                mor.push({_id:f._id});
            }
        });
        args.filters.$or = mor;
    } else {
        args.filters.opened = true;
    }

    Workspace.do.load(args,function(err,ws) {
        return res.send({ok:true,workspaces:ws});
    })
}

Workspace.ws.mines.recent = function(req,res,next) {

    log.debug('Workspace.ws.mines.recent '+JSON.stringify(req.body));

    var args = {
        filters:{
            creator:req.session.user._id
        },
        columns:'_id name selected',
        options:{
            sort:{tsClosed:-1},
            limit:10
        }
    };

    Workspace.do.load(args,function(err,ws) {
        return res.send({ok:true,workspaces:ws});
    })
}

Workspace.ws.mines.select = function(req,res,next) {

    log.debug('Workspace.ws.mines.select '+JSON.stringify(req.body));

    if (!req.body.selectId) {
        return res.send({ok:false});
    }

    var args = {
        filters:{
            creator:req.session.user._id
        },
        fields:{
            selected:false
        },
        options:{
            multi:true
        }
    }
    Workspace.do.update(args,function(err) {
        if (err) return req.send({ok:false,error:err});

        args.filters._id = req.body.selectId;
        args.fields.selected = true;
        args.fields.opened = true;
        delete args.options;

        Workspace.do.update(args,function(err) {
            if (err) return req.send({ok:false,error:err});
            return res.send({ok:true});
        })
    });
}

Workspace.ws.mines.exist = function(req,res,next) {

    log.debug('Workspace.ws.mines.exist '+JSON.stringify(req.body));

    var name = req.body.workspaceName||'';
    name = name.replace(/^ */,'');
    name = name.replace(/ *$/,'');

    var o = {
        name:name,
        creator:req.session.user._id
    }
    Workspace.findOne(o,function(err,r) {
        if (!r) return res.send({ok:true});
        return res.send({error:'This name is already used'});
    });
}

Workspace.ws.mines.create = function(req,res,next) {

    log.debug('Workspace.ws.mines.create '+JSON.stringify(req.body));

    if (!req.body.workspaceName) {
        return res.send({ok:false,error:'empty workspace name'});
    }

    var name = req.body.workspaceName;
    name = name.replace(/^ */,'');
    name = name.replace(/ *$/,'');

    if (!name.length) {
        return res.send({ok:false,error:'empty workspace name'});
    }

    var w = new Workspace({
        name:name,
        tsOpened:Date.now(),
        tsCreated:Date.now(),
        creator:req.session.user._id
    });
    w.save(function(err,r) {
        var newWorkspace = {
            name:r.name,
            _id:r._id
        }
        if (err) return res.send({error:err});
        return res.send({ok:true,workspace:newWorkspace});
    });
}


Workspace.ws.mines.close = function(req,res,next) {

    log.debug('Workspace.ws.mines.close '+JSON.stringify(req.body));

    var args = {
        filters:{
            _id:req.body._id
        },
        fields:{
            selected:false,
            opened:false,
            tsClosed:Date.now()
        }
    }
    Workspace.do.update(args,function(err) {
        return res.send({ok:true});
    });
}

Workspace.ws.mines.delete = function(req,res,next) {

    log.debug('Folder.ws.mines.delete '+JSON.stringify(req.body));

    if (!req.body._id) {
        return res.send({ok:false,error:'no workspace specified'});
    }

    var args = {
        filters:{
            _id:req.body._id,
            creator:req.session.user._id
        },
        options:{
            multi:true
        }
    };

    Workspace.do.delete(args,function(err,folders) {
        return res.send(folders); 
    })
}

Workspace.ws.search = function(req,res,next) {

    log.debug('Workspace.ws.search '+JSON.stringify(req.body));

    var filters = {};
    if (req.body.q) filters.name = new RegExp(req.body.q);
    
    var columns = '_id name selected creator tsCreated';
    var options = {
        sort:{tsClosed:-1},
        limit:500
    };

    Workspace
        .find(filters,columns,options)
        .populate('creator','login')
        .exec(function(err,r) {
            if (!r||!r.length) {
                return res.send({ok:true});
            }
            var ws=[];
            r.forEach(function(w) {
                w = JSON.parse(JSON.stringify(w)+'');
                if (w.creator) w.creator = w.creator.login;
                ws.push(w);
            });
            return res.send({ok:true,workspaces:ws});
        });
}


module.exports.Workspace = Workspace;
