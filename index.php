<?php
/**
 * WikiDocs
 *
 * @package WikiDocs
 * @repository https://github.com/Zavy86/wikidocs
 */
/*
error_reporting(E_ALL);
ini_set('display_errors',true);
*/
// include functions
require_once("bootstrap.inc.php");
// mode definition
$mode="view";
if(isset($_GET['auth'])){$mode="auth";}
if(isset($_GET['print'])){$mode="print";}
if(isset($_GET['search'])){$mode="search";}
if(isset($_GET['edit'])){if(Session::getInstance()->autenticationLevel()==2){$mode="edit";}else{$mode="auth";}}
if(isset($_GET['exit'])){Session::getInstance()->restart();}
// check for authentication
if(strlen(VIEWCODE ?? '') && !Session::getInstance()->isAuthenticated()){$mode="auth";}
// mode definition
define("MODE",$mode);
// initialize application
$APP=new WikiDocs();
// initialize document
$DOC=new Document(DOC);
// initialize markdown+extra parser (v1.8.0-beta-5 with markdownExtra)
$PARSER=new ParsedownExtra();
//$PARSER->setMarkupEscaped(true);
// include web or print template
if(MODE=="print"){require_once(DIR."print.inc.php");}else{require_once(DIR."template.inc.php");}
