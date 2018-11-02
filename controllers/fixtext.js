app.controller('FixText', function() {
	var fix = this;
	fix.transform = function(inputText) {
		console.log(inputText);
		var res = inputText.replace(/ - /g,'-').replace(/ \s*/g,'-').replace(/('|"|’)/g,'').toLowerCase();
		fix.outputText = res;
	}
});