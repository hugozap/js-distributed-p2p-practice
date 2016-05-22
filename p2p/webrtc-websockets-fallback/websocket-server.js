
var wsstream = require('websocket-stream')
var WebSocketServer = require('ws').Server
var args = require('minimist')(process.argv.slice(2))
var port = args.p || process.env.PORT || 4234
var wss = new WebSocketServer({port:port})
var hyperlog  = require('hyperlog')
var level = require('level-browserify')
var db = level('database/'+args.d || 'db')
var log = hyperlog(db, {valueEncoding:'json'})
var through = require('through2')


log.createReadStream({live:true, valueEncoding:'json'}).on('data', function(data){
 console.log(data.value.message)
})

console.log('using port:' , port)
wss.on('connection', function(ws) {
	console.log('Client connected.')
	ws.pipe(log.replicate({live:true})).pipe(ws)
})

//Add every line as a new object
process.stdin.pipe(through(function(data, enc, next){
	log.append({
		'message':data.toString(),
		'date':new Date()
	},{
		valueEncoding:'json'
	})
	next()
}))

