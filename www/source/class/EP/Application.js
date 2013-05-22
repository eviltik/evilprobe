/* ************************************************************************
   Copyright: eviltik
   License: WTFPL
   Authors: eviltik
************************************************************************ */

/* ***
 #asset(EP/*)
 #asset(qx/icon/Tango/22/apps/utilities-color-chooser.png)
 #asset(qx/icon/Tango/16/apps/utilities-terminal.png)
 #asset(qx/icon/Tango/16/actions/list-add.png)
 #asset(qx/icon/Tango/32/actions/help-faq.png)
 */

/**
 * @lint ignoreUndefined(CIDR,objectForEach,Faye)
 */

window.objectForEach = function(obj,cb,caller) {
    var i = -1;
    for (var prop in obj) {
        if (!obj.hasOwnProperty(prop)||typeof obj[prop]=='function') continue;
        cb.bind(caller,prop.toString(),obj[prop],++i)();
    }
}

qx.Class.define("EP.Application", {

    extend : qx.application.Standalone,

    members : {
        __desktop:null,

        /* faye manager, initialized by __desktop after login succeed */
        __FM: null,

        /* jobs manager, initialized by __desktop after login succeed */
        __JM: null,

        /* express session id */
        __session:null,

        main : function() {
            this.base(arguments);

            // Enable logging in debug variant
            if (qx.core.Environment.get("qx.debug")) {
                qx.log.appender.Native;
                qx.log.appender.Console;
            }

            this.getRoot().set({
               blockerColor: '#000000',
               blockerOpacity: 0.6
            });

            var loginPopup = new EP.app.popup.Login();
            loginPopup.addListener('authenticated',function(ev) {
                this.__session = ev.getData().user.session;
                this.__desktop = new EP.app.desktop.Desktop();
                this.getRoot().add(this.__desktop,{edge:0});
            },this);
        },

        getDesktop:function() {
            return this.__desktop;
        },

        getJobsManager:function() {
            return this.__JM;
        },

        getSession:function() {
            return this.__session;
        }

    }
});
