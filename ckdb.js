var pg = require('pg');
var logger = require('./logger');
var async = require('async');

var conString = "postgres://nate:123456@localhost:5432/ckdb";
function queryDB(query,callback) {
  var client = new pg.Client(conString);
  
  client.connect(function(err) {
    if(err) {
      callback('could not connect to postgres', null);
    }
    client.query(query, function(err, result) {
      if(err) {
	callback('error running query', null);
      }
      callback(null,result.rows);
      client.end();
    });
  });
}

function getGroups(callback) {
  var query = {
    name: "Get all groups",
    text: "select username,userid from users"
  };
  queryDB(query,function(err,result){
    if(err) {
      logger.error(err);
      callback([]);
    } else {
      callback(result);
    }
  });
}

function getWorkersByGroup(groupid,callback) {
  var query = {
    name: "Get workers by groupid",
    text: "select * from workers where userid=$1",
    values: [groupid]
  }; 
  queryDB(query,function(err,result){
    if(err) {
      logger.error(err);
      callback([]);
    } else {
      callback(result);
    }
  }); 
}

function getAllWorkers(callback) {
  var query = {
    name: "Get all workers from group",
    text: "select * from workers where userid=$1"
  }; 
  queryDB(query,function(err,result){
    if(err) {
      logger.error(err);
      callback([]);
    } else {
      callback(result);
    }
  }); 
}


// Test
// getGroups(function(groups){
//   async.map(groups,
// 	    function(group,cb){
// 	      var group_name = group.username;
// 	      var group_id = group.userid;
// 	      getWorkers(group_id,function(workers) {
// 		var worker_names = workers.map(function(x){return x.workername;});
// 		var group_info = {};
// 		group_info.name = group_name;
// 		group_info.workers = worker_names;
// 		cb(null,group_info);
// 	      });
// 	    },
// 	    function(err,results){
// 	      console.log(results);
// 	    });
// });
