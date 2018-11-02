app.controller('ToolCtrl', function($scope, $timeout, $mdSidenav, $log, $window, $location) {
	
	$scope.curTool = '';

	$scope.switchTool = function(newtool) {
		$scope.curTool = newtool;
		$location.search('tool',newtool);
	}

	// get tool from URL param
	var curView = $location.search();
	$scope.curTool = (curView['tool']? curView['tool']:'emaildia');
	
	
	$scope.reset = function(){
		
	}

});

//http://localhost:3000/#!?test=testing