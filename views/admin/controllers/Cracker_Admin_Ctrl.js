/**
 * Created by kells4 on 2/11/2015.
 */
app.filter('airportFilter',function(){
    return function(destinations,airport) {
        // now filter
        if(airport && airport.name){
            for(var i = 0; i < destinations.length; i++){
                if(destinations[i].name === airport.name){
                    destinations.splice(i,1);
                    break;
                }
            }
            return destinations;
        } else {
            console.log('caught error');
        }
        return destinations;
    };
});

var createCookie = function(name, value, days) {
    var expires;
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
    }
    else {
        expires = "";
    }
    document.cookie = name + "=" + value + expires + "; path=/";
};

function getCookie(c_name) {
    if (document.cookie.length > 0) {
        c_start = document.cookie.indexOf(c_name + "=");
        if (c_start != -1) {
            c_start = c_start + c_name.length + 1;
            c_end = document.cookie.indexOf(";", c_start);
            if (c_end == -1) {
                c_end = document.cookie.length;
            }
            return unescape(document.cookie.substring(c_start, c_end));
        }
    }
    return "";
}

app.controller('CrackerAdminCtrl',['$scope','$http','$filter',function($scope,$http,$filter){

    $scope.airports = [
        {'code':'AKL','name':'Auckland'},{'code':'CHC','name':'Christchurch'},{'code':'DUD','name':'Dunedin'},{'code':'GIS','name':'Gisborne'},
        {'code':'HKK','name':'Hokitika'},{'code':'HLZ','name':'Hamilton'},{'code':'IVC','name':'Invercargill'},{'code':'KKE','name':'Kerikeri'},
        {'code':'NPE','name':'Napier / Hastings'},{'code':'NPL','name':'New Plymouth'},{'code':'NSN','name':'Nelson'},{'code':'PMR','name':'Palmerston North'},
        {'code':'ROT','name':'Rotorua'},{'code':'TIU','name':'Timaru'},{'code':'TRG','name':'Tauranga'},{'code':'TUO','name':'Taupo'},{'code':'WAG','name':'Whanganui'},
        {'code':'WLG','name':'Wellington'},{'code':'WRE','name':'Whangarei'},{'code':'ZQN','name':'Queenstown'}
    ];
    $scope.org1airports = [
        {'code':'AKL','name':'Auckland'},{'code':'CHC','name':'Christchurch'},{'code':'DUD','name':'Dunedin'},{'code':'GIS','name':'Gisborne'},
        {'code':'HKK','name':'Hokitika'},{'code':'HLZ','name':'Hamilton'},{'code':'IVC','name':'Invercargill'},{'code':'KKE','name':'Kerikeri'},
        {'code':'NPE','name':'Napier / Hastings'},{'code':'NPL','name':'New Plymouth'},{'code':'NSN','name':'Nelson'},{'code':'PMR','name':'Palmerston North'},
        {'code':'ROT','name':'Rotorua'},{'code':'TIU','name':'Timaru'},{'code':'TRG','name':'Tauranga'},{'code':'TUO','name':'Taupo'},{'code':'WAG','name':'Whanganui'},
        {'code':'WLG','name':'Wellington'},{'code':'WRE','name':'Whangarei'},{'code':'ZQN','name':'Queenstown'}
    ];
    $scope.org2airports = [
        {'code':'AKL','name':'Auckland'},{'code':'CHC','name':'Christchurch'},{'code':'DUD','name':'Dunedin'},{'code':'GIS','name':'Gisborne'},
        {'code':'HKK','name':'Hokitika'},{'code':'HLZ','name':'Hamilton'},{'code':'IVC','name':'Invercargill'},{'code':'KKE','name':'Kerikeri'},
        {'code':'NPE','name':'Napier / Hastings'},{'code':'NPL','name':'New Plymouth'},{'code':'NSN','name':'Nelson'},{'code':'PMR','name':'Palmerston North'},
        {'code':'ROT','name':'Rotorua'},{'code':'TIU','name':'Timaru'},{'code':'TRG','name':'Tauranga'},{'code':'TUO','name':'Taupo'},{'code':'WAG','name':'Whanganui'},
        {'code':'WLG','name':'Wellington'},{'code':'WRE','name':'Whangarei'},{'code':'ZQN','name':'Queenstown'}
    ];

    $scope.jokes = [
        {title:'Yo Mamma So Bald',description:"Yo mama's so bald, that when she put on a sweater, folk thought she was a roll on deoderant!"},
        {title:'Yo Mamma So Fat',description:"Yo mama's so fat, that when she jumped for joy, she got stuck!"},
        {title:'Yo Mamma So Fat2',description:"Yo momma so fat she sued xbox 360 for guessing her weight!"},
        {title:'Yo Mamma So Dumb',description:"Yo mama so dumb when you stand next to her you hear the ocean!"}
    ];

    $scope.hours = [
        '08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23','00','01','02','03','04','05','06','07'
    ];

    $scope.minutes = [
        '00','05','10','15','20','25','30','35','40','45','50','55'
    ];

    $scope.showLogin = true;

    $scope.sessions = [];
    $scope.session = null;
    var redisData = [];
    $scope.redisSession = {};

    $scope.updateAirports = function(){
        $scope.org1airports = $filter('airportFilter')($scope.org1airports,$scope.session.destination);
        $scope.org2airports = $filter('airportFilter')($scope.org2airports,$scope.session.destination);
        $scope.org2airports = $filter('airportFilter')($scope.org2airports,$scope.session.origin1);
    };

    $scope.currentSession = {};

    // these var will be updated by update
    $scope.sessiondata = [];
    $scope.sessionlabels = [];

    $scope.series = []; // origins
    $scope.seriesLabels = []; // end date
    $scope.seriesData = []; // votes

    $scope.totalVotes = 0;
    $scope.highestVotingOrigin = {};
    $scope.highestVoteCount = 0;
    $scope.sessionUpdate = false;
    $scope.showModal = true;
    $scope.sec = ['gas','gas123'];
    $scope.invalidCredentials = false;
    $scope.auth = {};
    $scope.loginUsernameError = false;
    $scope.loginPasswordError = false;
    $scope.loginUsernameSuccess = false;
    $scope.loginPasswordSuccess = false;

    $scope.pieColours = [
        '#00B0FF', // blue
        '#FF6D00', // light grey
        '#F7464A', // red
        '#388E3C', // green
        '#FF6D00', // yellow
        '#949FB1', // grey
        '#4D5360'  // dark grey
    ];

    $scope.getTotalVotes = function(){
        var total = 0;
        for(var i=0; i < $scope.sessions.length; i++){
            if($scope.sessions[i].origin1VoteCount){
                total += parseInt($scope.sessions[i].origin1VoteCount);
            }
            if($scope.sessions[i].origin2VoteCount){
                total += parseInt($scope.sessions[i].origin2VoteCount);
            }
        }
        return total;
    };

    $scope.login = function(){
        if($scope.auth.username == $scope.sec[0]){
            if($scope.auth.password == $scope.sec[1]){
                $scope.showLogin = false;
                createCookie('ccadmin',true,1);
            }else{
                $scope.invalidCredentials = true;
            }
        } else {
            $scope.invalidCredentials = true;
        }
    };

    $scope.$watch('auth.username',function(o,n){
        if($scope.auth.username){
            console.log($scope.auth.username);
            if($scope.auth.username == $scope.sec[0]){
                $scope.loginUsernameSuccess = true;
                $scope.loginUsernameError = false;
            }else{
                $scope.loginUsernameError = true;
                $scope.loginUsernameSuccess = false;
            }
        }
    });

    $scope.$watch('auth.password',function(o,n){
        if($scope.auth.password){
            console.log($scope.auth.password);
            if($scope.auth.password == $scope.sec[1]){
                $scope.loginPasswordSuccess = true;
                $scope.loginPasswordError = false;
            }else{
                $scope.loginPasswordError = true;
                $scope.loginPasswordSuccess = false;
            }
        }
    });

    $scope.getHighestVotingOrigin = function(){
        var highestCount = 0;
        var origin = {};
        for(var i=0; i < $scope.sessions.length; i++){
            if($scope.sessions[i].origin1VoteCount){
                if( parseInt($scope.sessions[i].origin1VoteCount) > highestCount ){
                    highestCount = parseInt($scope.sessions[i].origin1VoteCount);
                    origin.name = $scope.sessions[i].origin1.name;
                    origin.code = $scope.sessions[i].origin1.code;
                    origin.total = $scope.sessions[i].origin1VoteCount;
                }
            }
            if($scope.sessions[i].origin2VoteCount){
                if( parseInt($scope.sessions[i].origin2VoteCount) > highestCount ){
                    highestCount = parseInt($scope.sessions[i].origin2VoteCount);
                    origin.name = $scope.sessions[i].origin2.name;
                    origin.code = $scope.sessions[i].origin2.code;
                    origin.total = $scope.sessions[i].origin2VoteCount;
                }
            }
        }
        return origin;
    };

    $scope.updateSeries = function(code, count){
        function containsIata(iata) {
            var res = {
                'index' : 0,
                'exists' : false
            };
            var a;
            for (a = 0; a < $scope.series.length; a++) {
                console.log('****************************************');
                console.log('$scope.series[a] = '+$scope.series[a] + ' | iata = ' +iata);
                if ($scope.series[a] === iata) {
                    res.index = a;
                    res.exists = true;
                    return res;
                }else{

                }
            }
            return res;
        }
        var o = containsIata(code);

        if( o.exists ){
            // set seriesData at index
            var ua = $scope.seriesData[o.index];
            if(ua){
                ua.push( count );
                $scope.seriesData.splice(o.index, 1, ua);
            }
        } else {
            $scope.series.push(code);
            var arr = [];
            for(var s=0; s < $scope.seriesLabels.length;s++){
                arr.push(0);
            }
            arr.push(count);
            arr.push(0);
            $scope.seriesData.push(arr);
        }


        console.log('SERIES: ' + JSON.stringify($scope.series));
        console.log('SERIESDATA: ' + JSON.stringify($scope.seriesData));

    };

    $scope.setSeriesData = function(){
        for(var i=0; i < $scope.sessions.length; i++){
            if( $scope.series.indexOf($scope.sessions[i].origin1.code) === -1){
                $scope.updateSeries( $scope.sessions[i].origin1.code, $scope.sessions[i].origin1VoteCount );
            }

            if( $scope.series.indexOf($scope.sessions[i].origin2.code) === -1){
                $scope.updateSeries( $scope.sessions[i].origin2.code, $scope.sessions[i].origin2VoteCount );
            }

            var endTime = new Date($scope.sessions[i].endTime).toDateString();
            if($scope.seriesLabels.indexOf(endTime) === -1){
                $scope.seriesLabels.push(endTime);
                console.log('LABELS: ' + JSON.stringify($scope.seriesLabels));
            }
        }
    };

    $scope.setTotals = function(){
        $scope.totalVotes = $scope.getTotalVotes();
        $scope.highestVotingOrigin = $scope.getHighestVotingOrigin();
        $scope.setSeriesData();
    };

    $scope.setGraphData = function(session){
        if(Object.getOwnPropertyNames(session).length > 0){
            $scope.sessiondata = [session.origin1VoteCount, session.origin2VoteCount];
            $scope.sessionlabels = [session.origin1.name, session.origin2.name];
            //$scope.series = [session.origin1.code, session.origin2.code];
        }
    };

    $scope.clearFormData = function(){
        // clear
        $scope.session = null;

        // clear date picker
        $('#date-end').bootstrapMaterialDatePicker({ weekStart : 0 });
        $('#date-start').bootstrapMaterialDatePicker({ weekStart : 0 });
        $('#date-vote-end').bootstrapMaterialDatePicker({ weekStart : 0 });
        $('#date-deal-start').bootstrapMaterialDatePicker({ weekStart : 0 });
    };

    $scope.createFormData = function(){
        // clear
        $scope.session = {
            'startMessage' : 'Check soon to see more ',
            'nextVotingMessage' : 'Check soon to see more '
        };

        // clear date picker
        $('#date-end').bootstrapMaterialDatePicker({ weekStart : 0 });
        $('#date-start').bootstrapMaterialDatePicker({ weekStart : 0 });
        $('#date-vote-end').bootstrapMaterialDatePicker({ weekStart : 0 });
        $('#date-deal-start').bootstrapMaterialDatePicker({ weekStart : 0 });
    };

    $scope.formError = false;

    $scope.createSession = function(session){
        var jsonObj = {
            "destination" : JSON.stringify(session.destination),
            "origin1" : JSON.stringify(session.origin1),
            "origin2" : JSON.stringify(session.origin2),
            "joke1" : session.joke1,
            "joke2" : session.joke2,
            "startTime" : session.startTime,
            "endTime" : session.endTime,
            "startMessage" : session.startMessage,
            "nextVotingMessage" : session.nextVotingMessage,
            "voteEndTime" : session.voteEndTime,
            "dealStartTime" : session.dealStartTime
        };

        // arr but wait lets validate the sessions for to make sure
        // need to compare with previous start and end times
        if(!$scope.sessionUpdate){
            for(var i=0; i < $scope.sessions.length; i++){
                var sess = $scope.sessions[i];
                if( sess ){
                    if( new Date(session.startTime) < new Date(sess.endTime) ){
                        // got a prob
                        $scope.formError = true;
                        break;
                    }
                }
            }
        }

        if( !$scope.formError ){
            $http({
                url: serverUrl + "/api/addSession?time=" + new Date().getTime(),
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

            $scope.clearFormData();
        }
    };

    $scope.addSession = function(session){
        if(!$scope.sessionUpdate) {
            session.origin1votes = '0';
            session.origin2votes = '0';
            $scope.createSession(session);
        } else {
            // remove previous
            $scope.removeSession(session.redisIndex).then(function(res){
                $scope.createSession(session);
                $scope.clearFormData();
            });
        }
    };

    $scope.setSession = function(session){
        //used to configure session
        $scope.session = session;
        //used to update dashboard
        $scope.currentSession = session;
        //used to update redis
        $scope.redisSession = $scope.parseSessionObj(session);
        $scope.setGraphData(session);
        $scope.sessionUpdate = true;
        // set time
        $scope.setSelectedDates();
    };

    $scope.parseSessionObj = function(sess){
        return {
            "id" : sess.id,
            "destination" : JSON.stringify(sess.destination),
            "origin1" : JSON.stringify(sess.origin1),
            "origin2" : JSON.stringify(sess.origin2),
            "joke1" : sess.joke1,
            "joke2" : sess.joke2,
            "startTime" : sess.startTime,
            "endTime" : sess.endTime,
            "startMessage" : sess.startMessage,
            "nextVotingMessage" : sess.nextVotingMessage,
            "voteEndTime" : sess.voteEndTime,
            "dealStartTime" : sess.dealStartTime
        };
    };

    $scope.removeSession = function(ind){
        return $http({
            url: serverUrl + "/api/removeSession?time=" + new Date().getTime(),
            method: "POST",
            transformRequest: function(obj) {
                var str = [];
                for(var p in obj)
                    str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                return str.join("&");
            },
            data: $scope.redisSession,
            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
        });
    };

    $scope.modalSessionId = null;

    $scope.removeSessionFromTable = function(ind){
        $scope.modalSessionId = ind;
    };

    $scope.removeSessionConfirmed = function(ind){
        $scope.removeSession(ind).then(function(res){
            $scope.getAllSessions();
            $scope.modalSessionId = null;
            $scope.clearFormData();
        });
    };

    $scope.orderByDate = function(item) {
        var date = new Date(item.startTime);
        return date;
    };

    $scope.parseSessionData = function(data){
        var newSessionArray = [];
        for(var i=0;i < data.length; i++){
            // parse city data
            if(data[i]['destination'] !== 'undefined' || data[i]['origin1'] !== 'undefined'){
                var sess = data[i];
                sess.destination = JSON.parse(data[i]['destination']);
                sess.origin1 = JSON.parse(data[i]['origin1']);
                sess.origin2 = JSON.parse(data[i]['origin2']);
                sess.redisIndex = i;
                // check status
                if( new Date(sess.endTime) < new Date() ){
                    sess.sessionended = true;
                }
                // store to redisData, used to remove later
                redisData.push(data[i]);
                // store to sessions for display
                newSessionArray.push(sess);
            }
        }
        $scope.sessions = newSessionArray;
        $scope.setTotals();
    };

    $scope.getAllSessions = function(){
        $http.get(serverUrl + '/api/getGraphData').then(function(res){
            $scope.parseSessionData(res.data);
        });
    };

    $scope.setSelectedDates = function(){
        var startDate = new Date($scope.session.startTime);
        var endDate = new Date($scope.session.endTime);
        var voteDate = new Date($scope.session.voteEndTime);
        var dealDate = new Date($scope.session.dealStartTime);
        $('#date-start').bootstrapMaterialDatePicker('setMinDate', startDate);
        $('#date-end').bootstrapMaterialDatePicker('setMinDate', endDate);
        $('#date-vote-end').bootstrapMaterialDatePicker('setMinDate', voteDate);
        $('#date-deal-start').bootstrapMaterialDatePicker('setMinDate', dealDate);
    };

    $scope.initDatePicker = function(){
        $('#date-end').bootstrapMaterialDatePicker({ weekStart : 0, format: 'DD/MM/YYYY HH:mm' }).on('change', function(e, date){
            $scope.session.endTime = moment(date).format('MM/DD/YYYY HH:mm');
        });

        $('#date-vote-end').bootstrapMaterialDatePicker({ weekStart : 0, format: 'DD/MM/YYYY HH:mm' }).on('change', function(e, date){
            $scope.session.voteEndTime = moment(date).format('MM/DD/YYYY HH:mm');
        });

        $('#date-deal-start').bootstrapMaterialDatePicker({ weekStart : 0, format: 'DD/MM/YYYY HH:mm' }).on('change', function(e, date){
            $scope.session.dealStartTime = moment(date).format('MM/DD/YYYY HH:mm');
        });

        $('#date-start').bootstrapMaterialDatePicker({ weekStart : 0, format: 'DD/MM/YYYY HH:mm' }).on('change', function(e, date)
        {
            $scope.session.startTime = moment(date).format('MM/DD/YYYY HH:mm');
            $('#date-vote-end').bootstrapMaterialDatePicker('setMinDate', date);
            $('#date-deal-start').bootstrapMaterialDatePicker('setMinDate', date);
            $('#date-end').bootstrapMaterialDatePicker('setMinDate', date);
        });
    };

    $scope.init = function(){
        $scope.getAllSessions();
        $scope.setGraphData($scope.currentSession);
        var ccadminCookie = getCookie('ccadmin');
        if(ccadminCookie){
            $scope.showLogin = false;
        }
    };

    $scope.init();

}]);

