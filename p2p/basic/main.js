var wswarm = require('webrtc-swarm')
var signalhub = require('signalhub')

var hubs = ['http://localhost:9999/'/*,'https://signalhub.mafintosh.com/'*/]
var hub = signalhub('canal', hubs)
var swarm = wswarm(hub)
var mypeers = {}

swarm.on('peer', function(peer, id) {
	console.log('peer connnected')
	mypeers[id] = peer;
	peer.on('data', function(d){
		console.log('received:', d.toString(), 'from', id)
	})

})

swarm.on('disconnect', function(peer, id){
	delete mypeers[id];
})

setInterval(function(){
	Object.keys(mypeers).forEach(function(key){
		var peer = mypeers[key]
		if(peer){
			peer.send(Math.random()*100);
		}
	})
},500)