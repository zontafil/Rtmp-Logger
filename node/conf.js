var conf = {
	force_db_sync: true,	//force rebuilding the DB, set to false in production!
	disable_pushpull: false, //if true, the servers are seen as publisher/player rather than pusher/pullers
	client_timeout: 600000, //timeout for not updated clients (in ms)
	enableTestData: true,	//test data, see app.js
	stats:{
		include_clients: false
	},
	debug: {
		console:{
			enabled: true,
			options:{
				colorize: true,
				level: 'verbose' //silly,debug,verbose,info,warn,error
			}
		},
		file:{
			enabled: true,
			options:{
				filename: 'rtmp_logger.txt',
				level: 'verbose' //silly,debug,verbose,info,warn,error
			}
		}
	},
	db:{
		database: 'test',
		user: 'testuser',
		password: 'test'
	},
	api:{
		onstartMethod: 'get',
		ondoneMethod: 'get'
	}
}


 module.exports = conf
