/* 
  replicate two logs across a tcp socket connection
*/
var hyperlog = require('hyperlog')
var level = require('level-mem')
var db1 = level('db1')
var net = require('net')
var through = require('through2')

var log = hyperlog(db1)
var rep = log.replicate({live:true});
//create the tcp client
var socket = net.createConnection('3999')
socket.on('connect', function(){
	rep.pipe(socket).pipe(rep)
})

//Monitor received values
var logChangeStream = log.createReadStream({live:true});
logChangeStream.on('data', function(node) {
	console.log('Change:', node.value.toString())
})

//pipe stdin to a custom stream that adds a record to the log
process.stdin.pipe(through(function(item, enc,  next){
	addRecord(log, item)
	next();
}))

function addRecord(log, value, cb) {
	log.append(value,  cb)
}


