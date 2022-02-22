<?php
/**
 * Functions
 *
 * @package WikiDocs
 * @author  Manuel Zavatta <manuel.zavatta@gmail.com>
 * @link    https://github.com/Zavy86/wikidocs
 */

// errors settings
error_reporting(E_ALL & ~E_NOTICE);
// initialize session
wdf_session_start();
// if behind https reverse proxy, set HTTPS property correctly
if (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] == 'https') $_SERVER['HTTPS']='on';
// check for configuration file
if(!file_exists(realpath(dirname(__FILE__))."/config.inc.php")){die("WikiDocs is not configured..<br><br>Launch <a href='setup.php'>Setup</a> script!");}
// include configuration file
require_once("config.inc.php");
// check debug from session
if(isset($_SESSION['wikidocs']['debug']) && ($_SESSION['wikidocs']['debug'] == 1)){$debug=true;}
// check debug from requests
if(isset($_GET['debug'])){
 if(DEBUGGABLE && $_GET['debug']==1){$debug=true;$_SESSION['wikidocs']['debug']=true;}
 else{$debug=false;$_SESSION['wikidocs']['debug']=false;}
}
// errors display for debug
ini_set("display_errors",$debug);
// get document id from rewrited url
$g_doc=strtolower(str_replace(array(" "),"-",$_GET['doc']));
// remove trailing slashes
if(substr($g_doc,-1)=="/"){$g_doc=substr($g_doc,0,-1);}
// set homepage as default if no request
if(!strlen($g_doc)){$g_doc="homepage";}
// make root dir from given path
$original_dir=str_replace("\\","/",realpath(dirname(__FILE__))."/");
$root_dir=substr($original_dir,0,strrpos($original_dir,(string)PATH));

/**
 * Definitions
 */
define("DEBUG",$debug);
define("VERSION",file_get_contents("VERSION.txt"));
define("HOST",(isset($_SERVER['HTTPS'])?"https":"http")."://".$_SERVER['HTTP_HOST']);
define("ROOT",$root_dir);
define("URL",HOST.PATH);
define("DIR",ROOT.PATH);
define("DOC",$g_doc);

/**
 * Classes
 */
require_once(DIR."classes/WikiDocs.class.php");
require_once(DIR."classes/Document.class.php");

/**
 * Initialize session and setup default sessions variables
 */
function wdf_session_start(){
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
 * @return integer 0 none, 1 view, 2 edit
 */
function wdf_authenticated(){
 return intval($_SESSION['wikidocs']['authenticated']);
}

/**
 * Dump a variable into a debug box (only if debug is enabled)
 *
 * @param string $variable Dump variable
 * @param string $label Dump label
 * @param string $class Dump class
 * @param boolean $force Force dump also if debug is disabled
 */
function wdf_dump($variable,$label=null,$class=null,$force=false){
 if(!DEBUG && !$force){return false;}
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
 * Document list in path
 *
 * @param string $parent Parent Document ID
 * @return array
 */
function wdf_document_list($parent=null){
 $documents_array=array();
 // check parameters
 if(substr($parent,-1)!="/"){$parent.="/";}
 if($parent=="/"){$parent=null;}
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
   if(!is_dir($directory_path.$element_fe)){continue;}
   // build directory
   $document=new stdClass();
   $document->id=$element_fe;
   $document->path=$parent.$element_fe;
   $document->url=URL.$document->path;
   $document->dir=$directory_path.$element_fe;
   // add element to documents array
   $documents_array[]=$document;
  }
 }
 // return
 return $documents_array;
}

/**
 * Documents List
 *
 * @param type $parent Parent document ID
 * @return index array
 */
function wdf_document_index($parent=null){
 // definitions
 $index_array=array();
 $documents_array=array();
 // get document list
 $directories_array=wdf_document_list($parent);
 // build documents array
 if(count($directories_array)){
  // cycle all documents
  foreach($directories_array as $document_fe){
   // definitions
   $document_url=$parent."/".$document_fe->id;
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
 * Documents search in path
 *
 * @param string $query String for search
 * @param string $parent Parent Document ID
 * @return array
 */
function wdf_document_search($query,$parent=null){
 // tree to array
 function tree_to_array(&$array,$parent=null){
  foreach(wdf_document_list($parent) as $dir_fe){
   //wdf_dump($dir);
   $array[]=$dir_fe->path;
   tree_to_array($array,$dir_fe->path);
  }
 }
 // definitions
 $paths_array=array();
 $matches_array=array();
 $queries_array=explode(" ",$query);
 // check for query or return the empty array
 if(!count($queries_array)){return $matches_array;}
 // get all documents directories recursively
 tree_to_array($paths_array,$parent);
 //wdf_dump($paths_array);
 // cycle all directories
 foreach($paths_array as $path_fe){
  // check if content file exist
  if(file_exists(DIR."documents/".$path_fe."/content.md")){
   // open file handle for read
   $handle=fopen(DIR."documents/".$path_fe."/content.md","r");
   if($handle){
    while(!feof($handle)){
     // get line in buffer
     $buffer=fgets($handle);
     // define a buffer id
     $buffer_id=md5($buffer.rand());
     // cycle all query words
     foreach($queries_array as $query_fe){
      // check for query word
      if(stripos($buffer,$query_fe)!==false){
       // highlight query word in buffer
       $buffer=str_ireplace($query_fe,"<mark>".$query_fe."</mark>",$buffer);
       $matches_array[$path_fe][$buffer_id]=$buffer;
       // skip current file after 3 matches
       if(count($matches_array[$path_fe])>2){continue(3);}
      }
     }
    }
    fclose($handle);
   }
  }
 }
 return $matches_array;
}

/**
 * Document title from content or path
 * @param string $document Document ID
 */
function wdf_document_title($document){
 // make path
 $content_path=DIR."documents/".$document."/content.md";
 // load content line by line to find document title if exist
 if(file_exists($content_path)){
  $handle=fopen($content_path,"r");
  while(!feof($handle)){
   $line=fgets($handle);
   if(substr($line,0,2)=="# "){
    $title=trim(substr($line,1));
    break;
   }
  }
  fclose($handle);
 }
 if(!strlen($title)){
  // make title by path
  $hierarchy=explode("/",$document);
  $title=ucwords(str_replace("-"," ",end($hierarchy)));
 }
 // return
 return $title;
}

?>
