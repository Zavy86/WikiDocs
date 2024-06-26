
var cssText = '*{margin: 0;padding: 0;}.content{width: 100vw;height: 100vh;background-size: 120%;} #rainBox{position: fixed;top: 0;left: 0;width: 100vw;height: 100vh;pointer-events: none;} .rain{position: absolute;width: 2px;height: 50px;background: linear-gradient(rgba(255,255,255,.3),rgba(255,255,255,.6));}';
var styleElement = document.createElement("STYLE");
styleElement.type = "text/css";
styleElement.appendChild(document.createTextNode(cssText));
var head = document.getElementsByTagName("HEAD")[0];
head.appendChild(styleElement);

var rainDiv = document.createElement("DIV");
rainDiv.innerHTML = '<div id="rainBox"></div><div class="content">     </div>';
document.body.appendChild(rainDiv);

const box=document.getElementById('rainBox');
let boxHeight=box.clientHeight;
let boxWidth=box.clientWidth;
// change the box size when the page size changes
window.onresize=function(){
	boxHeight=box.clientHeight;
	boxWidth=box.clientWidth;
};
// Add raindrops every once in a while
setInterval(()=>{
const rain=document.createElement('div');
rain.classList.add('rain');
rain.style.top=0;
// Randomly refresh raindrop positions
rain.style.left=Math.random()*boxWidth+'px';
// Random raindrop transparency
rain.style.opacity=Math.random();
box.appendChild(rain);
// Every once in a while, rainwater falls
let race=1;
const timer=setInterval(()=>{
	if(parseInt(rain.style.top)>boxHeight){
		clearInterval(timer);
		box.removeChild(rain);
	}
	race++;
	rain.style.top=parseInt(rain.style.top)+race+'px'
},20)
},50);