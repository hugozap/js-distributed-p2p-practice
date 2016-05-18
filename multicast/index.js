/*
 Creates a 1 on 1 stream, basic airpaste functionality.
 It uses multicast to anounce the service (ip, port) to other parties.
 Interesting: You can run one client and type data
 when the next client is executed, all the existing data will be
 sent.
*/

var airpaste = require('airpaste');
var myStream = airpaste();
process.stdin.pipe(myStream).pipe(process.stdout)

