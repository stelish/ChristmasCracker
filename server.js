var express = require('express');
var bodyParser = require('body-parser');
var http = require('http');
var https = require('https');

var app = express(); // the main app
var path = require('path');
var fs         = require("fs");

var key_file   = "server/certs/server.key";
var cert_file  = "server/certs/server.crt";

var config     = {
    key: fs.readFileSync(key_file),
    cert: fs.readFileSync(cert_file)
};

//CORS middleware
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', 'http://localhost');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
};

app.use(allowCrossDomain);

// body parser
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

// redis interface
var redis = require('redis');
var client = redis.createClient(); //creates a new client

// Redis Configuration
client.on('connect', function() {
    console.log('redis connected');
});

// Express Routes
/**
 * Get's Main Client Page
 * Used to enable short request to /client
 */
app.route('/client')
    .get(function(req, res) {
        console.log('Accessing the client section ...');
        console.log(app.path());
        res.type('.html');
        res.sendFile(path.join(__dirname + '/views/client/ChristmasCrackerClient.html'));
    });
/**
 * Get's Main Admin Dashboard Page
 * Used to enable short request to /admin
 */
app.route('/admin')
    .get(function(req, res) {
        console.log('Accessing the admin section ...');
        console.log(app.path());
        res.type('.html');
        res.sendFile(path.join(__dirname + '/views/admin/ChristmasCrackerAdmin.html'));
    });
/**
 * Serves API
 *
 * GETS:
 * getAllSessions (returns [] of all sessions)
 * getCurrentSession {returns {} of current session}
 *
 * POSTS:
 * addSessions([] of sessions) {returns [] of all sessions}
 * addVote(session) {returns session}
 *
 */
app.route('/api/:call')
    .get(function(req, res) {
        console.log('API GET request: '+req.params.call);
        var sessVotes = [];
        function getOriginVotes(sessionid,id){
            var orgSess = "type:votes:"+sessionid+':origin'+id;
            var result = 0;
            if(client.connected){
                client.get(orgSess,function(err,reply){
                    if(err){console.log(err);}
                    if(reply){
                        console.log(reply);
                        sessVotes.push(reply);
                    }
                });
            }

            return result;
        }

        switch( req.params.call ){
            case 'getAllSessions':
                client.smembers("type:session", function (err, obj) {
                    var result = [];
                    if(obj && obj.length > 0){

                        // parse data
                        for(var i = 0; i < obj.length; i++){
                            var sess = JSON.parse( obj[i] );

                            // get origin1 votes
                            sess.origin1votes = getOriginVotes(sess.id,'1');
                            sess.origin2votes = getOriginVotes(sess.id,'2');

                            result.push(sess);
                        }
                    }
                    res.send( result );
                });
                break;
        /**
         * NOTE:
         * Thie method will return the session that start time <= server time,
         * AND ent time > server time + offset hours
         */
            case 'getCurrentSession':
                client.smembers("type:session", function (err, obj) {
                    var result = [];
                    if(obj && obj.length > 0){
                        // parse data
                        for(var i = 0; i < obj.length; i++){
                            var sess = JSON.parse( obj[i] );
                            var _startTime = new Date(sess.startTime);
                            var _endTime = new Date(sess.endTime);
                            var _serverTime = new Date();
                            // used when deal time elapses
                            var offsetHours = 1;
                            var dealOffSetTime = _serverTime.setHours(_serverTime.getHours()+offsetHours);

                            if(_startTime < _serverTime && _endTime > dealOffSetTime){
                                // set deal status
                                sess.live = _endTime > _serverTime;
                                result = sess;
                                break;
                            }
                        }
                    }

                    res.send( result );
                });
                break;
            case 'getVotesForSession' :
                var response = [];
                var sessionid = req.query.id;
                console.log(sessionid);
                console.log("type:votes:"+sessionid+':origin1');
                client.multi()
                    .get("type:votes:"+sessionid+':origin1')
                    .get("type:votes:"+sessionid+':origin2')
                    .exec(function(err,replies){
                        if(err){
                            console.log("err="+err);
                        }
                        console.log('reply is '+replies);
                        res.send( replies );
                    });
                break;
            default :
                res.end();
                break;
        }
    })
    .post(function(req, res) {
        console.log('API POST request: '+req.params.call);
        switch( req.params.call ){
            case 'addSession':
                console.log('sessionid is '+req.body.id);
                // session data
                var session_obj = {
                    "id" : req.body.id,
                    "destination" : req.body.destination,
                    "origin1" : req.body.origin1,
                    "origin2" : req.body.origin2,
                    "joke1" : req.body.joke1,
                    "joke2" : req.body.joke2,
                    "startTime" : req.body.startTime,
                    "endTime" : req.body.endTime,
                    "startMessage" : req.body.startMessage,
                    "nextVotingMessage" : req.body.nextVotingMessage,
                    "origin1votes" : req.body.origin1votes,
                    "origin2votes" : req.body.origin2votes
                };
                var session_arr = [
                    "type:session",JSON.stringify(session_obj)
                ];

                client.sadd(session_arr, function (err, res) {
                    if(err){
                        console.log(err);
                    }
                    if(res){
                        console.log('added: '+res);
                    }
                });

                // vote store ORIGIN1
                var origin1Key = "type:votes:"+req.body.id+':origin1';
                console.log(origin1Key);
                client.set(origin1Key,0, function (err, res) {
                    if(err){
                        console.log(err);
                    }
                    if(res){
                        console.log(origin1Key + ' ' + res);
                    }
                });

                // vote store ORIGIN2
                var origin2Key = "type:votes:"+req.body.id+':origin2';
                client.set(origin2Key,0, function (err, res) {
                    if(err){
                        console.log(err);
                    }
                    if(res){
                        console.log(origin2Key + ' ' + res);
                    }
                });

                res.end();
                break;
            case 'addVote':
                // body.origin (origin1 or origin2)
                var key = "type:votes:"+req.body.id+':'+req.body.origin;
                console.log('addVote key is '+key);
                client.incr(key, function(err, reply) {
                    if(err){
                        console.log('addVote err is:'+err);
                    }else{
                        console.log('addVote reply is:'+reply);
                        res.sendStatus(200);
                    }

                });
                break;
            case 'removeSession':
                var session = {
                    "id" : req.body.id,
                    "destination" : req.body.destination,
                    "origin1" : req.body.origin1,
                    "origin2" : req.body.origin2,
                    "joke1" : req.body.joke1,
                    "joke2" : req.body.joke2,
                    "startTime" : req.body.startTime,
                    "endTime" : req.body.endTime,
                    "startMessage" : req.body.startMessage,
                    "nextVotingMessage" : req.body.nextVotingMessage,
                    "origin1votes" : req.body.origin1votes,
                    "origin2votes" : req.body.origin2votes
                };
                console.log('removeSession called: '+JSON.stringify(session));
                var arr = [
                    "type:session",JSON.stringify(session)
                ];
                var responseCode = 200;
                client.srem(arr, function (err, res) {
                    if(err){
                        console.log(err);
                        responseCode = 503;
                    }
                    if(res){
                        console.log('removed: '+res);
                    }
                });
                res.sendStatus(responseCode);
                break;
            default :
                res.end();
                break;
        }
    })
    .put(function(req, res) {
        res.send('this is a put');
    });

/**
 * Serves everything else
 */
app.route('/*')
    .get(function(req, res) {
        res.sendFile(path.join(__dirname + '/views/'+req.params[0]));
    });

// Bind to port
//app.listen(80);
http.createServer(app).listen(80);
https.createServer(config,app).listen(443);
