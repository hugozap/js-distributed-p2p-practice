/* Basic hyperlog test, create 2 logs and replicate them
   create a change stream for log2 and print each change
*/
var hyperlog = require('hyperlog')
var level = require('level-mem')
var db1 = level('db1')
var db2 = level('db2')

var log1 = hyperlog(db1, {
	valueEncoding: 'json'
})


var log2 = hyperlog(db2, {
	valueEncoding: 'json'
})




//replicate log1 and log2

var s1 = log1.replicate({live:true})
var s2 = log2.replicate({live:true})

s1.pipe(s2).pipe(s1)

s1.on('end', function(){
	console.log('replication ended')
})

//add some records to log1

addRecord(log1, {name:'Nikki', age: 34}, function(){
	addRecord(log1, {name:'Diana', age: 24}, function() {
		addRecord(log1, {name:'Andrea', age: 34})
	})

})

//Add some records to log 2
addRecord(log1, {name:'Johana', age: 34}, function(){
	addRecord(log1, {name:'Catherine', age: 24}, function() {
		addRecord(log1, {name:'Tatiana', age: 34})
	})

})


//log any change to log2
var log2ChangeStream = log2.createReadStream({live:true});
log2ChangeStream.on('data', function(node) {
	console.log('change:', node.value)
})



function addRecord(log, value, cb) {
	log.append(value, {valueEncoding:'json'}, cb)
}


