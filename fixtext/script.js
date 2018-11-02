	(function($) {
    class EmailTransformer {
      constructor(output) {

        this.output = output;

        $(".js-email-form").on("keyup", this.handleInputChange.bind(this));
        $("input[type=radio]").on("click", this.handleInputChange.bind(this));
      }

      handleInputChange() {
        try {
          const autoOutput = this.parseForManual();
          this.output.text(autoOutput);

        } catch (error) {
          this.output.text(error);
        }
      }


      parseForManual() {

        var elIndex = 0;

      // Get input values, turn them into an object
      const paramStub = $(".js-email-form")
      .serializeArray()
      .reduce((carry, item) => {
          carry[item.name] = item.value;//.toLowerCase();
          return carry;
        }, {});
      
      //console.log('paramstub:',paramStub);

      // Format email body
      // new lines, clean up characters
       paramStub.body = paramStub.body.replace(/\/br/g, '<br>').replace(/’/g,"'").replace(/—/g,"&mdash;").replace(/“/g,'&quot;').replace(/”/g,'"').replace(/ & /g," &amp; ").replace(/®/g,"<sup>&reg;</sup>").replace(/©/g,"<sup>&copy;</sup>").replace(/®/g,"<sup>&reg;</sup>").replace(/™/g,"<sup>&trade;</sup>");

      // auto fill

      // create regex criteria
      var regExp = {
        'tlnumber': /(tl\d{5})/gi,
        'aspotImg': /img:(.*)/gi,
        'eyebrow': /eyebrow:(.*)/gi,
        'h1': /header:([\s\S]*?)\/\//gi,
        'subhead': /subheading:(.*)/gi,
        'ctaTxt': /cta text:(.*)/gi,
        'ctaLink': /cta link:(.*)/gi,
        'utm_campaign': /tracking:(.*)/gi,
        'utm_medium': /medium:(.*)/gi
      }

      // Loop through data pulled from doc, update UI inputs
      for (var key in regExp) {
        var datum = regExp[key].exec(paramStub.body);
        if (datum!==null) {
          paramStub[key]=datum[1];
          var getSelector = '.ow-input[name='+key+']', getInput = $(getSelector);
          if (getInput.attr('type')) {
            $(getInput).val(paramStub[key]);
          } else {
            $(getInput).text(paramStub[key]);
          }
          $(getInput).prop('disabled',true).addClass('disabled');
        } else {
          var getSelector = '.ow-input[name='+key+']', getInput = $(getSelector);
          $(getInput).prop('disabled',false).removeClass('disabled');
        }
      }

      // Format certain params to lower case
      paramStub.tlnumber = paramStub.tlnumber.toLowerCase();
      paramStub.utm_campaign = paramStub.utm_campaign.toLowerCase();
      paramStub.utm_medium = paramStub.utm_medium.toLowerCase();
      

      paramStub.body = paramStub.body.replace(/([\s\S]*?)(\/\/\/body)([\s\S]*)/g, (match, pre, signal, body) => {
        return body;
      });

      // lead in line /lead content //
      paramStub.body = paramStub.body.replace(/\/lead([\s\S]*?)\/\//g, (match, leadin) => {
        leadin = '<span style="font-size: 18px; line-height: 24px;">'+leadin+'</span><br><br>';
        return leadin;
      });

      // List item wrapper, looks for bullets; add /// to last bullet
      paramStub.body = paramStub.body.replace(/•(.*)/g, (match, li) => {
        li = '<li style="margin-bottom:7px">'+li+'</li>';
        return li;
      }).replace(/(<li[\s\S]*?)(\/\/\/)(<\/li>)/g, (match, open, cnt, close) => {
        cnt = '';
        var res = '<ul style="margin-top:25px">'+open+close;
        return res;
      });;

      // links /link/url-- txt --
      paramStub.body = paramStub.body.replace(/\/l\/(.*?)--(.*?)--/g, (match, url, txt) => {
        var bodyLink = '<a href="'+url+'" style="color:#ff8000;text-decoration:none">'+txt+'</a>';
        return bodyLink;
      }).replace(/\(link to landing page\)/g, '');

      // /btn/url-- txt --
      paramStub.body = paramStub.body.replace(/\/btn\/(.*?)--(.*)/g, (match, url, txt) => {
        txt = txt.replace(/\(button\)/g, '');
        var btn = '</tr> <tr> <td height="40" style="font-size: 20px; line-height: 20px;">&nbsp;</td> </tr> <tr> <td align="left" valign="top" style="padding: 0 20px;"> <table border="0" cellspacing="0" cellpadding="0"> <tr> <td> <table border="0" cellspacing="0" cellpadding="0"> <tr> <!-- CTA --> <td align="left" style="-webkit-border-radius: 5px; -moz-border-radius: 5px; border-radius: 5px;" bgcolor="#ff8000" class="body-text"><a href="'+url+'" target="_blank" style="font-size: 14px; font-family: Arial, sans-serif; color: #ffffff; text-decoration: none; text-decoration: none; border-radius: 5px; padding: 12px 28px; border: 1px solid #ff8000; display: inline-block;" class="body-text">'+txt+'</a></td> <!-- END CTA --> </tr> </table> </td> </tr> </table> </td> </tr> <tr> <td height="40" style="font-size: 20px; line-height: 20px;">&nbsp;</td> </tr> <td align="left" valign="top" style="font-family: Arial, sans-serif; font-size:14px; line-height:20px; color:#555555; padding:0 20px;" class="body-text">';
        return btn;
      }).replace(/Button:/g, '').replace(/\[Button\]/g, '');

       

      // /box box/
      paramStub.body = paramStub.body.replace(/(\/box)([\s\S]*)(box\/)/gm, (match, open, cnt, close) => {
        var head = '</tr> <tr> <td style="padding:20px"> <table width="100%" bgcolor="#f3f3f3"> <tr> <td align="left" valign="top" style="font-family: Arial, sans-serif; font-size:14px; line-height:20px; color:#555555; padding:15px 30px;" class="body-text">';
        var foot = '</td> </table> </td> </tr><tr><td align="left" valign="top" style="font-family: Arial, sans-serif; font-size:14px; line-height:20px; color:#555555; padding:0 20px;" class="body-text">';
        var res = head + cnt + foot;
        return res;
      });

       // bolding /s cnt --
       paramStub.body = paramStub.body.replace(/(\/ss)([\s\S]*?)(\/ss)/g, (match, open, cnt, close) => {
        var res = '<strong>'+cnt+'</strong>';
        return res;
      });

       paramStub.bgclr = (paramStub.bg==='dark'?'#555555':'#f9f9f9');
       paramStub.txtclr = (paramStub.bg==='dark'?'#ffffff':'#555555');

       var email = {
        'head':  '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd"> <html lang="en"> <head> <meta http-equiv="Content-Type" content="text/html; charset=utf-8"> <meta name="viewport" content="width=device-width, initial-scale=1"> <meta http-equiv="X-UA-Compatible" content="IE=edge"> <meta name="robots" content="noindex, nofollow"> <title>Thomson Reuters</title> <style type="text/css"> body,div[style*="margin: 16px 0;"]{margin:0!important}a,body,table,td{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}table,td{mso-table-lspace:0;mso-table-rspace:0}img{border:0;height:auto;line-height:100%;outline:0;text-decoration:none;-ms-interpolation-mode:bicubic}table{border-collapse:collapse!important}body{font-family:Arial,sans-serif;height:100%!important;padding:0!important;width:100%!important}a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important;font-size:inherit!important;font-family:inherit!important;font-weight:inherit!important;line-height:inherit!important}@media only screen and (max-width:768px){.responsive-table{width:100%!important;display:block}.responsive-table-half{width:50%!important;display:block}.responsive-table-list{width:100%!important;display:table-cell!important}.responsive-image{margin:0 auto;display:block;padding-bottom:30px!important}.responsive-logo{display:block;margin-bottom:0;padding:0 30px 8px 5px!important}.copyright{margin-top:0;padding:0 30px 30px!important;display:block}.responsive-table-footer .responsive-footer-lockup{padding:0!important;text-align:right!important}.responsive-table-footer .responsive-footer-logo{padding:5px 0 0;text-align:right!important}}@media only screen and (max-width:480px){.responsive-table{width:100%;display:block}.responsive-table-half{width:50%!important;display:block}.responsive-table-footer{width:100%!important;display:block}.responsive-table-footer .responsive-footer-lockup{display:none}.responsive-table-footer .responsive-footer-logo{text-align:left!important;padding-left:20px;width:100%!important}} </style> </head> <body style="margin:0; padding:0;" bgcolor="#F1F1F1"> <table width="100%" height="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F1F1F1"> <!--[!if gte mso 9]> <tr> <td> <table width="600" height="100%" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto;"> <tr> <td> <![endif]--> <tr> <td width="100%" valign="top" align="center"> <center> <table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%"> <!-- CALLOUT BANNER --> <tr> <td align="center" height="100%" valign="top" width="100%"> <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;"> <tr> <td bgcolor="#f6f6f6" width="600" valign="top"> <!-- GRAY PADDED BANNER --> <table width="100%" height="100%" border="0" cellpadding="0" cellspacing="0"> <tr>',
        'aspot': '<!-- BANNER IMAGE --> <td width="600" height="400" align="left" valign="top" class="responsive-background-image" background="'+paramStub.aspotImg+'" bgcolor="'+paramStub.bgclr+'" style="background-position: top center; background-repeat: no-repeat; width: 100%; background-color:'+paramStub.bgclr+'"> <!-- OUTLOOK FALLBACK BANNER IMAGE: CHANGE SRC URL AND DIMS --> <!--[if gte mso 9]> <v:image xmlns:v="urn:schemas-microsoft-com:vml" id="theImage" style="behavior: url(#default#VML); display:inline-block;position:absolute; height:400px; width:600px;top:0;left:0;border:0;z-index:1;" src="'+paramStub.aspotImg+'"/> <v:shape xmlns:v="urn:schemas-microsoft-com:vml" id="theText" style="behavior: url(#default#VML); display:inline-block;position:absolute; height:400px; width:600px;top:-5;left:-10;border:0;z-index:2;""> <div> <![endif]--> <!-- END OUTLOOK FALLBACK BANNER IMAGE --> <!-- END BANNER IMAGE --> <table cellspacing="0" cellpadding="0" border="0" class="responsive-table-half" width="60%"> <tr> <td align="left" valign="top" style="padding: 40px 30px 0 20px;">'+(paramStub.eyebrow ? '<!-- EYEBROW --> <p style="font-family: Arial, sans-serif; font-size:14px; line-height:18px; color:#ff8000; font-weight: bold; padding: 0; margin: 0; text-transform: uppercase;" align="left" class="body-text">'+paramStub.eyebrow+'</p> <!-- END EYEBROW -->' : '')+'<!-- H1 --> <h1 style="font-size:30px; font-weight:normal; width:300px; padding:0; margin:0; line-height:34px; color:'+paramStub.txtclr+';">'+paramStub.h1+'</h1> <!-- END H1 --> '+(paramStub.subhead ? '<!-- SUB-HEADING --> <p style="font-family: Arial, sans-serif; font-size:14px; line-height:18px; color:'+paramStub.txtclr+'; padding: 10px 0px 0px 0px; margin: 0;" align="left" class="body-text">'+paramStub.subhead+'</p> <!-- END SUB HEADING -->' : '')+' </td> </tr> '+(paramStub.ctaLink ? '<tr> <td align="left" valign="top" style="padding: 20px 30px 0 20px;"> <table cellspacing="0" cellpadding="0" border="0"> <tr> <td align="center" style="-webkit-border-radius: 5px; -moz-border-radius: 5px; border-radius: 5px;" bgcolor="#ff8000" class="body-text"><a href="'+paramStub.ctaLink+'" target="_blank" style="font-size: 14px; font-family: Arial, sans-serif; color: #ffffff; text-decoration: none; text-decoration: none; border-radius: 5px; padding: 12px 28px; border: 1px solid #ff8000; display: inline-block;" class="body-text">'+paramStub.ctaTxt+'</a></td> </tr> </table> </td> </tr>' : '')+' </table> <!--[if gte mso 9]> </div> </v:shape> <![endif]--> </td> </tr> </table> </td> </tr> <!-- END CALLOUT BANNER -->',
        'body' : ' <tr> <td> <table cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" width="100%" style="max-width: 600px; margin: 0 auto;" align="center"> <tr> <td height="30" style="font-size: 30px; line-height: 30px;">&nbsp;</td> </tr> <tr> <td align="left" valign="top" style="font-family: Arial, sans-serif; font-size:14px; line-height:20px; color:#555555; padding:0 20px;" class="body-text"> ' + paramStub.body + ' <tr> <td height="20" style="font-size: 20px; line-height: 20px;">&nbsp;</td> </tr> ',
        'extras': '<!--FOOTER --> <tr> <td width="600"> <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF" style="border-top: 2px solid #F1F1F1"> <tbody> <tr> <td colspan="11" height="5"></td> </tr> <tr> <!--Logo: Thomson Reuters --> <td class="responsive-table-footer"> <table width="100%" border="0" cellspacing="0" cellpadding="0"> <tbody> <tr> <td align="right" style="text-align:right;" class="responsive-table-footer responsive-footer-lockup"><img src="https://cs.thomsonreuters.com/emails/i/TAC_ClarifyingLine_454x102.gif" width="227" height="51" alt="Thomson Reuters"></td> <td align="right" width="180" style="text-align:right; padding-right:20px;" class="responsive-table-footer responsive-footer-logo"> <a href="https://cs.thomsonreuters.com/email/link.aspx?elqTrackId=01319e74c21d482f970cca5debc22237&u=#usermessageid#&m=#messageid#&t=h&l=https://tax.thomsonreuters.com/"> <img src="https://cs.thomsonreuters.com/emails/i/TAC_Logo_360x102.gif" width="180" height="51" alt="The Answer Company"></a> </td> </tr> </tbody> </table> </td> </tr> </tbody> </table> </td> </tr> <!-- END FOOTER --> <tr> <td width="600" valign="top"> <table width="100%" border="0" cellspacing="0" cellpadding="10"> <tbody> <tr> <!-- EMAIL CODE --> <td style="-webkit-text-size-adjust:none; font-family:Arial, Helvetica, sans-serif; font-size:9px; line-height:13px; color:#555555;" align="center">TL31559</td> <!-- END EMAIL CODE --> </tr> </tbody> </table> </td> </tr> <!-- END BODY -->',
        'footer': '<!-- CS FOOTER --> <tr> <td style="border-top:1px solid #F1F1F1; padding: 25px 0 5px 0; background-color: #F1F1F1;" bgcolor="#F1F1F1;"> <table width="100%" border="0" cellpadding="0" cellspacing="0" class=""> <tr> <td align="left" style="padding:0 20px 0 20px;"> <p style="font-family:Helvetica, Arial, sans-serif;font-size:10px;line-height:12px;margin:0;padding:0;text-align:left;text-transform:uppercase;color:#818181;">Thomson Reuters <br> Tax &amp; Accounting</p> </td> <td align="right" style="padding:0 20px 0 20px;"> <p style="font-family:Helvetica, Arial, sans-serif; font-size:10px;margin:0;padding:0;text-align:right;"><a href="https://cs.thomsonreuters.com/email/link.aspx?u=#usermessageid#&m=#messageid#&y=url&t=h&l=https://tax.thomsonreuters.com&utm_campaign=tobeannounced&utm_medium=email&utm_source=mcat-h&utm_content=tl31559-url" target="_blank" style="color:#818181;">tax.tr.com</a></p> </td> </tr> <tr> <td align="left" style="padding: 0 20px 0 20px;" width="50%"> <p style="font-family:Helvetica, Arial, sans-serif;font-size:10px;line-height:12px;margin:0;padding: 5px 0;text-align:left;color:#818181;">6300 Interfirst Drive <br /> Ann Arbor, MI 48108 <br /> Toll Free: 800.968.0600 <br /> </p> </td> <td align="right" style="padding: 0 20px 0 0" width="50%"> <a href="https://cs.thomsonreuters.com/email/link.aspx?l=/facebook/&u=#usermessageid#&m=#messageid#&y=fb&t=h" target="_blank" title="Find us on Facebook"><img src="https://cs.thomsonreuters.com/i/ico-fb-32-trans.gif" alt="Facebook" width="32" height="32" border="0" /></a>&nbsp; <a href="https://cs.thomsonreuters.com/email/link.aspx?l=/twitter/&u=#usermessageid#&m=#messageid#&y=tw&t=h" target="_blank" title="Follow us on Twitter"><img src="https://cs.thomsonreuters.com/i/ico-tw-32-trans.gif" alt="Twitter" width="32" height="32" border="0" /></a>&nbsp; <a href="https://cs.thomsonreuters.com/email/link.aspx?l=/youtube/&u=#usermessageid#&m=#messageid#&y=yt&t=h" target="_blank" title="Subscribe to our YouTube channel"><img src="https://cs.thomsonreuters.com/i/ico-yt-32-trans.gif" alt="YouTube" width="32" height="32" border="0" /></a>&nbsp; <a href="https://cs.thomsonreuters.com/email/link.aspx?l=/linkedin/&u=#usermessageid#&m=#messageid#&y=li&t=h" target="_blank" title="Follow us on LinkedIn"><img src="https://cs.thomsonreuters.com/i/ico-in-32-trans.gif" alt="LinkedIn" width="32" height="32" border="0" /></a> </td> </tr> </table> </td> </tr> <tr> <td style="padding: 0; background-color: #F1F1F1;" bgcolor="#F1F1F1"> <table width="100%" align="left" cellpadding="0" cellspacing="0" border="0" class="responsive-table"> <tr> <td align="left" valign="top" style="font-family:Helvetica, Arial, sans-serif;font-size:10px;line-height:12px;color:#818181;padding: 0 20px 0 20px;"> This message was delivered to #emailaddress#. <br> <br> Subscribers to CS Professional Suite announcements can <a href="https://cs.thomsonreuters.com/email/link.aspx?l=/myaccount/ecomm/&u=#usermessageid#&m=#messageid#&t=h" target="_blank" style="color: #818181;">log in</a> to manage their communication preferences. <br> <br> If you prefer not to receive emails from CS Professional Suite, such as download notifications, support announcements, and promotional messages, you can <a href="https://cs.thomsonreuters.com/email/link.aspx?a=#emailaddress#&u=#usermessageid#&m=#messageid#&t=h&l=/myaccount/ecomm/remove.aspx" target="_blank" style="color: #818181;">opt out of these mailings</a>. <br> <br> View our <a href="https://cs.thomsonreuters.com/email/link.aspx?l=https://www.thomsonreuters.com/en/privacy-statement.html&u=#usermessageid#&m=#messageid#&t=h" target="_blank" style="color: #818181;">privacy statement</a>. <br> <br> To ensure uninterrupted delivery, please add <a href="mailto:subscriptions@cs.thomson.com" style="color:#818181;">subscriptions@cs.thomson.com</a> to your address book. <br> <br> <a href="https://cs.thomsonreuters.com/email/link.aspx?l=/email/messages/'+(paramStub.tlnumber? paramStub.tlnumber: 'TL######')+'.htm&u=#usermessageid#&m=#messageid#&y=online&t=h" target="_blank" style="color:#818181;">Read this email online if you are having trouble viewing this message</a>. <br> <br> </td> </tr> </table> </td> </tr> <!-- END CS FOOTER -->',
        'ofooter': '<!-- CS FOOTER --> <tr> <td style="border-top:1px solid #F1F1F1; padding: 25px 0 5px 0; background-color: #F1F1F1;" bgcolor="#F1F1F1;"> <table width="100%" border="0" cellpadding="0" cellspacing="0" class=""> <tr> <td align="left" style="padding:0 20px 0 20px;"> <p style="font-family:Helvetica, Arial, sans-serif;font-size:10px;line-height:12px;margin:0;padding:0;text-align:left;text-transform:uppercase;color:#818181;">Thomson Reuters <br> Tax &amp; Accounting</p> </td> <td align="right" style="padding:0 20px 0 20px;"> <p style="font-family:Helvetica, Arial, sans-serif; font-size:10px;margin:0;padding:0;text-align:right;"><a href="https://cs.thomsonreuters.com/email/link.aspx?u=#usermessageid#&m=#messageid#&y=url&t=h&l=https://tax.thomsonreuters.com&utm_campaign=tobeannounced&utm_medium=email&utm_source=mcat-h&utm_content=tl31559-url" target="_blank" style="color:#818181;">tax.tr.com</a></p> </td> </tr> <tr> <td align="left" style="padding: 0 20px 0 20px;" width="50%"> <p style="font-family:Helvetica, Arial, sans-serif;font-size:10px;line-height:12px;margin:0;padding: 5px 0;text-align:left;color:#818181;">6300 Interfirst Drive <br /> Ann Arbor, MI 48108 <br /> Toll Free: 800.968.0600 <br /> </p> </td> <td align="right" style="padding: 0 20px 0 0" width="50%"> <a href="https://cs.thomsonreuters.com/email/link.aspx?l=/facebook/&u=#usermessageid#&m=#messageid#&y=fb&t=h" target="_blank" title="Find us on Facebook"><img src="https://cs.thomsonreuters.com/i/ico-fb-32-trans.gif" alt="Facebook" width="32" height="32" border="0" /></a>&nbsp; <a href="https://cs.thomsonreuters.com/email/link.aspx?l=/twitter/&u=#usermessageid#&m=#messageid#&y=tw&t=h" target="_blank" title="Follow us on Twitter"><img src="https://cs.thomsonreuters.com/i/ico-tw-32-trans.gif" alt="Twitter" width="32" height="32" border="0" /></a>&nbsp; <a href="https://cs.thomsonreuters.com/email/link.aspx?l=/youtube/&u=#usermessageid#&m=#messageid#&y=yt&t=h" target="_blank" title="Subscribe to our YouTube channel"><img src="https://cs.thomsonreuters.com/i/ico-yt-32-trans.gif" alt="YouTube" width="32" height="32" border="0" /></a>&nbsp; <a href="https://cs.thomsonreuters.com/email/link.aspx?l=/linkedin/&u=#usermessageid#&m=#messageid#&y=li&t=h" target="_blank" title="Follow us on LinkedIn"><img src="https://cs.thomsonreuters.com/i/ico-in-32-trans.gif" alt="LinkedIn" width="32" height="32" border="0" /></a> </td> </tr> </table> </td> </tr> <tr> <td style="padding: 0; background-color: #F1F1F1;" bgcolor="#F1F1F1"> <table width="100%" align="left" cellpadding="0" cellspacing="0" border="0" class="responsive-table"> <tr> <td align="left" valign="top" style="font-family:Helvetica, Arial, sans-serif;font-size:10px;line-height:12px;color:#818181;padding: 0 20px 0 20px;">Subscribers to CS Professional Suite announcements can <a href="https://cs.thomsonreuters.com/email/link.aspx?l=/myaccount/ecomm/&u=#usermessageid#&m=#messageid#&t=h" target="_blank" style="color: #818181;">log in</a> to manage their communication preferences. <br> <br> View our <a href="https://cs.thomsonreuters.com/email/link.aspx?l=https://www.thomsonreuters.com/en/privacy-statement.html&u=#usermessageid#&m=#messageid#&t=h" target="_blank" style="color: #818181;">privacy statement</a>. <br> <br> To ensure uninterrupted delivery, please add <a href="mailto:subscriptions@cs.thomson.com" style="color:#818181;">subscriptions@cs.thomson.com</a> to your address book. <br> <br> </td> </tr> </table> </td> </tr> <!-- END CS FOOTER -->',
        'ending': '</table> </td> </tr> </table> </td> </tr> </table> </center> <!--[!if gte mso 9]> </td> </tr> </table> </td> <tr> <![endif]--> </td> </tr> </table> <img height="1" src="https://cs.thomsonreuters.com/email/image.aspx?u=#usermessageid#&m=#messageid#" width="1"> </body> </html>'
      };

      
      // Manually add MCAT track link, to avoid QA link swap
      paramStub.mcat_track = 'https://cs.thomsonreuters.com/email/link.aspx';
      
      // First, arrange footer if applicable
      if (paramStub.footer_type!=='undefined') {
        var head = email['head'];
        var aspot = email['aspot'];
        var body = email['body'];
        var extras = email['extras'];
        var footer = (paramStub.utm_source==='mcat-o'? email['ofooter'] : email['footer']);
        var ending = email['ending'];

        var html = head + aspot + body + extras + footer + ending;

       // Manually add MCAT track link, to avoid QA link swap
       paramStub.mcat_track = 'https://cs.thomsonreuters.com/email/link.aspx';
       
       // First, arrange footer if applicable
       if (paramStub.footer_type!=='undefined') {

        html = html.replace(/\<!--footer links--\>([\s\S]*)\<!--end footer links--\>/g, (match, linkGroup) => {
          if (paramStub.footer_type == 'final-filter-two') {
            if (paramStub.utm_source == 'mcat-h') {

              linkGroup = '<td valign="top" style="font-family:Helvetica, Arial, sans-serif;font-size:10px;line-height:12px;color:#818181;padding: 0 30px 0 30px;"><p style="margin:0; padding: 0 0 10px 0;">This message was delivered to #emailaddress#.</p><p style="margin:0; padding: 0 0 10px 0;">Subscribers to CS Professional Suite announcements can <a href="https://cs.thomsonreuters.com/email/link.aspx?l=/email/link.aspx&u=#usermessageid#&m=#messageid#&t=h" target="_blank" style="color:#ff9100;">log in</a> to manage their communication preferences.</p><p style="margin:0; padding: 0 0 10px 0;">If you prefer not to receive emails from CS Professional Suite, such as download notifications, support announcements, and promotional messages, you can <a href="https://cs.thomsonreuters.com/email/link.aspx?a=#emailaddress#&u=#usermessageid#&m=#messageid#&t=h&l=/myaccount/ecomm/remove.aspx" target="_blank" style="color:#ff9100;">opt out of these mailings</a>.</p></td>';
            } else {
              linkGroup = '<td valign="top" style="font-family:Helvetica, Arial, sans-serif;font-size:10px;line-height:12px;color:#818181;padding: 0 30px 0 30px;"><p style="margin:0; padding: 0 0 10px 0;">Subscribers to CS Professional Suite announcements can <a href="/email/link.aspx" target="_blank" style="color:#ff9100;">log in</a> to manage their communication preferences.</p></td>';
            }
          } else if (paramStub.footer_type == 'transactional') {
            if (paramStub.utm_source == 'mcat-h') {
             linkGroup = '<td valign="top" style="font-family:Helvetica, Arial, sans-serif;font-size:10px;line-height:12px;color:#818181;padding: 0 30px 0 30px;"><p style="margin:0; padding: 0 0 10px 0;">This message was delivered to #emailaddress#.</p></td>';
           } else {
             linkGroup = '';
           }
         } else if (paramStub.footer_type == 'one-time-only') {
          if (paramStub.utm_source == 'mcat-h') {
            linkGroup = '<td valign="top" style="font-family:Helvetica, Arial, sans-serif;font-size:10px;line-height:12px;color:#818181;padding: 0 30px 0 30px;"><p style="margin:0; padding: 0 0 10px 0;">This message was delivered to #emailaddress# because you registered for ' + paramStub.event_name + ' presented by ' + paramStub.presented_by + '.</p><p style="margin:0; padding: 0 0 10px 0;">To continue to receive CS Professional Suite product announcement emails, including newsletters, tips, and training, please <a href="http://cs.thomsonreuters.com/email/link.aspx?l=/myaccount/ecomm/&u=#usermessageid#&m=#messageid#&t=h" target="_blank">sign up</a> for our email subscriptions program.</p><p style="margin:0; padding: 0 0 10px 0;">If you prefer not to receive emails from CS Professional Suite, such as download notifications, support announcements, and promotional messages, you can <a href="https://cs.thomsonreuters.com/email/link.aspx?a=#emailaddress#&u=#usermessageid#&m=#messageid#&t=h&l=/myaccount/ecomm/remove.aspx" target="_blank" style="color:#ff9100;">opt out of these mailings</a>.</p></td>';
          } else {
           linkGroup = '<td valign="top" style="font-family:Helvetica, Arial, sans-serif;font-size:10px;line-height:12px;color:#818181;padding: 0 30px 0 30px;"><p style="margin:0; padding: 0 0 10px 0;">To continue to receive CS Professional Suite product announcement emails, including newsletters, tips, and training, please <a href="/myaccount/ecomm/" target="_blank">sign up</a> for our email subscriptions program.</p></td>';
         }
       }
       return '<!--footer links--> \n' + linkGroup + '\n <!--end footer links-->';
     });
      }

      // email link correction: adds parameter
      html = html.replace(/href="(mailto:.*?)"/g, (match, url) => {
        url = url+'?y=email';
        var res = 'href="'+url+'"';
        console.log(res);
        return res;
      })


       // Param logic
       html = html.replace(/href="(.*?)\?(.*?)"/g, (match, href, rawParams) => {
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

           // if links already have mcat tracking, reset href to l param
           if (href == paramStub.mcat_track) {
             href = params.l;
           }

           // Make relative links in MCAT version
           if (paramStub.utm_source == 'mcat-h') {
             href = href.replace(/http.*cs\.thomsonreuters\.com/,'');
           }

           // set variable for not counting links
           var linkCountIgnore = ["link"].includes(params.y) ? false : true;

           // set variable for not adding GA params
           var gaIgnore = ["url", "link"].includes(params.y) ? false : true;

           // set variable for special cases
           var gaOnly = params['special']=='ga';
           var mcatOnly = params['special']=='mcat';

           if (params['special']) {
             delete params['special'];
           }

           // Add MCAT tracking, or delete MCAT values for online version
           if (paramStub.utm_source == 'mcat-h' && !gaOnly) {
             ["u", "m", "t"].forEach(param => {
               params[param] = paramStub[param];
             });
             params.l = href;
           } else {
             ["u", "m", "t", "l"].forEach(param => {
               delete params[param];
             });
           }

           // Add GA params
           if (!gaIgnore) {
             ["utm_campaign","utm_content","utm_medium","utm_source"].forEach(param => {
               params[param] = paramStub[param];
             });
           }

           // hande special GA only case
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
           if (params.utm_content === undefined && !gaIgnore) {
             params.utm_content = `${paramStub.tlnumber}-${params.y}`;
           }


           // Remove y param if not needed
           //if (gaIgnore || paramStub.utm_source=='mcat-o') {
             if (paramStub.utm_source=='mcat-o') {
               delete params.y;
             }

           // Turn everything back to string
           var paramString = Object.keys(params).reduce((prev, cur) => {
             return (prev += `&${cur}=${params[cur]}`);
           }, "").substring(1);
           

           if 
             // Do nothing with email links
           (href.includes("mailto") === true) {
             return `href="${href}"`;
           } 
             // Special treatment for remove link
             else if (href.includes("https://cs.thomsonreuters.com/myaccount/ecomm/remove.aspx")) {
               return `href="${href}?${paramString}"`;
             } 
             // Default link return
             else if (paramStub.utm_source == 'mcat-h' && !gaOnly) {
               return `href="${paramStub.mcat_track}?${paramString}"`;
             }
             else {
               return `href="${href}${(!gaIgnore?'?':'')}${paramString}"`;
             }
           });


       html = html.replace(/’/g,"'").replace(/—/g,"&mdash;").replace(/–/g, '&ndash;').replace(/“/g,'"').replace(/”/g,'"').replace(/ & /g," &amp; ").replace(/®/g,"<sup>&reg;</sup>").replace(/©/g,"<sup>&copy;</sup>").replace(/®/g,"<sup>&reg;</sup>").replace(/™/g,"<sup>&trade;</sup>").replace(/TL[0-9]{5}|TL#####/g,paramStub.tlnumber.toUpperCase()).replace(/¬/g,'');

       $("#email-render").html(html);

       return html;
     }


   }
 }

 window.EmailTransformer = EmailTransformer;

  // toggle

  const OUTPUT = $(".js-auto-output");

  
  new EmailTransformer(OUTPUT);
  
  // Footer UI
  $('input[name="footer_type"]').click(function() {
    if ($(this).val()=='one-time-only') {
      $('.one-time').show();
    } else {
      $('.one-time').hide();
    }
  });


  
})(jQuery);