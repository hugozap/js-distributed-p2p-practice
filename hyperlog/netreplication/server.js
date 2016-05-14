/* 
  replicate two logs across a tcp socket connection
  Run the server, and open 2 clients, type something in each client
*/
var hyperlog = require('hyperlog')
var level = require('level-mem')
var db = level('serverdatabase'+ new Date().getTime())
var net = require('net')
var client = new net.Socket();
var log = hyperlog(db)
//Create the tcp server

net.createServer(function(socket){

	var rep = log.replicate({live:true})
	rep.pipe(socket).pipe(rep);


	
}).listen(3999)

//Monitor received values
var logChangeStream = log.createReadStream({live:true});
logChangeStream.on('data', function(node) {
	console.log('Change:', node.value.toString())
})


function addRecord(log, value, cb) {
	log.append(value, cb)
}


