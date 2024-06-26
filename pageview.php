<?php

$ct = time();
$lt = 0;
$pageview = '';
$base_path = dirname(__DIR__);
$url = urldecode($_SERVER['REQUEST_URI']);

if (strstr($url, '?')) return;

$index = strlen($APP->PATH);
if($url == $APP->PATH)$url = $APP->PATH.'homepage/';
$url = substr_replace($url, 'datasets/documents/', $index, 0);
$filename = str_replace('\\','/',urldecode($base_path.$url.'/content.md.view'));


if (file_exists($filename)){

	$line = file_get_contents($filename);

	$arr = explode('||', $line);
	$count = isset($arr[0]) ? $arr[0]:0;
	$lt = isset($arr[1]) ? $arr[1]:0;
}
else{
    $count = 0;
    $lt = 0;
}

if(($ct-$lt)>2) {

    $count++;

    file_put_contents($filename, $count.'||'.$ct, LOCK_EX);
}

$pageview = $TXT->ViewCount.": <b>".$count."</b>";

?>