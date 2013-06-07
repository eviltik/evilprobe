var net = require('net');
var City = require('geoip').City;
var geoip = new City(__dirname+'/../data/GeoLiteCity.dat');
var log = require('./logger.js').log;
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

ipInfo.do.info = function(args,cb) {

    log.debug('ipInfo.do.info '+JSON.stringify(args));

    var o = {
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
        if (args.ping && args.ping == 'true') {
            o.up = pinger.ping(args.ip);
        } else {
            o.up = '';
        }
        cb(o);
    });
};

ipInfo.ws.info = function(req,res,next) {
    if (!net.isIPv4(req.params.ip)) {
        return res.send({ok:true,error:req.params.ip+' is not a valid ipv4'});
    }
    ipInfo.do.info({ip:req.params.ip,ping:req.body.ping},function(o) {
        o.idrow = req.body.idrow;
        return res.send({ok:true,data:o});
    });
}


module.exports = ipInfo;