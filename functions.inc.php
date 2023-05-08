<?php
/**
 * Functions
 *
 * @package WikiDocs
 * @repository https://github.com/Zavy86/wikidocs
 */

/**
 * Dump a variable into a debug box (only if debug is enabled)
 *
 * @param mixed $variable Dump variable
 * @param ?string $label Dump label
 * @param ?string $class Dump class
 * @param bool $force Force dump also if debug is disabled
 */
function wdf_dump($variable,?string $label=null,?string $class=null,bool $force=false):void{
	if(!DEBUG && !$force){return;}
	echo "\n<!-- dump -->\n";
	echo "<pre class='debug ".$class."'>\n";
	if($label<>null){echo "<b>".$label."</b>\n";}
	if(is_string($variable)){$variable=str_replace(array("<",">"),array("&lt;","&gt;"),$variable);}
	print_r($variable);
	echo "</pre>\n<!-- /dump -->\n";
}

/**
 * Redirect (if debug is enabled show a redirect link)
 *
 * @param string $location Location URL
 */
function wdf_redirect(string $location):void{
	if(DEBUG){die("<a href=\"".$location."\">".$location."</a>");}
	exit(header("location: ".$location));
}

/**
 * Alert (if debug is enabled show a debug message)
 *
 * @param string $message Alert message
 * @param string $class Alert class (success|info|warning|danger)
 * @return bool
 */
function wdf_alert(string $message,string $class="info"):bool{
	// checks
	if(!$message){return false;}
	// build alert object
	$alert=new stdClass();
	$alert->timestamp=time();
	$alert->message=$message;
	$alert->class=$class;
	// check for debug
	if(!DEBUG){
		// add alert to session alerts
		$_SESSION['wikidocs']['alerts'][]=$alert;
	}else{
		// swicth class
		switch($class){
			case "success":$message="(!) ".$message;break;
			case "warning":$message="/!\\ ".$message;break;
			case "danger":$message="<!> ".$message;break;
			default:$message="(?) ".$message;
		}
		// dump alert
		wdf_dump($message,"ALERT");
	}
	// return
	return true;
}

/**
 * Timestamp Format
 *
 * @param ?int $timestamp Unix timestamp
 * @param string $format Date Time format (see php.net/manual/en/function.date.php)
 * @return string|boolean Formatted timestamp or false
 * @throws Exception
 */
function wdf_timestamp_format(?int $timestamp,string $format="Y-m-d H:i:s"){
	if(!is_numeric($timestamp) || $timestamp==0){return false;}
	// build date time object
	$datetime=new DateTime("@".$timestamp);
	// return date time formatted
	return $datetime->format($format);
}
