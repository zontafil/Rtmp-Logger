var conf = {
	debug: true,
	force_db_sync: true,
	use_fake_data: false,
	disable_pushpull: false, //if true, the servers are seen as publisher/player rather than pusher/pullers
	client_timeout: 600000, //timeout for not updated clients (in ms)
	// client_timeout: 60000000000, //timeout for not updated clients (in ms)
	stats:{
		include_clients: false
	}
}


module.exports = conf
