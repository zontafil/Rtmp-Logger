var conf = {
	debug: true,
	use_fake_data: false,
	client_timeout: 600000, //timeout for not updated clients (in ms)
	// client_timeout: 60000000000, //timeout for not updated clients (in ms)
	stats:{
		include_clients: false
	}
}


module.exports = conf
