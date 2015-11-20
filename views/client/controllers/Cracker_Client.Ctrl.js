/**
 * Created by kells4 on 10/11/2015.
 */
app.controller('CrackerClientCtrl',['$scope','$http','$cookieStore',function($scope,$http,$cookieStore){

    $scope.righthovereffect = false;
    $scope.lefthovereffect = false;

    $scope.sessionEnded = false;
    $scope.noSession = false;
    $scope.voteRegistered = false;
    $scope.displayWinner = false;

    $scope.displayCrackerEnd = false;

    $scope.displayJoke = false;
    $scope.confetti = [];

    $scope.session = null;

    $scope.setSessionStates = function(){

        if($scope.session){
            //$scope.session.live = false;
            if(!$scope.session.live){
                $scope.sessionEnded = true;
                $scope.noSession = false;
                $scope.voteRegistered = false;
            }else{
                $scope.sessionEnded = false;
            }
        } else {
            $scope.noSession = true;
        }
    };

    $scope.showJoke = function(){
        setTimeout(function(){
            $scope.displayJoke = true;
            $scope.displayWinner = true;
            if(!$scope.$$phase) {
                $scope.$apply();
            }
        },500);
    };

    var ccinterval = 0;

    $scope.init = function(){
        // set session state
        $scope.setSessionStates();
        // set cracker open if session has ended
        if($scope.sessionEnded){
           $scope.displayOpening();
           $scope.startTuggingEffect();
        } else {
            // check cookie
            var cookie = $scope.session ? $cookieStore.get('cc'+$scope.session.id) : null;
            if(cookie){
                $scope.voteRegistered = true;
            }else{

                // set interval for updates
                if(ccinterval === 0){
                    ccinterval = setInterval($scope.getSession,30000);
                }
            }
            // start dial animation
            $scope.randomnlyMoveVotingDial();

        }
    };

    $scope.calculateVotes = function(){

    };

    $scope.randomnlyMoveVotingDial = function(){
        var int = 0;
        var length = 20;

        function randomnlyMoveDial(){
            var min = 40;
            var max = -40;
            var num = Math.floor(Math.random() * (max - min + 1)) + min;
            console.log(num);
            document.getElementById('cc-divider').style.transform = 'rotate('+ num +'deg)';
        }

        var interval = setInterval(function(){
            if(int < length){
                randomnlyMoveDial();
                int++;
            }else{
                document.getElementById('cc-divider').style.transform = 'rotate(0deg)';
                $scope.calculateVotes();
                clearInterval(interval);
            }
        },400);
    };

    $scope.displayOpening = function(){
        setTimeout(function(){
            $scope.displayCrackerEnd = true;
            $scope.showJoke();
            if(!$scope.$$phase) {
                $scope.$apply();
            }
        },3000);
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
        $scope.addVote(direction === 'left' ? 'origin1' : 'origin2')
    };

    $scope.resetCracker = function(){
        setTimeout(function(){
            document.getElementById('ccmainwrapper').style.marginLeft = '0';
        },200);
    };

    $scope.startTransitions = function(){

        setTimeout(function(){
            document.getElementById('ccwrapper').className = !$scope.voteRegistered ? 'cctrans ccCenterCracker' : 'cctrans ccin';

            //setTimeout($scope.startTuggingEffect,2000);

        },2000);

        setTimeout(function(){
            document.getElementById('ccleftbtn').className = 'ccactionbtn cctrans ccin-left-btn';
            document.getElementById('ccrightbtn').className = 'ccactionbtn cctrans ccin-right-btn';
        },3000);
    };

    $scope.parseSession = function(sessObj){
        sessObj.destination = JSON.parse(sessObj.destination);
        sessObj.origin1 = JSON.parse(sessObj.origin1);
        sessObj.origin2 = JSON.parse(sessObj.origin2);
        return sessObj;
    };

    $scope.getSession = function(){
        $http.get('https://localhost/api/getCurrentSession').then(function(res){
            if(res.data && res.data.origin1){
                $scope.session = $scope.parseSession(res.data);
                $scope.init();
            }else{
                $scope.setSessionStates();
            }
        });
    };


    $scope.handleVoteResult = function(){
        setTimeout(function(){
            $scope.voteRegistered = true;
            if(!$scope.$$phase) {
                $scope.$apply();
            }
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
            url: "https://localhost/api/addVote?time=" + new Date().getTime(),
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
            return res.data;
        });

    };

    $scope.getSession();
}]);
