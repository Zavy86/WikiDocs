<?php

if(!isset($RECENT_MAX_NUMBER)) $RECENT_MAX_NUMBER = 20;

$url = urldecode($_SERVER['REQUEST_URI']);
$ul = ' ['.$url.']('.$url.')'.PHP_EOL;
$RecentLink = '';
$linkurl = $APP->PATH.'homepage/recent';

// return in edit mode and recent page
if ((strstr($url, '?')) || (strcasecmp($url, $linkurl)==0)) return;


$filename = str_replace('\\','/',dirname(__FILE__)."/datasets/documents/homepage/recent/content.md");

if(!file_exists(dirname($filename))){
    mkdir(dirname($filename));
}

$c = array('');
if(file_exists($filename)){
    $c = file($filename);
    for($i=0; $i < count($c); $i++){
        list($tmp, $u) = explode(',', $c[$i]);
        // delete url
        if(isset($u))
            if($u == $ul)
                unset($c[$i]);
    }
}

// add date and url to last
array_push($c, '1. '.date("Y-m-d H:i:s").','.$ul);

if(count($c) > $RECENT_MAX_NUMBER){
    for($i=0; $i < count($c) - $RECENT_MAX_NUMBER + 1; $i++)
        unset($c[$i]);
}

// write to file
file_put_contents($filename, $c,  LOCK_EX | FILE_USE_INCLUDE_PATH);

$RecentLink = "<a href='".$linkurl."' title='".$TXT->Recent."'>📒</a>&nbsp;&nbsp;";

?>