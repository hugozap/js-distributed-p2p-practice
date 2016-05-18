//Based on substack chatwizard
var html = require('yo-yo')
var uniq = require('uniq')
var randomBytes = require('randombytes')

var root = document.querySelector('#content')
var state = {
	regions: [],
	nym: randomBytes(3).toString('hex'),
	region: location.hash,
	alerts: {}
}

var memdb = require('memdb')
//Create a Platform instance
//passing the unique identifier
//and a data store
var platform = require('./alert-platform.js')(state.nym, memdb())
platform.on('join-region', function(region){
	state.regions.push(region)
	uniq(state.regions)
	selectRegion(region)
})

platform.on('peer', update)
platform.on('disconnect', update)
setInterval(update, 1000)

function selectRegion(region) {
	if(!region) return
	state.region = region
}

//Leave region channel
platform.on('part', function(region) {
	var ix = state.regions.indexOf(region)
	if (ix >= 0) {
		state.region.splice(ix, 1)
	}
	selectRegion(state.regions[Math.max(0, ix-1)])
	update()
})

//alerts are stored inside an array whose key is the region object
platform.on('add-alert', function (region, row) {
	console.log(row);
	if (!state.alerts[region]) {
		state.alerts[region] = []
	}
	state.alerts[region].push(row)
	state.alerts[region].sort(function	(a, b) {
		return a.value.time < b.value.time ? -1 : 1
	})
	update()
})


function update () {
	html.update(root, render(state))
}
update()
window.addEventListener('resize', update)

var h = location.hash
platform.joinRegion('#norte')
if (h && h !=='#') {
	platform.joinRegion(h)
}

window.addEventListener('hashchange', function() {
	platform.joinRegion(location.hash)
})

function render ( state ) {
	location.hash = state.region
	return html`
		<div id="content">
			<div class="regions">
				${state.regions.map(renderRegion)}
			</div>
			<div class="alerts">
				${(state.alerts[state.region] || []).map(renderAlert)}
			</div>
			<form class="formalert" onsubmit=${onsubmit}>
				<textarea name="text"></textarea>
				<button type="submit">Add alert </button>
			</form>
		</div>`
}

function onsubmit (ev) {
	ev.preventDefault();
	var atext = this.elements.text.value
	this.reset()
	platform.addAlert(state.region, {
		text:atext
	})
}

function renderRegion(region) {

	return html`
		<div class="region">
			<a onclick=${onclick}> ${region} </a>
		</div>`	
}

function renderAlert(row) {
	return html`
		<div class="alert">
			${row.value.alert.text}
		</div>`
}
