
var hyperlog = require('hyperlog')
var wswarm = require('webrtc-swarm')
var signalhub = require('signalhub')
var inherits = require('inherits')
var EventEmitter = require('events').EventEmitter
var through = require('through2')
var sub = require('subleveldown')
var has = require('has')
var shasum = require('shasum')

module.exports = Platform
inherits(Platform, EventEmitter)

function Platform(nym, db) {
	//allow instance without 'new'
	if (!(this instanceof Platform)) {
		return new Platform(nym, db)
	}
	EventEmitter.call(this)
	this.db = db
	this.logs = {}
	this.swarms = {}
	this.peers = {}
	this.onswarm = {}
	this.ondisconnect = {}
	this.nym = nym
	//Signal servers
	this.hubs = ['https://signalhub.mafintosh.com/']
	//this.hubs = ['http://localhost:9000']
}


Platform.prototype.joinRegion = function(region) {
	console.log('Platform.joinRegion: ', region)
	var self = this
	if (has(self.swarms, region)) {
		return self.emit('join-region', region)
	}

	//Each region has a hyperlog
	self.logs[region] = hyperlog(sub(self.db, region), {valueEncoding:'json'})
	//Create a read stream to the region channel hyperlog
	//and emit a add-alert event when a new record
	//is inserted to the log
	self.logs[region].createReadStream({ live: true})
	.on('data', function(detail){
		console.log('region log: data event', detail);
		self.emit('add-alert', region, detail)
	})

	self.emit('join-region', region)
	var hub = signalhub(shasum('alert.'+region), self.hubs)
	var swarm = wswarm(hub)
	self.swarms[region] = swarm
	self.peers[region] = {}
	self.onswarm[region] = function(peer, id) {
		console.log('peer connected', id);
		self.emit('peer', region, id)
		self.peers[region][id] = peer
		//Connect the hyperlog replication stream with the peer duplex stream
		peer.pipe(self.logs[region].replicate({live:true})).pipe(peer)
	}
	self.ondisconnect[region] = function(peer, id) {
		self.emit('disconnect', region, id)
		delete self.peers[region][id]
	}
	swarm.on('peer', self.onswarm[region])
	swarm.on('disconnect', self.ondisconnect[region])

}

Platform.prototype.part = function(region) {
	var self = this
	if (!has(self.swarm, region)) {
		return
	} 
	delete self.logs[region]
	self.swarms[region].removeListener('peer', self.onswarm[region])
	self.swarms[region].removeListener('peer', self.ondisconnect[region])
	delete self.swarms[region]
	delete self.onswarm[region]
	delete self.ondisconnect[region]
	Object.keys(self.peers[region].forEach(function(key){
		self.peers[region][key].destroy90
	}))
	delete self.peers[region]
	self.emit('part', region)
}

Platform.prototype.addAlert = function(region, alertData) {
	if(!has(this.logs, region)) {
		return
	}
	var data = {
		time: Date.now(),
		who: this.nym,
		alert: alertData
	}
	//Adding to the hyperlog will replicate with connected peers
	this.logs[region].append(data, function ( err, node) {})
}