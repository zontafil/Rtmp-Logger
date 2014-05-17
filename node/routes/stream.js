var db = require('../models')
var conf = require('../conf')
var fs = require('fs');
var chainer = new db.Sequelize.Utils.QueryChainer


//Create new stream
exports.createNew = function(req,res,next){

	db.Stream.create({
        name: req.params.streamname
    })
    .success(function(new_stream_item){
    	//STREAM SUCCESFULLY ADDED: BIND THE OWNER
    	new_stream_item.setPerson(req.person)
    	.success(function(){res.send()})
    	.error(function(err){next(new Error(JSON.stringify(err)))})
    })
    .error(function(err){next(new Error(JSON.stringify(err)))})

}

//publish or play a stream
exports.onStart = function(req,res,next){

	//UPDATE STREAM
	chainer.add(req.streamserver.updateAttributes({status: 'active'})
		.error(function(err){next(new Error(JSON.stringify(err)))}))

	chainer.add(req.server.updateAttributes({status: 'active'})
		.error(function(err){next(new Error(JSON.stringify(err)))}))


	//CHECK IF THE CLIENT PLAYING/PUBLISHING IS A SERVER (->PULL/PUSH)
	chainer.add(db.Server.find({where:{ip: req.query.addr}})
	.success(function(serv_push_pull){

		var client_status = ''
		if ((!serv_push_pull) || (conf.disable_pushpull)){
			if (req.query.call=='play') client_status = 'playing'
			else client_status = 'publishing'
		}
		else{
			if (req.query.call=='play') client_status = 'pulling'
			else client_status = 'pushing'
		}


    	//BUILD CLIENTID AND ADD CLIENT TO THE DB
    	chainer.add(db.Client.find({ClientId: req.query.clientid,StreamId:req.streamserver.id})
    	.success(function(client_item){
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

    		var client_data = {
				flash: flash,
				os: os,
				tcurl: req.query.pageurl,
				swfurl: req.query.swfurl,
				status: client_status
    		}

    		if (!client_item){
    			client_data.ClientId = req.query.clientid
    			client_data.StreamId = req.streamserver.id
    			chainer.add(db.Client.create(client_data)
    				.error(function(err){next(new Error(JSON.stringify(err)))}))
    		}
    		else{
    			chainer.add(client_item.updateAttributes(client_data)
    				.error(function(err){next(new Error(JSON.stringify(err)))}))		
    		}

    	})
    	.error(function(err){next(new Error(JSON.stringify(err)))}))


		//WAIT FOR THE QUERY CHAIN TO END
		chainer.run().success(function(){
			res.send()
		})
		.error(function(err){next(new Error(JSON.stringify(err)))})


	})
	.error(function(err){next(new Error(JSON.stringify(err)))}))

	
}

//stop publishing/playing a stream
exports.onDone = function(req,res,next){

	//UPDATE SERVER/STREAM STATUS IF THE PUBLISH IS DONE
	if (req.query.call=='publish_done'){
		chainer.add(req.streamserver.updateAttributes({status: 'idle'})
			.error(function(err){next(new Error(JSON.stringify(err)))}))
    	chainer.add(req.server.updateAttributes({status: 'inactive'})
			.error(function(err){next(new Error(JSON.stringify(err)))}))					    		
    }

    //UPDATE CLIENT DATA
	chainer.add(db.Client.find({where: {ClientId: req.query.clientid,StreamId:req.streamserver.id}})
	.success(function(client_item){
		if (!!client_item){ 
			chainer.add(client_item.updateAttributes({status:'idle'})
				.error(function(err){next(new Error(JSON.stringify(err)))}))
		}
	})
	.error(function(err){next(new Error(JSON.stringify(err)))}))

	//WAIT FOR THE QUERY CHAIN TO END
	chainer.run().success(function(){
		res.send()
	})
	.error(function(err){next(new Error(JSON.stringify(err)))})

						
}

//update stream data (hls from nginx logs/rtmp directives)
//		and clients data (~hls only)
exports.onUpdate = function(req,res,next){

	//UPDATE THE MAIN STREAM ITEM
	if (!!req.query.acodec) req.query.acodec = req.query.acodec.toLowerCase()
	if (!!req.query.vcodec) req.query.vcodec = req.query.vcodec.toLowerCase()

	chainer.add(req.stream.updateAttributes({
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
	.error(function(err){next(new Error(JSON.stringify(err)))}))

	if (req.query.idle==true) {
		//SET THE STREAM/SERVER TO IDLE
		chainer.add(req.streamserver.updateAttributes({status:'idle'})
			.error(function(err){next(new Error(JSON.stringify(err)))}))
	}
	else{
		//UPDATE THE STREAM/SERVER DATAS
		chainer.add(req.streamserver.updateAttributes({
              datain : req.query.datain,
              dataout : req.query.dataout,
              bandin : req.query.bandin,
              bandout : req.query.bandout,
              duration: req.query.duration,
              status: 'active'
        })
		.error(function(err){next(new Error(JSON.stringify(err)))}))
	}
		

	//CHECK IF THE CLIENTS DATA ARE EMBEDDED IN THE REQUEST
	if (!!req.body.clients){

		req.body.clients.forEach(function(client_data){

			chainer.add(db.Client.find({where: {ClientId: client_data.id,StreamId:req.streamserver.id}})
			.success(function(client_item){

				var timestamp = client_data.timestamp
				delete client_data.timestamp

				if (!client_item){
					if ((new Date()-timestamp)<conf.client_timeout){

						//add client's foreign keys and create the client on db
						client_data.ClientId = client_data.id
						client_data.status = 'playing'
						delete client_data.id
						client_data.StreamId = req.streamserver.id
						chainer.add(db.Client.create(client_data)
						.error(function(err){next(new Error(JSON.stringify(err)))}))
					}
					else if (conf.debug) console.log('Client log is too old')
				}
				else{
					//check if the log is in the past or not
					if (((new Date()-timestamp)<conf.client_timeout) && (timestamp>client_item.updatedAt)){
						chainer.add(client_item.updateAttributes(client_data)
						.error(function(err){next(new Error(JSON.stringify(err)))}))
					}
					else if (conf.debug) console.log('Client log is too old')

				}
			})
			.error(function(err){next(new Error(JSON.stringify(err)))}))
		})

	}


	// CHECK FOR OLD CLIENTS TO DELETE (MAINLY FOR HLS SUPPORT)
	if (!!req.streamserver.clients) req.streamserver.clients.forEach(function(client_item){
		if ((new Date() - new Date(client_item.updatedAt))>conf.client_timeout){
			chainer.add(client_item.updateAttributes({status:'idle'})
				.error(function(err){next(new Error(JSON.stringify(err)))}))
		}
	})

	//WAIT FOR THE QUERY CHAIN TO END
	chainer.run().success(function(){
		res.send()
	})
	.error(function(err){next(new Error(JSON.stringify(err)))})

}


exports.global_stats = function(streams_obj,next){
	//build global stats for a given stream

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


	for (var i = 0; i < streams_obj.length; i++) {
		var stream = streams_obj[i]
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