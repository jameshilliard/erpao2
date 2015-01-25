var influx = require('influx');
var logger = require('./logger');
var async = require('async');

var username = 'erpao';
var password = 'laitayipao';
var database = 'workers_db';

var workers_db = influx({host : 'localhost', port : 8086, database:database, username : username, password : password });

function randomInt (val) {
    return Math.floor(Math.random() * val * 2 - val);
}

function gen_testcase(){
  var now = new Date();
  async.times(1000, function(n, next){
    workers_db.writePoint('amstress.1173', {hashrate1m: 1000 + randomInt(500) , time: now-n*60000}, function(err, res) {
      next(err, res);
    });
  }, function(err, users) {
  });
}
