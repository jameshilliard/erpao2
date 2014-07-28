var async = require('async');
var moment = require('moment');
var logger = require('./logger');
var mysql = require('mysql');

var pool = mysql.createPool({
  host: 'localhost',
  user: 'pool',
  password: 'btcbtc',
  database: 'pool',
  port: 3306
});

function now(){
    return moment().format('YYYY-M-D HH:mm:ss');
}

function insert_failed(failed) {
  var insert_controller_sql = "INSERT INTO controller_stats SET ?";
  async.each(failed,function(ip,callback){
      pool.getConnection(function(err, conn) {
      var controller_stat = { 'ip':ip,'online':0,'updated_at':now() };
      conn.query(insert_controller_sql,controller_stat,
		 function(err,res){
		   if(err){
		     logger.error(err);
		     logger.error("insert controller failed: "+ip);
		   } else {
		     logger.info("inserted controller "+ip);
		   }
		 });
      conn.release();
      callback();
    },function(err){
      logger.info("finished inserting failed controllers");
    });
  });
}

function insert_controller(stats) {
}

//pool.end();

exports.insert_failed = insert_failed;
