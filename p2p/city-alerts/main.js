//Based on substack chatwizard
var html = require('yo-yo')
var uniq = require('uniq')
var randomBytes = require('randombytes')

var root = document.querySelector('#container')
var state = {
	regions: [],
	nym: randomBytes(3).toString('hex'),
	region: location.hash,
	alerts: {}
}

var memdb = require('memdb')
var db = require('level-browserify')('db1')
//Create a Platform instance
//passing the unique identifier
//and a data store
var platform = require('./alert-platform.js')(state.nym, db /*memdb()*/)
platform.on('join-region', function(region){
	state.regions.push(region)
	uniq(state.regions)
	selectRegion(region)
	update()
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
		return a.value.time > b.value.time ? -1 : 1
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
		<div id="layout" class="">
			<div class="title">
				City Alerts
			</div>
			<div class="regions">
				<div>
					<ul class="">
						${state.regions.map(renderRegion)}
					</ul>
				</div>
			</div>
			<div class="alerts" >
				<div class="">
					<form class="formregion pure-form" onsubmit=${onsubmitjoin}>
						<fieldset>
							<label for="region">Region</label>
							<input type="text" name="region">
							<button class="pure-buttom pure-button-primary" id="btnJoinRegion">Entrar</button>
						</fieldset>
					</form>
					<form class="formalert pure-form" onsubmit=${onsubmitadd}>
						<fieldset>
							<label for="text">Add alert</label>
							<textarea name="text"></textarea>
							<button class="pure-buttom pure-buttom-primary" type="submit">Add alert </button>
						</fieldset>
					</form>
				</div>
				<div id="list">
				</div>
				${(state.alerts[state.region] || []).map(renderAlert)}
				
			</div>
			
		</div>`
}


function onsubmitjoin (ev) {
	ev.preventDefault();
	var region = this.elements.region.value
	this.reset()
	platform.joinRegion('#'+region)
}

function onsubmitadd (ev) {
	ev.preventDefault();
	var atext = this.elements.text.value
	this.reset()
	platform.addAlert(state.region, {
		text:atext
	})
}

function renderRegion(region) {

	return html`
		<li class="region-item">
			<a onclick=${onclickregion} href='#' class=""> ${region} </a>
		</li>`	
}

function renderAlert(row) {
	return html`
		<div class="alert alert-item">
			<span class="alert-name">
				Alerta
			</span>
			<span class="alert-desc">
				${row.value.alert.text}
			</span>
		</div>`
}

function onclickregion(ev){
	platform.joinRegion(ev.target.innerText)
}
