var wswarm = require('webrtc-swarm')
var signalhub = require('signalhub')
var Level = require('level-browserify')
var hyperlog  = require('hyperlog')
var db = Level('./facts')
var log = hyperlog(db)


/* Adds a new fact
 - previousList can be null or the array of previous node keys (hashes)
 - so the new fact is explicitly dependant on previous facts
*/
window.add = function(previousList, fact){
	log.add(previousList, fact)
}

window.logFact = function(hash) {
	log.get(hash,{}, function(node){
		console.log(node)
	})
}

var changeStream = log.createReadStream({live:true})
changeStream.on('data', function(node){
	console.log(node)
})