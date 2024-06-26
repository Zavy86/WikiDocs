var JS_FT_CSS = '.jsft_Canvas {position: fixed;margin: 0;padding: 0;overflow: hidden;top: 0;left: 0;width: 100vw;height: 100vh;background-color: transparent;pointer-events: none;z-index:100000;}';

var styleElement = document.createElement("STYLE");
styleElement.type = "text/css";
styleElement.appendChild(document.createTextNode(JS_FT_CSS));
var head = document.getElementsByTagName("HEAD")[0];
head.appendChild(styleElement);

var jsftCV = document.createElement("canvas");
jsftCV.id = "jsftCanvas";
jsftCV.className = "jsft_Canvas";
document.body.appendChild(jsftCV);

var jsftCVH = document.createElement("canvas");
jsftCVH.id = "jsftCanvasH";
jsftCVH.className = "jsft_Canvas";
document.body.appendChild(jsftCVH);

const jsftCanvas = document.getElementById('jsftCanvas');
const ctx = jsftCanvas.getContext('2d');
const jsftCanvasH = document.getElementById('jsftCanvasH');
const ctxh = jsftCanvasH.getContext('2d');

let animationId = false;
var jsft_mode = '';
var jsft_MAXDOT = 500;
var jsft_cnt = 0;
var jsft_speed = 5;
var jsft_step = 8;
var jsft_step_max = 500;
var jsft_color = 'red';
var jsft_alpha = 0.5;

var jsft_bx = 0;
var jsft_by = 0;
var jsft_ex = 0;
var jsft_ey = 0;
var jsft_dx = 0;
var jsft_dy = 0;

var jsft_points = [];
var jsft_speed_n = 0;
var jsft_speed_cnt = 0;

function rand(a=100,b=1) {
    return Math.ceil(Math.random()*(a-b))+b;
}

function jsft_random() {
    jsft_speed = rand(8);
    jsft_step = rand(50,5);
    jsft_color = 'rgb('+rand(250,5)+','+rand(250,5)+','+rand(250,5)+')';
    jsft_alpha = rand(8,2)/10;
    jsft_MAXDOT= rand(800, 200);
}

function jsft_reset() {
    if(jsft_mode == "RANDOM")
        jsft_random();
    ctx.globalAlpha = jsft_alpha;
    ctx.strokeStyle = jsft_color;
    ctx.lineWidth = 0.5;
    jsft_ex =rand(jsftCanvas.width/jsft_step)*jsft_step;
    jsft_ey = rand(jsftCanvas.height/jsft_step)*jsft_step;
    jsft_cnt = rand(4);
    ctxh.globalAlpha = 0.8;
    ctxh.fillStyle = jsft_color;
    ctxh.strokeStyle = jsft_color;
    ctx.clearRect(0, 0, jsftCanvas.width, jsftCanvas.height);
    jsft_speed_cnt = 0;
}

function jsft_calc() {
    jsft_cnt += 1;
    if(jsft_cnt > jsft_MAXDOT){
        jsft_reset();
    }

    jsft_bx = jsft_ex;
    jsft_by = jsft_ey;

    switch(jsft_cnt%4){
        case 1:
            jsft_ey = jsft_ey - rand(Math.min(jsft_step_max, jsft_ey)/jsft_step)*jsft_step;
            jsft_dx=0; jsft_dy=-jsft_speed;
            jsft_speed_cnt=Math.ceil((jsft_by-jsft_ey)/jsft_speed)+1;
            break;
        case 2:
            jsft_ex = jsft_ex - rand(Math.min(jsft_step_max, jsft_ex)/jsft_step)*jsft_step;
            jsft_dx=-jsft_speed; jsft_dy=0;
            jsft_speed_cnt=Math.ceil((jsft_bx-jsft_ex)/jsft_speed)+1;
            break;
        case 3:
            jsft_ey = jsft_ey + rand(Math.min(jsft_step_max, jsftCanvas.height-jsft_ey)/jsft_step)*jsft_step;
            jsft_dx=0; jsft_dy=jsft_speed;
            jsft_speed_cnt=Math.ceil((jsft_ey-jsft_by)/jsft_speed)+1;
            break;
        default:
            jsft_ex = jsft_ex + rand(Math.min(jsft_step_max, jsftCanvas.width-jsft_ex)/jsft_step)*jsft_step;
            jsft_dx=jsft_speed; jsft_dy=0;
            jsft_speed_cnt=Math.ceil((jsft_ex-jsft_bx)/jsft_speed)+1;
            break;
    }

    jsft_speed_n = 0;
    jsft_points.length = 0;
    jsft_points.push({x:jsft_bx, y:jsft_by});
    for(i=0;i<jsft_speed_cnt-1;i++)
        jsft_points.push({x:jsft_bx+i*jsft_dx, y:jsft_by+i*jsft_dy});
    jsft_points.push({x:jsft_ex, y:jsft_ey});
}

function jsft_draw() {

    if(jsft_speed_n > jsft_speed_cnt-1)
        jsft_calc();
    else {
        const cp = jsft_points[jsft_speed_n];
        jsft_speed_n += 1;
        const cn = jsft_points[jsft_speed_n];
        ctx.beginPath();
        ctx.moveTo(cp.x, cp.y);
        ctx.lineTo(cn.x, cn.y);
        ctx.stroke();
        ctxh.clearRect(0, 0, jsftCanvasH.width, jsftCanvasH.height);
        if (new Date().getSeconds() % 2)
            ctxh.strokeRect(cn.x-3, cn.y-3, 6, 6);
        else
            ctxh.fillRect(cn.x-3, cn.y-3, 6, 6);
    }

    requestAnimationFrame(jsft_draw);
}

function resize_jsftCanvas() {
    jsftCanvas.width = window.innerWidth;
    jsftCanvas.height = window.innerHeight;
    jsftCanvasH.width = window.innerWidth;
    jsftCanvasH.height = window.innerHeight;
    jsft_reset();
}

window.addEventListener('resize', resize_jsftCanvas);
resize_jsftCanvas();

function jsft(mode="", speed=5, step=12, color='blue', alpha=0.5, maxdot=300) {
    jsft_mode = mode;
    jsft_speed = speed;
    jsft_step = step;
    jsft_color = color;
    jsft_alpha = alpha;
    jsft_MAXDOT= maxdot;
    jsft_reset();
    if(!animationId){
        animationId = true;
        jsft_draw();
    }
}

jsft("RANDOM");

