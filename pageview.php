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
    $fp = fopen($filename, "r");

	if ($fp) {
		$canWrite = false;
		while (!$canWrite)
			$canWrite = flock($fp, LOCK_EX);

		while (!feof($fp)) {
			$line = trim(fgets($fp, 128));
		}
		flock($fp, LOCK_UN);
		fclose ($fp);
	}

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

    $fp = fopen($filename, "w+");
    if ($fp) {
        $canWrite = false;
        while (!$canWrite)
            $canWrite = flock($fp, LOCK_EX);

        fwrite($fp, $count.'||'.$ct);
        flock($fp, LOCK_UN);
        fclose($fp);
    }
}

$pageview = $TXT->ViewCount.": <b>".$count."</b>";

?>