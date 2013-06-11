/**
 * @ignore(d3)
 */

var d33 = d3;

qx.Class.define("EP.app.popup.Earth", {

    extend : Zen.ui.window.Window,

    construct:function() {

        this.base(arguments);

    	this.set({
    		contentPadding:0,
    		resizable:true,
    		showMinimize:true,
            showClose:false,
    		showMaximize:true,
            //height:170,
            //width:300,
            height:680,
            width:1200,
    		margin:0,
    		caption:'World map',
    		layout:new qx.ui.layout.Grow,
    		modal:false,
            fadeInAppear:false,
            fadeOutClose:false,
            centered:false
    	});

        this.addListener('resize',this.__onAppear,this);
        qx.event.message.Bus.subscribe('mapUpdate',this.mapUpdate,this);
        qx.event.message.Bus.subscribe('mapReset',this.mapReset,this);

        window.mapTooltip = new qx.ui.tooltip.ToolTip().set({rich:true});
    },

    members:{

        __html:null,
        __container:null,
        __map:null,
        __projection:null,
        __data:[],

        __mini:function() {
            var myScreen = qx.core.Init.getApplication().getRoot().getBounds();
            var left = myScreen.width-this.getWidth()-1;
            var top = myScreen.height-this.getHeight()-33;
            this.moveTo(left,top);
            qx.core.Init.getApplication().getRoot().addListenerOnce('resize',this.__mini,this);
        },

        mapReset:function() {
            if (this.__map) {
                this.__map.selectAll("circle").remove();
            }
        },

        mapUpdate:function(ev) {
            qx.event.message.Bus.dispatch(new qx.event.message.Message('playSound'));
            var lat = ev.getData().latitude;
            var longi = ev.getData().longitude;
            if (!lat||!longi) return;
            this.__data.push(ev.getData());
            this.__add(longi,lat,ev.getData());
        },

        __add:function(lo,la,data) {
            this.__map.append("circle")
                //.data(data)
                .text(function(d) {return data.ip;})
                .attr("r",20)
                .style("fill-opacity",0.5)
                .style("fill", "red")
                .attr("data",JSON.stringify(data))
                .attr("transform", function() {return "translate(" + window.projection([lo,la]) + ")";})
                //.attr("title", function (d) { return d.ip+' '+d.reverse; })
                //.attr("class", "node")

            .on("mouseover", function(a,b,c) {
                var data = JSON.parse(this.getAttribute('data'));
                var str = '';
                str+=data.ip;
                if (data.reverse) str+=', '+data.reverse;
                if (data.city) str+=', '+data.city;
                if (data.country) str+=', '+data.country;
                window.mapTooltip.setLabel(str);
                window.mapTooltip.placeToPoint({left:d33.event.pageX,top:d33.event.pageY});
                window.mapTooltip.show();
            })
            .transition()
                .delay(100)
                .duration(1000)
                .attr("r", 3)
                .style("fill-opacity",1)
                .style('fill','white')


                //.attr("fill", "url(#star)")

            /*
            this.__map.append("pattern")
                .attr("id", "star")
                .attr("patternUnits", "objectBoundingBox")

                .attr("width", "25")
                .attr("height", "25")
                .append("image")

                .attr("xlink:href", "resource/star.png")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", 25)
                .attr("height", 25);
            */

        },

        __draw:function(ev) {
            var map = this.__map = d33.select("svg");
            var width = this.getBounds().width;
            var height = this.getBounds().height;

            var ratio = 2;
            var projection = window.projection = d33.geo.equirectangular().scale(width-10).translate([width/ratio, height/ratio]);

            var path = d33.geo.path().projection(projection);
            d33.json('resource/world-countries.json', function(collection) {
                map.selectAll('path').data(collection.features).enter()
                    .append('path')
                    .attr('d', path)
                    .attr("width", width)
                    .attr("height", width/ratio);
            });

            this.set({
                height:170,
                width:300
            });

            qx.lang.Function.delay(function() {
                this.setVisibility('visible');
                this.show();
            },100,this);

        },
        __onAppear:function(ev) {

            this.__mini();

            if (this.__map) return;

            this.setVisibility('hidden');

            qx.lang.Function.delay(function() {
                var w = this.getBounds().width;
                var h = this.getBounds().height-40;
                if (h<0) h = 10;
                var text = '<div id="mapContainer"><svg viewBox="0 20 '+w+' '+h+'"></svg></div>';
                var h = new qx.ui.embed.Html(text,{rich:true});
                h.addListenerOnce('appear',this.__draw,this);
                this.add(h);
            },100,this);
        }
    }
});

