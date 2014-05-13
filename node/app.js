var express = require('express')
  , http = require('http')
  , path = require('path')
  , db = require('./models')
  , stream = require('./routes/stream')
  , client = require('./routes/client')
  , passport = require('passport')
  , fakeAuth = require('./fakeAuth')
  , user = require('./auth_roles/connect_roles')
  , dataCheck = require('./auth_roles/dataCheck')
  , conf = require('./conf')

var app = express();

app.set('port', process.env.PORT || 3000);
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);

app.use(express.bodyParser());

app.configure('development', function(){
  app.use(express.errorHandler());
});



//PASSPORT CONFIG
// require('./passport-config')



//SERVER API -- PRIVATE
app.post('/Person/:personid/Stream/:streamname',dataCheck.createNewStream(),stream.createNew) //register new stream
app.get('/Stream/Start',dataCheck.EditStream('start'), stream.onStart) //start publish/play -- call with nginx on_*
app.get('/Stream/Done',dataCheck.EditStream('done'),stream.onDone) //stop publish/play -- call with nginx on_*
app.get('/Stream/Update',dataCheck.EditStream('update'),stream.onUpdate) //update stream -- call with stream_logger_rtmp or hls



//SERVER API -- PUBLIC

//stats for a particular stream
app.get('/Person/:personid/Stream/:streamname/Stats',
  fakeAuth.fakeAuth, user.can('access stats'),dataCheck.StreamStats(),
  client.streamStats);

//stats for all times
app.get('/Person/:personid/Streams/Stats',
  fakeAuth.fakeAuth, user.can('access stats'),dataCheck.StreamStats(),
  client.streamsStats);

//interval: {Day,Week,Month}
app.get('/Person/:personid/Streams/Stats/:interval',
  fakeAuth.fakeAuth, user.can('access stats'),dataCheck.StreamStats(),
  client.streamsStats);



//INITIALIZE THE DB
db
  .sequelize
  .sync({ force: conf.force_db_sync })
  .complete(function(err) {
    if (err) {
      throw err
    } else {


      //TEST DATA
      // db.Server.findOrCreate({
      //   id: 13,
      //   ip: "127.0.0.1",
      //   status: 'new',
      //   provider: 'provider1',
      //   geo: [0.001,0.32222]
      // })
      // db.Server.findOrCreate({
      //   id: 16,
      //   ip: "192.168.10.6",
      //   status: 'new',
      //   provider: 'provider1',
      //   geo: [0.04,0.2]
      // })
      // db.Person.findOrCreate({
      //   username: 'topolino',
      //   password: '123456',
      //   email: 'topolino@paperopoli.it',
      //   plan: 'plan1',
      //   rank: 'user',
      //   lastlogin: "2011-11-05",
      // })



      http.createServer(app).listen(app.get('port'), function(){
        console.log('Express server listening on port ' + app.get('port'))


      })
    }
  })

