<?php
/**
 * WikiDocs
 *
 * @package WikiDocs
 * @author  Manuel Zavatta <manuel.zavatta@gmail.com>
 * @link    https://github.com/Zavy86/wikidocs
 */

 // include functions
 require_once("functions.inc.php");
 // mode definition
 $mode="view";
 if(isset($_GET['search'])){$mode="search";}
 if(isset($_GET['edit'])){if(wdf_authenticated()){$mode="edit";}else{$mode="auth";}}
 define(MODE,$mode);
 // initialize application
 $WD=new WikiDocs();
 // initialize document
 $DOC=new Document(DOC);
 // initialize markdown parser
 require_once(DIR."helpers/parsedown-1.7.1/Parsedown.php");
 $parser=new Parsedown();
 $parser->setMarkupEscaped(true);
 // include template
 require_once(DIR."template.inc.php");
?>
