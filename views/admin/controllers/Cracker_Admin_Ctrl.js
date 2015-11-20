/**
 * Created by kells4 on 2/11/2015.
 */
app.controller('CrackerAdminCtrl',['$scope','$http',function($scope,$http){

    $scope.airports = [
        {'code':'AKL','name':'Auckland'},{'code':'CHC','name':'Christchurch'},{'code':'DUD','name':'Dunedin'},{'code':'GIS','name':'Gisborne'},
        {'code':'HKK','name':'Hokitika'},{'code':'HLZ','name':'Hamilton'},{'code':'IVC','name':'Invercargill'},{'code':'KKE','name':'Kerikeri'},
        {'code':'NPE','name':'Napier/Hastings'},{'code':'NPL','name':'New Plymouth'},{'code':'NSN','name':'Nelson'},{'code':'PMR','name':'Palmerston North'},
        {'code':'ROT','name':'Rotorua'},{'code':'TIU','name':'Timaru'},{'code':'TRG','name':'Tauranga'},{'code':'TUO','name':'Taupo'},{'code':'WAG','name':'Whanganui'},
        {'code':'WLG','name':'Wellington'},{'code':'WRE','name':'Whangarei'},{'code':'ZQN','name':'Queenstown'}
    ];

    $scope.jokes = [
        {title:'Yo Mamma So Bald',description:"Yo mama's so bald, that when she put on a sweater, folk thought she was a roll on deoderant!"},
        {title:'Yo Mamma So Fat',description:"Yo mama's so bald, that when she jumped for joy, she got stuck!"},
        {title:'Yo Mamma So Fat2',description:"Yo momma so fat she sued xbox 360 for guessing her weight!"},
        {title:'Yo Mamma So Dumb',description:"Yo mama so dumb when you stand next to her you hear the ocean!"}
    ];

    $scope.hours = [
        '08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23','00','01','02','03','04','05','06','07'
    ];

    $scope.minutes = [
        '00','05','10','15','20','25','30','35','40','45','50','55'
    ];

    $scope.sessions = [];
    $scope.session = {

    };

    $scope.currentSession = {
        sessionid : '16874',
        destination : {'code':'AKL','name':'Auckland'},
        origin1 : {'code':'CHC','name':'Christchurch'},
        origin2 : {'code':'DUD','name':'Dunedin'},
        origin1votes : '4309',
        origin2votes : '6506',
        joke1 : {title:'Yo Mamma So Fat',description:"Yo mama's so bald, that when she jumped for joy, she got stuck!"},
        joke2 : {title:'Yo Mamma So Dumb',description:"Yo mama so dumb when you stand next to her you hear the ocean!"},
        startTime : 'Mon 9 Nov 0900',
        endTime : 'Mon 9 Nov 1100',
        startMessage : 'start message',
        nextVotingMessage : 'next message'
    };

    // these var will be updated by update
    $scope.sessiondata = [];
    $scope.sessionlabels = [];
    $scope.series = [];

    $scope.seriesLabels = ['test 1','test 2'];
    $scope.seriesData = [
        [6506],
        [4309]
    ];
    $scope.sessionUpdate = false;

    //$scope.$watch(function(o,n){
    //    // update
    //    $scope.sessiondata = [$scope.currentSession.origin1votes, $scope.currentSession.origin2votes];
    //    $scope.sessionlabels = [$scope.currentSession.origin1.name, $scope.currentSession.origin2.name];
    //    $scope.series = [$scope.currentSession.origin1.code, $scope.currentSession.origin2.code];
    //
    //});

    $scope.setGraphData = function(session){
        $scope.sessiondata = [session.origin1votes, session.origin2votes];
        $scope.sessionlabels = [session.origin1.name, session.origin2.name];
        $scope.series = [session.origin1.code, session.origin2.code];
    };

    $scope.setGraphData($scope.currentSession);

    $scope.setCurrentSession = function(){

    };

    $scope.createSession = function(session){
        var jsonObj = {
            "id" : session.id,
            "destination" : JSON.stringify(session.destination),
            "origin1" : JSON.stringify(session.origin1),
            "origin2" : JSON.stringify(session.origin2),
            "joke1" : session.joke1,
            "joke2" : session.joke2,
            "startTime" : session.startTime,
            "endTime" : session.endTime,
            "startMessage" : session.startMessage,
            "nextVotingMessage" : session.nextVotingMessage
        };

        $http({
            url: "https://localhost/api/addSession?time=" + new Date().getTime(),
            method: "POST",
            transformRequest: function(obj) {
                var str = [];
                for(var p in obj)
                    str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                return str.join("&");
            },
            data: jsonObj,
            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
        }).then(function(res) {
            $scope.getAllSessions();
        });

        $scope.sessionUpdate = false;
        // clear
        $scope.session = {};

        // clear date picker
        $('#date-end').bootstrapMaterialDatePicker({ weekStart : 0 });
        $('#date-start').bootstrapMaterialDatePicker({ weekStart : 0 });
    };

    $scope.addSession = function(session){
        if(!$scope.sessionUpdate) {
            //$scope.sessions.push(session);
            var sessID = Math.floor(Math.random()*90000) + 10000;
            session.origin1votes = '0';
            session.origin2votes = '0';
            session.id = sessID;
            $scope.createSession(session);
        } else {
            // remove previous
            $scope.removeSession(session.redisIndex).then(function(res){
                //$scope.createSession(session);
            });
        }
    };

    $scope.setSession = function(session){
        $scope.session = session;
        $scope.currentSession = session;
        $scope.setGraphData(session);
        $scope.sessionUpdate = true;
        //// set time
        //$scope.session.startTime = session.starthour + ':' + session.startminute;
        //$scope.session.endTime = session.endhour + ':' + session.endminute;
    };

    $scope.redisData = [];

    $scope.parseSessionObj = function(session){
        return {
            "id" : session.id,
            "destination" : JSON.stringify(session.destination),
            "origin1" : JSON.stringify(session.origin1),
            "origin2" : JSON.stringify(session.origin2),
            "joke1" : session.joke1,
            "joke2" : session.joke2,
            "startTime" : session.startTime,
            "endTime" : session.endTime,
            "startMessage" : session.startMessage,
            "nextVotingMessage" : session.nextVotingMessage
        };
    };

    $scope.removeSession = function(ind){
        var objToRemove = $scope.parseSessionObj($scope.redisData[ind]);
        return $http({
            url: "https://localhost/api/removeSession?time=" + new Date().getTime(),
            method: "POST",
            transformRequest: function(obj) {
                var str = [];
                for(var p in obj)
                    str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                return str.join("&");
            },
            data: objToRemove,
            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
        });
    };

    $scope.removeSessionFromTable = function(ind){
        $scope.removeSession(ind).then(function(res){
            $scope.getAllSessions();
        });
    };

    $scope.parseSessionData = function(data){
        var newSessionArray = [];
        for(var i=0;i < data.length; i++){
            // parse city data
            var sess = data[i];
            sess.destination = JSON.parse(data[i]['destination']);
            sess.origin1 = JSON.parse(data[i]['origin1']);
            sess.origin2 = JSON.parse(data[i]['origin2']);
            sess.redisIndex = i;
            // store to redisData, used to remove later
            $scope.redisData.push(data[i]);
            // store to sessions for display
            newSessionArray.push(sess);
        }
        $scope.sessions = newSessionArray;
    };

    $scope.getAllSessions = function(){
        $http.get('https://localhost/api/getAllSessions').then(function(res){
            $scope.parseSessionData(res.data);
        });
    };

    $scope.initDatePicker = function(){
        $('#date-end').bootstrapMaterialDatePicker({ weekStart : 0, format: 'DD/MM/YYYY HH:mm' }).on('change', function(e, date){
            $scope.session.endTime = moment(date).format('MM/DD/YYYY HH:MM');
        });

        $('#date-start').bootstrapMaterialDatePicker({ weekStart : 0, format: 'DD/MM/YYYY HH:mm' }).on('change', function(e, date)
        {
            $scope.session.startTime = moment(date).format('MM/DD/YYYY HH:MM');
            $('#date-end').bootstrapMaterialDatePicker('setMinDate', date);
        });
    };

    $scope.getAllSessions();

}]);