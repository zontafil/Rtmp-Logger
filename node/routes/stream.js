var db = require('../models')
var conf = require('../conf')
var fs = require('fs');
var WatchJS = require("watchjs")
var watch = WatchJS.watch;
var unwatch = WatchJS.unwatch;

var Sequelize = require('sequelize')
, chainer = new Sequelize.Utils.QueryChainer


var test_query_publish = { app: 'myapp',
  flashver: 'FMLE/3.0 (compatible; Lavf55.19',
  swfurl: '',
  tcurl: 'rtmp://localhost:1935/myapp',
  pageurl: 'teststream',
  addr: '127.0.0.1',
  clientid: '21',
  call: 'publish',
  name: 'mystream',
  type: 'live' }

var test_query_play = { app: 'myapp',
  flashver: 'LNX 9,0,124,2',
  swfurl: '',
  tcurl: 'rtmp://localhost:1935/myapp',
  pageurl: 'teststream',
  addr: '127.0.0.1',
  clientid: '9',
  call: 'play',
  name: 'mystream',
  start: '4294965296',
  duration: '0',
  reset: '0' }

var test_query_publish_done = { app: 'myapp',
  flashver: 'FMLE/3.0 (compatible; Lavf55.19',
  swfurl: '',
  tcurl: 'rtmp://localhost:1935/myapp',
  pageurl: 'teststream',
  addr: '127.0.0.1',
  clientid: '21',
  call: 'publish_done',
  name: 'mystream' }

var test_query_play_done = { app: 'myapp',
  flashver: 'LNX 9,0,124,2',
  swfurl: '',
  tcurl: 'rtmp://localhost:1935/myapp',
  pageurl: 'teststream',
  addr: '127.0.0.1',
  clientid: '9',
  call: 'play_done',
  name: 'mystream' }




//Create new stream, require person id and stream name
exports.createNew = function(req,res,next){
	//mandatory
	var personid = req.params.personid
	var streamname = req.params.streamname

	//Check if person exists
	db.Person.find({id:personid})
	.success(function(person_item){
		if (!person_item) next(new Error("Person does not exist!"))
		else{
			db.Stream.find({where: {name:streamname}})
			.success(function(stream_item){
				if (!!stream_item) next(new Error("Stream already exist!"))
				else{
					db.Stream.create({
				        name: streamname
				    })
				    .success(function(new_stream_item){
				    	//stream succesfully added: bind the publisher person
				    	new_stream_item.setPerson(person_item)
				    	.success(function(){res.send()})
				    	.error(function(err){next(new Error(err))})
				    })
				    .error(function(err){next(new Error(err))})
				} 
			})
			.error(function(err){next(new Error(err))})
		}

	})
	.error(function(err){next(new Error(err))})

}

