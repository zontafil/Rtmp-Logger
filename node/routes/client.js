var db = require('../models')
var conf = require('../conf')
var stream = require('./stream')

var Sequelize = require('sequelize')
, chainer = new Sequelize.Utils.QueryChainer



exports.streamStats = function(req,res,next){
	//check if client owns the stream
	db.Stream.find({where:{
		name:req.params.streamname,
		PersonId:req.params.personid
	}})
	.success(function(stream_item){
		if (!stream_item) next(new Error('Stream or Client not found'))
		else{
			stream.global_stats(req.params.streamname,function(err,global_stream){
				if (!!err) next(new Error('StreamStats: '+err))
				else res.send([global_stream])
			})
		}
	})
	.error(function(err){next(new Error(err))})
}

exports.streamsStats = function(req,res,next){
	db.Stream.findAll({where:{
		PersonId:req.params.personid
	}})
	.success(function(streams_item){

		var nstreams = streams_item.length
		var completed_tasks = 0
		var client_stats = {
			PersonId: 0,
			duration: 0,
			avarageDuration: 0,
			data: 0,
			nclients: 0,
			streams:[]
		}

		if (nstreams==0) res.send([])
		for (var i = 0; i < streams_item.length; i++) {
			var name = streams_item[i].name
			if (!!name){
				 stream.global_stats(name,function(err,global_stream){
					if (!!err) next(new Error(err))
					else{
						//build global stats of all streams
						var add_client = false
						if (!req.params.interval) add_client = true
						else if ((req.params.interval=='Day') && ((new Date() - new Date(global_stream.updatedAt)) < 86400000)) add_client = true
						else if ((req.params.interval=='Week') && ((new Date() - new Date(global_stream.updatedAt)) < 604800000)) add_client = true
						else if ((req.params.interval=='Month') && ((new Date() - new Date(global_stream.updatedAt)) < 2678400000)) add_client = true

						if (add_client){
							client_stats.nclients += global_stream.nclients
							client_stats.data += global_stream.datain + global_stream.dataout
							client_stats.PersonId = global_stream.PersonId
							client_stats.duration += parseInt(global_stream.duration)
						}

						client_stats.streams.push(global_stream)
						completed_tasks++
						if (completed_tasks==nstreams) onTasksEnd()
					}
				})
			}
		};



		var onTasksEnd = function(){
			//build additional stats
			client_stats.avarageDuration = client_stats.duration /  nstreams

			res.send([client_stats])
		}

	})
	.error(function(err){next(new Error(err))})
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