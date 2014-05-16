// DEBUG/ERROR MANAGEMENT
var conf = require('./conf.js'),
	fs = require('fs')



var exp = {
	db_log: function(query){
		if (conf.debug.mode=='file'){
			//print query to file
			fs.appendFile(conf.debug.file, query+"\n")

		}
		else if (conf.debug.mode=='console') console.log(query)
	}
}


module.exports = function(app){

	if (!!app) app.use(function(err,req,res,next){

		if (conf.debug.mode=='file'){
			if (!err.stack) fs.appendFile(conf.debug.file,err+"\n")
			else fs.appendFile(conf.debug.file,err.stack+"\n")

			//print input data injected into request
			if (!!req.person){
				fs.appendFile(conf.debug.file,"Input Data: person\n")
				fs.appendFile(conf.debug.file,JSON.stringify(req.person.dataValues))
			}
			if (!!req.server){
				fs.appendFile(conf.debug.file,"Input Data: server\n")
				fs.appendFile(conf.debug.file,JSON.stringify(req.server.dataValues))
			}
			if (!!req.stream){
				fs.appendFile(conf.debug.file,"Input Data: stream\n")
				fs.appendFile(conf.debug.file,JSON.stringify(req.stream.dataValues))
			}
			if (!!req.streamserver){
				fs.appendFile(conf.debug.file,"Input Data: streamserver\n")
				fs.appendFile(conf.debug.file,JSON.stringify(req.streamserver.dataValues))
			}
		}
		else if (conf.debug.mode=='console'){
			if (!err.stack) console.log(err+"\n")
			else console.log(err.stack+"\n")
		}

		if (!!err.stack) res.send(500,err.stack)
		else res.send(500,err)
	})
	return exp
}