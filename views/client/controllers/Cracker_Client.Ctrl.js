/**
 * Created by kells4 on 10/11/2015.
 */
app.controller('CrackerClientCtrl',['$scope','$http','$cookieStore',function($scope,$http,$cookieStore){

    // used to set dev ports or aws
    $scope.serverUrl = 'https://promo.grabaseat.co.nz';
   // $scope.serverUrl = 'https://isis-ws-103.isis.airnz.co.nz';

    $scope.righthovereffect = false;
    $scope.lefthovereffect = false;

    $scope.sessionEnded = false;
    $scope.noSession = false;
    $scope.voteRegistered = false;
    $scope.voted = false;
    $scope.displayWinner = false;
    $scope.displayBrokenCracker = false;
    $scope.displayCrackerEnd = false;
    $scope.displayJoke = false;
    $scope.crackerOpenMessage = '';

    $scope.defaultOpenText = "Check soon to see more ";
    $scope.defaultDealText = "cheap flights for Christmas";
    $scope.winningOrigin = "";
    $scope.winningJoke = "";

    $scope.session = null;
    var randomnVotingDialPlayed = false;
    $scope.sessionGetterInterval = null;

    $scope.setSessionStates = function(){
        if($scope.session){
            //$scope.session.status = "VOTING_END";
            if($scope.session.status  !== "VOTING"){
                $scope.sessionEnded = true;
                $scope.noSession = false;
                $scope.voteRegistered = false;
                $scope.setMessageText($scope.session.status);
            }else{
                $scope.sessionEnded = false;
                $scope.noSession = false;
                $scope.voteRegistered = false;
                $scope.forceApply();
            }
        } else {
            $scope.setNoSessionState();
        }
    };

    $scope.setNoSessionState = function(){
        $scope.noSession = true;
        $scope.sessionEnded = false;
        $scope.voteRegistered = false;
        $scope.displayWinner = false;
        $scope.displayBrokenCracker = false;
        $scope.displayCrackerEnd = false;
        $scope.displayJoke = false;
        $scope.forceApply();
    };

    $scope.setMessageText = function(status){
        if(typeof status != 'undefined'){
            switch(status){
                case 'VOTING_END':
                    if(typeof($scope.session.startMessage) !== 'undefined'){
                        $scope.crackerOpenMessage = $scope.session.startMessage;
                    }
                    break;
                case 'DEAL_START':
                    if(typeof($scope.session.nextVotingMessage) !== 'undefined'){
                        $scope.crackerOpenMessage = $scope.session.nextVotingMessage;
                    }
                    break;
                default :
                    $scope.crackerOpenMessage = $scope.defaultOpenText;
                    break;
            }
        }

    };

    $scope.showJoke = function(){
        setTimeout(function(){
            $scope.displayJoke = true;
            $scope.displayWinner = true;
            $scope.forceApply();
        },500);
    };

    $scope.setSessionGetters = function(){
        if(!$scope.sessionGetterInterval){
            $scope.sessionGetterInterval = setInterval(function(){
                $scope.getSession();
                // get votes
                $scope.getVotes();
            },3e4);
        }
    };

    $scope.init = function(){
        // set session state
        $scope.setSessionStates();
        // get votes
        $scope.getVotes();
        // set cracker open if session has ended
        if($scope.sessionEnded){
            if(!$scope.displayCrackerEnd){$scope.startTuggingEffect();}
           $scope.setMessageText();
        } else {
            // check cookie
            var cookie = $scope.session ? $cookieStore.get('cc'+$scope.session.id) : null;
            if(cookie){
                $scope.voteRegistered = true;
            }else{
                $scope.startTransitions();
            }
            // start dial animation
            if(!randomnVotingDialPlayed){
                $scope.randomnlyMoveVotingDial();
                randomnVotingDialPlayed = true;
            }
        }
    };

    $scope.calculateVotes = function(orig1,orig2){
        var median = 5;
        var orig1Total = parseInt(orig1)+median;
        var orig2Total = parseInt(orig2)+median;
        var totalVotes = orig1Total + orig2Total;
        var max = 85;
        var num = 0;
        var percen = 0;

        if(orig1Total > orig2Total){
            percen = ( orig1Total / totalVotes ) * 100;
            num = ( percen * max ) / 100;
            num = -num;
        }else if(orig1Total < orig2Total){
            percen = ( orig2Total / totalVotes ) * 100;
            num = ( percen * max ) / 100;
        } else {
            num = 0;
        }

        // update winner vars
        $scope.winningOrigin = num > 0 ? $scope.session.origin2.name : $scope.session.origin1.name;
        $scope.winningJoke = num > 0 ? $scope.session.joke2 : $scope.session.joke1;

        $scope.setDial(num);
    };

    $scope.getVotes = function(){
        if($scope.session && $scope.session.id){
            $http.get($scope.serverUrl+'/api/getVotesForSession?id='+$scope.session.id).then(function(res){
                // assume for in array is origin1
                if(res.data){
                    $scope.calculateVotes(res.data[0],res.data[1]);
                }
            });
        }
    };

    $scope.setDial = function(num){
        if(document.getElementById('cc-divider')){
            document.getElementById('cc-divider').style.transform = 'rotate('+ num +'deg)';
        }
    };

    $scope.randomnlyMoveVotingDial = function(){
        var int = 0;
        var length = 8;

        function randomnlyMoveDial(){
            var min = 70;
            var max = -70;
            var num = Math.floor(Math.random() * (max - min + 1)) + min;

            $scope.setDial(num);
        }
        var interval = setInterval(function(){
            if(int < length){
                randomnlyMoveDial();
                int++;
            }else{
                $scope.setDial(0);
                $scope.getVotes();
                clearInterval(interval);
            }
        },400);
    };

    $scope.forceApply = function(){
        if(!$scope.$$phase) {
            $scope.$apply();
        }
    };

    $scope.displayOpening = function(){
        $scope.displayBrokenCracker = true;
        $scope.forceApply();
        setTimeout(function(){
            $scope.displayCrackerEnd = true;
            $scope.showJoke();
            $scope.forceApply();

        },200);
    };

    $scope.startTuggingEffect = function(){
        var int = 0;
        var length = 18;
        var goLeft = false;

        function moveCracker(){
            document.getElementById('ccmainwrapper').style.marginLeft = goLeft ? '25px' : '-25px';
        }

        var interval = setInterval(function(){
            if(length > int){
                moveCracker();
                goLeft = !goLeft;
                int++;
            }else{
                $scope.displayOpening();
                clearInterval(interval);
            }
        },150);
    };

    $scope.pullCracker = function(direction){
        var distance = '60px';
        if(direction === 'left'){
            distance = '-60px';
        }
        document.getElementById('ccmainwrapper').style.marginLeft = distance;

        // add vote
        if(!$scope.voted){
            $scope.addVote(direction === 'left' ? 'origin1' : 'origin2');
            $scope.voted = true;
        }
        if(document.body.offsetWidth < 900){
            setTimeout($scope.resetCracker,1200);
        }
    };


    $scope.resetCracker = function(){
        setTimeout(function(){
            document.getElementById('ccmainwrapper').style.marginLeft = '0';
        },200);
    };

    $scope.startTransitions = function(){

        setTimeout(function(){
            var _classNames = 'cctrans ccin';
            if(!$scope.voteRegistered && !$scope.noSession){
                _classNames = 'cctrans ccCenterCracker';
            }else if($scope.noSession){
                _classNames = 'cctrans ccin';
            }
            if(document.getElementById('ccwrapper')){
                document.getElementById('ccwrapper').className = _classNames;
            }
        },2e3);

        setTimeout(function(){
            if(document.getElementById('ccleftbtn')){
                document.getElementById('ccleftbtn').className = 'ccactionbtn cctrans ccin-left-btn';
                document.getElementById('ccrightbtn').className = 'ccactionbtn cctrans ccin-right-btn';
            }
        },3e3);
    };

    $scope.parseSession = function(sessObj){
        sessObj.destination = JSON.parse(sessObj.destination);
        sessObj.origin1 = JSON.parse(sessObj.origin1);
        sessObj.origin2 = JSON.parse(sessObj.origin2);
        // parse vote end time
        var voteEndDate = new Date(sessObj.voteEndTime);
        var vtime = voteEndDate.getHours().toString() + ':' + (voteEndDate.getMinutes().toString() == '0' ? voteEndDate.getMinutes().toString() + '0' : voteEndDate.getMinutes().toString());
        var vdate = '('+voteEndDate.getDate().toString() + '/' + (voteEndDate.getMonth() + 1 ).toString() + '/' + voteEndDate.getFullYear().toString()+')';
        sessObj.voteEndTime = vtime + ' today ' + vdate;
        // parse deal start time
        var dealStartTime = new Date(sessObj.dealStartTime);
        var dtime = dealStartTime.getHours().toString() + ':' + (dealStartTime.getMinutes().toString() == '0' ? dealStartTime.getMinutes().toString() + '0' : dealStartTime.getMinutes().toString());
        var ddate = '('+dealStartTime.getDate().toString() + '/' + (voteEndDate.getMonth() + 1 ).toString() + '/' + dealStartTime.getFullYear().toString()+')';
        sessObj.dealStartTime = dtime + ' today ' + ddate;

        return sessObj;
    };

    $scope.getSession = function(){
        $http.get($scope.serverUrl + '/api/getCurrentSession').then(function(res){
            if(res.data && res.data.origin1){
                $scope.session = $scope.parseSession(res.data);
                $scope.init();
            }else{
                $scope.session = null;
                $scope.setSessionStates();
            }
        });
    };


    $scope.handleVoteResult = function(){
        setTimeout(function(){
            $scope.voteRegistered = true;
            $scope.forceApply();

        },500);

        // set cookie
        $cookieStore.put('cc'+$scope.session.id,true);
    };

    $scope.addVote = function(origin){
        var jsonObj = {
            "id" : $scope.session.id,
            "origin" : origin
        };
        $http({
            url: $scope.serverUrl + "/api/addVote?time=" + new Date().getTime(),
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
            $scope.handleVoteResult();
        });

    };
    $scope.getSession();
    $scope.setSessionGetters();
}]);
