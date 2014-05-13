var db = require('../models')
var conf = require('../conf')

//VALIDATE INPUT
//servers and streams are put in req.server, req.stream, req.streamserver


exports.createNewStream = function(){

	return function(req,res,next){
			//mandatory
			var personid = req.params.personid
			var streamname = req.params.streamname

			if ((!personid) || (!streamname)) next(new Error('PersonId or StreamName missing'))

			else{
				//Check if person exists
				db.Person.find({id:personid})
				.success(function(person_item){
					if (!person_item) next(new Error("Person does not exist!"))
					else{
						db.Stream.find({where: {name:streamname}})
						.success(function(stream_item){
							if (!!stream_item) next(new Error('Stream already exists'))
							else {
								req.person = person_item
								next()
							}
						})
						.error(function(err){next(new Error(err))})
					}

				})
				.error(function(err){next(new Error(err))})
			}
	
	}

}

exports.EditStream = function(action){
	return function(req,res,next){

		//CHECK THE CONSISTENCY OF INPUT DATAS
		var params_ok = false
		if (!req.query.name) next(new Error('Stream Name missing'))
		else if (action=='start'){
			if ((req.query.call!='play') && (req.query.call!='publish')) next(new Error('Wrong action'))
			else if (!req.query.clientid) next(new Error('nginxclientid missing!'))
			else params_ok = true
		}
		else if (action=='done'){
			if ((req.query.call!='publish_done') && (req.query.call!='play_done')) manage_error(res,'OnDone: Wrong action')
			else if (!req.query.clientid) manage_error(res,'OnDone: nginxclientid missing!')
			else params_ok = true
		}
		else if (action=='update') params_ok = true
		else next(new Error('Wrong Action'))

		if (params_ok){
			//CHECK IF THE DB IS DB (STREAM/SERVER) IS CONSISTENT
			var remoteAddress = req.connection.remoteAddress
			var streamname = req.query.name

			//CHECK SERVER
			db.Server.find({where:{ip:remoteAddress}})
			.success(function(server_item){
				if (!server_item) next(new Error('Server does not exist'))
				else{
					req.server = server_item
					var serverid = server_item.id

					//CHECK IF STREAM IS REGISTERED
					db.Stream.find({where:{name:streamname,ServerId:null}})
					.success(function(stream_item){
						if (!stream_item) next(new Error('Stream is not registered'))
						else{
							req.stream = stream_item

							//CHECK OR CREATE STREAM/SERVER
							db.Stream.find({where:{
								name: streamname,
								ServerId: serverid
							},include:[db.Client]})
							.success(function(ss_item){
								if (!ss_item) {
									db.Stream.create({
										name: streamname,
										ServerId: serverid
									})
									.success(function(ss_item){
										if (!ss_item) next(new Error('Stream/Server does not exist'))
										else {
											req.streamserver = ss_item
											next()
										}
									})
									.error(function(err){next(new Error(err))})
								}
								else{
									req.streamserver = ss_item
									next()
								}
							})
							.error(function(err){next(new Error(err))})

						}
					})
					.error(function(err){next(new Error(err))})
				}
			})
			.error(function(err){next(new Error(err))})
		}

	}
}

exports.StreamStats = function(){
	return function(req,res,next){

		var query = {PersonId:req.params.personid}
		if (!!req.params.streamname) query.name = req.params.streamname

		db.Stream.findAll({where:query})
		.success(function(streams_item){
			if ((!streams_item) && (!!req.params.streamname)) next(new Error('Stream not found'))
			else{
				req.streams = streams_item
				next()
			}
		})
		.error(function(err){next(new Error(err))})
	}
}


// if (fs.existsSync('FAKE')) {
// 			console.log('WARNING: USING FAKE SERVER IP')

// 			remoteAddress = '192.168.10.6'
// 		}