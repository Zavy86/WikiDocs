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
 if(isset($_GET['print'])){$mode="print";}
 if(isset($_GET['export'])){$mode="export";}
 if(isset($_GET['auth'])){session_destroy();session_start();}
 if(isset($_GET['edit'])){if(wdf_authenticated()==2){$mode="edit";}else{$mode="auth";}}
 // check for authentication
 if(strlen(VIEWCODE) && wdf_authenticated()==0){$mode="auth";}
 // mode definition
 define(MODE,$mode);
 // initialize application
 $WD=new WikiDocs();
 // initialize document
 $DOC=new Document(DOC);
 // initialize markdown parser
 require_once(DIR."helpers/parsedown-1.7.1/Parsedown.php");
 $PARSER=new Parsedown();
 $PARSER->setMarkupEscaped(true);
 // web modes
 if(in_array(MODE,array("auth","view","edit","search"))){require_once(DIR."template.inc.php");}
 // print mode
 if(MODE=="print"){require_once(DIR."print.inc.php");}
 // export mode
 if(MODE=="export"){
  require_once(DIR."helpers/html2pdf-4.4.0/html2pdf.class.php");
  try{
   $HTML2PDF=new HTML2PDF('P','A4','IT');
   if(DEBUG){$HTML2PDF->setModeDebug();}
   $HTML2PDF->WriteHTML($PARSER->text($DOC->loadContent("FS")));
   $HTML2PDF->WriteHTML($output);
   $HTML2PDF->Output(str_replace(" ","-",strtolower($DOC->TITLE)).".pdf");
  }catch(HTML2PDF_exception $e){die($e);}
 }
?>
