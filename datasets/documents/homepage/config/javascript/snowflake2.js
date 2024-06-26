window.onload = function () {
            var minSize = 3; //Minimum font size
            var maxSize = 30;//Maximum font size
            var newOne = 100; //snowflake intervals
            var flakColor = "#fff"; //Snowflake color
            var flak = $("<div></div>").css({position:"absolute","top":"0px"}).html("❉");//Define a snowflake
            var dhight = $(window).height();
            var dw =$(window).width()-80;
            setInterval(function(){
            var sizeflak = minSize+Math.random()*maxSize; //Random snowflake size
            var startLeft = Math.random()*dw; //Random location
            var startOpacity = 0.7+Math.random()*0.3; //Random Transparency
            var endTop= dhight-200; //The location where snowflakes stop
            var endLeft= Math.random()*dw;
            var durationfull = 5000+Math.random()*5000; //Random snowflake falling speed
            flak.clone().appendTo($("body")).css({
            "left":startLeft ,
            "opacity":startOpacity,
            "font-size":sizeflak,
            "color":flakColor
            }).animate({
            "top":endTop,
            "left":endLeft,
            "apacity":0.1
            },durationfull,function(){
            $(this).remove()
            });
            },newOne);
        }
