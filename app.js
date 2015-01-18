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

function ip_to_value(ip) {
  var chunks = ip.split('.');
  return parseInt(chunks[2])*1000+parseInt(chunks[3]);
}


function seconds_to_str(sec){
  var d = sec/86400;
  sec = sec%86400;
  var h = sec/3600;
  sec = sec%3600;
  var m = sec/60;
  sec = sec%60;
  return printf("%02dd:%02dh:%02dm:%02ds",d,h,m,sec);
}

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
  output.uptime = seconds_to_str(poolstats[0].runtime);
  if(group !== undefined) {
    var workers_in_group = workerstats[group];
    output.groups = 1;
    output.workers = workers_in_group.length;
    output.idle = 0;
    var sum = u.reduce(workers_in_group,function(cur,item){
      cur.hashrate1m = cur.hashrate1m+parseInt(item.hashrate1m);
      cur.hashrate5m = cur.hashrate5m+parseInt(item.hashrate5m);
      cur.hashrate1hr = cur.hashrate1hr+parseInt(item.hashrate1hr);
      cur.hashrate1d = cur.hashrate1d+parseInt(item.hashrate1d);
      return cur;
    },{hashrate1m:0,hashrate5m:0,hashrate1hr:0,hashrate1d:0});
    output.hashrate1m = sum.hashrate1m;
    output.hashrate5m = sum.hashrate5m;
    output.hashrate1hr = sum.hashrate1hr;
    output.hashrate1d = sum.hashrate1d;
  } else {
    output.hashrate1m = poolstats[1].hashrate1m;
    output.hashrate5m = poolstats[1].hashrate5m;
    output.hashrate1hr = poolstats[1].hashrate1hr;
    output.groups = poolstats[0].Users;
    output.workers = poolstats[0].Workers;
    output.idle = poolstats[0].Idle;
  }
  console.log(output);
  return output;
}

app.get('/',function(req,res){
  res.render('index',{pool:[getGroupStats()],workers:u.flatten(u.values(workerstats)),groups:groups.map(function(x){return {group:x};})});
});

app.get('/stats',function(req,res){
  res.json(getGroupStats());
});

app.get('/stats/:group',function(req,res){
  res.json(getGroupStats(req.params.group));
});

stats_loader();
setInterval(stats_loader,60*1000);
logger.info("Started backgroud loader");
var server = app.listen(8000);
logger.info("Listening on Port 8000");

