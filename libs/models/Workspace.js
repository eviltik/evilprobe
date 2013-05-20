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

Workspace.doLoad = function(args,cb) {
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
                    Workspace.doUpdate(wargs);
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

Workspace.doUpdate = function(args,cb) {
    var filters = args.filters||{};
    if (!args.fields) return cb('No fields specified');
    var fields = args.fields;
    var options = args.options;

    Workspace.update(filters,fields,options,cb||function() {});
}

Workspace.ws = {};
Workspace.ws.mines = {};

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

    Workspace.doLoad(args,function(err,ws) {
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

    Workspace.doLoad(args,function(err,ws) {
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
    Workspace.doUpdate(args,function(err) {
        if (err) return req.send({ok:false,error:err});

        args.filters._id = req.body.selectId;
        args.fields.selected = true;
        args.fields.opened = true;
        delete args.options;

        Workspace.doUpdate(args,function(err) {
            if (err) return req.send({ok:false,error:err});
            return res.send({ok:true});
        })
    });
}

Workspace.ws.mines.exist = function(req,res,next) {

    log.debug('Workspace.ws.mines.exist '+JSON.stringify(req.body));

    var o = {
        name:req.body.workspaceName,
        creator:req.session.user._id
    }
    Workspace.findOne(o,function(err,r) {
        if (!r) return res.send({ok:true});
        return res.send({error:'This name is already used'});
    });
}

Workspace.ws.mines.create = function(req,res,next) {

    log.debug('Workspace.ws.mines.create '+JSON.stringify(req.body));

    var w = new Workspace({
        name:req.body.workspaceName,
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
    Workspace.doUpdate(args,function(err) {
        return res.send({ok:true});
    });
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
