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

function url_to_ip(url) {
  return url.slice(7,-6);
}

function execSQL(sql,callback){
  pool.getConnection(function(err,conn){
//  logger.debug(sql);
    conn.query(sql,function(err,res){
      conn.release();
      if(err){
	logger.error(err);
	callback(err,null);
      } else {
	callback(null,res);
      }
    });
  });
}

function new_job(job_id) {
  var sql = mysql.format("INSERT INTO jobs SET ?",{'job_id':job_id, 'date':now()});
  execSQL(sql,function(err,res){});
}

function update_job(job) {
  var sql = mysql.format("UPDATE jobs SET ? WHERE job_id=?",[job,job.job_id]);
  execSQL(sql,function(err,res){});
}

function insert_failed(failed) {
  var insert_controller_sql = "INSERT INTO controller_stats SET ?";
  var timestamp = now();
  async.each(failed,function(ip,callback){
      pool.getConnection(function(err, conn) {
      var controller_stat = { 'ip':ip,'online':0,'updated_at':timestamp };
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

function insert_stats(stats,job_id) {
  var timestamp = now();
  var hashrate = 0;
  var expected = 0;
  async.each(stats,function(stat,callback){
    var controller = stat[0];
    var boards = stat[1];
    hashrate = hashrate + controller.HashRate;
    expected = expected + controller.Expected;
    var ip = url_to_ip(controller.url);
    var insert_controller = "INSERT INTO controller_stats SET ?";
    var record = { 'ip':ip,
		   'online':1,
		   'clock':controller.Clock,
		   'hashrate':controller.HashRate,
		   'expected':controller.Expected,
		   'eff':controller.Eff,
		   'accepted':controller.Accepted,
		   'rejected':controller.Rejected,
		   'hwe':controller.HwError,
		   'pdn':controller.PwrDn,
		   'diff':controller.Diff,
		   'uptime':controller.RunningTime,
		   'session':controller.SessionTime,
		   'updated_at':timestamp,
		   'job_id':job_id
		 };
    var sql = mysql.format(insert_controller,record);
    execSQL(sql,function(err,res){});
    logger.info("Insert boards  for "+ip);
    async.each(boards,function(board,callback){
      var insert_board = "INSERT INTO board_stats SET ?";
      var record = { 'board_id':board.id,
		     'controller_ip':ip,
		     'asics':board.asics,
		     'hashrate':board.hashrate,
		     'expected':board.expected,
		     'eff':board.eff,
		     'pdn':board.pdn,
		     'hwe':board.hwe,
		     'ver':board.ver,
		     'updated_at':timestamp,
		     'job_id':job_id
		   };
      var sql = mysql.format(insert_board,record);
      execSQL(sql,function(err,res){});
      callback();
    },function(err){
      logger.info("Insert boards for "+ip+" done.");
    });
    callback();
  },function(err){
    console.log(hashrate);
    console.log(expected);
    var eff = Math.floor(hashrate*10000/expected)/100;
    var job = { 'job_id':job_id,
		'hashrate':hashrate,
		'expected':expected,
		'eff': eff
	      };
    update_job(job);
  });
}

//pool.end();

exports.insert_failed = insert_failed;
exports.insert_stats = insert_stats;
exports.now = now;
exports.new_job = new_job;
exports.url_to_ip = url_to_ip;
