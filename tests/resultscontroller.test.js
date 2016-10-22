describe('result', function(){
    beforeEach(module('countTheVotes'));

    var $controller;
    var controller;
    var mockLocalStorageService;

    beforeEach(inject(function(_$controller_, localStorageService){
        $controller = _$controller_;
        mockLocalStorageService = localStorageService;
        mockLocalStorageService.get = function(electionName){
            return {
                "nameOfElection":"asdf",
                "candidates":[],
                "ballots":[]
            };
        };
        var $scope = {};
        controller = $controller('ResultsController', {$scope: $scope, localStorageService: mockLocalStorageService});
    }));

    describe('formalBallotsTest', function(){
        it('formal ballot should be correctly identified from a set of ballots', function(){
            var ballots = [
                {boxes: [1, 2, 3, 4, 5],
                value: 1.0,
                ballotId: 0},
                {boxes: [1, 2, 3, 4, null],
                value: 1.0,
                ballotId: 1},
                {boxes: [0, 1, 2, 3, 4],
                value: 1.0,
                ballotId: 2},
                {boxes: [1, 2, 2, 3, 4],
                value: 1.0,
                ballotId: 3},
                {boxes: [3, 2, 1, 5, 4],
                value: 1.0,
                ballotId: 4}
            ];
            var formalVotes = controller.getFormalBallots(ballots, 5);
            expect(formalVotes.length).toBe(2);
            expect(formalVotes[0]).toBe(ballots[0]);
            expect(formalVotes[1]).toBe(ballots[4]);
        });
    });

    describe('quotaTest', function(){
        it('quota should be 34 when there are 100 formal votes and 2 seats to be filled', function(){
            var quota = controller.getQuota(100, 2);
            expect(quota).toBe(34);
        });
        
        it('quota should be 80001 when there are 400,000 formal votes and 4 seats to be filled', function(){
            var quota = controller.getQuota(400000, 4);
            expect(quota).toBe(80001);
        });
    });

    describe('initialCandidatesTest', function(){
        it('initial candidates should be setup correctly', function(){
            var candidates = ["a", "b", "c"];
            var initialCandidates = controller.getInitialCandidates(candidates);
            expect(initialCandidates.length).toBe(3);
            expect(initialCandidates[0].id).toBe(0);
            expect(initialCandidates[1].id).toBe(1);
            expect(initialCandidates[2].id).toBe(2);
        });
    });

    describe('initialCountTest', function(){
        it('initial count should have candidates sorted correctly', function(){
            var candidates = ["a", "b", "c"];
            var formalBallots = [
                {boxes: [3, 2, 1],
                value: 1.0,
                ballotId: 0},
                {boxes: [2, 3, 1],
                value: 1.0,
                ballotId: 1},
                {boxes: [3, 2, 1],
                value: 1.0,
                ballotId: 2},
                {boxes: [2, 1, 3],
                value: 1.0,
                ballotId: 3},
                {boxes: [3, 1, 2],
                value: 1.0,
                ballotId: 4},
                {boxes: [1, 2, 3],
                value: 1.0,
                ballotId: 5}
            ];

            var initialCandidates = controller.getInitialCandidates(candidates);
            var initialCount = controller.getInitialCount(initialCandidates, formalBallots, 2);
            expect(initialCount.excludedCandidates.length).toBe(0);
            expect(initialCount.electedCandidates.length).toBe(0);
            expect(initialCount.candidatesInRunning.length).toBe(3);

            expect(initialCount.candidatesInRunning[0].name).toBe("c");
            expect(initialCount.candidatesInRunning[0].voteValue).toBe(3.0);

            expect(initialCount.candidatesInRunning[1].name).toBe("b");
            expect(initialCount.candidatesInRunning[1].voteValue).toBe(2.0);

            expect(initialCount.candidatesInRunning[2].name).toBe("a");
            expect(initialCount.candidatesInRunning[2].voteValue).toBe(1.0);
        });
    });
    
    describe('updateBallotValuesTest', function(){
        it('ballot values should update correctly when ballot values are 1', function(){
            var ballotsElectingCandidate = [
                {value: 1.0},
                {value: 1.0},
                {value: 1.0},
                {value: 1.0},
                {value: 1.0}
            ];
            //5 ballots, 1 surplus vote, each ballot should reduce to 1/5 of its value.
            controller.updateBallotValues(ballotsElectingCandidate, 1);

            expect(ballotsElectingCandidate[0].value).toBe(0.2);
            expect(ballotsElectingCandidate[1].value).toBe(0.2);
            expect(ballotsElectingCandidate[2].value).toBe(0.2);
            expect(ballotsElectingCandidate[3].value).toBe(0.2);
            expect(ballotsElectingCandidate[4].value).toBe(0.2);
        });

        it('ballot values should update correctly when ballot values are 0.5', function(){
            var ballotsElectingCandidate = [
                {value: 0.5},
                {value: 0.5},
                {value: 0.5},
                {value: 0.5},
                {value: 0.5}
            ];
            //5 ballots, 1 surplus vote, each ballot should reduce to 1/5
            controller.updateBallotValues(ballotsElectingCandidate, 1);

            expect(ballotsElectingCandidate[0].value).toBe(0.2);
            expect(ballotsElectingCandidate[1].value).toBe(0.2);
            expect(ballotsElectingCandidate[2].value).toBe(0.2);
            expect(ballotsElectingCandidate[3].value).toBe(0.2);
            expect(ballotsElectingCandidate[4].value).toBe(0.2);
        });

        it('ballot values should update correctly when ballot values vary', function(){
            var ballotsElectingCandidate = [
                {value: 0.1},
                {value: 0.2},
                {value: 0.5},
                {value: 0.8},
                {value: 1.0}
            ];
            //5 ballots, 1 surplus vote, each ballot should reduce to 1/5
            controller.updateBallotValues(ballotsElectingCandidate, 1);

            expect(+ballotsElectingCandidate[0].value.toFixed(2)).toBe(0.2);
            expect(+ballotsElectingCandidate[1].value.toFixed(2)).toBe(0.2);
            expect(+ballotsElectingCandidate[2].value.toFixed(2)).toBe(0.2);
            expect(+ballotsElectingCandidate[3].value.toFixed(2)).toBe(0.2);
            expect(+ballotsElectingCandidate[4].value.toFixed(2)).toBe(0.2);
        });

        it('ballot values should update correctly when surplus is a decimal', function(){
            var ballotsElectingCandidate = [
                {value: 0.1},
                {value: 0.2},
                {value: 0.5},
                {value: 0.8},
                {value: 1.0}
            ];

            //5 ballots, 1.7 surplus vote, each ballot should reduce to .34
            controller.updateBallotValues(ballotsElectingCandidate, 1.7);

            expect(+ballotsElectingCandidate[0].value.toFixed(4)).toBe(0.34);
            expect(+ballotsElectingCandidate[1].value.toFixed(4)).toBe(0.34);
            expect(+ballotsElectingCandidate[2].value.toFixed(4)).toBe(0.34);
            expect(+ballotsElectingCandidate[3].value.toFixed(4)).toBe(0.34);
            expect(+ballotsElectingCandidate[4].value.toFixed(4)).toBe(0.34);
        });
    });

    describe('distributeBallotsTest', function(){
        it('ballots should be distributed to correct candidates', function(){
            var candidates = [
                {
                    id: 3,
                    name: 'sam',
                    ballots: [{boxes: [3, 4, 2, 1], ballotId: 1, value: 1.0},
                              {boxes: [3, 4, 2, 1], ballotId: 2, value: 1.0}]
                },
                {
                    id: 2,
                    name: 'sally',
                    ballots: [{boxes: [4, 2, 1, 3], ballotId: 3, value: 1.0}]
                },
                {
                    id: 0,
                    name: 'jenny',
                    ballots: [{boxes: [1, 2, 3, 4], ballotId: 4, value: 1.0}]
                }
            ];

            var ballotsToDistribute = [
                {
                    boxes: [2, 1, 3, 4],
                    ballotId: 5,
                    value: 1.0
                },
                {
                    boxes: [3, 1, 2, 4],
                    ballotId: 6,
                    value: 1.0
                },
                {
                    boxes: [4, 1, 3, 2],
                    ballotId: 7,
                    value: 1.0
                },
                {
                    boxes: [2, 1, 4, 3],
                    ballotId: 8,
                    value: 0.9
                }
            ];

            controller.distributeBallots(ballotsToDistribute, candidates);

            expect(candidates[0].id).toBe(3);
            expect(candidates[0].ballots.length).toBe(3);
            expect(candidates[0].ballots[2].ballotId).toBe(7);

            expect(candidates[1].id).toBe(0);
            expect(candidates[1].ballots.length).toBe(3);
            expect(candidates[1].ballots[1].ballotId).toBe(5);
            expect(candidates[1].ballots[2].ballotId).toBe(8);

            expect(candidates[2].id).toBe(2);
            expect(candidates[2].ballots.length).toBe(2);
            expect(candidates[2].ballots[1].ballotId).toBe(6);
        });
    });

    describe('calculateCandidateVotesAndSortTest', function(){
        it('candidate votes should be calculated correctly and candidates should be sorted', function(){
            var candidates = [
                {
                    id: 3,
                    name: 'sam',
                    ballots: [{value: 0.8},
                              {value: 0.5}]
                },
                {
                    id: 2,
                    name: 'sally',
                    ballots: [{value: 1.0},
                              {value: 0.1},
                              {value: 0.1},
                              {value: 0.1},
                              {value: 0.1}]
                },
                {
                    id: 0,
                    name: 'jenny',
                    ballots: [{value: 0.7},
                              {value: 0.7},
                              {value: 0.7}]
                }
            ];

            controller.calculateCandidateVotesAndSort(candidates);

            expect(candidates[0].id).toBe(0);
            expect(+candidates[0].voteValue.toFixed(2)).toBe(2.1);

            expect(candidates[1].id).toBe(2);
            expect(+candidates[1].voteValue.toFixed(2)).toBe(1.4);

            expect(candidates[2].id).toBe(3);
            expect(+candidates[2].voteValue.toFixed(2)).toBe(1.3);
        });
    });

    describe('generateNextCountTest', function(){
        it('candidate above quota gets elected and votes get distributed', function(){
            var previousCount = {
                candidatesInRunning: [
                {
                    id: 3,
                    name: 'sam',
                    ballots: [{boxes: [3, 4, 2, 1], ballotId: 1, value: 1.0},
                              {boxes: [3, 4, 2, 1], ballotId: 2, value: 1.0},
                              {boxes: [4, 2, 3, 1], ballotId: 5, value: 1.0},
                              {boxes: [2, 3, 4, 1], ballotId: 6, value: 1.0},
                              {boxes: [2, 4, 3, 1], ballotId: 12, value: 1.0}],
                    voteValue: 5.0
                },
                {
                    id: 2,
                    name: 'sally',
                    ballots: [{boxes: [4, 2, 1, 3], ballotId: 3, value: 1.0},
                              {boxes: [4, 2, 1, 3], ballotId: 8, value: 1.0},
                              {boxes: [4, 2, 1, 3], ballotId: 9, value: 1.0}],
                    voteValue: 3.0
                },
                {
                    id: 0,
                    name: 'jenny',
                    ballots: [{boxes: [1, 2, 3, 4], ballotId: 4, value: 1.0},
                              {boxes: [1, 2, 4, 3], ballotId: 10, value: 1.0}],
                    voteValue: 2.0
                },
                {
                    id: 1,
                    name: 'fred',
                    ballots: [{boxes: [2, 1, 3, 4], ballotId: 11, value: 1.0}],
                    voteValue: 1.0
                }
                ],
                electedCandidates: [],
                excludedCandidates: [],
                description: 'Initial Count'
            };

            var nextCount = controller.generateNextCount(previousCount, 4.0);

            //Previous count should be unaffected
            expect(previousCount.candidatesInRunning.length).toBe(4);
            expect(previousCount.candidatesInRunning[0].ballots.length).toBe(5);
            expect(previousCount.electedCandidates.length).toBe(0);
            expect(previousCount.excludedCandidates.length).toBe(0);
            expect(previousCount.description).toBe('Initial Count');

            //Next count should have correct values
            expect(nextCount.candidatesInRunning.length).toBe(3);
            expect(nextCount.electedCandidates.length).toBe(1);
            expect(nextCount.excludedCandidates.length).toBe(0);
            expect(nextCount.description).toBe('Elected sam and distributed 5 ballots.');

            expect(nextCount.electedCandidates[0].id).toBe(3);
            expect(nextCount.electedCandidates[0].ballots.length).toBe(0);

            expect(nextCount.candidatesInRunning[0].id).toBe(2);
            expect(nextCount.candidatesInRunning[0].ballots.length).toBe(5);
            expect(+nextCount.candidatesInRunning[0].voteValue.toFixed(2)).toBe(3.4);

            expect(nextCount.candidatesInRunning[1].id).toBe(0);
            expect(nextCount.candidatesInRunning[1].ballots.length).toBe(4);
            expect(+nextCount.candidatesInRunning[1].voteValue.toFixed(2)).toBe(2.4);

            expect(nextCount.candidatesInRunning[2].id).toBe(1);
            expect(nextCount.candidatesInRunning[2].ballots.length).toBe(2);
            expect(+nextCount.candidatesInRunning[2].voteValue.toFixed(2)).toBe(1.2);
        });

        it('bottom candidate gets excluded and votes get distributed', function(){
            var previousCount = {
                candidatesInRunning: [
                {
                    id: 3,
                    name: 'sam',
                    ballots: [{boxes: [3, 4, 2, 1], ballotId: 1, value: 1.0},
                              {boxes: [3, 4, 2, 1], ballotId: 2, value: 1.0},
                              {boxes: [4, 2, 3, 1], ballotId: 5, value: 1.0}],
                    voteValue: 3.0
                },
                {
                    id: 2,
                    name: 'sally',
                    ballots: [{boxes: [4, 2, 1, 3], ballotId: 3, value: 1.0},
                              {boxes: [4, 2, 1, 3], ballotId: 8, value: 1.0},
                              {boxes: [4, 2, 1, 3], ballotId: 9, value: 1.0}],
                    voteValue: 3.0
                },
                {
                    id: 0,
                    name: 'jenny',
                    ballots: [{boxes: [1, 2, 3, 4], ballotId: 4, value: 1.0},
                              {boxes: [1, 2, 4, 3], ballotId: 10, value: 1.0}],
                    voteValue: 2.0
                },
                {
                    id: 1,
                    name: 'fred',
                    ballots: [{boxes: [2, 1, 3, 4], ballotId: 11, value: 1.0}],
                    voteValue: 1.0
                }
                ],
                electedCandidates: [],
                excludedCandidates: [],
                description: 'Initial Count'
            };

            var nextCount = controller.generateNextCount(previousCount, 4.0);

            //Previous count should be unaffected
            expect(previousCount.candidatesInRunning.length).toBe(4);
            expect(previousCount.candidatesInRunning[3].ballots.length).toBe(1);
            expect(previousCount.electedCandidates.length).toBe(0);
            expect(previousCount.excludedCandidates.length).toBe(0);
            expect(previousCount.description).toBe('Initial Count');

            //Next count should have correct values
            expect(nextCount.candidatesInRunning.length).toBe(3);
            expect(nextCount.electedCandidates.length).toBe(0);
            expect(nextCount.excludedCandidates.length).toBe(1);
            expect(nextCount.description).toBe('Excluded fred and distributed 1 ballots.');

            expect(nextCount.excludedCandidates[0].id).toBe(1);
            expect(nextCount.excludedCandidates[0].ballots.length).toBe(0);

            expect(nextCount.candidatesInRunning[0].id).toBe(3);
            expect(nextCount.candidatesInRunning[0].ballots.length).toBe(3);
            expect(+nextCount.candidatesInRunning[0].voteValue.toFixed(2)).toBe(3.0);

            expect(nextCount.candidatesInRunning[1].id).toBe(2);
            expect(nextCount.candidatesInRunning[1].ballots.length).toBe(3);
            expect(+nextCount.candidatesInRunning[1].voteValue.toFixed(2)).toBe(3.0);

            expect(nextCount.candidatesInRunning[2].id).toBe(0);
            expect(nextCount.candidatesInRunning[2].ballots.length).toBe(3);
            expect(+nextCount.candidatesInRunning[2].voteValue.toFixed(2)).toBe(3.0);
        });
    });

    describe('countTheVotesTest', function(){
        it('correct candidates get elected in simple election', function(){
            var election = {
                nameOfElection: "test",
                numberOfPositions: 2,
                candidates: ["jenny", "fred", "sally", "sam"],
                ballots: [
                    [null, null, null, 1],
                    [3, 4, 2, 1],
                    [3, 4, 2, 1],
                    [4, 2, 1, 3],
                    [1, 2, 3, 4],
                    [3, 2, 4, 1], //the critical vote: swapping the 3 and the 4 should change the result!
                    [2, 3, 4, 1],
                    [1, 1, 2, 3],
                    [4, 2, 1, 3],
                    [4, 2, 1, 3],
                    [1, 2, 4, 3],
                    [2, 1, 3, 4],
                    [2, 4, 3, 1],
                    [0, 1, 2, 3]
                ]
            };

            var result = controller.countTheVotes(election);
            
            expect(result.quota).toBe(4.0);
            expect(result.electedCandidates.length).toBe(2);
            expect(result.electedCandidates[0].name).toBe('sam');
            expect(result.electedCandidates[1].name).toBe('jenny');

            expect(result.counts[0].description).toBe('Initial Count');

            expect(result.counts[1].description).toBe('Elected sam and distributed 5 ballots.');
            expect(result.counts[1].candidatesInRunning[0].name).toBe('sally');
            expect(+result.counts[1].candidatesInRunning[0].voteValue.toFixed(2)).toBe(3.4);
            expect(result.counts[1].candidatesInRunning[1].name).toBe('jenny');
            expect(+result.counts[1].candidatesInRunning[1].voteValue.toFixed(2)).toBe(2.4);

            expect(result.counts[2].description).toBe('Excluded fred and distributed 2 ballots.');
            expect(result.counts[2].candidatesInRunning[0].name).toBe('jenny');
            expect(+result.counts[2].candidatesInRunning[0].voteValue.toFixed(2)).toBe(3.6);
            expect(result.counts[2].candidatesInRunning[1].name).toBe('sally');
            expect(+result.counts[2].candidatesInRunning[1].voteValue.toFixed(2)).toBe(3.4);

            expect(result.counts[3].description).toBe('Excluded sally and distributed 5 ballots.');
            expect(result.counts[3].electedCandidates.length).toBe(1);
            expect(result.counts[3].excludedCandidates.length).toBe(2);

            expect(result.counts[4].description).toBe('Elected jenny and distributed 11 ballots.');
            expect(result.counts[4].candidatesInRunning.length).toBe(0);
            expect(result.counts[4].electedCandidates.length).toBe(2);
            expect(result.counts[4].excludedCandidates.length).toBe(2);
        });
    });
});