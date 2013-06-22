var log = require('../logger.js').log;
var net = require('net');
var cidr = require('../cidr');
var mongoose =  require('mongoose');
var tree = require('mongoose-tree2');
mongoose.set('debug', false);


/* schema */
var schema = mongoose.Schema({
    name:       {
        type:String,
        trim:true
    },
    longip: {
        type:Number
    },
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
    },
    data: mongoose.Schema.Types.Mixed
})

schema.plugin(tree);
schema.index({name:1,longip:1,data:1,creator:1,workspace:1,path:1,type:1});


/* model */
var Folder = mongoose.model('Folder',schema);
Folder.ws = {};
Folder.do = {};

Folder.cleanItem = function(item) {
    item = JSON.parse(JSON.stringify(item));
    if (item.creator) {
        item.creator = item.creator.login || 'Unknow';
    }
    delete item.path;
    return item;
}

Folder.do.load = function(args,cb) {
    var filters = args.filters||{name:'root'};
    var columns = args.columns||'_id name path';
    var options = args.options||{};

    // Needed because options are dynamicaly
    // updated by mongoose or mongoose-tree
    var optionsO = JSON.parse(JSON.stringify(options));

    if (columns) {
        if (!columns.match(/path/)) {
            // mandatory for recursive children search (mongoose-tree plugin)
            columns+=' path';
        }
    }

    var doExec = function(err,r) {

        if (!r||!r.length) return cb(null,{});

        var cleanItems = function(r) {
            if (r.length) {
                r.forEach(function(item,i) {
                    if (item.childs && item.childs.length) {
                        r[i].childs = cleanItems(item.childs);
                    }
                    r[i] = Folder.cleanItem(item);
                });
            }
            return r;
        }

        var fs = [];
        var i = 0;
        var j = 0;

        r.forEach(function(f) {

            f = JSON.parse(JSON.stringify(f));

            var args = {
                filters:filters,
                columns:columns,
                options:optionsO,
                minLevel:2,
                recursive:true,
                emptyChilds:true
            }

            var ff = new Folder(f);
            ff.getChildrenTree(args,function(err,c) {
                f.childs = c;
                fs[this.j]=f;
                if (i == r.length-1) {
                    fs = cleanItems(fs);
                    return cb(null,fs);
                }
                i++;
            }.bind({j:j}))
            j++;
        });
    }

    Folder
        .find(filters,columns,options)
        .populate('creator','login')
        .exec(doExec);
}

Folder.do.create = function(args,cb) {
    if (net.isIPv4(args.name)) {
        args.longip = cidr.ip2long(args.name);
    } else {
        args.longip = 0;
    }
    var w = new Folder(args);
    w.save(function(err,r) {
        cb(err,w,r);
    });
}

Folder.do.update = function(args,cb) {
    var filters = args.filters||{};
    if (!args.fields) return cb('No fields specified');

    if (net.isIPv4(args.fields.name)) {
        args.fields.longip = cidr.ip2long(args.fields.name);
    } else {
        args.fields.longip = 0;
    }

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
        opened:true,
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
        columns:'_id name creator type opened data',
        options:{
            sort:{'type':1,'longip':1,'name':1}
        }
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

Folder.ws.empty = function(req,res,next) {
    log.debug('Folder.ws.empty '+req.params.workspaceId+'/'+JSON.stringify(req.body));

    if (!req.body._id) {
        return res.send({ok:false,error:'no node specified'});
    }

    var args = {
        filters:{
            path:{$regex:req.body._id+'.+'},
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
