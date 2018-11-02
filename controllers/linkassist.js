app.controller('LinkAssist', function($sce) {

	var link = this;
	link.form = {}

	link.curView = 'output';
	link.changeView = function(view) {
		link.curView = view;
	}

	
	link.form.wordRawDebug = 'Review the following resource: /l/ http://cs.thomsonreuters.com/email/link.aspx?l=/ua/acct_pr/acs/cs_us_en/kb/transitioning-from-csa-to-acs.htm&u=#usermessageid&y=link--Transitioning From CSA to Accounting CS Services--';



	link.processForm = function() {
		var email = link.form.rawHtml;
		
		output(email); // output email

		linkExpose(email);
		link.form.output = output(email);
	}

	// format email string
	var emailstart = '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd"><html lang="en">';
	var emailend = '</html>';

	function process(str) {

	    var div = document.createElement('html');
	    div.innerHTML = str.trim();

	    var res = format(div, 0).innerHTML;
	    res = emailstart + res + emailend;
	    return res;
	}

	function format(node, level) {
	    var indentBefore = new Array(level++ + 1).join('  '),
	        indentAfter  = new Array(level - 1).join('  '),
	        textNode;


	    for (var i = 0; i < node.children.length; i++) {

	        textNode = document.createTextNode('\n' + indentBefore);
	        node.insertBefore(textNode, node.children[i]);

	        format(node.children[i], level);

	        if (node.lastElementChild == node.children[i]) {
	            textNode = document.createTextNode('\n' + indentAfter);
	            node.appendChild(textNode);
	        }
	    }

	    return node;
	}


	function output(emailParsed) {

		link.form.render = $sce.trustAsHtml(emailParsed);
		return emailParsed;
	}

	// logic for link updating
	function linkExpose(emailParsed) {
		link.linkOutputs = [];
		link.linkAnchors = [];
		
		emailParsed.replace(/href="(.*?)".*?>(.*?)<\/a>/g, (match, href, anchor) => {
			href = href.replace(/\s/g, '');
			link.linkOutputs.push(href);
			link.linkAnchors.push(anchor);
			return match;
		});
	}
	link.updateLink = function($index) {

		var count = 0;
		link.form.output = link.form.output.replace(/href="(.*?)"/g, (match, href) => {
			var res = 'href="'+link.linkOutputs[count]+'"';
			count++;
			return res;
		});
		link.form.render = $sce.trustAsHtml(link.form.output);
	}


		

});