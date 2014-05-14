var http = require('http')
, xml2js = require('xml2js')
, fs = require('fs')
, template = require('url-template')

//list of apps/streams to log / set to [] to fetch all
var app_list = ['myapp']
var stream_list = []
var logger_url = '/Stream/Update'

//url of the streaming servers
var stream_servers = ['http://localhost/stat']

//include clients data, mainly for av/drop/duration infos
var include_clients = true

for (var l = 0; l < stream_servers.length; l++) {
    var stream_server = stream_servers[l]

    var req = http.get(stream_server, function(res) {
      // save the data
      var xml = '';
      res.on('data', function(chunk) {
        xml += chunk;
      });

      res.on('end', function() {
        //xml ---> js object

        xml2js.parseString(xml,function(err,item){


          //ANALYZE STREAMS
          for (var i = 0; i < item.rtmp.server[0].application.length; i++) {
            var app = item.rtmp.server[0].application[i]
            var app_pos = app_list.indexOf(app.name[0])

            if ((app_pos!=-1) || (!app_list.length)) {
              //we have a good app, loop through its streams

              if (app.live[0].stream!=undefined) for (var i = 0; i < app.live[0].stream.length; i++) {
                var stream = app.live[0].stream[i]

                var stream_pos = stream_list.indexOf(stream.name[0])
                if ((stream_pos!=-1) || (!stream_list.length)) {

                    //BUILD STREAM INFO
                    var params = {
                      vcodec : stream.meta[0].video[0].codec[0],
                      vbit : stream.bw_video[0],
                      sizew : stream.meta[0].video[0].width[0],
                      sizeh : stream.meta[0].video[0].height[0],
                      fps : stream.meta[0].video[0].frame_rate[0],
                      acodec : stream.meta[0].audio[0].codec[0],
                      abit : stream.bw_audio[0],
                      freq : stream.meta[0].audio[0].sample_rate[0],
                      chan : stream.meta[0].audio[0].channels[0],
                      datain : stream.bytes_in[0],
                      dataout : stream.bytes_out[0],
                      bandin : stream.bw_in[0],
                      bandout : stream.bw_out[0],
                      nclients : stream.nclients[0],
                      duration : stream.time[0],
                      name : stream.name[0],

                      url : '/Stream/Update?vcodec={vcodec}&vbit={vbit}&sizew={sizew}&sizeh={sizeh}&fps={fps}&acodec={acodec}&abit={abit}&freq={freq}&chan={chan}&datain={datain}&dataout={dataout}&bandin={bandin}&bandout={bandout}&nclients={nclients}&name={name}&duration={duration}',
                      port: 3000 
                    }


                    //INCLUDE CLIENTS DATA IF NEEDED
                    if (include_clients){
                      var clients = stream.client
                      var clients_arr = []

                      for (var c = 0; c < clients.length; c++) {
                        var client = {}

                        //populate client object
                        client.av = clients[c].avsync[0]
                        client.drop = clients[c].dropped[0]
                        client.duration = clients[c].time[0]
                        client.id = clients[c].id[0]
                        client.flash = clients[c].flashver[0]
                        client.timestamp = +(new Date())
                        clients_arr.push(client)
                      };

                      var clientstring = JSON.stringify({clients:  clients_arr});

                      params.headers={
                        'Content-Type': 'application/json',
                        'Content-Length': clientstring.length
                      }

                    }

                    //SEND DATA TO THE LOGGER
                    params.path = template.parse(params.url).expand(params)
                    var request = http.request(params)
                    request.on('error', function(err){console.log("HTTP error: "+err)})
                    if (include_clients) request.write(clientstring)
                    request.end()

                    stream_list.splice(stream_pos,1)
                }

                app_list.splice(app_pos,1)
              };
            }
          };

          //if the stream does not exist in the logs, push the idle state
          for (var i = 0; i < stream_list.length; i++) {
            var params = {
              path: logger_url+'?idle=true&name='+stream_list[i],
              port: 3000
            }
            var request = http.request(params)
            request.on('error', function(err){console.log("HTTP error: "+err)})
            request.end()
          };


         }) //end xml
      });

    });
}

req.on('error', function(err) {
  console.log('Error fetching nginx stats: '+err)
});