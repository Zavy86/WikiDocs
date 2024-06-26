<?php

if(!isset($_GET['cmd'])) return;
$cmd = Strtoupper($_GET['cmd']);
if($cmd != 'UPDATE') return;

function statistics($dir, &$doc, &$img){
    global $exts;

    $arr = glob($dir);
    foreach($arr as $v){
        if(is_file($v)){
            if(basename($v) == 'content.md') $doc++;

            foreach($exts as $ext){
                if(substr($v, -strlen($ext)) == $ext) {
                    $img++;
                    break;
                }
            }
        }
        else
            statistics($v."/*", $doc, $img);
    }
}

$basedir = str_replace('\\','/',dirname(__FILE__));
$datafile = $basedir."/datasets/documents/homepage/statistics.txt";

$ct = time();
$update = false;

if(!file_exists($datafile)){
    $update = true;
}
else {
    $c = file($datafile);
    if(count($c)<1){
        $update = true;
    }
    else {
        $arr = explode('||', $c[0]);
        if(count($arr)<3){
            $update = true;
        }
        else {
            if(($ct - $arr[2]) > 300)
                $update = true;
        }
    }
}

$exts = ['.png', '.gif', '.jpg', 'jpeg', '.svg', '.webp'];
$doc = $img = 0;

if($update) {

    statistics($basedir."/datasets/documents/*", $doc, $img);

    file_put_contents($datafile, $doc.'||'.$img.'||'.$ct, LOCK_EX);
    
    clearstatcache();
}

?>