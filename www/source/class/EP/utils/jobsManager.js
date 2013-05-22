qx.Class.define("EP.utils.jobsManager", {

    extend : qx.core.Object,

    construct : function(args) {
        this.base(arguments);
        this.__FM = args.FM;
    },

    members:{

        __FM : null,
        __jobs : {},

        /* private */

        __onJobMessage : function(obj) {
            // To be able to fetch related job,
            // (rathern than looping in jobsList and search for jobUid)
            // the function has been bind to an object :
            // {self:this, job:job}

            var job = this.job;
            var widget = this.widget;
            widget.fireDataEvent('jobMessage',obj);
            //console.log('onJobMessage',job.jobUid,obj);
        },

        __remove : function(jobUid) {
            if (this.__jobs[jobUid]) {
                // Cancel faye connection
                this.__FM.unsubscribe(this.__jobs[jobUid]);
                // Remove from list
                delete this.__jobs[jobUid];
            }
        },

        __command : function(jobUid,cmd) {
            this.__FM.jobCommand(jobUid,cmd);
        },

        /* public */

        push : function(job,widget) {
            if (widget) {
                var callbackBinded = qx.lang.Function.bind(this.__onJobMessage,{widget:widget,job:job});
                this.__jobs[job.jobUid] = this.__FM.jobSubscribe(job,callbackBinded);
            }
            this.__FM.jobPublish(job);
        },

        pause : function(jobUid) {
            return this.__command(jobUid,'pause');
        },

        unpause : function(jobUid) {
            return this.__command(jobUid,'unpause');
        },

        abort : function(jobUid) {
            this.__command(jobUid,'abort');
            setTimeout(function() {
                this.__remove(jobUid);
            }.bind(this),1500);
        },

        end : function(jobUid) {
            this.__remove(jobUid);
        }
    }
});
