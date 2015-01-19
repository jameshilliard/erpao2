var printf = require('printf');

function min(a,b) {
    if(a<b) return a;
    else return b;
}

function user_from_worker (worker) {
    var pos_dot = worker.indexOf('.');
    var pos_underscore = worker.indexOf('_');
    if(pos_underscore==-1 && pos_dot == -1) 
	return worker;
    if(pos_dot==-1)
	return worker.slice(0,pos_underscore);
    if(pos_underscore==-1)
	return worker.slice(0,pos_dot);
    return worker.slice(0,min(pos_underscore,pos_dot));
}

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

var kilo = 1000;
var mega = 1000000;
var giga = 1000000000;
var tera = 1000000000000;
var peta = 1000000000000000;
var exa  = 1000000000000000000;

function suffix_string(hashrate) {
  var suffix;
  var value;
  var decimal=true;
  if (hashrate >= exa) {
    hashrate /= peta;
    value = hashrate / kilo;
    suffix = 'E';
  } else if (hashrate >= peta) {
    hashrate /= tera;
    value = hashrate / kilo;
    suffix = 'P';
  } else if (hashrate >= tera) {
    hashrate /= giga;
    value = hashrate / kilo;
    suffix = 'T';
  } else if (hashrate >= giga) {
    hashrate /= mega;
    value = hashrate / kilo;
    suffix = 'G';
  } else if (hashrate >= mega) {
    hashrate /= kilo;
    value = hashrate / kilo;
    suffix = 'M';
  } else if (hashrate >= kilo) {
    value = hashrate / kilo;
    suffix = 'K';
  } else {
    value = hashrate;
    decimal = false;
  }
  if(decimal) {
    return printf("%.3g%s", value, suffix);
  } else {
    return printf("%d", value);
  }  
}

function unsuffix_string(hashrate) {
  var value = parseFloat(hashrate);
  var suffix = hashrate.slice(-1);
  var coef;
  switch(suffix) {
    case 'E': coef = exa;break;
    case 'P': coef = peta;break;
    case 'T': coef = tera;break;
    case 'G': coef = giga;break;
    case 'M': coef = mega;break;
    case 'K': coef = kilo;break;
    default: coef = 1;break;
  }
  return value*coef;
}

exports.user_from_worker = user_from_worker;
exports.ip_to_value = ip_to_value;
exports.seconds_to_str = seconds_to_str;
exports.suffix_string = suffix_string;
exports.unsuffix_string = unsuffix_string;
