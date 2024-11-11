<?php
/**
 * Bootstrap
 *
 * @package WikiDocs
 * @repository https://github.com/Zavy86/wikidocs
 */

// error reporting
error_reporting(E_ALL);
ini_set('display_errors',(isset($_GET['debug']) && $_GET['debug']==1));

// base directory
define('BASE',str_replace(['/','\\'],DIRECTORY_SEPARATOR,__DIR__.'/'));
if(version_compare(PHP_VERSION,'7.4.0')<0){die('Required at least PHP version 7.4.0, current version: '.PHP_VERSION);}

// require functions and classes
require_once(BASE.'functions.inc.php');
require_once(BASE.'classes/WikiDocs.class.php');
require_once(BASE.'classes/Localization.class.php');
require_once(BASE.'classes/Document.class.php');
require_once(BASE.'classes/Session.class.php');

// require external libraries
require_once(BASE."libraries/parsedown-1.8.0-beta-6/Parsedown.php");
require_once(BASE."libraries/parsedown-extra-0.8.1/ParsedownExtra.php");
require_once(BASE."libraries/parsedown-extended-1.1.2-modified/ParsedownExtended.php");
require_once(BASE."libraries/parsedown-filter-0.0.1/ParsedownFilter.php");
require_once(BASE."libraries/parsedown-plus-0.0.8/ParsedownPlus.php");

// if behind https reverse proxy, set HTTPS property correctly
if(isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO']=='https'){$_SERVER['HTTPS']='on';}

// check for configuration file
if(!file_exists(realpath(dirname(__FILE__))."/datasets/config.inc.php")){header("location:setup.php");}

// include configuration file
require_once("datasets/config.inc.php");

// check debug from session
if(Session::getInstance()->isDebug()){$debug=true;}else{$debug=false;}

// check debug from requests   @todo spostare in classe Session
if(isset($_GET['debug'])){
  if(DEBUGGABLE && $_GET['debug']==1){$debug=true;Session::getInstance()->setDebug(true);}
  else{$debug=false;Session::getInstance()->setDebug(false);}
}

// errors display for debug
ini_set("display_errors",$debug);

// set timezone
if(!defined("TIMEZONE")){define("TIMEZONE","default");}
elseif(TIMEZONE!="default"){date_default_timezone_set(TIMEZONE);}

// get document id from rewrited url
$g_doc=strtolower(str_replace(array(" "),"-",($_GET['doc'] ?? '')));

// remove trailing slashes
if(substr($g_doc,-1)=="/"){$g_doc=substr($g_doc,0,-1);}

// set homepage as default if no request
if(!strlen($g_doc)){$g_doc="homepage";}

// make root dir from given path
$original_dir=str_replace("\\","/",realpath(dirname(__FILE__))."/");
$root_dir=substr($original_dir,0,strrpos($original_dir,(string)PATH));

// constant definitions
define("DEBUG",$debug);
define("VERSION",file_get_contents(BASE."VERSION"));
define("HOST",(isset($_SERVER['HTTPS'])?"https":"http")."://".$_SERVER['HTTP_HOST']);
define("ROOT",$root_dir);
define("URL",HOST.PATH);
define("DIR",ROOT.PATH);
define("DOC",$g_doc);

// check for privacy agreement
if(isset($_GET['privacy'])){Session::getInstance()->privacyAgreement($_GET['privacy']);}

// regenerate sitemap
if(!file_exists(DIR.'sitemap.xml')){wdf_regenerate_sitemap();}
