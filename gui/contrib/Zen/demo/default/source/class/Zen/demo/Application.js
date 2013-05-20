/* ************************************************************************

   Copyright:

   License:

   Authors:

************************************************************************ */

/* ************************************************************************

#asset(Zen/demo/*)

************************************************************************ */

/**
 * This is the main application class of your custom application "Zen"
 */
qx.Class.define("Zen.demo.Application",
{
  extend : qx.application.Standalone,



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /**
     * This method contains the initial application code and gets called 
     * during startup of the application
     * 
     * @lint ignoreDeprecated(alert)
     */
    main : function()
    {
      // Call super class
      this.base(arguments);

      // Enable logging in debug variant
      if (qx.core.Environment.get("qx.debug"))
      {
        // support native logging capabilities, e.g. Firebug for Firefox
        qx.log.appender.Native;
        // support additional cross-browser console. Press F7 to toggle visibility
        qx.log.appender.Console;
      }

      /*
      -------------------------------------------------------------------------
        Below is your actual application code...
      -------------------------------------------------------------------------
      */

      // Create a button
      var button1 = new Zen.Contribution("First Contribution", "Zen/test.png");

      // Document is the application root
      var doc = this.getRoot();
			
      // Add button to document at fixed coordinates
      doc.add(button1, {left: 100, top: 50});

      // Add an event listener
      button1.addListener("execute", function(e) {
        alert("Hello World!");
      });
    }
  }
});
