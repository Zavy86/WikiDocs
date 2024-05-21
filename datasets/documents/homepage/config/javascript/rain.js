
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
// 页面大小发生变化时，改变盒子大小
window.onresize=function(){
	boxHeight=box.clientHeight;
	boxWidth=box.clientWidth;
};
// 每隔一段时间,添加雨滴
setInterval(()=>{
const rain=document.createElement('div');
rain.classList.add('rain');
rain.style.top=0;
// 随机刷新雨点位置
rain.style.left=Math.random()*boxWidth+'px';
// 随机雨点透明度
rain.style.opacity=Math.random();
box.appendChild(rain);
// 每隔一段时间,雨水下落
let race=1;
const timer=setInterval(()=>{
	// 判断“雨滴”元素的top属性是否超出“盒子”元素的高度来决定是否停止动画
	if(parseInt(rain.style.top)>boxHeight){
		clearInterval(timer);
		box.removeChild(rain);
	}
	// 每次定时器执行时，“雨滴”元素的top值会逐渐增加，
	//并且增加的速率会随着时间的推移而逐渐加快
	race++;
	rain.style.top=parseInt(rain.style.top)+race+'px'
},20)
},50);