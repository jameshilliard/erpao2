var influx = require('influx');
var logger = require('./logger');

var username = 'root';
var password = 'root';
var database = 'workers_db';

var dbserver = influx({host : 'localhost', port : 8086, username : username, password : password });

function init_db(){
  dbserver.getDatabaseNames(function(err,dbs){
    if(err) {
      throw(err);
    } else {
      if(dbs.indexOf('workers_db') === -1) {
	logger.info("Creating database workers_db");
	dbserver.createDatabase('workers_db', function(err) {
	  if(err) throw err;
	  logger.info('Creating User');
	  dbserver.createUser('workers_db', 'erpao', 'laitayipao', function(err) {
            if(err) throw err;
	  });
	});
      }
    }
  });
}

init_db();



// function randomInt (val) {
//     return Math.floor(Math.random() * val * 2 - val);
// }

// function gen_testcase(){
//   var now = new Date();
//   async.times(1000, function(n, next){
//     workers_db.writePoint('amstress.1173', {hashrate1m: 1000 + randomInt(500) , time: now-n*60000}, function(err, res) {
//       next(err, res);
//     });
//   }, function(err, users) {
//   });
// }