//publish or play a stream
exports.onStart = function(req,res,next){
	if ((req.query.call!='play') && (req.query.call!='publish')) next(new Error('Wrong action'))
	else if (!req.query.clientid) next(new Error('nginxclientid missing!'))
	else{

		//use test data if needed
		if (conf.use_fake_data){
			if (req.query.call=='play') req.query = test_query_play
			if (req.query.call=='publish') req.query = test_query_publish
		}

		var remoteAddress = req.connection.remoteAddress

		if (fs.existsSync('FAKE')) {
			console.log('WARNING: USING FAKE SERVER IP')

			remoteAddress = '192.168.10.6'
		}


		//build stream name
		var streamname = getStreamnameFromPageName(req.query.pageurl, req.query.name)

		//check if server and stream exist
		db.Server.find({where:{ip:remoteAddress}})
		.success(function(server_item){
			if (!server_item) next(new Error('Server does not exist'))
			else{
				//get server id
				var serverid = server_item.id

				db.Stream.find({where:{name:streamname,ServerId:null}})
				.success(function(stream_item){
					if (!stream_item) next(new Error('Stream does not exist'))
					else{

						//ADD STREAM TO THE DB
						db.Stream.findOrCreate({
							name: streamname,
							ServerId: serverid
						})
						.success(function(ss_item,created){

							//UPDATE STREAM
					    	chainer.add(ss_item.updateAttributes({status: 'active'})
					    		.error(function(err){next(new Error(err))}))

					    	chainer.add(server_item.updateAttributes({status: 'active'})
					    		.error(function(err){next(new Error(err))}))


					    	//CHECK IF THE CLIENT PLAYING/PUBLISHING IS A SERVER (PULL/PUSH)
					    	chainer.add(db.Server.find({where:{ip: req.query.addr}})
					    	.success(function(serv_push_pull){

					    		var client_status = ''
					    		// if (!serv_push_pull){
					    			if (req.query.call=='play') client_status = 'playing'
					    			else client_status = 'publishing'
					    		// }
					    		// else{
					    			// if (req.query.call=='play') client_status = 'pulling'
					    			// else client_status = 'pushing'
					    		// }

						    	//BUILD CLIENTID AND ADD CLIENT TO THE DB
						    	var cid = getClientIDFromNginx(req.query.clientid,serverid)
						    	chainer.add(db.Client.findOrCreate({id: cid})
						    	.success(function(client_item,created){
						    		//compute flash version and OS
						    		var flash='',os=''
						    		if (client_status=='playing'){
						    			os = req.query.flashver.split(' ')[0]
						    			console.log(os)
						    			if (os=='MAC') os='Mac OS'
						    			else if (os=='LNX') os='Linux'
						    			else if (os=='WIN') os='Windows'
						    			else os=null
						    			flash = req.query.flashver.split(' ')[1]
						    		}
						    		else if (client_status=='publishing'){
						    			os = null
						    			flash = req.query.flashver
						    		}
						    		else{
						    			os = flash = null
						    		}

						    		chainer.add(client_item.addStream(stream_item,{status: client_status})
						    			.error(function(err){next(new Error(err))}))
						    		chainer.add(client_item.updateAttributes({
					    				flash: flash,
					    				os: os,
					    				tcurl: req.query.pageurl,
					    				swfurl: req.query.swfurl
					    			})
					    				.error(function(err){next(new Error(err))}))
						    	})
								.error(function(err){manage_error(res,'OnStart: '+err)}))



						    	})
						    	.error(function(err){next(new Error(err))}))


								//WAIT FOR THE QUERY CHAIN TO END
								chainer.run().success(function(){
									res.send()
								})
								.error(function(err){next(new Error(err))})


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

exports.onDone = function(req,res,next){
	if ((req.query.call!='publish_done') && (req.query.call!='play_done')) manage_error(res,'OnDone: Wrong action')
	else if (!req.query.clientid) manage_error(res,'OnDone: nginxclientid missing!')
	else{
		//use test data if needed
		if (conf.use_fake_data){
			if (req.query.call=='play_done') req.query = test_query_play_done
			if (req.query.call=='publish_done') req.query = test_query_publish_done
		}

		var remoteAddress = req.connection.remoteAddress

		if (fs.existsSync('FAKE')) {
			console.log('WARNING: USING FAKE SERVER IP')

			remoteAddress = '192.168.10.6'
		}


		//build stream name
		var streamname = getStreamnameFromPageName(req.query.pageurl,req.query.name)

		//check if server and stream exist
		db.Server.find({where:{ip:remoteAddress}})
		.success(function(server_item){
			if (!server_item) next(new Error('OnDone: Server does not exist'))
			else{
				//get server id
				var serverid = server_item.id

				db.Stream.find({where:{name:streamname,ServerId: null}})
				.success(function(stream_item){
					if (!stream_item) next(new Error('Stream does not exist'))
					else{
						db.Stream.findOrCreate({
							name: streamname,
							ServerId: serverid
						})
						.success(function(ss_item){
							//build clientid
					    	var cid = getClientIDFromNginx(req.query.clientid,serverid)

					    	//UPDATE SERVER/STREAM STATUS
					    	if (req.query.call=='publish_done') 
					    		chainer.add(ss_item.updateAttributes({status: 'idle'})
					    			.error(function(err){next(new Error(err))}))

					    	chainer.add(server_item.updateAttributes({status: 'inactive'})
								.error(function(err){next(new Error(err))}))					    		


					    	chainer.add(db.Client.find({where: {id: cid}})
					    	.success(function(client_item){
					    		if (!!client_item){ 
					    			chainer.add(client_item.addStream(stream_item,{status:'idle'})
					    				.error(function(err){next(new Error(err))}))
					    		}
					    		else next(new Error('Cant create the client'))
					    	})
							.error(function(err){next(new Error(err))}))

							//WAIT FOR THE QUERY CHAIN TO END
							chainer.run().success(function(){
								res.send()
							})
							.error(function(err){next(new Error(err))})

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

exports.onUpdate = function(req,res,next){
	//UPDATE STREAM DATA (HLS FROM NGINX LOGS/RTMP DIRECTIVES)
	//		AND CLIENTS DATA (~HLS ONLY)
	remoteAddress = req.connection.remoteAddress
	if (fs.existsSync('FAKE')) {
			console.log('WARNING: USING FAKE SERVER IP')

			remoteAddress = '192.168.10.6'
	}

	if (!req.query.streamname) next(new Error('Streamname missing'))
	else db.Server.find({where:{ip: remoteAddress}})
	.success(function(server_item){
		if (!server_item) next(new Error('Server not found'))
		else{
			var serverid = server_item.id
			db.Stream.findAll({where: Sequelize.or(
				{name:req.query.streamname,ServerId:serverid},
				{name:req.query.streamname,ServerId:null}),
				include:[db.Client]})
			.success(function(streams_item){

				if ((!streams_item) || (streams_item.length!=2)) next(new Error('Stream/Server not found'))
				else{

						//UPDATE STREAM DATA
						for (var i = 0; i < streams_item.length; i++) {
							if ((streams_item[i].ServerId==null) && (req.query.idle!=true)) {
								//update the main stream item
								if (!!req.query.acodec) req.query.acodec = req.query.acodec.toLowerCase()
								if (!!req.query.vcodec) req.query.vcodec = req.query.vcodec.toLowerCase()

								chainer.add(streams_item[i].updateAttributes({
						              vcodec : req.query.vcodec,
						              vbit : req.query.vbit,
						              sizew : req.query.sizew,
						              sizeh : req.query.sizeh,
						              fps : req.query.fps,
						              acodec : req.query.acodec,
						              abit : req.query.abit,
						              freq : req.query.freq,
						              chan : req.query.chan,
								})
								.error(function(err){next(new Error(err))}))
							}
							else if ((streams_item[i].ServerId!=null) && (req.query.idle==true)) {
								//set the stream/server to idle
								var ss_index = i
								chainer.add(streams_item[i].updateAttributes({status:'idle'})
									.error(function(err){next(new Error(err))}))
							}
							else{
								//update the stream/server datas
								var ss_index = i
								chainer.add(streams_item[i].updateAttributes({
						              datain : req.query.datain,
						              dataout : req.query.dataout,
						              bandin : req.query.bandin,
						              bandout : req.query.bandout,
						              duration: req.query.duration,
						              status: 'active'
						          })
									.error(function(err){next(new Error(err))}))
							}
							
						};
						var stream_item = streams_item[ss_index]


						//CHECK IF THE CLIENTS DATA ARE EMBEDDED IN THE REQUEST
						if (!!req.body.clients){

							for (var i = 0; i < req.body.clients.length; i++) {
								var client_data = req.body.clients[i] 
								var clientid = getClientIDFromNginx(client_data.id,serverid)
								client_data.id = clientid;

								//isolate every client and add it to the db if needed
								(function(client_data){
									chainer.add(db.Client.find({where: {id: clientid}})
									.success(function(client_item){

										var timestamp = client_data.timestamp
										delete client_data.timestamp

										if (!client_item){
											if ((new Date()-timestamp)<conf.client_timeout){
												chainer.add(db.Client.create(client_data)
												.success(function(client_item){
													chainer.add(stream_item.addClient(client_item,{status: 'playing'}))
												})
												.error(function(err){next(new Error(err))}))
											}
											else if (conf.debug) console.log('Client log is too old')
										}
										else{
											//check if the log is in the past or not
											if (((new Date()-timestamp)<conf.client_timeout) && (timestamp>client_item.updatedAt)){
												chainer.add(client_item.updateAttributes(client_data)
												.success(function(client_item){
													chainer.add(stream_item.addClient(client_item,{status: 'playing'}))
												})
												.error(function(err){next(new Error(err))}))
											}
											else if (conf.debug) console.log('Client log is too old')

										}
									})
									.error(function(err){next(new Error(err))}))
								})(client_data)
							}

						}


						// CHECK FOR OLD CLIENTS TO DELETE (MAINLY FOR HLS SUPPORT)
						for (var i = 0; i < stream_item.clients.length; i++) {
							var client_item = stream_item.clients[i]
							if ((new Date() - new Date(client_item.updatedAt))>conf.client_timeout)
								chainer.add(client_item.destroy())
						};

						//WAIT FOR THE QUERY CHAIN TO END
						chainer.run().success(function(){
							res.send()
						})
						.error(function(err){next(new Error(err))})

				}
			})
			.error(function(err){next(new Error(err))})
		}
	})
	.error(function(err){next(new Error(err))})
}


exports.global_stats = function(streamname,next){
	//build global stats for a given stream
	db.Stream.findAll({
		where:{ name: streamname },
		include: [db.Client]
	})
	.success(function(streams){
		var global_stream = {
			name: '',
			PersonId: 0,
		    status: 'idle',
		    vcodec: '',
		    acodec: '',
		    vbit: 0,
		    sizew: 0,
		    sizeh: 0,
		    fps: 0,
		    abit: 0,
		    freq: 0,
		    chan: 0,
		    datain: 0,
		    dataout: 0,
		    bandin: 0,
		    bandout: 0,
		    duration: 0,
		    nclients: 0,
		    createdAt: null,
		    updatedAt: null,
		    servers: []
		}


		for (var i = 0; i < streams.length; i++) {
			var stream = streams[i]
			if (!!stream.ServerId){
				delete stream.dataValues.PersonId
				global_stream.name = stream.name
				global_stream.datain += parseInt(stream.datain)
				global_stream.dataout += parseInt(stream.dataout)
				global_stream.bandin += parseInt(stream.bandin)
				global_stream.bandout += parseInt(stream.bandout)
				global_stream.status = stream.status

				//delete unnecessary cols
				delete stream.dataValues.vcodec
				delete stream.dataValues.acodec
				delete stream.dataValues.vbit
				delete stream.dataValues.sizew
				delete stream.dataValues.sizeh
				delete stream.dataValues.fps
				delete stream.dataValues.abit
				delete stream.dataValues.freq
				delete stream.dataValues.chan
				stream.dataValues.bandin = parseInt(stream.dataValues.bandin)
				stream.dataValues.bandout = parseInt(stream.dataValues.bandout)
				stream.dataValues.datain = parseInt(stream.dataValues.datain)
				stream.dataValues.dataout = parseInt(stream.dataValues.dataout)

				if (new Date(stream.updatedAt)>new Date(global_stream.updatedAt))
					global_stream.updatedAt = stream.updatedAt

				dur = parseInt(stream.duration)
				if (dur>global_stream.duration) global_stream.duration = dur

				//count the number of clients
				var nclients = stream.clients.length
				stream.dataValues.nclients = nclients
				global_stream.nclients += nclients

				if (!conf.stats.include_clients) delete stream.dataValues.clients
				global_stream.servers.push(stream.dataValues)
			}
			else{
				global_stream.PersonId = stream.PersonId
				global_stream.createdAt = stream.createdAt

				global_stream.vcodec = stream.vcodec
				global_stream.acodec = stream.acodec
				global_stream.vbit = stream.vbit
				global_stream.sizew = stream.sizew
				global_stream.sizeh = stream.sizeh
				global_stream.fps = stream.fps
				global_stream.abit = stream.abit
				global_stream.freq = stream.freq
				global_stream.chan = stream.chan

				if (new Date(stream.updatedAt)>new Date(global_stream.updatedAt))
					global_stream.updatedAt = stream.updatedAt

			}

		}
		if (!!next) next(null,global_stream)

	})
	.error(function(err){if (!!next) next('global Stats: '+err)})
}



var getClientIDFromNginx = function(nginxid,serverid){
	if ((!nginxid) || (!serverid)) return false

	//build clientid
	var sid_str = serverid.toString()
	var sid2 = sid_str[sid_str.length-2]+sid_str[sid_str.length-1]
	var cid = parseInt(sid2 + nginxid.toString())

	return cid
}

var getStreamnameFromPageName = function(page,name){
	return name
}