/**
 *
 *
**/

// used to set dev ports or aws
var dev_only = true;

// connection ports and addresses
var SERVER_PORT = dev_only ? 80 : process.env.PORT || 3000;
var REDIS_HOST = dev_only ? '192.168.1.2' : 'gas-cracker.isqbpv.ng.0001.apse2.cache.amazonaws.com';


var express = require('express');
var bodyParser = require('body-parser');
var http = require('http');
var https = require('https');

var app = express(); // the main app
var path = require('path');
var fs         = require("fs");

if(dev_only){
    var key_file   = "server/certs/server.key";
    var cert_file  = "server/certs/server.crt";

    var config     = {
        key: fs.readFileSync(key_file),
        cert: fs.readFileSync(cert_file)
    };

//CORS middleware
    var allowCrossDomain = function(req, res, next) {
        res.header('Access-Control-Allow-Origin', 'https://192.168.1.2');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
        res.header('Access-Control-Allow-Headers', 'Content-Type');

        next();
    };

    app.use(allowCrossDomain);
}

// body parser
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

// redis interface
var redis = require('redis');
var client = redis.createClient('6379',REDIS_HOST);//creates a new client

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
 * Get's Main Admin Dashboard Page
 * Used to enable short request to /admin
 */
app.route('/test')
    .get(function(req, res) {
        console.log('Accessing the test section ...');
        console.log(app.path());
        res.type('.html');
        res.sendFile(path.join(__dirname + '/views/client/TestPage.html'));
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
                            var _voteEndTime = new Date(sess.voteEndTime);
                            var _dealStartTime = new Date(sess.dealStartTime);
                            var _serverTime = new Date();
                            console.log('startTime time is '+_startTime.toDateString());
                            console.log('endTime time is '+_endTime.toDateString());
                            console.log('server time is '+_serverTime.toDateString());
                            if(_startTime < _serverTime && _endTime > _serverTime){
                                // set deal status
                                sess.live = _endTime > _serverTime;
                                sess.status = 'VOTING';
                                // check vote end
                                if(_voteEndTime < _serverTime){
                                    sess.status = 'VOTING_END';
                                }
                                // check deal start
                                if(_dealStartTime < _serverTime){
                                    sess.status = 'DEAL_START';
                                }
                                console.log('server time is '+_serverTime.toDateString());
                                result = sess;
                                break;
                            }else{
                                console.log('no current session');
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
            case 'getGraphData':
                client.smembers("type:session", function (err, result) {
                    if(result && result.length > 0){
                        graphdata = [];
                        tempdata = [];
                        var multi = client.multi();
                        // parse data
                        for(var i = 0; i < result.length; i++){
                            var sess = JSON.parse( result[i] );
                            // get origin1 votes
                            multi.get("type:votes:"+sess.id+':origin1');
                            multi.get("type:votes:"+sess.id+':origin2');
                        }
                        multi.exec(function(err,replies){
                            if(err){
                                console.log("err="+err);
                            }
                            var returningArray = [];
                            var incr = 0;

                            for(var n=0; n < result.length; n++){
                                var resObj = JSON.parse(result[n]);
                                resObj.origin1VoteCount = replies[incr];
                                incr++;
                                resObj.origin2VoteCount = replies[incr];
                                incr++;
                                returningArray.push(resObj);
                            }
                            setTimeout(function(){
                                res.send(returningArray);
                            },0);
                        });
                    }
                });
                break;
            case 'getServerTime':
                var serverDate = new Date().toDateString();
                var serverTime = new Date().toTimeString();
                res.send(serverDate + ' - ' + serverTime);
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
                    "id" : Math.floor(Math.random()*90000) + 10000,
                    "destination" : req.body.destination,
                    "origin1" : req.body.origin1,
                    "origin2" : req.body.origin2,
                    "joke1" : req.body.joke1,
                    "joke2" : req.body.joke2,
                    "startTime" : req.body.startTime,
                    "endTime" : req.body.endTime,
                    "dealStartTime" : req.body.dealStartTime,
                    "voteEndTime" : req.body.voteEndTime,
                    "startMessage" : req.body.startMessage,
                    "nextVotingMessage" : req.body.nextVotingMessage,
                    "origin1votes" : req.body.origin1votes,
                    "origin2votes" : req.body.origin2votes
                };
                console.log(session_obj.id);
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
                var origin1Key = "type:votes:"+session_obj.id+':origin1';
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
                var origin2Key = "type:votes:"+session_obj.id+':origin2';
                client.set(origin2Key,0, function (err, res) {
                    if(err){
                        console.log(err);
                    }
                    if(res){
                        console.log(origin2Key + ' ' + res);
                    }
                });
                res.send(200);
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
                var session = {};

                client.smembers("type:session", function (err, result) {
                    if (result && result.length > 0) {
                        for(var i=0; i < result.length; i++ ){
                            var obj = JSON.parse(result[i]);
                            console.log('----------------------------');
                            console.log(obj.id);
                            console.log(req.body.id);
                            console.log('----------------------------');
                            if(obj.id == req.body.id){
                                console.log('got match');
                                session = result[i];
                                break;
                            }
                        }

                        console.log('removeSession called: '+session);
                        var arr = [
                            "type:session",session
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
                        console.log('end of removeSession method');
                        res.sendStatus(responseCode);
                    }
                });


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
http.createServer(app).listen(SERVER_PORT);

if(dev_only){

    https.createServer(config,app).listen(443);
}

