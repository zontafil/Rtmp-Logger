var winston = require('winston')
, expressWinston = require('express-winston')
, conf = require('./conf.js')

var exp = {
	transports: [],
	winston: winston,
	winston_noConsole: null,
	expressWinston: expressWinston,
	errorMiddleware: function(err,req,res,next){
		if (!err.stack){
			res.send(500,err)
			exp.winston.error(err)	
		} 
		else{
			res.send(500,err.stack)
			exp.winston.error(err.stack)	
		}

		//PRINT INPUT DATA
		if (!!req.server) winston_noConsole.error(JSON.stringify(req.server),{item: 'req.server'})
		if (!!req.person) winston_noConsole.error(JSON.stringify(req.person),{item: 'req.person'})
		if (!!req.stream) winston_noConsole.error(JSON.stringify(req.stream),{item: 'req.stream'})
		if (!!req.streamserver) winston_noConsole.error(JSON.stringify(req.streamserver),{item: 'req.streamserver'})

	}
}

module.exports = function(app){

		if (!!app){

			winston_noConsole = new (winston.Logger)()
			winston.remove(winston.transports.Console)

			if (conf.debug.console.enabled) {
				winston.add(winston.transports.Console,conf.debug.console.options)
				exp.transports.push(new winston.transports.Console(conf.debug.console.options))
			}
			if (conf.debug.file.enabled) {
				winston.add(winston.transports.File, conf.debug.file.options)
				winston_noConsole.add(winston.transports.File, conf.debug.file.options)
				exp.transports.push(new winston.transports.File(conf.debug.file.options))
			}
		}

		return exp
}