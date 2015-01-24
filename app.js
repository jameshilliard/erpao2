var express = require('express');
var bodyParser = require('body-parser');
var logger = require('./logger');
var db = require('./ckdb_fs');
var async = require('async');
var u = require('underscore');
var printf = require('printf');
var range = require('./range');
var moment = require('moment');
var helpers = require('./helpers');

var app = express();
app.set('view engine','html');
app.set('views', __dirname + '/views');
app.enable('view cache');
app.engine('html',require('hogan-express'));
app.set('layout', 'layout');
app.enable("jsonp callback");


app.use(bodyParser.urlencoded(({ extended: true })));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

var poolstats;
var workers;
var workerstats;
var groups;
var groupstats;
var last_update = new moment();

function stats_loader() {
  async.series([
    function(cb){
      cb(null,db.getPoolStatusSync());      
    },
    function(cb){
      db.getGroups(function(g){cb(null,g);});
    },
    function(cb){
      db.getGroupsStats(function(gs){cb(null,gs);});
    },
    function(cb){
      db.getAllWorkers(function(w){cb(null,w);});
    }
  ],function(err,results){
    poolstats = results[0];
    groups = results[1];
    groupstats = results[2];
    workers = results[3][0];
    workerstats = results[3][1];
    last_update = new moment();
    logger.info("Status updated");
  });
}


function getGroupStats(group) {
  var output = {};
  output.upstream = poolstats[0].upstream;
  output.uptime = helpers.seconds_to_str(poolstats[0].runtime);
  if(group !== undefined) {
    var workers_in_group = workerstats[group];
    output.groups = 1;
    output.workers = workers_in_group.length;
    var sum = u.reduce(workers_in_group,function(cur,item){
      cur.hashrate1m = cur.hashrate1m+helpers.unsuffix_string(item.hashrate1m);
      cur.hashrate5m = cur.hashrate5m+helpers.unsuffix_string(item.hashrate5m);
      cur.hashrate1hr = cur.hashrate1hr+helpers.unsuffix_string(item.hashrate1hr);
      cur.hashrate1d = cur.hashrate1d+helpers.unsuffix_string(item.hashrate1d);
      cur.idle = cur.idle+item.idle;
      return cur;
    },{hashrate1m:0,hashrate5m:0,hashrate1hr:0,hashrate1d:0,idle:0});
    output.hashrate1m = helpers.suffix_string(sum.hashrate1m);
    output.hashrate5m = helpers.suffix_string(sum.hashrate5m);
    output.hashrate1hr = helpers.suffix_string(sum.hashrate1hr);
    output.hashrate1d = helpers.suffix_string(sum.hashrate1d);
    output.idle = sum.idle;
  } else {
    output.hashrate1m = poolstats[1].hashrate1m;
    output.hashrate5m = poolstats[1].hashrate5m;
    output.hashrate1hr = poolstats[1].hashrate1hr;
    output.groups = poolstats[0].Users;
    output.workers = poolstats[0].Workers;
    output.idle = poolstats[0].Idle;
  }
  logger.debug(output);
  return output;
}

app.get('/',function(req,res){
  var now = moment();
  var render_pool = [getGroupStats()];
  var render_workers = u.flatten(u.values(workerstats));
  render_workers.map(function(x){x.lastshare=helpers.seconds_to_str(now - x.lastshare*1000);});
  render_workers.map(function(x){
    x.hashrate1m_val = helpers.unsuffix_string(x.hashrate1m);
    x.hashrate5m_val = helpers.unsuffix_string(x.hashrate5m);
    x.hashrate1hr_val = helpers.unsuffix_string(x.hashrate1hr);
    x.hashrate1d_val = helpers.unsuffix_string(x.hashrate1d);
  });
  var render_groups = groups.map(function(x){return {group:x};});
  res.render('index',{pool:render_pool, workers:render_workers, groups:render_groups});
});

app.get('/stats',function(req,res){
  res.json(getGroupStats());
});

app.get('/stats/:group',function(req,res){
  res.json(getGroupStats(req.params.group));
});

app.get('/admin',function(req,res){
  res.render('admin');
});

stats_loader();
setInterval(stats_loader,20*1000);
logger.info("Started backgroud loader");
var server = app.listen(8000);
logger.info("Listening on Port 8000");

