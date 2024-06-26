<?php

// generate daily random numbers for daily quotes
function randint_day(){
    $D1 = new DateTime('1900-01-01');
    $D2 = new DateTime();
    $n = $D1->diff($D2)->days;  // get date difference
    for($i=0;$i<5;$i++)         // iteration 5 times
        $n = (142857*$n+31)%65536;
    return $n;
}

// return image filename array
function getImagelist($path) {
    $image_list = array_merge(glob($path.'*.png'), glob($path.'*.jpg'), glob($path.'*.jpeg'), glob($path.'*.svg'), glob($path.'*.webp'));
    foreach ($image_list as &$v){
        $v = substr($v, strlen($path));
    }
    return $image_list;
}

?>