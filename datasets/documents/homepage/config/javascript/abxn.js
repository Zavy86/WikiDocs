/*

Function formula:

  X(n+1) = A - B / X(n)

*/

var abxnCSS = '.abxnCanvas {position: fixed;margin: 0;padding: 0;overflow: hidden;top: 0;left: 0;width: 100vw;height: 100vh;background-color: transparent;pointer-events: none;z-index:100000;}';

var styleElement = document.createElement("STYLE");
styleElement.type = "text/css";
styleElement.appendChild(document.createTextNode(abxnCSS));
var head = document.getElementsByTagName("HEAD")[0];
head.appendChild(styleElement);

var cv = document.createElement("canvas");
cv.id = "abxnCanvas";
cv.className = "abxnCanvas";
document.body.appendChild(cv);

const canvas = document.getElementById('abxnCanvas');
const ctx = canvas.getContext('2d');


let _A = 1;
let _B = 100;
let _X0 = -11;
let _color = 'rgba(200,0,0,0.2)';
let _N = 5000;

let _mode = '';
let cnt=0;
let Xn;
let points = [];
let animationId = false;

function randrange(min, max) {
    return Math.random()*(max-min)+min;
}

function abxn_randParam() {
    _A = randrange(0.1, 3);
    _B = randrange(3, 200);
    _X0 = randrange(-100, -0.01);
    _N = randrange(2000, 5000);
    _color = 'rgba('+Math.floor(randrange(0,255))+','+Math.floor(randrange(0,255))+','+Math.floor(randrange(0,255))+','+randrange(0.2,0.6)+')';
    Xn = _X0;
}

function reset() {
    if( _mode == "RANDOM" )
        abxn_randParam();

    cnt = 0;
    points=Array(Math.round(canvas.width/2)).fill(0);
    ctx.strokeStyle = _color;
    
    //console.log('Mode: '+_mode);
    //console.log('A, B, X0: '+_A+' '+_B+' '+_X0);
    //console.log('color, MAXDOT: '+_color+' '+_N);
}

function draw() {

    // new Xn
    Xn = _A - _B / Xn;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    for(i=0;i<Math.round(canvas.width/2);i++){
        ctx.moveTo(i*2, canvas.height/2);
        ctx.lineTo(i*2, canvas.height/2 - points[i]);
    }
    ctx.lineWidth = 0.5;
    ctx.stroke();
    cnt++;

    if(cnt > _N){
        reset();
    }

    points.push(Xn);
    if(points.length > Math.round(canvas.width/2))
        points.shift();
    requestAnimationFrame(draw);
}


function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    reset();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // 初始化Canvas大小


function abxn(mode="RANDOM", A=1, B=100, X0=-11, color="rgba(200,0,0,0.4)", maxdot=3000) {
    _mode = mode;
    _A = A;
    _B = B;
    _X0 = X0;
    _N = maxdot;
    _color = color;
    Xn = _X0;

    reset();

    //console.log('Draw');

    if (!animationId) {
        animationId = true;
        requestAnimationFrame(draw);
    }
}

abxn();
