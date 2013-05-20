/**
 * @lint ignoreUndefined(Faye.Client)
 */
 qx.Class.define("EP.utils.fayeManager", {

    extend : qx.core.Object,

    construct : function() {
    	this.base(arguments);
        if (!window.Faye||!window.Faye.Client) {
            console.error('No Faye client detected, aborting fayeManager initialization');
            return;
        }

		this.client = new Faye.Client('/faye'),
		this.channels = {
			jobsStatus : '/jobs/status',
			jobsManage : '/jobs/manage'
		}
    },

    members : {
    	jobsStatusSubscribe : function(cb,caller) {
			//console.log('subscribe to '+this.channels.jobsStatus);
            if (!this.client) return;
            this.__notify();
			return this.client.subscribe(this.channels.jobsStatus,qx.lang.Function.bind(cb,caller));
    	},
        jobSubscribe:function(job,cb,caller) {
            if (!this.client) return;
            var channel = '/jobs/'+job.jobUid;
            //console.log("jobSubscribe",channel);
            this.__notify();
            return this.client.subscribe(channel,qx.lang.Function.bind(cb,caller));
        },        
        jobPublish : function(job) {
            if (!this.client) return;
            //console.log("jobPublish",this.channels.jobsManage,job);
            this.__notify();
            return this.client.publish(this.channels.jobsManage,job);
        },
        jobCommand : function(jobUid,cmd) {
            if (!this.client) return;
            this.__notify();
            return this.client.publish(this.channels.jobsManage,{jobUid:jobUid,jobCmd:cmd});
        },
        unsubscribe : function(subscription) {
            if (!this.client) return;
            //console.log('unsubscribe',subscription);
            this.__notify();
            subscription.cancel();
        },
        __notify:function() {
            qx.event.message.Bus.dispatch(new qx.event.message.Message('networkActivity'));
        }
    }
});
