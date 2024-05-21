<?php
/*
Text Counter by http://www.free-php-counter.com
You are allowed to remove advertising after you purchased a licence
*/

// settings
$counter_filename = str_replace('\\','/',dirname(__FILE__)."/datasets/documents/homepage/counter.txt");

// get basic information
$counter_time = time();

$add = true;

if (file_exists($counter_filename)) {

	// get current counter state
	$fp = fopen($counter_filename, "r");

	if ($fp) {
		$canWrite = false;
		while (!$canWrite)
			$canWrite = flock($fp, LOCK_EX);

		while (!feof($fp)) {
			$line = trim(fgets($fp, 1024));
		}
		flock($fp, LOCK_UN);
		fclose ($fp);
	}

    // increase counter
    if (isset($line))
        $tmp = explode("||", $line);
    else
        $tmp = array();

    if (sizeof($tmp) > 6) {
        // prevent errors
        list($day_arr, $yesterday_arr, $week_arr, $month_arr, $year_arr, $all, $lasttime) = $tmp;

        $add = ($counter_time - $lasttime) > 2 ? true : false;
        
        $day_data = explode(":", $day_arr);
        $yesterday_data = explode(":", $yesterday_arr);

        // yesterday
        $yesterday = $yesterday_data[1];
        if ($day_data[0] == (date("z")-1)) {
            $yesterday = $day_data[1];
        } else
        {
            if ($yesterday_data[0] != (date("z")-1)) {
                $yesterday = 0;
            }
        }

        // day
        $day = $day_data[1];
        if ($add)
            if ($day_data[0] == date("z")) $day++; else $day = 1;

        // week
        $week_data = explode(":", $week_arr);
        $week = $week_data[1];
        if ($add)
            if ($week_data[0] == date("W")) $week++; else $week = 1;

        // month
        $month_data = explode(":", $month_arr);
        $month = $month_data[1];
        if ($add)
            if ($month_data[0] == date("n")) $month++; else $month = 1;

        // year
        $year_data = explode(":", $year_arr);
        $year = $year_data[1];
        if ($add)
            if ($year_data[0] == date("Y")) $year++; else $year = 1;

        // all
        if ($add)
            $all++;

    } else
    {
        // default value
        $yesterday = 0;
        $day = $week = $month = $year = $all = 1;
    }
} else
{
    // default value
    $yesterday = 0;
    $day = $week = $month = $year = $all = 1;
}

$wikistat = '📊 '.$TXT->Today.' <b><font color="#0080FF">'.$day.'</font></b> &nbsp'.$TXT->Yesterday.' <b><font color="#A04020">'.$yesterday.'</font></b> &nbsp'.$TXT->Week.' <b><font color="#12CC22">'.$week.'</font></b> &nbsp'.$TXT->Month.' <b><font color="#CF8C52">'.$month.'</font></b> &nbsp'.$TXT->Year.' <b><font color="#801010">'.$year.'</font></b> &nbsp'.$TXT->All.' <b><font color="#002288">'.$all.'</font></b>';

if (!$add)
    return;

$fp = fopen($counter_filename, "w+");
if ($fp) {
    $canWrite = false;
    while (!$canWrite)
        $canWrite = flock($fp, LOCK_EX);

    $add_line1 = date("z") . ":" . $day . "||" . (date("z")-1) . ":" . $yesterday . "||" . date("W") . ":" . $week . "||" . date("n") . ":" . $month . "||" . date("Y") . ":" . $year . "||" . $all . "||" . $counter_time;
    fwrite($fp, $add_line1);

    flock($fp, LOCK_UN);
    fclose($fp);
}
?>
