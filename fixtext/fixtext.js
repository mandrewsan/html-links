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
        // Get input values, turn them into an object
        const paramStub = $(".js-email-form")
        .serializeArray()
        .reduce((carry, item) => {
            carry[item.name] = item.value;
            return carry;
          }, {});

        var txt = paramStub.inputTxt.replace(/\s/g,'-').replace(/('|"|’)/g,'').toLowerCase();
       return txt;
     


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