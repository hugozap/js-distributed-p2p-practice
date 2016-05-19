var wswarm = require('webrtc-swarm')
var signalhub = require('signalhub')
var Level = require('level-browserify')
var hyperlog  = require('hyperlog')
var db = Level('./facts')
var log = hyperlog(db)
var html = require('yo-yo')

var root = document.createElement('div');
document.body.appendChild(root);

var state = {
	facts:{},
	heads:[]
}

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
	state.facts[node.key] = node
	state.facts[node.key].linkedNodes = []

	//If this node links other nodes add those to the linkedNodes array
	node.links.forEach(function(key){
		var other = state.facts[key]
		state.facts[node.key].linkedNodes.push(other)
	})

	log.heads(function(err, heads){
		state.heads = heads.map(function(h){
			return state.facts[h.key]
		})
	})

	
	update()
})

function update() {
	html.update(root, render(state))
}

function render(state) {
	return html`
		<div class="container">
			<style>
			 
			</style>
			<div class="heads">
				${renderHeads(state.heads)}
			</div>
		</div>
		`
}

function renderHeads(heads) {
	return html`
		<ul>
			${heads.map(renderFact)}
		</ul>
		`
}

function renderFact(fact) {
	if(fact == null) return;
	return html`<li>

		${fact.value.toString()}
		(<span class="key" style="font-size:small;font-weight:bold">${fact.key}</span>)
		<ul>
			${fact.linkedNodes.map(renderFact)}
		</ul>
	</li>`
}
function renderFacts(facts){

}

setInterval(function(){
	update()
},500)