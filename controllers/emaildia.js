app.controller('EmailDia', function($sce) {

	var dia = this;
	dia.form = {};
	

	dia.processForm = function() {

		if (dia.form.htmlRaw) {

			let emailParsed = parseLinks(dia.form.htmlRaw);
	
			setDefaultAttrs();

			output(emailParsed);
			linkExpose(emailParsed);

		} else {
			dia.form.output = '';
			dia.form.render = '';
		}

	}

	setDefaultAttrs = function() {
		// Force online version
		dia.form.utm_source = 'mcat-o';

		if (!dia.form.utm_medium | dia.form.utm_medium===null) {
			dia.form.utm_medium = 'email';
		}
	}


	parseLinks = function(email) {
		
		function formatLinks(email) {

			let linkArray = [];

			var email = email.replace(/(<a.*href=")(.*?)"/g, (match, prev, href) => {
				linkArray.push(href)
				return match;
			})

			let formattedLinks = linkArray.map( link => {

				let strippedURL = link.split("?")[0]
	
				const params = (new URL(strippedURL)).searchParams
				
				params.append('utm_campaign', dia.form.utmCampaign)
				params.append('utm_medium', dia.form.utmMedium)
				params.append('utm_source', dia.form.utmSource)
				params.append('utm_content', dia.form.utmContent)
	
				const paramString = params.toString()
	
				return `${strippedURL}?${paramString}`
	
			})

			return formattedLinks

		}

	  const formattedLinks = formatLinks(email)

		var linkCount = -1;

		// Param logic
		var email = email.replace(/(<a.*href=")(.*?)"/g, (match, prev, href) => {
			// console.log(href, formattedLinks[linkCount])
			linkCount++
			console.log(`${prev}${formattedLinks[linkCount]}" `)
			return `${prev}${formattedLinks[linkCount]}" `

		});
		return email;
	};

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


	const output = function(emailParsed) {
		dia.form.output = emailParsed; 
		dia.form.render = $sce.trustAsHtml(emailParsed);
	}

	// logic for link updating
	const linkExpose = function(emailParsed) {
		dia.linkOutputs = [];
		emailParsed.replace(/(<a.*href=")(.*?)"/g, (match, attrs, href) => {
			href = href.replace(/\s/g, '');
			dia.linkOutputs.push(href);
			return match;
		});

	}
	dia.updateLink = function($index) {
		let count = 0;

		// Take email output, replace all links when one link is updated
		dia.form.output = dia.form.output.replace(/(<a.*href=")(.*?)"/g, (match, attrs, link) => {

			// Set with corresponding link in linkoutputs array
			let updatedLink = `${attrs}${dia.linkOutputs[count]}"`

			// get the next link in this current loop
			count++

			return updatedLink
		});

		dia.form.render = $sce.trustAsHtml(dia.form.output);
	}
		

});