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
    .when("/edit-election/:electionName/ballot/:ballotNumber", {
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
    this.readyPage = function(){
        $scope.candidates = [{name : ""}, {name : ""}];
        if ($routeParams.electionName != null){
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
        $location.path('/edit-election/' + election.nameOfElection + '/' + 'ballot/1');
    }

    this.readyPage();
});

app.controller("BallotController", function($scope, $routeParams, $location, localStorageService){
    var ballotController = this;
    this.readyPage = function(){
        $scope.ballotNumber = $routeParams.ballotNumber;

        //Get the election
        var election = localStorageService.get($routeParams.electionName);
        var boxes = [];
        //Determine whether or not this ballot has been entered yet.
        if (election.ballots.length >= $scope.ballotNumber){
            //Ballot has been entered! Load its details
            var boxes = [];
            for (var i = 0; i < election.candidates.length && i < election.ballots[$scope.ballotNumber - 1].length; i++){
                boxes.push({candidateId: i, candidateName: election.candidates[i], vote: election.ballots[$scope.ballotNumber - 1][i]});
            }
        }

        //Fill in unentered candidates on the ballot paper.
        for(var i = boxes.length; i < election.candidates.length; i++){
            boxes.push({candidateId: i, candidateName: election.candidates[i], vote: null});
        }
        $scope.boxes = boxes;
    };

    $scope.another = function(){
        ballotController.saveBallot();
        
        //Go to next ballot paper
        var nextBallotNumber = parseInt($scope.ballotNumber) + 1;
        $location.path('/edit-election/' + $routeParams.electionName + '/' + 'ballot/' + nextBallotNumber);
    }

    this.saveBallot = function(){
        //Process boxes
        var boxes = [];
        for (var i = 0; i < $scope.boxes.length; i++){
            boxes[i] = $scope.boxes[i].vote;
        }
        //Save storage
        var election = localStorageService.get($routeParams.electionName);
        election.ballots[$scope.ballotNumber - 1] = boxes;
        localStorageService.set($routeParams.electionName, election);
    }

    this.readyPage();
});