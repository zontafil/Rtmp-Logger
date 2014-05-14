# Overview
``rtmp-logger`` is a logger for streaming services hosted on nginx, written in Node.js.
It supports rtmp and hls as long as multiple servers networks (push/pull).
The logs are stored in PostgreSQL through Sequelize.js

## Folders

``node/``: the main logger server
``loggers/hls/``: script that parses nginx access.log and send the logs to the main server
``loggers/rtmp/``: script that parses the nginx-rtmp stats page and send the logs to the main server. This script can be put remotely, as long as the stat page for the specified server is accessible

## API Schema

The logger server exposes ``private`` and ``public`` APIs.
The response data is always in JSON format.

### Private API
The private APIs are used for pushing the logs to the server and shoould not be accessible by external clients.

#### rtmp Start/Stop events

    GET:/Stream/Start
    GET:/Stream/Done
    
Used for stopping and starting a stream, both play and publish. The publishing/playing client information are passed as GET parameters and are compatible with nginx ``on_start``/``on_stop`` directives (https://github.com/arut/nginx-rtmp-module/wiki/Directives), so these APIs should be called directly by nginx.

#### Update Stream

    GET:/Stream/Update
    
Used for updating stream datas. Optionally information about single clients can be put in the body of the HTTP packet. Should be called by the hls and the rtmp scripts

### Public APIs

Public APIs can be called by logged users.

#### Register new Stream

    POST:/Person/:personid/Stream/:streamname
    
Used by a logged person to register a new stream. Publishing/playing are performed in a second moment.

#### Get Stream Stats
    GET:/Person/:personid/Stream/:streamname/Stats
    GET:/Person/:personid/Streams/Stats
    GET:/Person/:personid/Streams/Stats/:interval
    
Gather statistics for a single stream (first line), or for all streams of a person. 
Interval can be {Day,Week,Month}. If set only the streams of the selected interval are included.
Should be called by logged users. Normal users are allowed to access only their own streams.

    


##Installation

Clone the repo or a specific folder, as needed, i.e.:

    $ git clone https://bitbucket.org/m3l7/rtmp-logger
    
Install the dependencies on every folder with npm (make sure to have node installed first):

    $ cd node && npm install
    $ cd loggers/rtmp && npm install
    $ cd loggers/hls && npm install
    
Make sure to have PostgreSQL installed on the server

## Configuration

### Main Server

Some configs are located in ``node/conf.js``. In particular, it is possible to choose a timeout for hls clients, so that they're set to idle state automatically if they have not communicated with the server for a while.

#### DB configuration

edit ``node/models/index.js`` to configure the connection parameters of the database.

### nginx

Build nginx with rtmp support and configure the directives on_play/done to point to the server API /Stream/Start, /Stream/Done. Example:

    on_publish http://localhost:3000/Stream/Start;
    on_play http://localhost:3000/Stream/Start;
    on_publish_done http://localhost:3000/Stream/Done;
    on_play_done http://localhost:3000/Stream/Done;

In this way, every time a client start or stop streaming, nginx calls the logger server which will update the db.

### rtmp script
Edit the script directly (``stream_logger_rtmp.js``). You can choose to select which app or stream to log (or everything by setting the proper array to []).
Also, it can be chosen an array of streaming servers and the url of the main logger server.
If ``include_clients`` is set, additional information on the clients which are not passed with nginx directives (i.e. drop/av sync) are included.

### hls script

Edit the script directly (``stream_logger_hls.js``). As for the rtmp script, you can choose an array of streams to fetch (set to [] to fetch all streams).
The position of the ``accesso.log`` of nginx should be set. Nginx must be configured with the default log format. Make sure that the script has the correct permissions to access the log.
Additionally, you should provide the url  of the main logger server.



## Run

### Run the logger server

just run ``app.js`` with node:

    $ node node/app.js
    
### Run nginx

    $ nginx

### rtmp Script

Run the rtmp script when needed (i.e. with a cron job):

    $ node loggers/rtmp/stream_logger_rtmp.js
    
the script will pass to the logger server information about the stream (and optionally additional information about the clients, see ``Configuration`` section).
The script can be put everywhere, as long as the streaming servers stat page is accessible

### hls script

Run the script in each streaming server.

    $ node loggers/hls/stream_logger_hls.js
    
Make sure that the script can read the nginx access.log

## Advanced Topics: server code

The server uses the following libraries:

    express.js
    passport.js for authentication (need to be configured)
    connect-roles for authorization
    sequelize.js as ORM
    postgreSQL for the db
    
When an API request is performed, a typical routing is the following:

    API -> authentication -> authorization -> dataCheck -> resource
    
every module is implemented as express middleware.

### Authentication

Authentication should be performed by ``passport.js``. At the moment, a dummy module (``FakeAuth``) is used instead, which just authenticate for a hardcoded user.

### Authorization

authorization choses if a logged user has the privilege to access the resource. It is implemented with connect-roles.
The rules are located in ``auth_roles/connect_roles.js``. Right now, the only rule coded is the one for stats resource (an user, unless it is an admin, can access only it own stats).

### dataCheck

The dataCheck middleware makes sure that the input data is compatible with the resource.
For example, if someone tries to update a stream which does not exist, dataCheck will block the execution of the API.
If the middleware succedes, it will inject into the request object the proper sequelize objects (i.e. stream/server/person objects)

### Routing

The actual resource is handled by the two routes (``streams.js`` and ``clients.js``).

### DB Schema

The sequelize schema is stored in ``models/`` folder.