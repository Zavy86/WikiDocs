<?php

// search config file
$file_search = str_replace('\\','/',dirname(__FILE__).'/datasets/documents/homepage/config/search/content.md');
// navigator config file
$file_nav = str_replace('\\','/',dirname(__FILE__).'/datasets/documents/homepage/config/nav/content.md');
// Daily Motto
$file_dm = str_replace('\\','/',dirname(__FILE__).'/datasets/documents/homepage/config/dailymotto/content.md');

// search config array
$arr_sd = '';

// navigator url config array
$arr_nd = '';

function AnalyseConfig($file, &$arr) {
    $arr = '';
    $ss = array('');

    if(file_exists($file)){
        // load file to array
        $ss = file($file);

        foreach($ss as $v){
            // trim blank
            $a = trim($v);
            if ($a == '') continue;
            // first char must be '-' or '*'
            if (($a[0] <> '-')&&(($a[0] <> '*'))) continue;
            // replace '，' to ',' then explode to sub-array $tmp
            $tmp = explode('|', substr($a, 1));
            $arr = $arr.'[';
            for($n=0; $n<count($tmp); $n++){
                $arr = $arr.'"'.trim($tmp[$n]).'",';
            }
            $arr = $arr.'],';
        }
    }
    // add '[ ]'
    $arr = '['.$arr.'[""]];';
}

AnalyseConfig($file_search, $arr_sd);
AnalyseConfig($file_nav, $arr_nd);

$dm = $dmh = $dms = '';
if(file_exists($file_dm)){
    $ss = file($file_dm);
    $ar = array();
    foreach($ss as $v){
        // trim blank
        $a = trim($v);
        if ($a == '') continue;
        // first char must be '-' or '*'
        if (($a[0] <> '-')&&(($a[0] <> '*'))) continue;
        // add a line
        $t = trim(substr($a, 1));
        if ($t != '')
            array_push($ar, $t);
    }

    if(count($ar) > 0) {
        $tdm = explode('|', $ar[randint_day() % count($ar)]);
        list($dm, $dmh, $dms) = $tdm;
    }
}

echo "<script>  wikidocs_ArraySearch = ".$arr_sd.";\n  wikidocs_ArrayNav = ".$arr_nd.";\n  wikidocs_dm = '".addslashes(trim($dm))."';\n  wikidocs_dm_hint ='".addslashes(trim($dmh))."';\n  wikidocs_dm_style = '".trim($dms)."';\n</script>";

?>