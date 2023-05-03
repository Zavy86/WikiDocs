<?php
/**
 * Functions
 *
 * @package WikiDocs
 * @author  Manuel Zavatta <manuel.zavatta@gmail.com>
 * @link    https://github.com/Zavy86/wikidocs
 */

/**
 * Initialize session and setup default sessions variables
 */
function wdf_session_start():void{
	// start php session
	session_start();
	// check for application session array
	if(!isset($_SESSION['wikidocs']) || !is_array($_SESSION['wikidocs'])){$_SESSION['wikidocs']=array();}
	// check for application session alerts array
	if(!isset($_SESSION['wikidocs']['alerts']) || !is_array($_SESSION['wikidocs']['alerts'])){$_SESSION['wikidocs']['alerts']=array();}
}

/**
 * Authentication level
 *
 * @return int 0 none, 1 view, 2 edit
 */
function wdf_authenticated():int{
	return intval($_SESSION['wikidocs']['authenticated'] ?? '');
}

/**
 * Dump a variable into a debug box (only if debug is enabled)
 *
 * @param mixed $variable Dump variable
 * @param ?string $label Dump label
 * @param ?string $class Dump class
 * @param bool $force Force dump also if debug is disabled
 */
function wdf_dump($variable,?string $label=null,?string $class=null,bool $force=false):bool{
	if(!DEBUG && !$force){return false;}
	echo "\n<!-- dump -->\n";
	echo "<pre class='debug ".$class."'>\n";
	if($label<>null){echo "<b>".$label."</b>\n";}
	if(is_string($variable)){$variable=str_replace(array("<",">"),array("&lt;","&gt;"),$variable);}
	print_r($variable);
	echo "</pre>\n<!-- /dump -->\n";
	return true;
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
