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
 if(isset($_GET['auth'])){$mode="auth";}
 if(isset($_GET['print'])){$mode="print";}
 if(isset($_GET['search'])){$mode="search";}
 if(isset($_GET['edit'])){if(wdf_authenticated()==2){$mode="edit";}else{$mode="auth";}}
 if(isset($_GET['exit'])){session_destroy();wdf_session_start();}
 // check for authentication
 if(strlen(VIEWCODE ?? '') && wdf_authenticated()==0){$mode="auth";}
 // mode definition
 define("MODE",$mode);
 // initialize application
 $APP=new WikiDocs();
 // initialize document
 $DOC=new Document(DOC);
 // initialize markdown+extra parser (v1.8.0-beta-5 with markdownExtra)
 require_once(DIR."helpers/parsedown-1.8.0-beta-6/Parsedown.php");
 require_once(DIR."helpers/parsedown-extra-0.8.1/ParsedownExtra.php");
 require_once(DIR."helpers/parsedown-checkbox-0.2.0-modified/ParsedownCheckbox.php");
 $PARSER=new ParsedownCheckbox();
 //$PARSER->setMarkupEscaped(true);
 // include web or print template
 if(MODE=="print"){require_once(DIR."print.inc.php");}else{require_once(DIR."template.inc.php");}
