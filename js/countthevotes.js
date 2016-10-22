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
    })
    .when("/results/:electionName", {
        controller: 'ResultsController',
        templateUrl: "./templates/results.html"
    })
    .when("/how-this-works", {
        templateUrl: "./templates/howthisworks.html"
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

    $scope.add = function(){
        ballotController.validateBallot($scope.selectedBallot);
        var nextBallotIndex = $scope.ballots.length;
        $scope.ballots[nextBallotIndex] = {ballotNumber: nextBallotIndex + 1, boxes:[]};
        for (var i = 0; i < election.candidates.length; i++){
            $scope.ballots[nextBallotIndex].boxes[i] = {candidateId: i, candidateName: election.candidates[i], vote: null};
        }
        $scope.selectedBallot = $scope.ballots[nextBallotIndex];
        ballotController.saveElection();
    }

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
        for (var number = 1; number <= lastCandidateNumber; number++){
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

    $scope.countTheVotes = function(){
        ballotController.saveElection();
        $location.path('/results/' + $scope.electionName);
    };

    this.readyPage();
});

app.controller("ResultsController", function($scope, $routeParams, localStorageService){
    var resultsController = this;
    this.readyPage = function(){
        //Get the election
        election = localStorageService.get($routeParams.electionName);
        $scope.electionName = election.nameOfElection;

        //Count the votes (in a different thread?)
        $scope.results = resultsController.countTheVotes(election);
    };

    this.countTheVotes = function(election){
        var allBallots = resultsController.getAllBallots(election);
        var formalBallots = resultsController.getFormalBallots(allBallots, election.candidates.length);
        var quota = resultsController.getQuota(formalBallots.length, election.numberOfPositions);

        var result = {quota: quota, electedCandidates: [], counts: []};
        var initialCandidates = resultsController.getInitialCandidates(election.candidates);
        var counts = [resultsController.getInitialCount(initialCandidates, formalBallots, quota)];
        while(counts[counts.length - 1].candidatesInRunning.length > 0 && 
            counts[counts.length - 1].electedCandidates.length < election.numberOfPositions){
            counts.push(resultsController.generateNextCount(counts[counts.length-1], quota));
        }

        return {positions: election.numberOfPositions,
                numberOfBallots: allBallots.length,
                informalBallots: allBallots.length - formalBallots.length,
                formalBallots: formalBallots.length,
                quota: quota,
                counts: counts, 
                electedCandidates: counts[counts.length-1].electedCandidates};
    };

    this.getAllBallots = function(election){
        var ballots = [];
        for(var i = 0; i < election.ballots.length; i++){
            ballots.push({
                boxes: election.ballots[i],
                value: 1.0,
                ballotId: i
            });
        };
        return ballots;
    };

    this.getFormalBallots = function(allBallots, numberOfCandidates){
        var formalBallots = [];

        ballotLoop: for (var i = 0; i < allBallots.length; i++){
            numberLoop: for (var number = 1; number <= numberOfCandidates; number++){
                boxLoop: for (var j = 0; j < allBallots[i].boxes.length; j++){
                    if (allBallots[i].boxes[j] == number){
                        continue numberLoop; //found this number, try for the next
                    }
                }
                //Didn't find a number, informal ballot
                continue ballotLoop;
            }
            //Found all numbers, formal
            formalBallots.push(allBallots[i]);
        }
        return formalBallots;
    };

    this.getQuota = function(numberOfFormalBallots, numberOfPositions){
        var beforeRounding = ((numberOfFormalBallots)/(numberOfPositions + 1) + 1);
        var quota = Math.floor(beforeRounding);
        return quota;
    };

    this.getInitialCandidates = function(candidates){
        var initialCandidates = [];
        for (var i = 0; i < candidates.length; i++){
            initialCandidates.push({
                id: i,
                name: candidates[i],
                ballots: []
            });
        }
        return initialCandidates;
    };

    this.getInitialCount = function(candidates, formalBallots, quota){
        var count = {candidatesInRunning: [], electedCandidates: [], excludedCandidates: [], description: 'Initial Count'};
        var candidatesWithBallots = angular.copy(candidates);
        //Assign first votes to candidates
        for (var i = 0; i < formalBallots.length; i++){
            for(var j = 0; j < formalBallots[i].boxes.length; j++){
                if (formalBallots[i].boxes[j] == 1){
                    candidatesWithBallots[j].ballots.push(formalBallots[i]);
                    break;
                }
            }
        }
        //Calculate total votes and sort
        resultsController.calculateCandidateVotesAndSort(candidatesWithBallots);
        resultsController.calculateCandidatePercentageOfQuota(candidatesWithBallots, quota);
        count.candidatesInRunning = candidatesWithBallots;

        return count;
    };

    this.generateNextCount = function(previousCount, quota){
        //Start with the previous count
        var count = angular.copy(previousCount);
        //Does the top candidate have a quota?
        if (count.candidatesInRunning[0].voteValue >= quota){
            //Someone is elected!
            var electedCandidate = count.candidatesInRunning[0];
            count.candidatesInRunning.splice(0,1);
            var surplus = electedCandidate.voteValue - quota;

            var surplusBallots = electedCandidate.ballots;
            electedCandidate.ballots = [];
            count.electedCandidates.push(electedCandidate);

            count.description = "Elected " + electedCandidate.name + " and distributed " + surplusBallots.length + " ballots.";

            //Reduce ballot values
            resultsController.updateBallotValues(surplusBallots, surplus);

            //Distribute surplus ballots
            resultsController.distributeBallots(surplusBallots, count.candidatesInRunning);
            resultsController.calculateCandidatePercentageOfQuota(count.candidatesInRunning, quota);

            return count;
        }

        //Exclude the bottom candidate
        var excludedCandidate = count.candidatesInRunning.pop();
        var excludedCandidateBallots = excludedCandidate.ballots;
        excludedCandidate.ballots = [];
        count.excludedCandidates.push(excludedCandidate);

        count.description = "Excluded " + excludedCandidate.name + " and distributed " + excludedCandidateBallots.length + " ballots.";

        //Distribute surplus ballots
        resultsController.distributeBallots(excludedCandidateBallots, count.candidatesInRunning);
        resultsController.calculateCandidatePercentageOfQuota(count.candidatesInRunning, quota);
        return count;
    };

    this.updateBallotValues = function(ballotsElectingCandidate, surplus){
        //Using the (unweighted) inclusive gregory method
        var transferValue = surplus / (ballotsElectingCandidate.length + 0.0);
        for (var i = 0; i < ballotsElectingCandidate.length; i++){
            ballotsElectingCandidate[i].value = transferValue;
        }
    };

    this.distributeBallots = function(ballots, candidates){
        ballotLoop: for (var i = 0; i < ballots.length; i++){
            numberLoop: for (var number = 1; number <= ballots[i].boxes.length; number++){
                boxLoop: for (var j = 0; j < ballots[i].boxes.length; j++){
                    if (ballots[i].boxes[j] == number){
                        candidateLoop: for (var k = 0; k < candidates.length; k++){
                            if (j == candidates[k].id){
                                //Found the candidate this ballot is for.
                                candidates[k].ballots.push(ballots[i]);
                                continue ballotLoop;
                            }
                            
                        }
                    }
                }
            }
        }

        resultsController.calculateCandidateVotesAndSort(candidates);
    };

    this.calculateCandidateVotesAndSort = function(candidates){
        for (var i = 0; i < candidates.length; i++){
            candidates[i].voteValue = 0.0;
            for(var j = 0; j < candidates[i].ballots.length; j++){
                candidates[i].voteValue += candidates[i].ballots[j].value;
            }
        }
        candidates.sort(function(a, b){
            if (a.voteValue > b.voteValue) return -1;
            if (b.voteValue < a.voteValue) return 1;
            return 0;
        });
    };

    this.calculateCandidatePercentageOfQuota = function(candidates, quota){
        for (var i = 0; i < candidates.length; i++){
            candidates[i].percentOfQuota = (candidates[i].voteValue / quota) * 100;
        }
    };

    this.readyPage();
});