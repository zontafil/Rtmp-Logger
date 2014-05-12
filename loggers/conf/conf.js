exports.serverid = 13
exports.debug = true
exports.use_test_data = true

//configure logging API endpoint
exports.api_logger = {
	host : 'localhost',
	port : 3000,
	on_start : '/Server/{serverid}/Stream/{streamname}/Start?flash={flashver}&swf={swfurl}&nginxclientid={clientid}&url={pageurl}&action={call}',
	method: 'POST'
}