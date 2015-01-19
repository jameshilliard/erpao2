var load_dir = require('read-dir-files');
var fs = require('fs');
var conf= require('./config.json');
var path = require('path');
var helpers = require('./helpers');
var _ = require('underscore');

var poolDir = conf.ckdb_dir + "/logs/pool/";
var userDir = conf.ckdb_dir + "/logs/users/";
var workerDir = conf.ckdb_dir + "/logs/workers/";

function getPoolStatusSync() {
  var poolStatus_file = poolDir+"pool.status";
  try {
    var raw_status = fs.readFileSync(poolStatus_file).toString();
    var status_list = raw_status.split('\n').slice(0,-1);
    return status_list.map(JSON.parse);
  } catch (x) {
    return [];
  }
}

function getGroups(callback) {
  load_dir.list(userDir,
		function(err,res) {
		  if(err) callback([]);
		  else callback(res.slice(1).map(path.basename));
		});
}

function getGroupStats(callback) {
  load_dir.read(userDir,
		function(err,res){
		  if(err) callback([]);
		  else {
		    var group_buffer = _.pairs(res);
		    callback(group_buffer.map(function(elem){return [elem[0],elem[1].toString().trim()];}));
		  }
		});
}

function getAllWorkers(callback) {
  load_dir.read(workerDir,
		function(err,res) {
		  if(err) callback([]);
		  else {
		    var workers = _.keys(res).sort();
		    var grouped_workers = 
			  _.reduce(workers,
				   function(cur,worker){
				     var group = helpers.user_from_worker(worker);
				     var elem = res[worker].toString().trim();
				     var output = JSON.parse(elem);
				     output.group = group;
				     output.worker = worker;
				     if(cur[group]) {
				       cur[group].push(output);
				     } else {
				       cur[group] = [output];
				     }
				     return cur;
				   },
				   {});
		    callback([workers,grouped_workers]);
		  }
		});
}



exports.getPoolStatusSync = getPoolStatusSync;
exports.getGroups = getGroups;
exports.getGroupsStats = getGroupStats;
exports.getAllWorkers = getAllWorkers;
