var app = angular.module("countTheVotes", ["ngRoute", "LocalStorageModule"]);
app.config(function ($routeProvider){
    $routeProvider.when("/",{
        controller: 'HomeController',
        templateUrl: "./templates/elections.html"
    }).when("/add-election", {
        controller: 'AddEditElectionController',
        templateUrl: "./templates/add-edit-election.html"
    })
    .when("/edit-election/:electionName", {
        controller: 'AddEditElectionController',
        templateUrl:"./templates/add-edit-election.html"
    })
    .when("/edit-election/:electionName/ballots", {
        controller: 'BallotController',
        templateUrl:"./templates/ballot.html"
    });
});
app.config(function(localStorageServiceProvider){
    localStorageServiceProvider
        .setPrefix('club.countTheVotes');
});

app.controller('HomeController', function($scope, localStorageService){
    $scope.elections = localStorageService.keys();

    $scope.deleteElection = function(electionName){
        bootbox.confirm("Delete this election?", function(result){
            if (!result) return;
            localStorageService.remove(electionName);
            $scope.elections = localStorageService.keys();
            $scope.$apply();
        });
    };
});

app.controller('AddEditElectionController', function($scope, $routeParams, $location, localStorageService){ 
    $scope.pageTitle = "New Election";
    $scope.electionNameEditable = true;
    this.readyPage = function(){
        $scope.candidates = [{name : ""}, {name : ""}];
        if ($routeParams.electionName != null){
            $scope.pageTitle = $routeParams.electionName;
            $scope.electionNameEditable = false;
            //Fetch from local storage
            var election = localStorageService.get($routeParams.electionName);
            $scope.electionName = election.nameOfElection;
            $scope.numberOfPositions = election.numberOfPositions;
            var candidates = [];
            for(var i = 0; i < election.candidates.length; i++){
                candidates.push({name: election.candidates[i]});
            }
            
            for (var i = 0; i < 2; i++){
                candidates.push({name: ""}); //always want two blank candidates at the end.
            }
            $scope.candidates = candidates;
        }
    };

    $scope.processCandidates = function(){
        var foundOne = false;
        for (var i = 0; i < $scope.candidates.length; i++){
            if ($scope.candidates[i].name == null || $scope.candidates[i].name.length == 0){
                if (foundOne)
                    return
                foundOne = true;
            }
        }
        $scope.candidates.push({name : ""})
    };

    $scope.addElection = function(){
        //Get valid candidates and assign IDs
        var id = 0;
        var candidates = [];
        for (var i = 0; i < $scope.candidates.length; i++){
            if ($scope.candidates[i].name != null && $scope.candidates[i].name.length != 0){
                candidates[id] = $scope.candidates[i].name;
                id++;
            }
        }

        //Does this election already exist?
        var election = localStorageService.get($scope.electionName);
        var ballots = election == null ? [] : election.ballots;

        //Make an election and save it to local storage.
        election = {
            version: "1.0",
            nameOfElection: $scope.electionName,
            numberOfPositions: $scope.numberOfPositions,
            candidates: candidates,
            ballots: ballots
        };
        localStorageService.set(election.nameOfElection, election);

        //Navigate to first ballot.
        $location.path('/edit-election/' + election.nameOfElection + '/' + 'ballots');
    }

    this.readyPage();
});

app.controller("BallotController", function($scope, $routeParams, $location, localStorageService){
    var ballotController = this;
    var election = {};
    this.readyPage = function(){
        //Get the election
        election = localStorageService.get($routeParams.electionName);
        $scope.election = election;
        $scope.electionName = election.nameOfElection;

        //Get a list of processed ballots
        var ballots = [];
        for (var i = 0; i < election.ballots.length; i++){
            ballots[i] = {ballotNumber: i+1, boxes: []};
            for (var j = 0; j < election.candidates.length; j++){
                ballots[i].boxes[j] = {candidateId: j, candidateName: election.candidates[j], vote: null};
                if (election.ballots[i].length > j){
                    ballots[i].boxes[j].vote = election.ballots[i][j];
                }
            }
        }
        if (ballots.length == 0){
            ballots.push({ballotNumber: 1, boxes:[]});
            for (var j = 0; j < election.candidates.length; j++){
                ballots[0].boxes[j] = {candidateId: j, candidateName: election.candidates[j], vote: null};
            }
        }
        $scope.ballots = ballots;
        $scope.selectedBallot = $scope.ballots[0];
        ballotController.validateAllBallots();
    };

    $scope.selectBallot = function(ballot){
        ballotController.validateBallot($scope.selectedBallot);
        $scope.selectedBallot = ballot;
        ballotController.saveElection();
    };

    $scope.nextBallot = function(){
        ballotController.validateBallot($scope.selectedBallot);
        var i = $scope.ballots.indexOf($scope.selectedBallot);
        if ($scope.ballots.length == i+1){
            $scope.ballots[i+1] = {ballotNumber: i+2, boxes:[]};
            for (var j = 0; j < election.candidates.length; j++){
                $scope.ballots[i+1].boxes[j] = {candidateId: j, candidateName: election.candidates[j], vote: null};
            }
        }
        $scope.selectedBallot = $scope.ballots[i+1];
        ballotController.saveElection();
    };

    $scope.removeBallot = function(ballot){
        var i = $scope.ballots.indexOf(ballot);
        $scope.ballots.splice(i, 1);
        if ($scope.ballots.length == 0){
            $scope.ballots.push({ballotNumber: 1, boxes:[]});
            for (var j = 0; j < election.candidates.length; j++){
                $scope.ballots[0].boxes[j] = {candidateId: j, candidateName: election.candidates[j], vote: null};
            }
        }
        $scope.selectedBallot = $scope.ballots[0];
        ballotController.saveElection();
    };

    this.saveElection = function(){
        //Process ballots
        var ballots = [];
        for (var i = 0; i < $scope.ballots.length; i++){
            ballots[i] = [];
            for (var j = 0; j < $scope.ballots[i].boxes.length; j++){
                ballots[i][j] = $scope.ballots[i].boxes[j].vote;
            }
        }
        //Save storage
        election.ballots = ballots;
        localStorageService.set($routeParams.electionName, election);
    };

    this.validateAllBallots = function(){
        for (var i = 0; i < $scope.ballots.length; i++){
            ballotController.validateBallot($scope.ballots[i]);
        }
    };

    //Update the 'formal' and 'errorMessage' properties on a ballot.
    this.validateBallot = function(ballot){
        if (ballot == null)
            return;
        var lastCandidateNumber = election.candidates.length;
        for (var number = 1; number < lastCandidateNumber; number++){
            var foundNumber = false;
            for (var i = 0; i < ballot.boxes.length; i++){
                if (ballot.boxes[i].vote == number){
                    foundNumber = true;
                    break;
                }
            }
            if (!foundNumber){
                ballot.formal = false;
                ballot.errorMessage = "Missing the number " + number;
                return;
            }
        }
        ballot.formal = true;
        ballot.errorMessage = null;
    };

    this.readyPage();
});