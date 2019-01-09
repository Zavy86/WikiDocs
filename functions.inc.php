<?php
/**
 * Functions
 *
 * @package WikiDocs
 * @author  Manuel Zavatta <manuel.zavatta@gmail.com>
 * @link    https://github.com/Zavy86/wikidocs
 */

// initialize session
session_start();
// check for session array
if(!is_array($_SESSION['wikidocs'])){$_SESSION['wikidocs']=array();}
// check for alerts array
if(!is_array($_SESSION['wikidocs']['alerts'])){$_SESSION['wikidocs']['alerts']=array();}
// check debug from session
if($_SESSION['wikidocs']['debug']){$debug=true;}
// check debug from requests
if(isset($_GET['debug'])){
 if($_GET['debug']==1){$debug=true;$_SESSION['wikidocs']['debug']=true;}
 else{$debug=false;$_SESSION['wikidocs']['debug']=false;}
}
// errors settings
error_reporting(E_ALL & ~E_NOTICE);
ini_set("display_errors",$debug);
// check for configuration file
if(!file_exists(realpath(dirname(__FILE__))."/config.inc.php")){die("WikiDocs is not configured..<br><br><a href=\"setup.php\">Setup it now!</a>");}
// include configuration file
require_once("config.inc.php");
// get document id from rewrited url
$g_doc=strtolower(str_replace(array(" "),"-",$_GET['doc']));
// remove trailing slashes
if(substr($g_doc,-1)=="/"){$g_doc=substr($g_doc,0,-1);}
// set homepage as default if no request
if(!strlen($g_doc)){$g_doc="homepage";}

/**
 * Definitions
 */
define('DEBUG',$debug);
define('VERSION',file_get_contents("VERSION.txt"));
define('HOST',(isset($_SERVER['HTTPS'])?"https":"http")."://".$_SERVER['HTTP_HOST']);
define('ROOT',str_replace(PATH,"",str_replace("\\","/",realpath(dirname(__FILE__))."/")));
define('URL',HOST.PATH);
define('DIR',ROOT.PATH);
define('DOC',$g_doc);

/**
 * Classes
 */
require_once(DIR."classes/WikiDocs.class.php");
require_once(DIR."classes/Document.class.php");

/**
 * Authentication status
 *
 * @return boolean
 */
function wdf_authenticated(){
 return boolval($_SESSION['wikidocs']['authenticated']);
}

/**
 * Dump a variable into a debug box (only if debug is enabled)
 *
 * @param string $variable Dump variable
 * @param string $label Dump label
 * @param string $class Dump class
 */
function wdf_dump($variable,$label=null,$class=null){
 if(!DEBUG){return false;}
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
function wdf_redirect($location){
 if(DEBUG){die("<a href=\"".$location."\">".$location."</a>");}
 exit(header("location: ".$location));
}

/**
 * Alert (if debug is enabled show a debug message)
 *
 * @param string $message Alert message
 * @param string $class Alert class (success|info|warning|danger)
 * @return boolean
 */
function wdf_alert($message,$class="info"){
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
 * @param integer $timestamp Unix timestamp
 * @param string $format Date Time format (see php.net/manual/en/function.date.php)
 * @return string|boolean Formatted timestamp or false
 */
function wdf_timestamp_format($timestamp,$format="Y-m-d H:i:s"){
 if(!is_numeric($timestamp) || $timestamp==0){return false;}
 // build date time object
 $datetime=new DateTime("@".$timestamp);
 // return date time formatted
 return $datetime->format($format);
}

/**
 * Documents List
 *
 * @param type $parent Parent document ID
 * @return index array
 */
function wdf_document_list($parent=null){
 // definitions
 $index_array=array();
 $directories_array=array();
 $documents_array=array();
 // check parameters
 if(substr($parent,-1)=="/"){$parent=substr($parent,0,-1);}
 // make directory full path
 $directory_path=DIR."documents/".$parent;
 // check for directory
 if(is_dir($directory_path)){
  // scan directory for documents
  $elements=scandir($directory_path);
  // cycle all elements
  foreach($elements as $element_fe){
   // skip versioning and files
   if(in_array($element_fe,array(".","..","versions","homepage"))){continue;}
   if(!is_dir($directory_path."/".$element_fe)){continue;}
   // add element to documents array
   $directories_array[]=$element_fe;
  }
 }
 // build documents array
 if(count($directories_array)){
  // cycle all documents
  foreach($directories_array as $document_fe){
   // definitions
   $document_url=$parent."/".$document_fe;
   $document_label=wdf_document_title($document_url);
   // check document url
   if(substr($document_url,0,1)=="/"){$document_url=substr($document_url,1);}
   // add document to documents array
   $documents_array[$document_url]=$document_label;
  }
 }
 // sort document array by title
 asort($documents_array);
 // cycle all documents and build index array
 foreach($documents_array as $url_fe=>$label_fe){
  // build index element
  $element=new stdClass();
  $element->label=$label_fe;
  $element->url=$url_fe;
  // add element to index array
  $index_array[]=$element;
 }
 // return
 return $index_array;
}

/**
 * Document title from content or path
 * @param string $document Document ID
 */
function wdf_document_title($document){
 // make path
 $content_path=DIR."documents/".$document."/content.md";
 // load first line for document title if exist
 if(file_exists($content_path)){
  $firstline=fgets(fopen($content_path,"r"));
  // check if firstline is the title
  if(substr($firstline,0,1)=="#"){$title=trim(substr($firstline,1));}
 }else{
  // make title by path
  $hierarchy=explode("/",$document);
  $title=ucwords(str_replace("-"," ",end($hierarchy)));
 }
 // return
 return $title;
}

?>