var jobManager = require('../job');
var log = require('../logger').log;
var net = require('net');
var City = require('geoip').City;
var geoip = new City(__dirname+'/../../data/GeoLiteCity.dat');
var dns = require('dns');
var async = require('async');
var pinger = require('pinger');

var ipInfo = {};
ipInfo.ws = {};
ipInfo.do = {};

var geoCheck = function(ip,next) {
    geoip.lookup(ip,next);
}

var reverseLookup = function(ip,next) {
    dns.reverse(ip,next);
}

info = function(args,cb) {

    log.debug('ipInfo.do.info '+JSON.stringify(args));

    var o = {
        row:args.row,
        ip:args.ip,
        city:'',
        country:'',
        latitude:'',
        longitude:'',
        reverse:''
    };

    async.series([
        function(next) {
            //console.log('geoCheck ',ip);
            geoCheck(args.ip,next);
        },

        function(next) {
            //console.log('reverse ',ip);
            reverseLookup(args.ip,next);
        }

    ],function(err,arr) {

        if (!arr || !arr.length) {
            return cb(null);
        }

        // geolocalisation
        var geo = arr[0];
        if (geo) {
            o.city = geo.city || '';
            o.country = geo.country_name || '';
            o.latitude = geo.latitude || '';
            o.longitude = geo.longitude || '';
        }

        var rev = arr[1];
        if (rev&&rev[0]) {
            // reverse
            o.reverse = rev[0]||'';
        }

        // Pinger only support synchronous ping atm
        if (args.ping) {
            o.up = pinger.ping(args.ip);
        } else {
            o.up = '';
        }
        cb(o);
    });
};

var displayProgress = function(args) {
    var o = this.q.stats();
    //if (!paused) {
        o._message = lastMessage;
    //} else {
    //    o._message = 'Paused';
    //    o._status='Paused';
    //}

    this.JM.update(this.job._jobUid,o);
}

var fetchInfo = function(rec,nextIteration) {
    info(rec,function(o) {
        this.JM.say(this.job._jobUid,o);
        nextIteration();
    }.bind(this));
}

var ipv4Info = function(opts) {

    this.q = require('qjobs')({maxConcurrency:3});
    this.lastMessage = '';
    this.JM = global.jobManager;
    this.job = this.JM.add(opts,this);

    var i = 0;
    var max = opts.args.ips.length;

    opts.args.ips.forEach(function(rec) {
        rec.i = i++;
        rec.max = max;
        rec.ping = opts.args.ping;
        this.q.add(fetchInfo.bind(this),rec);
    }.bind(this));

    this.q.on('end',function() {
        clearInterval(this.progressTimer);
        this.JM.terminate(opts._jobUid);
    }.bind(this));

    this.q.on('jobEnd',function(args) {
        lastMessage = 'Done: '+args.ip;
    });

    this.progressTimer = setInterval(displayProgress.bind(this),1000);

    this.q.run();

}

module.exports = ipv4Info;
