


/**
 * objetForEach: loop an objet like an array
 * @param obj: a js object
 * @param cb: callback for each item
 * @param caller: scope
 */
var objectForEach = function(obj,cb,caller) {
    var i = -1;
    for (prop in obj) {
        if (!obj.hasOwnProperty(prop)||typeof obj[prop]=='function') continue;
        cb.bind(caller,prop.toString(),obj[prop],++i)();
    }
}


module.exports.objectForEach = objectForEach;

