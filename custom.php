<?php

if(!isset($_GET['cmd'])) return;

include "common.php";

$url = urldecode($_SERVER['REQUEST_URI']);

$APP_PATH = substr($url, 0, strpos($url, 'custom.php'));
$DIR_PATH = str_replace('\\', '/', dirname(__FILE__));
if($DIR_PATH[-1] != '/')$DIR_PATH .= '/';
$DAT_PATH = $DIR_PATH.'datasets/documents/';
$CFG_PATH = $DAT_PATH.'homepage/config/';


$cmd = Strtoupper($_GET['cmd']);

// get random image
function random_image($mode) {
    global $CFG_PATH;

    $image_list = getImagelist($CFG_PATH.'images/');
    if(count($image_list)==0) return;

    if ($mode == 0)
        return $image_list[rand(0, count($image_list)-1)];
    else
        return $image_list[randint_day()%count($image_list)];
}

function get_bing_today_imageurl() {
	$str = file_get_contents('https://cn.bing.com/HPImageArchive.aspx?idx=0&n=1');
	if (preg_match("/<url>(.+?)<\/url>/", $str, $matches)) {
		$imgurl = 'https://cn.bing.com'.$matches[1];
		return $imgurl;
	}
}

function random_js($mode) {
    global $CFG_PATH;

    $js_list = glob($CFG_PATH.'javascript/*.js');
    if(count($js_list)==0) return;
    foreach ($js_list as &$v){
        $v = substr($v, strlen($CFG_PATH.'javascript/'));
    }
    
    if ($mode == 0)
        return $js_list[rand(0, count($js_list)-1)];
    else
        return $js_list[randint_day()%count($js_list)];
}

/*
custom.php?cmd=xxx&
cmd:
  IMAGE_OF_BING
  IMAGE_OF_RANDOM
  IMAGE_OF_DAY
  IMAGE_LIBRARY
  
  JS_OF_DAY
  JS_OF_RANDOM

*/
switch($cmd) {
    case "IMAGE_OF_DAY":
        echo random_image(1);
        return;
    case "IMAGE_OF_RANDOM":
        echo random_image(0);
        return;
    case "IMAGE_OF_BING":
    case "IMAGE_OF_BING_AUTOSAVE":
        for($i=0; $i<3; $i++) {
            $url = get_bing_today_imageurl();
            if($url != "") break;
        }
        for($i=0; $i<3; $i++) {
            $v1 = parse_url($url);
            parse_str($v1['query'], $v2);
            $imgfile = $CFG_PATH.'images/'.$v2['id'];
            if (file_exists($imgfile) && (filesize($imgfile)>30000) ){
                echo $v2['id'];
                return;
            }
            else {               
                if ($cmd == "IMAGE_OF_BING_AUTOSAVE") {
                    // get image and save to file
                    $image_data = file_get_contents($url);
                    file_put_contents($imgfile, $image_data);
                }
                else {
                    echo $url;
                    return;
                }
            }
        }
        return;
    case "IMAGE_LIBRARY":
        echo json_encode(getImagelist($CFG_PATH.'images/'));
        return;
    case "JS_OF_DAY":
        echo random_js(1);
        return;
    case "JS_OF_RANDOM":
        echo random_js(0);
        return;
    default: return;
}

?>