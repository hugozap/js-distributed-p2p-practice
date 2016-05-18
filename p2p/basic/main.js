var wswarm = require('webrtc-swarm')
var signalhub = require('signalhub')
// var hubs = ['https://signalhub.mafintosh.com/']
var hubs = ['http://localhost:9999']
var hub = signalhub('canal', hubs)
var swarm = wswarm(hub)
swarm.on('peer', function(peer, id) {
	console.log('peer connnected')
})