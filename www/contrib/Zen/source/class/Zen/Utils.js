/* ************************************************************************

@asset(Zen/*)

************************************************************************ */

qx.Class.define("Zen.Utils", {
    statics:{
        objectForEach:function(obj,cb,caller) {
            var i = -1;
            for (var prop in obj) {
                if (!obj.hasOwnProperty(prop)||typeof obj[prop]=='function') continue;
                cb.bind(caller,prop.toString(),obj[prop],++i)();
            }
        }
    }
});

