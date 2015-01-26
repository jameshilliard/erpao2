var influx = require('influx');
var logger = require('./logger');
var async = require('async');
var sqlstrings = require('./sqlstrings');
var sprintf = require('sprintf');
var helpers = require('./helpers');
var _ = require('underscore');

var username = 'erpao';
var password = 'laitayipao';
var database = 'workers_db';
var database_pool = 'pool_db';

var workers_db = influx({host:'localhost', port:8086, database:database, username : username, password : password });
var pool_db = influx({host:'localhost', port:8086, database:database_pool, username : username, password : password });

function save_pool(stats,timestamp,callback) {
  pool_db.writePoint('stats', _.extend(stats,{time:timestamp}), function(err,res) {
    if(!err)
      logger.debug("Saved pool stats");
    else
      logger.debug(err);
    callback(err);
  });
}

function save_worker(name,hashrate,timestamp,callback) {
  workers_db.writePoint(name,{hashrate:hashrate,time:timestamp}, function(err,res) {
    if(!err)
      logger.debug("Saved worker "+name);
    else
      logger.debug(err);
    callback(err);
  });
}

function get_pool(callback) {
  var sql = "select hashrate1m,Users,Workers,Idle from stats limit 100 order asc";
  pool_db.query(sql,
		function(err,res){
		  if(err) {
		    logger.debug(err);
		    callback([]);
		  } else {
		    var cols = res[0].columns;
		    var points = res[0].points;
		    var times = points.map(function(e){return e[cols.indexOf('time')];});
		    var hashrates = points.map(function(e){return parseFloat(e[cols.indexOf('hashrate1m')]);});
		    var users = points.map(function(e){return e[cols.indexOf('Users')];});
		    var workers = points.map(function(e){return e[cols.indexOf('Workers')];});
		    var idles = points.map(function(e){return e[cols.indexOf('Idle')];});
		    var series = [];
		    series[0] = _.zip(times,hashrates);
		    series[1] = _.zip(times,users);
		    series[2] = _.zip(times,workers);
		    series[3] = _.zip(times,idles);
		    callback(series);
		  }
		});
}

// [ { name: name, column:[time, mean], points: [ [time,mean], [],[],[] ] ]
var tera = 1000000000000;
function get_worker(name,callback) {
  var sql = sprintf("select mean(hashrate) from %s group by time(15m) limit 100 order asc",name);
  workers_db.query(sql,
		   function(err,res){
		     if(err) {
		       logger.debug(err);
		       callback([]);
		     } else {
		       callback(res[0].points.map(function(item){return [item[0],item[1]/tera];}));
		     }
		   });
}

exports.save_pool = save_pool;
exports.save_worker = save_worker;
exports.get_worker = get_worker;
