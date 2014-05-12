var http = require('http')
, xml2js = require('xml2js')
, fs = require('fs')
, template = require('url-template')

//list of apps/streams to log / set to [] to fetch all
var app_list = ['myapp']
var stream_list = ['teststream']

var logger_urls = ['http://localhost/stat']

for (var l = 0; l < logger_urls.length; l++) {
    var logger_url = logger_urls[l]

    var req = http.get(logger_url, function(res) {
      // save the data
      var xml = '';
      res.on('data', function(chunk) {
        xml += chunk;
      });

      res.on('end', function() {
        //xml ---> js object

        xml2js.parseString(xml,function(err,item){
          for (var i = 0; i < item.rtmp.server[0].application.length; i++) {
            var app = item.rtmp.server[0].application[i]
            var app_pos = app_list.indexOf(app.name[0])

            if ((app_pos!=-1) || (!app_list.length)) {
              //we have a good app, loop through its streams

              if (app.live[0].stream!=undefined) for (var i = 0; i < app.live[0].stream.length; i++) {
                var stream = app.live[0].stream[i]

                var stream_pos = stream_list.indexOf(stream.name[0])
                if ((stream_pos!=-1) || (!stream_list.length)) {
                  debugger
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
                      streamname : stream.name[0],

                      url : '/Stream/Update?vcodec={vcodec}&vbit={vbit}&sizew={sizew}&sizeh={sizeh}&fps={fps}&acodec={acodec}&abit={abit}&freq={freq}&chan={chan}&datain={datain}&dataout={dataout}&bandin={bandin}&bandout={bandout}&nclients={nclients}&streamname={streamname}&duration={duration}',
                      port: 3000 
                    }

                    params.path = template.parse(params.url).expand(params)
                    var request = http.request(params)
                    request.on('error', function(err){console.log("HTTP error: "+err)})
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
              path: '/Stream/Update?idle=true&streamname='+stream_list[i],
              port: 3000
            }
            var request = http.request(params)
            request.on('error', function(err){console.log("HTTP error: "+err)})
            request.end()
          };


        })
      });

    });
}

req.on('error', function(err) {
  console.log('Error fetching nginx stats: '+err)
});