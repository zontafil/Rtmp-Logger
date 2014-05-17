var winston = require('winston')
, expressWinston = require('express-winston')
, conf = require('./conf.js')

var exp = {
	transports: [],
	winston: winston,
	expressWinston: expressWinston,
	errorMiddleware: function(err,req,res,next){
		if (!err.stack) res.send(500,err)
		else res.send(500,err.stack)
	}
}

module.exports = function(app){

		if (!!app){

			winston.remove(winston.transports.Console)
			if (conf.debug.console.enabled) {
				winston.add(winston.transports.Console)

				exp.transports.push(new winston.transports.Console({
		          json: false,
		          colorize: true
		        }))
			}
			if (conf.debug.file.enabled) {
				winston.add(winston.transports.File, { filename: conf.debug.file.filename })
				exp.transports.push(new winston.transports.File({ filename: conf.debug.file.filename }))
			}
		}

		return exp
}