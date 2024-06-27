# Lorenz attractor

Using the dynamically generated Lorentz attractor curve as the background, various parameters can be set, with the default being the random parameter mode.

$$
\frac{dx}{dt} = \sigma \* (y - x) \\\\
\frac{dy}{dt} = x \* (\rho - z) - y \\\\
\frac{dz}{dt} = x \* y - \beta \* z 
$$



```
// Display Lorentz attractor curve with random parameters (default)
<script>WikiDocs_js("lorenz.js");</script>

// Display Lorentz attractor curve with default parameters
<script>WikiDocs_js("lorenz.js");</script>
<script>lorenz("");</script>

// Display the Lorentz attractor curve with specified parameters
<script>WikiDocs_js("lorenz.js");</script>
<script>lorenz("", 12,25,3);</script>
```

## Function parameters
- `function lorenz(mode="RANDOM", sigma=10.0, rho=28.0, beta=8/3.0, dt=0.01, MAXDOT=3000, scale=20, color1='rgba(20,40,200,0.3)', color2='rgba(50,180,200,0.8)')`

    - mode: display mode. `"RANDOM"`represents randomness, while others represent specified parameters.
    - sigma/rho/beta: The three parameters of the Lorentz attractor equation, default value are 10/28/2.67.
    - dt: Step distance parameter, the smaller the step distance, the higher the accuracy, but the slower the speed.
    - MAXDOTThe maximum number of displayed points, exceeding which will clear the screen and restart drawing.
    - scale: Display magnification factor set based on screen resolution.
    - color1: Curve color, supports CSS standard methods such as rgb, rgba.
    - color2: The color of the square representing the current point position.
<br>

<script>WikiDocs_js("lorenz.js");</script>

<style>
.divLorenz{
    border:solid 0px;
    margin:5px;
}
.spanLorenz{
    width:80px;
    display: inline-block;
    white-space: nowrap;
}
.btnLorenz{
    width:100px;
    height:30px;
    margin:10px;
    color:white;
}
.inputLorenz {
    border: 1px solid #555555;
    border-radius: 2px;
    height: 1.5em;
    width: 200px;
}
</style>

<div class="divLorenz">
<div class="divLorenz"><span class="spanLorenz">sigma</span><input class="inputLorenz browser-default" type="text" id="param_sigma" value="10" onchange="update_value=false"></div>
<div class="divLorenz"><span class="spanLorenz">rho</span><input class="inputLorenz browser-default" type="text" id="param_rho" value="28" onchange="update_value=false"></div>
<div class="divLorenz"><span class="spanLorenz">beta</span><input class="inputLorenz browser-default" type="text" id="param_beta" value="2.6667" onchange="update_value=false"></div>
<div class="divLorenz"><span class="spanLorenz">dt</span><input class="inputLorenz browser-default" type="text" id="param_dt" value="0.01" onchange="update_value=false"></div>
<div class="divLorenz"><span class="spanLorenz">scale</span><input class="inputLorenz browser-default" type="text" id="param_scale" value="20" onchange="update_value=false"></div>
<div class="divLorenz"><span class="spanLorenz">color1</span><input class="inputLorenz browser-default" type="text" id="param_color1" value="rgba(0,0,200,0.3)" onchange="update_value=false"></div>
<div class="divLorenz"><span class="spanLorenz">color2</span><input class="inputLorenz browser-default" type="text" id="param_color2" value="rgba(200,20,20,0.8)" onchange="update_value=false"></div>
<div class="divLorenz"><span class="spanLorenz">MAXDOT</span><input class="inputLorenz browser-default" type="text" id="param_MAXDOT" value="3000" onchange="update_value=false"></div>
</div>
<div class="divLorenz"><button onclick="lorenz_rand();" class="btnLorenz" style="background:rgb(40,200,40);">Random</button><button onclick="lorenz_default();" class="btnLorenz" style="background:rgb(40,60,200);">Default</button><button onclick="lorenz_user();" class="btnLorenz" style="background:rgb(200,60,40);">Custom</button></div>


<script>
let update_value = true;

function lorenz_user() {
    var sigma = document.getElementById("param_sigma").value;
    var rho = document.getElementById("param_rho").value;
    var beta = document.getElementById("param_beta").value;
    var dt = document.getElementById("param_dt").value;
    var MAXDOT = document.getElementById("param_MAXDOT").value;
    var scale = document.getElementById("param_scale").value;
    var color_1 = document.getElementById("param_color1").value;
    var color_2 = document.getElementById("param_color2").value;
    lorenz("", sigma, rho, beta, dt, MAXDOT, scale, color_1, color_2);
    update_value = false;
}

function lorenz_rand() {
    lorenz();
    update_value = true;
}

function lorenz_default() {
    lorenz("");
    update_value = true;
}

function get_value() {

    if (update_value){
        document.getElementById("param_sigma").value = _sigma;
        document.getElementById("param_rho").value = _rho;
        document.getElementById("param_beta").value = _beta;
        document.getElementById("param_dt").value = _dt;
        document.getElementById("param_MAXDOT").value = _MAXDOT;
        document.getElementById("param_scale").value = _scale;
        document.getElementById("param_color1").value = _color1;
        document.getElementById("param_color2").value = _color2;
    }
}

setInterval(get_value, 3000);

</script>
