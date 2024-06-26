var lorenzCSS = '.lorenzCanvas {position: fixed;margin: 0;padding: 0;overflow: hidden;top: 0;left: 0;width: 100vw;height: 100vh;background-color: transparent;pointer-events: none;z-index:100000;}';

var styleElement = document.createElement("STYLE");
styleElement.type = "text/css";
styleElement.appendChild(document.createTextNode(lorenzCSS));
var head = document.getElementsByTagName("HEAD")[0];
head.appendChild(styleElement);

var cv = document.createElement("canvas");
cv.id = "lorenzCanvas";
cv.className = "lorenzCanvas";
document.body.appendChild(cv);

var cvP = document.createElement("canvas");
cvP.id = "lorenzCanvasP";
cvP.className = "lorenzCanvas";
document.body.appendChild(cvP);

const canvas = document.getElementById('lorenzCanvas');
const ctx = canvas.getContext('2d');

const canvasP = document.getElementById('lorenzCanvasP');
const ctxP = canvasP.getContext('2d');
canvasP.width = window.innerWidth;
canvasP.height = window.innerHeight;

// default Lorentz attractor equation parameters
let _sigma = 10.0;
let _rho = 28.0;
let _beta = 8.0 / 3.0;
let _scale = 9; // Scale factor, used to adjust the size of the drawing
let x = 1.0;
let y = 1.0;
let z = 1.0;
let _dt = 0.01; // Step distance
let points = []; // point array
let _MAXDOT = 3000;
let _color1 = 'red';
let _color2 = 'blue';
let _mode = '';
let animationId = false;

function randrange(min, max) {
    return Math.random()*(max-min)+min;
}

function lorenz_randParam() {
    _sigma = randrange(5, 15);
    _rho = randrange(20, 36);
    _beta = randrange(2, 3);
    _dt = randrange(0.009, 0.015);
    _MAXDOT = Math.floor(randrange(2000, 5000));
    _scale = randrange(8, 40);
    _color1 = 'rgba('+Math.floor(randrange(40,240))+','+Math.floor(randrange(55,225))+','+Math.floor(randrange(30,255))+','+randrange(0.2,0.6)+')';
    _color2 = 'rgba('+Math.floor(randrange(120,240))+','+Math.floor(randrange(125,225))+','+Math.floor(randrange(130,255))+', 0.6)';
    ctx.strokeStyle = _color1;
    ctxP.strokeStyle = _color2;
}

function lorenz_initParam(sigma, rho, beta, dt, MAXDOT, scale, color1, color2) {
    _sigma=sigma;
    _rho=rho;
    _beta=beta;
    _dt=parseFloat(dt);
    _MAXDOT=MAXDOT;
    _scale=scale;
    _color1=color1;
    _color2=color2;
    ctx.strokeStyle = _color1;
    ctxP.strokeStyle = _color2;
}

function drawLorenz() {

    const dx = _sigma * (y - x) * _dt;
    const dy = (x * (_rho - z) - y) * _dt;
    const dz = (x * y - _beta * z) * _dt;

    x += dx;
    y += dy;
    z += dz;
    
    const x2d = canvas.width / 2 + x * _scale + y * _scale*0.2 ;
    const y2d = -canvas.height / 16 + z * _scale ;

    // 绘制点并连线
    if (points.length > 0) {
        const lastPoint = points[points.length - 1];
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(x2d, y2d);
        ctx.stroke();

        ctxP.beginPath();
        ctxP.clearRect(0, 0, canvasP.width, canvasP.height);
        ctxP.strokeRect(x2d-4, y2d-4, 8, 8);    
        ctxP.stroke();
    }

    if(points.length > _MAXDOT){
        reset();
    }

    points.push({x: x2d, y: y2d});
    requestAnimationFrame(drawLorenz);
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvasP.width = window.innerWidth;
    canvasP.height = window.innerHeight;
    reset();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // Initialize Canvas size

function reset() {
    if( _mode == "RANDOM" )
        lorenz_randParam();
    points.length = 0;
    ctx.lineWidth = 1;
    ctxP.lineWidth = 1;
    ctx.strokeStyle = _color1;
    ctxP.strokeStyle = _color2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function lorenz(mode="RANDOM", sigma=10.0, rho=28.0, beta=8/3.0, dt=0.01, MAXDOT=3000, scale=20, color1='rgba(20,40,200,0.3)', color2='rgba(50,180,200,0.8)') {

    _mode = mode;

    lorenz_initParam(sigma, rho, beta, dt, MAXDOT, scale, color1, color2);

    reset();
    if(!animationId) {
        animationId = true;
        requestAnimationFrame(drawLorenz);
    }
}

lorenz();
