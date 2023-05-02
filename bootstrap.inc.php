<?php
/**
 * Bootstrap
 *
 * @package WikiDocs
 * @author  Manuel Zavatta <manuel.zavatta@gmail.com>
 * @link    https://github.com/Zavy86/wikidocs
 */

// error reporting
error_reporting(E_ALL);
ini_set('display_errors',(isset($_GET['debug']) && $_GET['debug']==1));

// base directory
define('baseDIR',str_replace(['/','\\'],DIRECTORY_SEPARATOR,__DIR__.'/'));
if(version_compare(PHP_VERSION,'7.4.0')<0){die('Required at least PHP version 7.4.0, current version: '.PHP_VERSION);}

// require classes and functions
require_once(baseDIR.'src/WikiDocs.class.php');
require_once(baseDIR.'src/Document.class.php');
require_once baseDIR.'src/functions.inc.php';              // @todo rinomare baseDIR in DIR e togliere da sotto

// require external libraries
require_once(baseDIR."libraries/parsedown-1.8.0-beta-6/Parsedown.php");
require_once(baseDIR."libraries/parsedown-extra-0.8.1/ParsedownExtra.php");

// start session
wdf_session_start();  // @todo fare classe dedicata?


// if behind https reverse proxy, set HTTPS property correctly
if(isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO']=='https'){$_SERVER['HTTPS']='on';}

// check for configuration file
if(!file_exists(realpath(dirname(__FILE__))."/datasets/config.inc.php")){die("Wiki|Docs is not configured..<br><br>Launch <a href='setup.php'>Setup</a> script!");}

// include configuration file
require_once("datasets/config.inc.php");

// check debug from session
if(isset($_SESSION['wikidocs']['debug']) && ($_SESSION['wikidocs']['debug']==1)){$debug=true;}else{$debug=false;}

// check debug from requests
if(isset($_GET['debug'])){
	if(DEBUGGABLE && $_GET['debug']==1){$debug=true;$_SESSION['wikidocs']['debug']=true;}
	else{$debug=false;$_SESSION['wikidocs']['debug']=false;}
}

// errors display for debug
ini_set("display_errors",$debug);

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
define("VERSION",file_get_contents("VERSION.txt"));
define("HOST",(isset($_SERVER['HTTPS'])?"https":"http")."://".$_SERVER['HTTP_HOST']);
define("ROOT",$root_dir);
define("URL",HOST.PATH);
define("DIR",ROOT.PATH);
define("DOC",$g_doc);
