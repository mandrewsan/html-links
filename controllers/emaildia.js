app.controller('EmailDia', function($sce) {

	var dia = this;
	dia.form = {};
	

	dia.processForm = function() {

		if (dia.form.htmlRaw) {

			setDefaultAttrs(); // set default attrs
			let emailParsed = parseLinks(dia.form.htmlRaw);

			const rxFooter = /CS FOOTER[\s\S]*END CS FOOTER/;
			let currentFooter = rxFooter.exec(emailParsed);

			// Remove online link
			emailParsed = emailParsed.replace(/<a.*Read this email online[\s\S]*?<br>[\s\S]*?<br>/g,"").replace(/This message was delivered to[\s\S]*?<br>[\s\S]*?<br>/g,"");
	
			output(emailParsed); // output email
			linkExpose(emailParsed);

		} else {
			dia.form.output = '';
			dia.form.render = '';
		}

	}

	parseWordRaw = function() {

		if (dia.form.wordRaw) {

			// Remove odd characters
			dia.form.word = dia.form.wordRaw.replace(/\/br/g, '<br>').replace(/’/g,"'").replace(/—/g,"&mdash;").replace(/“/g,'&quot;').replace(/”/g,'"').replace(/ & /g," &amp; ").replace(/®/g,"<sup>&reg;</sup>").replace(/©/g,"<sup>&copy;</sup>").replace(/®/g,"<sup>&reg;</sup>").replace(/™/g,"<sup>&trade;</sup>");

			// Create array for disabled inputs
			dia.form.disabled = [];

			// create regex criteria
			var regExp = {
			  'tlnumber': /(tl\d{5}|ta\d{6})/gi,
			  'utm_campaign': /tracking:(.*)/gi,
			  'utm_medium': /medium:(.*)/gi,
			  'body': /[\s\S]*?\/\/\/body([\s\S]*)/gi
			}

			// Loop through regExp object, find matches in body
			for (var key in regExp) {
				var match = regExp[key].exec(dia.form.word);
				if (match!==null) {
					dia.form[key] = match[1];
					dia.form.disabled.push(key);
				} else if (key==='body') {
					// special treatment for body
					dia.form.body = dia.form.word;
				}
			}

			// get selectors, disable those supplied
			var inputs = document.getElementsByClassName('ow-input');

			for (var i=0;i<inputs.length;i++) {
				if (dia.form.disabled.indexOf(inputs[i]['id'])>-1) {
					inputs[i].disabled = true;
				} else {
					inputs[i].disabled = false;
				}
			}

		}
	
	}

	setDefaultAttrs = function() {
		// Force online version
		dia.form.utm_source = 'mcat-o';

		if (!dia.form.tlnumber || dia.form.tlnumber===null) {
			dia.form.tlnumber = 'TL#####';
		}

		if (!dia.form.utm_medium | dia.form.utm_medium===null) {
			dia.form.utm_medium = 'email';
		}
	}


	parseLinks = function(email) {

		// Index for links
		var elIndex = 0, globalParams = {};
		
		// email link correction: adds parameter for proper treatment
		email = email.replace(/href="(mailto:.*?)"/g, (match, url) => {
		  url = url+'?y=email';
		  var res = 'href="'+url+'"';
		  return res;
		})

		// build object of globalParams and values
		var paramInputs = document.getElementsByClassName('param');
		for (var i=0;i<paramInputs.length;i++){
			globalParams[paramInputs[i].name] = paramInputs[i].value;
			var paramName = paramInputs[i].name;
			if (dia.form[paramName]){
				globalParams[paramName] = dia.form[paramName];
			}
		}

		// add in utm_source
		globalParams.utm_source = dia.form.utm_source;
		dia.form.links = [];

		// Param logic
		var email = email.replace(/href="(.*?)"/g, (match, link) => {
			link = link.replace(/\s/g,'');
			if (link.indexOf('?')===-1) {
				
				return match;
			} else {
				link = link.replace(/(.*?)\?(.*)/g, (newmatch, href, rawParams) => {

			    //turn link parameters into object

			    
			    var params = rawParams.split("&").reduce(function(prev, cur) {
			      var [key, value] = cur.split("=");
			      prev[key] = value;
			      return prev;
			    }, {});

			    // Remove user supplied link numbers
			    if (params.y) {
			      params['y'] = params['y'].replace(/link\d*/,'link');
			    }
			    
			    // Correct CS http to https in user-provided link
			    href = href.replace(/http:\/\/cs/g, 'https://cs');

			    // if links already have mcat tracking, set href to l param
			    if (href === globalParams.mcat_track) {
			      href = params.l;
			    }


			    // set variable for not counting links
			    var linkCountIgnore = ["link"].includes(params.y) ? false : true;

			    // set variable for not adding GA params
			    var gaIgnore = ["url", "link", "logo"].includes(params.y) ? false : true;

			    // set variable for special cases
			    var gaOnly = params['special']=='ga';
			    var mcatOnly = params['special']=='mcat';

			    if (params['special']) {
			      delete params['special'];
			    }

			    // delete MCAT values for online version
					["u", "m", "t", "l"].forEach(param => {
						delete params[param];
					});
			  
			    // handle special mcat only case
			    if (mcatOnly ) {
			      gaIgnore = true;
			      linkCountIgnore = true;
			      ["utm_campaign","utm_content","utm_medium","utm_source"].forEach(param => {
			        delete params[param];
			      });
			    }

			    // Add link numbers if y exists, y=link
			    if (params.y && !linkCountIgnore) {
			      if (!params["ie"]) {
			        elIndex++;
			      }
			      (params.y = params.y == 'link'? 'link' + elIndex: params.y)
			    }

			    // Build utm_content param
			    
			    // previous working version
			    // if (params.utm_content === undefined && !gaIgnore) {
			    //   params.utm_content = `${globalParams.tlnumber}-${params.y}`;

			    // }

			    // new version
			    if (!gaIgnore) {
			      params.utm_content = `${globalParams.tlnumber}-${params.y}`;
			    }

			    // Add GA params
			    if (!gaIgnore) {
			      ["utm_campaign","utm_medium","utm_source"].forEach(param => {
			        params[param] = globalParams[param];
			      });
			    }

			    // Remove y param if not needed
			    //if (gaIgnore || dia.form.utm_source=='mcat-o') {
			      if (dia.form.utm_source=='mcat-o') {
			        delete params.y;
			      }


			    // Turn everything back to string
			    var paramString = Object.keys(params).reduce((prev, cur) => {
			      return (prev += `&${cur}=${params[cur]}`);
			    }, "").substring(1);
			    
			   
			    if 
			      // Do nothing with email links
			    (href.includes("mailto") === true) {
			    	linkOutput = '<p>' + href + '</p>';
						dia.form.links.push(linkOutput);
			      return `href="${href}"`;
			    } 
			      // Special treatment for remove link
			      else if (href.includes("https://cs.thomsonreuters.com/myaccount/ecomm/remove.aspx")) {
      	    	linkOutput = `<p>href="${href}?${paramString}"</p>`;
      				dia.form.links.push(linkOutput);
			        return `href="${href}?${paramString}"`;
			      } 
			      // Default link return
			      else {
							// linkOutput = `<p>href="${href}${(!gaIgnore?'?':'')}${paramString}"</p>`;
							linkOutput = `<p>href="${href}?${paramString}"</p>`;
							dia.form.links.push(linkOutput);
							// return `href="${href}${(!gaIgnore?'?':'')}${paramString}"`;
			        return `href="${href}?${paramString}"`;
			      }	
				});


				return link;
			}
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


	output = function(emailParsed) {
		dia.form.output = emailParsed; 
		dia.form.render = $sce.trustAsHtml(emailParsed);
	}

	// logic for link updating
	linkExpose = function(emailParsed) {
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
			// console.log('match',match)
			// Set with corresponding link in linkoutputs array
			let updatedLink = `${attrs}${dia.linkOutputs[count]}"`
			console.log('newlink',updatedLink)

			// get the next link in this current loop
			count++

			return updatedLink
		});

		dia.form.render = $sce.trustAsHtml(dia.form.output);
	}
		

});