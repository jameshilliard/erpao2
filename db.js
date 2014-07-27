var mysql = require('mysql');
var pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'kouxiangtang',
    database: 'pool',
    port: 3306
});

var selectSQL ="select * from details";

pool.getConnection(function (err, conn) {
    if (err) {
	console.log("POOL ==> " + err);
	return 0;
    }

    function query(){
        conn.query(selectSQL, function (err, res) {
            console.log(new Date());
            console.log(res);
            conn.release();
        });
    }
    query();
});
