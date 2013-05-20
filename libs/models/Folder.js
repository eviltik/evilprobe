var log = require('../logger.js').log;
var mongoose =  require('mongoose');
var tree = require('mongoose-tree');
//mongoose.set('debug', true)


/* schema */
var schema = mongoose.Schema({
    name:       String,
    opened:     Boolean,
    tsOpened:   Date,
    tsCreated:  Date,
    type:       String,
    creator:    { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    workspace: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workspace'
    }
})

schema.plugin(tree);
schema.index({name:1});


/* model */
var Folder = mongoose.model('Folder',schema);
Folder.ws = {};
Folder.do = {};


Folder.do.load = function(args,cb) {
    var filters = args.filters||{name:'root'};
    var columns = args.columns||null;
    var options = args.options||{};

    if (columns && !columns.match(/path/)) {
        // mandatory for recursive children search (mongoose-tree plugin)
        columns+=' path';
    }

    var doExec = function(err,r) {

        if (!r||!r.length) return cb(null,{});

        var fs = [];
        var i = 0;

        r.forEach(function(f) {

            f = JSON.parse(JSON.stringify(f));

            var args = {
                filters:filters,
                columns:columns,
                options:options,
                minLevel:2,
                recursive:true,
                emptyChilds:true
            }

            var ff = new Folder(f);
            ff.getChildrenTree(args,function(err,c) {
                f.childs = c;
                fs.push(f);
                if (i == r.length-1) return cb(null,fs);
                i++;
            })
        });
    }

    Folder
        .find(filters,columns,options)
        //.populate('creator','login')
        .exec(doExec);
}

Folder.do.create = function(args,cb) {
    var w = new Folder(args);
    w.save(function(err,r) {
        cb(err,w,r);
    });
}

Folder.do.update = function(args,cb) {
    var filters = args.filters||{};
    if (!args.fields) return cb('No fields specified');
    var fields = args.fields;
    var options = args.options;

    Folder.update(filters,fields,options,cb||function() {});
}

Folder.do.delete = function(args,cb) {
    var filters = args.filters||{};
    Folder.remove(filters,cb||function() {});
}

Folder.do.dropWorkspace = function(req,workspaceId,cb) {

    log.debug('Folder.do.dropWorkspace '+workspaceId);

    var filters = {
        creator:req.session.user._id,
        workspace:workspaceId
    }

    Folder.remove(filters,cb);
}





Folder.ws.create = function(req,res,next) {

    log.debug('Folder.ws.create '+req.params.workspaceId+'/'+JSON.stringify(req.body));

    var w = {
        name:req.body.name,
        tsOpened:Date.now(),
        tsCreated:Date.now(),
        opened:false,
        creator:req.session.user._id,
        workspace:req.params.workspaceId,
        type:req.body.type||''
    }
    if (req.body.parent) {
        w.parent = req.body.parent;
    }

    Folder.do.create(w,function(err,w,r) {
        if (err) throw err;
        var newFolder = {
            name:r.name,
            _id:r._id
        }
        if (err) return res.send({error:err});
        return res.send({ok:true,node:newFolder});
    });
}

Folder.ws.load = function(req,res,next) {
    log.debug('Folder.ws.load '+req.params.workspaceId+'/'+JSON.stringify(req.body));

    var args = {
        filters:{
            creator:req.session.user._id,
            workspace:req.params.workspaceId,
            parent:null
        },
        columns:'_id name creator type opened',
        options:{}
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
    }

    Folder.do.load(args,function(err,folders) {
        return res.send(folders); 
    })
}

Folder.ws.update = function(req,res,next) {
    log.debug('Folder.ws.update '+req.params.workspaceId+'/'+JSON.stringify(req.body));

    if (!req.body._id) {
        return res.send({ok:false,error:'no node specified'});
    }

    var args = {
        filters:{
            _id:req.body._id,
            creator:req.session.user._id,
            workspace:req.params.workspaceId
        },
        fields:{
            name:req.body.name
        },
        options:{
            multi:false
        }
    };

    Folder.do.update(args,function(err,affectedRows) {
        if (affectedRows) return res.send({ok:true,updated:affectedRows});
        res.send({ok:false,error:err});
    })
}

Folder.ws.delete = function(req,res,next) {
    log.debug('Folder.ws.delete '+req.params.workspaceId+'/'+JSON.stringify(req.body));

    if (!req.body._id) {
        return res.send({ok:false,error:'no node specified'});
    }

    var args = {
        filters:{
            path:{$regex:req.body._id},
            creator:req.session.user._id,
            workspace:req.params.workspaceId
        },
        options:{
            multi:true
        }
    };

    Folder.do.delete(args,function(err,folders) {
        return res.send(folders); 
    })
}

Folder.ws.deleteAll = function(req,res,next) {
    log.debug('Folder.ws.delete '+req.params.workspaceId+'/'+JSON.stringify(req.body));

    var args = {
        filters:{
            creator:req.session.user._id,
            workspace:req.params.workspaceId
        },
        options:{
            multi:true
        }
    };

    Folder.do.delete(args,function(err,folders) {
        return res.send(folders); 
    })
}

Folder.ws.openClose = function(req,res,next) {
    log.debug('Folder.ws.openClose '+req.params.workspaceId+'/'+JSON.stringify(req.body));

    if (!req.body._id) {
        return res.send({ok:false,error:'no node specified'});
    }

    var args = {
        filters:{
            _id:req.body._id,
            workspace:req.params.workspaceId,
            creator:req.session.user._id
        },
        fields:{
            opened:req.body.opened
        },
        options:{
            multi:false
        }
    }
    Folder.do.update(args,function(err,affectedRows) {
        if (affectedRows) return res.send({ok:true,updated:affectedRows});
        res.send({ok:false,error:err});
    })
}

module.exports.Folder = Folder;
