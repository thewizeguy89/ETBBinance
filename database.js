require('dotenv').config();
const mysql = require('mysql2');

let connection = mysql.createConnection({
	host: 'localhost',
	user: process.env.DB_USER,
	password: process.env.DB_PASS,
	database: process.env.DB_NAME
})

connection.connect(function(err) {
	if (err)throw err;
	connection.query('SELECT exchange, price FROM test_eth.ticker', function(err, result,fields){
		if(err)throw err;
		console.log(result);
	})
})
