app.controller('EmailDia', function($sce) {

	var dia = this;
	dia.form = {};
	

	dia.processForm = function() {

		if (dia.form.wordRaw) {

			parseWordRaw(); // parse supplied word doc
			setDefaultAttrs(); // set default attrs
			cleanAttrs(); // clean up supplied attrs

			let email = buildEmail(); // Build the email
			let emailParsed = parseLinks(email); // parse links

			output(emailParsed); // output email
			linkExpose(emailParsed);

		} else if (dia.form.htmlRaw) {

			setDefaultAttrs(); // set default attrs
			let emailParsed = parseLinks(dia.form.htmlRaw);

			const rxFooter = /CS FOOTER[\s\S]*END CS FOOTER/;
			let currentFooter = rxFooter.exec(emailParsed);

			switch(dia.form.utm_source) {
				case 'mcat-o':
					
					emailParsed = emailParsed.replace(/<a.*Read this email online[\s\S]*?<br>[\s\S]*?<br>/g,"").replace(/This message was delivered to[\s\S]*?<br>[\s\S]*?<br>/g,"");
					break;
				case 'mcat-h':
					emailParsed = emailParsed.replace(/CS FOOTER[\s\S]*END CS FOOTER/,currentFooter);
					break;
			}

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
			  'aspotImg': /img:(.*)/gi,
			  'eyebrow': /eyebrow:(.*)/gi,
			  'h1': /header:([\s\S]*?)\/\//gi,
			  'subhead': /subheading:(.*)/gi,
			  'ctaTxt': /cta text:(.*)/gi,
			  'ctaLink': /cta link:(.*)/gi,
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

			// lead in line /lead content //
      dia.form.body = dia.form.body.replace(/\/lead([\s\S]*?)\/\//g, (match, leadin) => {
        leadin = '<span style="font-size: 18px; line-height: 24px;">'+leadin+'</span><br><br>';
        return leadin;
      });

      // List item wrapper, looks for bullets; add /// to last bullet
      dia.form.body = dia.form.body.replace(/•(.*)/g, (match, li) => {
        li = '<li style="margin-bottom:7px">'+li+'</li>';
        return li;
      }).replace(/(<li[\s\S]*?)(\/\/\/)(<\/li>)/g, (match, open, cnt, close) => {
        cnt = '';
        var res = '<ul style="margin-top:20px;margin-bottom:20px">'+open+close+'</ul>';
        return res;
      });;

      // links /link/url-- txt --
      dia.form.body = dia.form.body.replace(/\/l\/(.*?)--(.*?)--/g, (match, url, txt) => {
        var bodyLink = '<a href="'+url+'" style="color:#ff8000;text-decoration:none">'+txt+'</a>';
        return bodyLink;
      }).replace(/\(link to landing page\)/g, '');

      // /btn/url-- txt --
      dia.form.body = dia.form.body.replace(/\/btn\/(.*?)--(.*)/g, (match, url, txt) => {
        txt = txt.replace(/\(button\)/g, '');
        var btn = '</td> </tr> <tr> <td height="40" style="font-size: 20px; line-height: 20px;">&nbsp;</td> </tr> <tr> <td align="left" valign="top" style="padding: 0 20px;"><table border="0" cellspacing="0" cellpadding="0"> <tr> <td><table border="0" cellspacing="0" cellpadding="0"> <tr> <!-- CTA --> <td align="left" style="-webkit-border-radius: 5px; -moz-border-radius: 5px; border-radius: 5px;" bgcolor="#ff8000" class="body-text"><a href="'+url+'" target="_blank" style="font-size: 14px; font-family: Arial, sans-serif; color: #ffffff; text-decoration: none; text-decoration: none; border-radius: 5px; padding: 12px 28px; border: 1px solid #ff8000; display: inline-block;" class="body-text">'+txt+'</a></td> <!-- END CTA --> </tr> </table></td> </tr> </table></td> </tr> <tr> <td height="40" style="font-size: 20px; line-height: 20px;">&nbsp;</td> </tr> <tr> <td align="left" valign="top" style="font-family: Arial, sans-serif; font-size:14px; line-height:20px; color:#555555; padding:0 20px;" class="body-text">';
        return btn;
      }).replace(/Button:/g, '').replace(/\[Button\]/g, '');

      // /box box/
      dia.form.body = dia.form.body.replace(/(\/box)([\s\S]*)(box\/)/gm, (match, open, cnt, close) => {
        var head = '</tr> <tr> <td style="padding:20px"> <table width="100%" bgcolor="#f3f3f3"> <tr> <td align="left" valign="top" style="font-family: Arial, sans-serif; font-size:14px; line-height:20px; color:#555555; padding:15px 30px;" class="body-text">';
        var foot = '</td> </table> </td> </tr><tr><td align="left" valign="top" style="font-family: Arial, sans-serif; font-size:14px; line-height:20px; color:#555555; padding:0 20px;" class="body-text">';
        var res = head + cnt + foot;
        return res;
      });

       // bolding /s cnt --
       dia.form.body = dia.form.body.replace(/(\/ss)([\s\S]*?)(\/ss)/g, (match, open, cnt, close) => {
        var res = '<strong>'+cnt+'</strong>';
        return res;
      });

		}
	
	}

	setDefaultAttrs = function() {
		// set default image if none provided
		if (!dia.form.aspotImg || dia.form.aspotImg===null) {
			dia.form.aspotImg = '600x400_EH_UT_Prospect.jpg';
		}

		if (!dia.form.utm_source || dia.form.utm_source===null) {
			dia.form.utm_source = 'mcat-h';
		}

		dia.form.footerType = (dia.form.footerType?dia.form.footerType:'promotional');

		if (!dia.form.tlnumber || dia.form.tlnumber===null) {
			dia.form.tlnumber = 'TL#####';
		}

		if (!dia.form.utm_medium | dia.form.utm_medium===null) {
			dia.form.utm_medium = 'email';
		}

		// set bg color
		dia.form.bgclr = (dia.form.clrinput==='dark'? '#555555':'#f9f9f9');
		dia.form.txtclr = (dia.form.clrinput==='dark'? '#f9f9f9':'#555555');
	}

	cleanAttrs = function() {
		// Make sure no spaces in image
		dia.form.aspotImg = dia.form.aspotImg.replace(/\s/g, '');
		dia.form.utm_medium = dia.form.utm_medium.replace(/\s/g, '');
		dia.form.utm_campaign = (dia.form.utm_campaign? dia.form.utm_campaign.replace(/\s/g, '') : null);
		dia.form.h1 = dia.form.h1.replace(/<sup>/g,'<sup style="line-height:15px">');
		console.log(dia.form.h1);
	}

	buildEmail = function() {
		// Email template contents
		const emailContents = {
      'head':  '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd"> <html lang="en"> <head> <meta http-equiv="Content-Type" content="text/html; charset=utf-8"> <meta name="viewport" content="width=device-width, initial-scale=1"> <meta http-equiv="X-UA-Compatible" content="IE=edge"> <meta name="robots" content="noindex, nofollow"> <title>Thomson Reuters</title> <style type="text/css"> body,div[style*="margin: 16px 0;"]{margin:0!important}a,body,table,td{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}table,td{mso-table-lspace:0;mso-table-rspace:0}img{border:0;height:auto;line-height:100%;outline:0;text-decoration:none;-ms-interpolation-mode:bicubic}table{border-collapse:collapse!important}body{font-family:Arial,sans-serif;height:100%!important;padding:0!important;width:100%!important}a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important;font-size:inherit!important;font-family:inherit!important;font-weight:inherit!important;line-height:inherit!important}@media only screen and (max-width:768px){.responsive-table{width:100%!important;display:block}.responsive-table-half{width:50%!important;display:block}.responsive-table-list{width:100%!important;display:table-cell!important}.responsive-image{margin:0 auto;display:block;padding-bottom:30px!important}.responsive-logo{display:block;margin-bottom:0;padding:0 30px 8px 5px!important}.copyright{margin-top:0;padding:0 30px 30px!important;display:block}.responsive-table-footer .responsive-footer-lockup{padding:0!important;text-align:right!important}.responsive-table-footer .responsive-footer-logo{padding:5px 0 0;text-align:right!important}}@media only screen and (max-width:480px){.responsive-table{width:100%;display:block}.responsive-table-half{width:50%!important;display:block}.responsive-table-footer{width:100%!important;display:block}.responsive-table-footer .responsive-footer-lockup{display:none}.responsive-table-footer .responsive-footer-logo{text-align:left!important;padding-left:20px;width:100%!important}} </style> </head> <body style="margin:0; padding:0;" bgcolor="#F1F1F1"> <table width="100%" height="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F1F1F1"> <!--[!if gte mso 9]> <tr> <td> <table width="600" height="100%" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto;"> <tr> <td> <![endif]--> <tr> <td width="100%" valign="top" align="center"> <center> <table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%"> <!-- CALLOUT BANNER --> <tr> <td align="center" height="100%" valign="top" width="100%"> <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;"> <tr> <td bgcolor="#f6f6f6" width="600" valign="top"> <!-- GRAY PADDED BANNER --> <table width="100%" height="100%" border="0" cellpadding="0" cellspacing="0"> <tr>',
      'aspot': '<!-- BANNER IMAGE --> <td width="600" height="400" align="left" valign="top" class="responsive-background-image" background="'+dia.form.aspotImg+'" bgcolor="'+dia.form.bgclr+'" style="background-position: top center; background-repeat: no-repeat; width: 100%; background-color:'+dia.form.bgclr+'"> <!-- OUTLOOK FALLBACK BANNER IMAGE: CHANGE SRC URL AND DIMS --> <!--[if gte mso 9]> <v:image xmlns:v="urn:schemas-microsoft-com:vml" id="theImage" style="behavior: url(#default#VML); display:inline-block;position:absolute; height:400px; width:600px;top:0;left:0;border:0;z-index:1;" src="'+dia.form.aspotImg+'"/> <v:shape xmlns:v="urn:schemas-microsoft-com:vml" id="theText" style="behavior: url(#default#VML); display:inline-block;position:absolute; height:400px; width:600px;top:-5;left:-10;border:0;z-index:2;""> <div> <![endif]--> <!-- END OUTLOOK FALLBACK BANNER IMAGE --> <!-- END BANNER IMAGE --> <table cellspacing="0" cellpadding="0" border="0" class="responsive-table-half" width="60%"> <tr> <td align="left" valign="top" style="padding: 40px 30px 0 20px;">'+(dia.form.eyebrow ? '<!-- EYEBROW --> <p style="font-family: Arial, sans-serif; font-size:14px; line-height:18px; color:#ff8000; font-weight: bold; padding: 0; margin: 0; text-transform: uppercase;" align="left" class="body-text">'+dia.form.eyebrow+'</p> <!-- END EYEBROW -->' : '')+'<!-- H1 --> <h1 style="font-size:30px; font-weight:normal; width:300px; padding:0; margin:0; line-height:34px; color:'+dia.form.txtclr+';">'+dia.form.h1+'</h1> <!-- END H1 --> '+(dia.form.subhead ? '<!-- SUB-HEADING --> <p style="font-family: Arial, sans-serif; font-size:14px; line-height:18px; color:'+dia.form.txtclr+'; padding: 10px 0px 0px 0px; margin: 0;" align="left" class="body-text">'+dia.form.subhead+'</p> <!-- END SUB HEADING -->' : '')+' </td> </tr> '+(dia.form.ctaLink ? '<tr> <td align="left" valign="top" style="padding: 20px 30px 0 20px;"> <table cellspacing="0" cellpadding="0" border="0"> <tr> <td align="center" style="-webkit-border-radius: 5px; -moz-border-radius: 5px; border-radius: 5px;" bgcolor="#ff8000" class="body-text"><a href="'+dia.form.ctaLink+'" target="_blank" style="font-size: 14px; font-family: Arial, sans-serif; color: #ffffff; text-decoration: none; text-decoration: none; border-radius: 5px; padding: 12px 28px; border: 1px solid #ff8000; display: inline-block;" class="body-text">'+dia.form.ctaTxt+'</a></td> </tr> </table> </td> </tr>' : '')+' </table> <!--[if gte mso 9]> </div> </v:shape> <![endif]--> </td> </tr> </table> </td> </tr> <!-- END CALLOUT BANNER -->',
      'body' : '<tr> <td><table cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" width="100%" style="max-width: 600px; margin: 0 auto;" align="center"> <tr> <td height="30" style="font-size: 30px; line-height: 30px;">&nbsp;</td> </tr> <tr> <td align="left" valign="top" style="font-family: Arial, sans-serif; font-size:14px; line-height:20px; color:#555555; padding:0 20px;" class="body-text"> ' + dia.form.body + ' </td> </tr> <tr> <td height="20" style="font-size: 20px; line-height: 20px;">&nbsp;</td> </tr> ', 
      'extras': '<!--FOOTER --> <tr> <td width="600"> <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF" style="border-top: 2px solid #F1F1F1"> <tbody> <tr> <td colspan="11" height="5"></td> </tr> <tr> <!--Logo: Thomson Reuters --> <td class="responsive-table-footer"> <table width="100%" border="0" cellspacing="0" cellpadding="0"> <tbody> <tr> <td align="right" style="text-align:right;" class="responsive-table-footer responsive-footer-lockup"><img src="https://cs.thomsonreuters.com/emails/i/TAC_ClarifyingLine_454x102.gif" width="227" height="51" alt="Thomson Reuters"></td> <td align="right" width="180" style="text-align:right; padding-right:20px;" class="responsive-table-footer responsive-footer-logo"> <a href="https://cs.thomsonreuters.com/email/link.aspx?y=logo&special=mcat&u=#usermessageid#&m=#messageid#&t=h&l=https://www.thomsonreuters.com/"> <img src="https://cs.thomsonreuters.com/emails/i/TAC_Logo_360x102.gif" width="180" height="51" alt="The Answer Company"></a> </td> </tr> </tbody> </table> </td> </tr> </tbody> </table> </td> </tr> <!-- END FOOTER --> <tr> <td width="600" valign="top"> <table width="100%" border="0" cellspacing="0" cellpadding="10"> <tbody> <tr> <!-- EMAIL CODE --> <td style="-webkit-text-size-adjust:none; font-family:Arial, Helvetica, sans-serif; font-size:9px; line-height:13px; color:#555555;" align="center">'+dia.form.tlnumber+'</td> <!-- END EMAIL CODE --> </tr> </tbody> </table> </td> </tr> <!-- END BODY -->',
      'footer': '<!-- CS FOOTER --> <tr> <td style="border-top:1px solid #F1F1F1; padding: 25px 0 5px 0; background-color: #F1F1F1;" bgcolor="#F1F1F1;"> <table width="100%" border="0" cellpadding="0" cellspacing="0" class=""> <tr> <td align="left" style="padding:0 20px 0 20px;"> <p style="font-family:Helvetica, Arial, sans-serif;font-size:10px;line-height:12px;margin:0;padding:0;text-align:left;text-transform:uppercase;color:#818181;">Thomson Reuters <br> Tax &amp; Accounting</p> </td> <td align="right" style="padding:0 20px 0 20px;"> <p style="font-family:Helvetica, Arial, sans-serif; font-size:10px;margin:0;padding:0;text-align:right;"><a href="https://cs.thomsonreuters.com/email/link.aspx?u=#usermessageid#&m=#messageid#&y=url&t=h&l=https://tax.thomsonreuters.com&utm_campaign=&utm_medium=email&utm_source=mcat-h&utm_content='+dia.form.tlnumber+'-url" target="_blank" style="color:#818181;">tax.tr.com</a></p> </td> </tr> <tr> <td align="left" style="padding: 0 20px 0 20px;" width="50%"> <p style="font-family:Helvetica, Arial, sans-serif;font-size:10px;line-height:12px;margin:0;padding: 5px 0;text-align:left;color:#818181;">6300 Interfirst Drive <br /> Ann Arbor, MI 48108 <br /> Toll Free: 800.968.0600 <br /> </p> </td> <td align="right" style="padding: 0 20px 0 0" width="50%"> <a href="https://cs.thomsonreuters.com/email/link.aspx?l=/facebook/&u=#usermessageid#&m=#messageid#&y=fb&t=h" target="_blank" title="Find us on Facebook"><img src="https://cs.thomsonreuters.com/i/ico-fb-32-trans.gif" alt="Facebook" width="32" height="32" border="0" /></a>&nbsp; <a href="https://cs.thomsonreuters.com/email/link.aspx?l=/twitter/&u=#usermessageid#&m=#messageid#&y=tw&t=h" target="_blank" title="Follow us on Twitter"><img src="https://cs.thomsonreuters.com/i/ico-tw-32-trans.gif" alt="Twitter" width="32" height="32" border="0" /></a>&nbsp; <a href="https://cs.thomsonreuters.com/email/link.aspx?l=/youtube/&u=#usermessageid#&m=#messageid#&y=yt&t=h" target="_blank" title="Subscribe to our YouTube channel"><img src="https://cs.thomsonreuters.com/i/ico-yt-32-trans.gif" alt="YouTube" width="32" height="32" border="0" /></a>&nbsp; <a href="https://cs.thomsonreuters.com/email/link.aspx?l=/linkedin/&u=#usermessageid#&m=#messageid#&y=li&t=h" target="_blank" title="Follow us on LinkedIn"><img src="https://cs.thomsonreuters.com/i/ico-in-32-trans.gif" alt="LinkedIn" width="32" height="32" border="0" /></a> </td> </tr> </table> </td> </tr> <tr> <td style="padding: 0; background-color: #F1F1F1;" bgcolor="#F1F1F1"> <table width="100%" align="left" cellpadding="0" cellspacing="0" border="0" class="responsive-table"> <tr> <td align="left" valign="top" style="font-family:Helvetica, Arial, sans-serif;font-size:10px;line-height:12px;color:#818181;padding: 0 20px 0 20px;"> This message was delivered to #emailaddress#. <br> <br>  If you prefer not to receive emails from CS Professional Suite, such as download notifications, support announcements, and promotional messages, you can <a href="https://cs.thomsonreuters.com/email/link.aspx?a=#emailaddress#&u=#usermessageid#&m=#messageid#&t=h&l=/myaccount/ecomm/remove.aspx" target="_blank" style="color: #818181;">opt out of these mailings</a>. <br> <br> View our <a href="https://cs.thomsonreuters.com/email/link.aspx?l=https://www.thomsonreuters.com/en/privacy-statement.html&u=#usermessageid#&m=#messageid#&t=h" target="_blank" style="color: #818181;">privacy statement</a>. <br> <br> To ensure uninterrupted delivery, please add <a href="mailto:subscriptions@cs.thomson.com" style="color:#818181;">subscriptions@cs.thomson.com</a> to your address book. <br> <br> <a href="https://cs.thomsonreuters.com/email/link.aspx?l=/email/messages/'+(dia.form.tlnumber? dia.form.tlnumber: 'TL######')+'.htm&u=#usermessageid#&m=#messageid#&y=online&t=h" target="_blank" style="color:#818181;">Read this email online if you are having trouble viewing this message</a>. <br> <br> </td> </tr> </table> </td> </tr> <!-- END CS FOOTER -->',
      'ofooter': '<!-- CS FOOTER --> <tr> <td style="border-top:1px solid #F1F1F1; padding: 25px 0 5px 0; background-color: #F1F1F1;" bgcolor="#F1F1F1;"> <table width="100%" border="0" cellpadding="0" cellspacing="0" class=""> <tr> <td align="left" style="padding:0 20px 0 20px;"> <p style="font-family:Helvetica, Arial, sans-serif;font-size:10px;line-height:12px;margin:0;padding:0;text-align:left;text-transform:uppercase;color:#818181;">Thomson Reuters <br> Tax &amp; Accounting</p> </td> <td align="right" style="padding:0 20px 0 20px;"> <p style="font-family:Helvetica, Arial, sans-serif; font-size:10px;margin:0;padding:0;text-align:right;"><a href="https://cs.thomsonreuters.com/email/link.aspx?u=#usermessageid#&m=#messageid#&y=url&t=h&l=https://tax.thomsonreuters.com&utm_campaign=&utm_medium=email&utm_source=mcat-h&utm_content='+dia.form.tlnumber+'-url" target="_blank" style="color:#818181;">tax.tr.com</a></p> </td> </tr> <tr> <td align="left" style="padding: 0 20px 0 20px;" width="50%"> <p style="font-family:Helvetica, Arial, sans-serif;font-size:10px;line-height:12px;margin:0;padding: 5px 0;text-align:left;color:#818181;">6300 Interfirst Drive <br /> Ann Arbor, MI 48108 <br /> Toll Free: 800.968.0600 <br /> </p> </td> <td align="right" style="padding: 0 20px 0 0" width="50%"> <a href="https://cs.thomsonreuters.com/email/link.aspx?l=/facebook/&u=#usermessageid#&m=#messageid#&y=fb&t=h" target="_blank" title="Find us on Facebook"><img src="https://cs.thomsonreuters.com/i/ico-fb-32-trans.gif" alt="Facebook" width="32" height="32" border="0" /></a>&nbsp; <a href="https://cs.thomsonreuters.com/email/link.aspx?l=/twitter/&u=#usermessageid#&m=#messageid#&y=tw&t=h" target="_blank" title="Follow us on Twitter"><img src="https://cs.thomsonreuters.com/i/ico-tw-32-trans.gif" alt="Twitter" width="32" height="32" border="0" /></a>&nbsp; <a href="https://cs.thomsonreuters.com/email/link.aspx?l=/youtube/&u=#usermessageid#&m=#messageid#&y=yt&t=h" target="_blank" title="Subscribe to our YouTube channel"><img src="https://cs.thomsonreuters.com/i/ico-yt-32-trans.gif" alt="YouTube" width="32" height="32" border="0" /></a>&nbsp; <a href="https://cs.thomsonreuters.com/email/link.aspx?l=/linkedin/&u=#usermessageid#&m=#messageid#&y=li&t=h" target="_blank" title="Follow us on LinkedIn"><img src="https://cs.thomsonreuters.com/i/ico-in-32-trans.gif" alt="LinkedIn" width="32" height="32" border="0" /></a> </td> </tr> </table> </td> </tr> <tr> <td style="padding: 0; background-color: #F1F1F1;" bgcolor="#F1F1F1"> <table width="100%" align="left" cellpadding="0" cellspacing="0" border="0" class="responsive-table"> <tr> <td align="left" valign="top" style="font-family:Helvetica, Arial, sans-serif;font-size:10px;line-height:12px;color:#818181;padding: 0 20px 0 20px;"> View our <a href="https://cs.thomsonreuters.com/email/link.aspx?l=https://www.thomsonreuters.com/en/privacy-statement.html&u=#usermessageid#&m=#messageid#&t=h" target="_blank" style="color: #818181;">privacy statement</a>. <br> <br> To ensure uninterrupted delivery, please add <a href="mailto:subscriptions@cs.thomson.com" style="color:#818181;">subscriptions@cs.thomson.com</a> to your address book. <br> <br> </td> </tr> </table> </td> </tr> <!-- END CS FOOTER -->',
      'transFooter': '<!-- CS FOOTER --> <tr> <td style="border-top:1px solid #F1F1F1; padding: 25px 0 5px 0; background-color: #F1F1F1;" bgcolor="#F1F1F1;"> <table width="100%" border="0" cellpadding="0" cellspacing="0" class=""> <tr> <td align="left" style="padding:0 20px 0 20px;"> <p style="font-family:Helvetica, Arial, sans-serif;font-size:10px;line-height:12px;margin:0;padding:0;text-align:left;text-transform:uppercase;color:#818181;">Thomson Reuters <br> Tax &amp; Accounting</p> </td> <td align="right" style="padding:0 20px 0 20px;"> <p style="font-family:Helvetica, Arial, sans-serif; font-size:10px;margin:0;padding:0;text-align:right;"><a href="https://cs.thomsonreuters.com/email/link.aspx?u=#usermessageid#&m=#messageid#&y=url&t=h&l=https://tax.thomsonreuters.com&utm_campaign=&utm_medium=email&utm_source=mcat-h&utm_content='+dia.form.tlnumber+'-url" target="_blank" style="color:#818181;">tax.tr.com</a></p> </td> </tr> <tr> <td align="left" style="padding: 0 20px 0 20px;" width="50%"> <p style="font-family:Helvetica, Arial, sans-serif;font-size:10px;line-height:12px;margin:0;padding: 5px 0;text-align:left;color:#818181;">6300 Interfirst Drive <br /> Ann Arbor, MI 48108 <br /> Toll Free: 800.968.0600 <br /> </p> </td> <td align="right" style="padding: 0 20px 0 0" width="50%"> <a href="https://cs.thomsonreuters.com/email/link.aspx?l=/facebook/&u=#usermessageid#&m=#messageid#&y=fb&t=h" target="_blank" title="Find us on Facebook"><img src="https://cs.thomsonreuters.com/i/ico-fb-32-trans.gif" alt="Facebook" width="32" height="32" border="0" /></a>&nbsp; <a href="https://cs.thomsonreuters.com/email/link.aspx?l=/twitter/&u=#usermessageid#&m=#messageid#&y=tw&t=h" target="_blank" title="Follow us on Twitter"><img src="https://cs.thomsonreuters.com/i/ico-tw-32-trans.gif" alt="Twitter" width="32" height="32" border="0" /></a>&nbsp; <a href="https://cs.thomsonreuters.com/email/link.aspx?l=/youtube/&u=#usermessageid#&m=#messageid#&y=yt&t=h" target="_blank" title="Subscribe to our YouTube channel"><img src="https://cs.thomsonreuters.com/i/ico-yt-32-trans.gif" alt="YouTube" width="32" height="32" border="0" /></a>&nbsp; <a href="https://cs.thomsonreuters.com/email/link.aspx?l=/linkedin/&u=#usermessageid#&m=#messageid#&y=li&t=h" target="_blank" title="Follow us on LinkedIn"><img src="https://cs.thomsonreuters.com/i/ico-in-32-trans.gif" alt="LinkedIn" width="32" height="32" border="0" /></a> </td> </tr> </table> </td> </tr> <tr> <td style="padding: 0; background-color: #F1F1F1;" bgcolor="#F1F1F1"> <table width="100%" align="left" cellpadding="0" cellspacing="0" border="0" class="responsive-table"> <tr> <td align="left" valign="top" style="font-family:Helvetica, Arial, sans-serif;font-size:10px;line-height:12px;color:#818181;padding: 0 20px 0 20px;"> This message was delivered to #emailaddress#. <br> <br>View our <a href="https://cs.thomsonreuters.com/email/link.aspx?l=https://www.thomsonreuters.com/en/privacy-statement.html&u=#usermessageid#&m=#messageid#&t=h" target="_blank" style="color: #818181;">privacy statement</a>. <br> <br> <a href="https://cs.thomsonreuters.com/email/link.aspx?l=/email/messages/'+(dia.form.tlnumber? dia.form.tlnumber: 'TL######')+'.htm&u=#usermessageid#&m=#messageid#&y=online&t=h" target="_blank" style="color:#818181;">Read this email online if you are having trouble viewing this message</a>. <br> <br> </td> </tr> </table> </td> </tr> <!-- END CS FOOTER -->',
      'otransFooter': '<!-- CS FOOTER --> <tr> <td style="border-top:1px solid #F1F1F1; padding: 25px 0 5px 0; background-color: #F1F1F1;" bgcolor="#F1F1F1;"> <table width="100%" border="0" cellpadding="0" cellspacing="0" class=""> <tr> <td align="left" style="padding:0 20px 0 20px;"> <p style="font-family:Helvetica, Arial, sans-serif;font-size:10px;line-height:12px;margin:0;padding:0;text-align:left;text-transform:uppercase;color:#818181;">Thomson Reuters <br> Tax &amp; Accounting</p> </td> <td align="right" style="padding:0 20px 0 20px;"> <p style="font-family:Helvetica, Arial, sans-serif; font-size:10px;margin:0;padding:0;text-align:right;"><a href="https://cs.thomsonreuters.com/email/link.aspx?u=#usermessageid#&m=#messageid#&y=url&t=h&l=https://tax.thomsonreuters.com&utm_campaign=&utm_medium=email&utm_source=mcat-h&utm_content='+dia.form.tlnumber+'-url" target="_blank" style="color:#818181;">tax.tr.com</a></p> </td> </tr> <tr> <td align="left" style="padding: 0 20px 0 20px;" width="50%"> <p style="font-family:Helvetica, Arial, sans-serif;font-size:10px;line-height:12px;margin:0;padding: 5px 0;text-align:left;color:#818181;">6300 Interfirst Drive <br /> Ann Arbor, MI 48108 <br /> Toll Free: 800.968.0600 <br /> </p> </td> <td align="right" style="padding: 0 20px 0 0" width="50%"> <a href="https://cs.thomsonreuters.com/email/link.aspx?l=/facebook/&u=#usermessageid#&m=#messageid#&y=fb&t=h" target="_blank" title="Find us on Facebook"><img src="https://cs.thomsonreuters.com/i/ico-fb-32-trans.gif" alt="Facebook" width="32" height="32" border="0" /></a>&nbsp; <a href="https://cs.thomsonreuters.com/email/link.aspx?l=/twitter/&u=#usermessageid#&m=#messageid#&y=tw&t=h" target="_blank" title="Follow us on Twitter"><img src="https://cs.thomsonreuters.com/i/ico-tw-32-trans.gif" alt="Twitter" width="32" height="32" border="0" /></a>&nbsp; <a href="https://cs.thomsonreuters.com/email/link.aspx?l=/youtube/&u=#usermessageid#&m=#messageid#&y=yt&t=h" target="_blank" title="Subscribe to our YouTube channel"><img src="https://cs.thomsonreuters.com/i/ico-yt-32-trans.gif" alt="YouTube" width="32" height="32" border="0" /></a>&nbsp; <a href="https://cs.thomsonreuters.com/email/link.aspx?l=/linkedin/&u=#usermessageid#&m=#messageid#&y=li&t=h" target="_blank" title="Follow us on LinkedIn"><img src="https://cs.thomsonreuters.com/i/ico-in-32-trans.gif" alt="LinkedIn" width="32" height="32" border="0" /></a> </td> </tr> </table> </td> </tr> <tr> <td style="padding: 0; background-color: #F1F1F1;" bgcolor="#F1F1F1"> <table width="100%" align="left" cellpadding="0" cellspacing="0" border="0" class="responsive-table"> <tr> <td align="left" valign="top" style="font-family:Helvetica, Arial, sans-serif;font-size:10px;line-height:12px;color:#818181;padding: 0 20px 0 20px;">View our <a href="https://cs.thomsonreuters.com/email/link.aspx?l=https://www.thomsonreuters.com/en/privacy-statement.html&u=#usermessageid#&m=#messageid#&t=h" target="_blank" style="color: #818181;">privacy statement</a>. <br> <br></td> </tr> </table> </td> </tr> <!-- END CS FOOTER -->',
      'ending': '</table> </td> </tr> </table> </td> </tr> </table> </center> <!--[!if gte mso 9]> </td> </tr> </table> </td> <tr> <![endif]--> </td> </tr> </table> <img height="1" src="https://cs.thomsonreuters.com/email/image.aspx?u=#usermessageid#&m=#messageid#" width="1"> </body> </html>'
    };

    const getFooter = function() {
    	if (dia.form.utm_source==='mcat-o') {
    		return (dia.form.footerType==='transactional'?emailContents.otransFooter:emailContents.ofooter);
    	} else {
    		return (dia.form.footerType==='transactional'?emailContents.transFooter:emailContents.footer);
    	}
    }

    const head = emailContents['head'],
    	aspot = emailContents['aspot'],
      body = emailContents['body'],
      extras = emailContents['extras'],
      footer = getFooter(),
      ending = emailContents['ending'];
    // Build email
    let email = head + aspot + body + extras + footer + ending;
    email = email.replace(/\/\/br/g, '<br>').replace(/\/\/\/br/g, '<br><br>').replace(/’/g,"'").replace(/—/g,"&mdash;").replace(/“/g,'&quot;').replace(/”/g,'"').replace(/ & /g," &amp; ").replace(/®/g,"<sup>&reg;</sup>").replace(/©/g,"<sup>&copy;</sup>").replace(/®/g,"<sup>&reg;</sup>").replace(/™/g,"<sup>&trade;</sup>");
		
		return email;
		
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


			    // Make relative links in MCAT version
			    if (dia.form.utm_source == 'mcat-h') {
			      href = href.replace(/http.*cs\.thomsonreuters\.com/,'');
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

			    // Add MCAT tracking, or delete MCAT values for online version
			    if (dia.form.utm_source === 'mcat-h' && !gaOnly) {
			      ["u", "m", "t"].forEach(param => {
			        params[param] = globalParams[param];
			      });
			      params.l = href;
			    } else {
			      ["u", "m", "t", "l"].forEach(param => {
			        delete params[param];
			      });
			    }
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


			     // Deal with online version link 
			     if (globalParams.utm_source==='mcat-h'&&!gaOnly) {
			     	params['l'] = params['l'].replace(/(TL.{5})\.htm/gi, (match, tl) => {
			       	return globalParams.tlnumber+'.htm';
			       });
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
			      else if (dia.form.utm_source == 'mcat-h' && !gaOnly) {
      	    	linkOutput = `<p>href="${globalParams.mcat_track}?${paramString}"</p>`;
      				dia.form.links.push(linkOutput);
			        return `href="${globalParams.mcat_track}?${paramString}"`;
			      }
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
		//format function translating &s into &amp; use formatter for now
		// if (dia.form.wordRaw) {
		// 	emailParsed = process(emailParsed);
		// }
		
		dia.form.output = emailParsed; 
		dia.form.render = $sce.trustAsHtml(emailParsed);
	}

	// logic for link updating
	linkExpose = function(emailParsed) {
		dia.linkOutputs = [];
		dia.linkAnchors = [];
		emailParsed.replace(/href="(.*?)".*?>(.*?)<\/a>/g, (match, link, anchor) => {
			link = link.replace(/\s/g, '');
			dia.linkOutputs.push(link);
			dia.linkAnchors.push(anchor);
			return match;
		});
	}
	dia.updateLink = function($index) {
		var count = 0;
		dia.form.output = dia.form.output.replace(/href="(.*?)"/g, (match, link) => {
			var res = 'href="'+dia.linkOutputs[count]+'"';
			count++;
			return res;
		});
		dia.form.render = $sce.trustAsHtml(dia.form.output);
	}
		

});