/* ************************************************************************
   Copyright: eviltik
   License: WTFPL
   Authors: eviltik
************************************************************************ */

/**
 * @asset(EP/*)
 * @asset(Zen/*)
 * @asset(qx/icon/Tango/22/apps/utilities-color-chooser.png)
 * @asset(qx/icon/Tango/16/apps/utilities-terminal.png)
 * @asset(qx/icon/Tango/16/actions/list-add.png)
 * @asset(qx/icon/Tango/32/actions/help-faq.png)
 */

/**
 * @lint ignore(CIDR,objectForEach,Faye)
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

    properties: {
        soundVolume: {
            check:'Number',
            event:'changeVolume',
            nullable:false,
            init:0.5
        },
        session: {
            /* express session id */
            nullable:false,
            init:false
        },
        desktop: {
            nullable:false
        },
        jobsManager: {
            nullable:false
        },
        fayeManager:{
            nullable:false
        },
        indicator:{
            nullable:false
        }
    },

    members: {

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

            this.addListener('changeVolume',this.__onChangeVolume,this);

            var loginPopup = new EP.app.popup.Login();
            loginPopup.addListener('authenticated',function(ev) {
                this.setSoundVolume(ev.getData().user.soundVolume||0.5);
                this.setSession(ev.getData().user.session);
                this.setDesktop(new EP.app.desktop.Desktop());
                this.getRoot().add(this.getDesktop(),{edge:0});
            },this);
        },

        __onChangeVolume:function(ev) {
            if (!this.getSession()) return;
            new EP.app.util.Xhr('user/update/soundVolume',{value:ev.getData()},null,this).send();
        }
    }
});
