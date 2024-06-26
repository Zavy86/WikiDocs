<?php

$datafile = str_replace('\\','/',dirname(__FILE__)."/datasets/documents/homepage/statistics.txt");

$updatecount = false;

if(!file_exists($datafile)){
    $pagenumber = '📝 <b>0</b> 🖼️ <b>0</b>';
    $updatecount = true;
}
else {
    $c = file($datafile);
    if(count($c)<1){
        $pagenumber = '📝 <b>0</b> 🖼️ <b>0</b>';
        $updatecount = true;
    }
    else {
        $arr = explode('||', $c[0]);
        if(count($arr)<2){
            $pagenumber = '📝 <b>0</b> 🖼️ <b>0</b>';
            $updatecount = true;
        }
    }
}

$pagenumber = '📝 <b>'.$arr[0].'</b> 🖼️ <b>'.$arr[1].'</b>';

if( $updatecount || (!isset($arr[2])) || ((time() - $arr[2])>300))
    $updatefilecount = 1;
else
    $updatefilecount = 0;

echo "<script>wikidocs_FLAG_UPDATE_FILECOUNT = ".$updatefilecount.";</script>";

?>