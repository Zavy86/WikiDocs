<?php
/**
 * WikiDocs
 *
 * @package WikiDocs
 * @repository https://github.com/Zavy86/wikidocs
 */
require_once('bootstrap.inc.php');
// mode definition
$mode='view';
if(isset($_GET['auth'])){$mode='auth';}
if(isset($_GET['print'])){$mode='print';}
if(isset($_GET['search'])){$mode='search';}
if(isset($_GET['edit'])){if(Session::getInstance()->autenticationLevel()==2){$mode='edit';}else{$mode='auth';}}
if(isset($_GET['exit'])){Session::getInstance()->restart();}
// check for authentication
if(strlen(VIEWCODE ?? '') && !Session::getInstance()->isAuthenticated()){$mode='auth';}
// mode definition
define('MODE',$mode);
// search definition
define('SEARCH',(isset($_GET['search'])?htmlspecialchars($_GET['search']):null));
// get localization
$TXT=Localization::getInstance();
// get theme
$THEME=Theme::getInstance();
// initialize application
$APP=new WikiDocs();
// initialize document
$DOC=new Document(DOC);
// initialize markdown parser
$PARSER=new ParsedownExtended([
    'typographer' => true,
    'toc' => true,
    'sup' => true,
    'sub' => true
]);
// include web or print template
if(MODE=='print'){require_once(BASE.'print.inc.php');}else{require_once(BASE.'template.inc.php');}
