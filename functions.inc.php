<?php
/**
 * Functions
 *
 * @package WikiDocs
 * @author  Manuel Zavatta <manuel.zavatta@gmail.com>
 * @link    https://github.com/Zavy86/wikidocs
 */

// initialize session
wdf_session_start();
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
if(!file_exists(realpath(dirname(__FILE__))."/config.inc.php")){die("WikiDocs is not configured..<br><br>Launch <a href='setup.php'>Setup</a> script!");}
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
define('ROOT',rtrim(str_replace("\\","/",realpath(dirname(__FILE__))."/"),PATH));
define('URL',HOST.PATH);
define('DIR',ROOT.PATH);
define('DOC',$g_doc);

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
 if(!is_array($_SESSION['wikidocs'])){$_SESSION['wikidocs']=array();}
 // check for application session alerts array
 if(!is_array($_SESSION['wikidocs']['alerts'])){$_SESSION['wikidocs']['alerts']=array();}
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