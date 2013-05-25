var log = require('../libs/logger').log;
var fs = require('fs');
var xml2json = require('xml2json');

log.info('IANA Ports list: reading file ...');

var content = fs.readFileSync('data/service-names-port-numbers.xml');

log.info('IANA Ports list: completed ('+content.length+' bytes)');

log.info('IANA Ports list: parsing data ...');

ianaPorts = xml2json.toJson(content,{object:true,reversible:false});

delete content;

/*
<registry xmlns="http://www.iana.org/assignments" id="service-names-port-numbers">
  <title>Service Name and Transport Protocol Port Number Registry</title>
  <updated>2013-05-24</updated>
  <expert>Joe Touch; Markku Kojo, Eliot Lear, Allison Mankin, Kumiko Ono, Martin Stiemerling, Lars Eggert and Alexey Melnikov</expert>
  <note>********************</note>
  <record>
    <name>telnet</name>
    <protocol>tcp</protocol>
    <xref type="person" data="Jon_Postel"/>
    <description>Telnet</description>
    <number>23</number>
    <xref type="rfc" data="rfc854"/>
    <note>Defined TXT keys: u=&lt;username&gt; p=&lt;password&gt;</note>
  </record>
</registery>
*/


var ports = {};
var protocols = [];

for (var i = 0; i < ianaPorts.registry.record.length;i++) {
    var r = ianaPorts.registry.record[i];
    if (r.number) {
        //log.debug('IANA Ports list: adding port '+r.number+' '+r.name||r.description);
        ports[r.number] = {
          name:r.name || r.description
        }
        if (protocols.indexOf(r.protocol)==-1) {
          //log.debug('IANA Ports list: adding protocol '+r.number);
          protocols.push(r.protocol);
        }
        i++;
    }
}

log.info('IANA Ports list: founded '+i+' ports ('+protocols.join(',')+')');


module.exports = ports;
