/*
大圆半径: R
小圆半径: r
笔距离小圆圆心: d
大圆转动角度: a

(R-r)*a+(360-a*R/r)*(r-d)

*/

var flowerCurveCSS = '.flowerCurveCanvas {position: fixed;margin: 0;padding: 0;overflow: hidden;top: 0;left: 0;width: 100vw;height: 100vh;background-color: transparent;pointer-events: none;z-index:100000;}';

var styleElement = document.createElement("STYLE");
styleElement.type = "text/css";
styleElement.appendChild(document.createTextNode(flowerCurveCSS));
var head = document.getElementsByTagName("HEAD")[0];
head.appendChild(styleElement);

var cv = document.createElement("canvas");
cv.id = "flowerCurveCSS";
cv.className = "flowerCurveCanvas";
document.body.appendChild(cv);

const canvas = document.getElementById('flowerCurveCSS');
const ctx = canvas.getContext('2d');

var cvC = document.createElement("canvas");
cvC.id = "flowerCurveCSSC";
cvC.className = "flowerCurveCanvas";
document.body.appendChild(cvC);

const canvasC = document.getElementById('flowerCurveCSSC');
const ctxC = canvas.getContext('2d');

let _R = 501;
let _r = 322;
let _d = 50;
let _dt = 0.001;
let _color = 'rgba(200,0,0,0.5);';
let _width = 1;
let _MAXDOT = 20000;

let _mode = '';
let points = []; // 保存绘制的点
let ang = 0;
let animationId = false;

function randrange(min, max) {
    return Math.random()*(max-min)+min;
}

function flowerCurve_randParam() {
    _R = Math.floor(randrange(200, canvas.height/2));
    _r = Math.floor(randrange(50,canvas.height/4));
    _d = Math.floor(randrange(-50, canvas.height/4));
    _dt = randrange(3/10000, 2/1000);
    _color = 'rgba('+Math.floor(randrange(10,240))+','+Math.floor(randrange(15,225))+','+Math.floor(randrange(10,255))+','+randrange(0.1,0.4)+')';
    _width = 1;
    _MAXDOT = Math.floor(randrange(1500, 30000));
}

function flowerCurve_initParam(R, r, d, dt, color, width, maxdot) {
    _R = R;
    _r = r;
    _d = d;
    _dt = parseFloat(dt);
    _width = width;
    _MAXDOT = maxdot;
    _color = color;
}

function dot(ang = 0) {
    const x1 = (_R - _r)*Math.cos(ang*180/Math.PI);
    const y1 = (_R - _r)*Math.sin(ang*180/Math.PI);
    const b = 360 - ang*_R/_r;
    const x2 = (_r-_d)*Math.cos(b*180/Math.PI);
    const y2 = (_r-_d)*Math.sin(b*180/Math.PI);
    
    x2d = canvas.width / 2 + x1 - x2;
    y2d = canvas.height / 2 + y1 - y2;    
}

function draw() {
    dot(ang);
    ang += _dt;
    
    if (points.length > 0) {
        const lastPoint = points[points.length - 1];
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(x2d, y2d);
        ctx.lineWidth = _width;
        ctx.stroke();

        //ctxC.beginPath();
        //ctxC.clearRect(0, 0, canvasC.width, canvasC.height);
        //ctxC.strokeRect(x2d-4, y2d-4, 8, 8);
        //ctxC.stroke();
    }

    if(points.length > _MAXDOT){
        reset();
    }

    points.push({x: x2d, y: y2d});
    requestAnimationFrame(draw);
}

function reset() {
    if( _mode == "RANDOM" )
        flowerCurve_randParam();
    ang = 0;
    dot();
    points.length = 0;
    ctx.strokeStyle = _color;
    ctx.lineWidth = _width;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctxC.strokeStyle = _color;
    ctxC.lineWidth = 1;
    //console.log('Mode: '+_mode);
    //console.log('R, r, d: '+_R+' '+_r+' '+_d);
    //console.log('dt, MAX: '+_dt+' '+_MAXDOT);
    //console.log('color, width: '+_color+' '+_width);
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvasC.width = window.innerWidth;
    canvasC.height = window.innerHeight;
    reset();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // 初始化Canvas大小

function flowerCurve(mode="RANDOM", R=500, r=310, d=65, dt=0.001, color='rgba(200,0,0,0.1)', width=1, maxdot=5000) {
    _mode = mode;

    flowerCurve_initParam(R, r, d, dt, color, width, maxdot);

    //console.log('Draw flower curve.');

    reset();
    if(!animationId) {
        animationId = true;
        requestAnimationFrame(draw);
    }
}

flowerCurve();