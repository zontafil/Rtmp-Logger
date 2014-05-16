var conf = {
	force_db_sync: true,	//force rebuilding the DB, set to false in production!
	disable_pushpull: false, //if true, the servers are seen as publisher/player rather than pusher/pullers
	client_timeout: 600000, //timeout for not updated clients (in ms)
	enableTestData: true,	//test data, see app.js
	stats:{
		include_clients: false
	},
	debug: {
		mode: 'console', // file / console / none
		file: '/var/log/rtmp_logger.txt'
	},
	db:{
		database: 'test',
		user: 'testuser',
		password: 'test'
	}
}


 module.exports = conf
