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

exports.user_from_worker = user_from_worker;