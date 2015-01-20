var net = require('net');
var logger = require('./logger');
var socket_dir = "/tmp/ckproxy/";
var generator = socket_dir + "generator";
var connector = socket_dir + "connector";
var listener = socket_dir + "listener";
var stratifier = socket_dir + "stratifier";

function send_msg(socket,msg,callback) {
  var msg_len = msg.length;
  var buf = new Buffer(4);
  buf.fill(0);
  buf.writeUInt32LE(msg_len,0);
  var client = net.createConnection(socket);
  client.on("connect", function() {
    logger.debug('connected to %s', socket);   
    client.write(buf);
    client.write(msg);
  });
  client.on("end", function() {
    logger.debug('disconnected from %s',socket);
  });
  client.on("data", function(data){
    callback(data.slice(4).toString());
  });
}

// generator(handle incoming connect)
exports.getdiff = function(cb) { send_msg(generator,"getdiff",cb);};
exports.getnotify = function(cb) { send_msg(generator,"getnotify",cb);};
// listener(main process)
exports.shutdown = function(cb) { send_msg(listener,"shutdown",cb);};
exports.restart = function(cb) { send_msg(listener,"restart",cb);};
exports.ping = function(cb) { send_msg(listener,"ping",cb);};
// connector(connect to upstream pool)

// stratifier(handle all stratum stuff)


