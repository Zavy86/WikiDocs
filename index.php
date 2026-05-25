<?php
/**
 * WikiDocs
 *
 * @package WikiDocs
 * @repository https://github.com/Zavy86/wikidocs
 */
// additional security headers
header("X-Content-Type-Options: nosniff");
header("X-XSS-Protection: 1; mode=block");

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
// initialize application
$APP=new WikiDocs();
// initialize document
$DOC=new Document(DOC);
// initialize markdown parser
$PARSER=new ParsedownPlus([
	'tables' => [
		'tablespan' => true,
	],
	'typographer' => true,
	'toc' => true,
	'sup' => true,
	'sub' => true
]);
// NOTE: Parsedown safe mode intentionally NOT enabled — it strips inline HTML
// (e.g. <span style="color:..."> spans, simple Mermaid/KaTeX) breaking core
// use cases (see issue #293). XSS protection is provided in layers by
// Document::sanitizeHtml() (escapes <script>, dangerous tags, on* events,
// javascript:/data: URLs) and SecurityFilters (KaTeX command/tag blocklist,
// SVG sanitizer).
// include web or print template
if(MODE=='print'){require_once(BASE.'print.inc.php');}else{require_once(BASE.'template.inc.php');}
