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
// initialize application
$APP=new WikiDocs();
// initialize document
$DOC=new Document(DOC);
// initialize markdown parser
$PARSER = new ParsedownPlus([
    'typographer' => true,
    'toc' => [
        'enabled' => true
    ],
    'emphasis' => [
        'enabled' => true,
        'superscript' => true,
        'subscript' => true
    ],
    'markup' => true,
    'diagrams' => [
        'enabled' => true,
        'chartjs' => true,
        'mermaid' => true,
    ],
    'math' => [
        'enabled' => true,
        'inline' => [
            'enabled' => true,
            'delimiters' => [
                ['left' => '\\(', 'right' => '\\)'],
            ],
        ],
        'block' => [
            'enabled' => true,
            'delimiters' => [
                ['left' => '$$', 'right' => '$$'],
            ],
        ],
    ],
    'emphasis' => [
        'enabled' => true,
        'bold' => true,
        'italic' => true,
        'strikethroughs' => true,
        // this must be off for collapsible section to work
        'insertions' => false,
        'subscript' => true,
        'superscript' => true,
        'keystrokes' => true,
        'marking' => true,
    ],
]);
// include web or print template
if(MODE=='print'){require_once(BASE.'print.inc.php');}else{require_once(BASE.'template.inc.php');}
