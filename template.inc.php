<?php
/**
 * Template
 *
 * @package WikiDocs
 * @author  Manuel Zavatta <manuel.zavatta@gmail.com>
 * @link    https://github.com/Zavy86/wikidocs
 */
?>
<!DOCTYPE html>
<html>
 <head>
  <link type="text/css" rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" media="screen,projection"/>
  <link type="text/css" rel="stylesheet" href="<?php echo $APP->PATH; ?>helpers/materialize-1.0.0/css/materialize.min.css" media="screen,projection"/>
  <link type="text/css" rel="stylesheet" href="<?php echo $APP->PATH; ?>helpers/simplemde-1.11.2/css/simplemde.min.css" media="screen,projection"/>
  <link type="text/css" rel="stylesheet" href="<?php echo $APP->PATH; ?>css/styles.css" media="screen,projection"/>
  <link  type="image/png" rel="icon" href="<?php echo $APP->PATH; ?>images/favicon.png" sizes="any"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta name="theme-color" content="#4CAF50">
  <title><?php echo ($DOC->ID!="homepage"?$DOC->TITLE." - ":null).$APP->TITLE; ?></title>
 </head>
 <body>
  <header>
   <ul id="nav-mobile" class="sidenav sidenav-fixed">
    <li class="logo">
     <a id="logo-container" href="<?php echo $APP->PATH; ?>" class="brand-logo">
      <h1><?php echo $APP->TITLE; ?></h1>
      <span><em><?php echo $APP->SUBTITLE; ?></em></span>
     </a>
    </li>
    <li class="search">
     <div class="search-wrapper">
      <form action="<?php echo $APP->PATH; ?>" method="get" autocomplete="off">
       <input id="search" name="search" placeholder="Search in wiki.." value="<?php echo $_GET['search']; ?>"><i class="material-icons">search</i>
      </form>
     </div>
    </li>
<?php
 if(in_array(MODE,array("view","edit","search"))){
  // get primary level index
  $index_array=wdf_document_index();
  // cycle all documents
  foreach($index_array as $index_fe){
   echo "<li class=\"bold";
   if($index_fe->url==substr($DOC->ID,0,strlen($index_fe->url))){echo " active";}
   echo "\"><a class=\"waves-effect waves-green\" href=\"".$APP->PATH.$index_fe->url."\">".$index_fe->label."</a></li>\n";
  }
 }
?>
   </ul>
   <div class="sidebar-footer"> <!-- @todo migliorare -->
    <div id="sidebar-footer-content">
     <span class="default-title"><?php echo $APP->OWNER; ?></span><br>
     <span class="default-description"><?php echo $APP->NOTICE; ?></span>
    </div>
   </div>
  </header>
  <main>
   <div class="container">
    <div class="row breadcrumbs" style="padding-top:18px">
     <div class="col s2 m1 offset-m1 hide-on-large-only">
      <a class="btn btn-floating btn-small tooltipped waves-effect waves-light sidenav-trigger green" href="#" data-target="nav-mobile" data-position="bottom" data-tooltip="Sidebar"><i class="material-icons">menu</i></a>
     </div><!-- /col -->
     <div class="col s8 m7 l8 offset-l1 center-on-small-only" style="padding-top:3px">
      <span>
<?php
 if($DOC->ID=="homepage"){
  echo "Wiki|Docs";
 }else{
  foreach($DOC->hierarchy() as $element){
   // check for current document
   if($DOC->ID==$element->path){
    echo "<span class=\"nowrap\">".$element->label."</span>";
   }else{
    echo "<a href=\"".$APP->PATH.$element->path."\" class=\"green-text nowrap\">".$element->label."</a> / ";
   }
  }
 }
?>
      </span>
     </div><!-- /col -->
     <div class="col s2 m2 l2">
<?php if(MODE=="view"){ ?>
      <span class="right nowrap">
       <a class="btn btn-floating btn-small tooltipped waves-effect waves-light green" href="<?php echo $DOC->URL."?print"; ?>" target="_blank" data-position="bottom" data-tooltip="Print this document"><i class="material-icons">print</i></a>
<?php if(wdf_authenticated()==2){ ?>
       <a class="btn btn-floating btn-small tooltipped waves-effect waves-light green" href="#" data-position="bottom" data-tooltip="Add new document" onClick="javascript:new_document();"><i class="material-icons">add_circle</i></a>
       <a class="btn btn-floating btn-small tooltipped waves-effect waves-light green" href="<?php echo $DOC->URL."?edit"; ?>" data-position="bottom" data-tooltip="Edit this document"><i class="material-icons">border_color</i></a>
<?php }else{ ?>
       <a class="btn btn-floating btn-small tooltipped waves-effect waves-light green" href="<?php echo $DOC->URL."?auth"; ?>" data-position="bottom" data-tooltip="Sign in to edit or<br>add new documents"><i class="material-icons">lock_open</i></a>
<?php } ?>
       </span>
<?php } ?>
<?php if(MODE=="edit"){ ?>
      <span class="right nowrap">
       <a class="btn btn-floating btn-small tooltipped waves-effect waves-light grey" href="<?php echo $DOC->URL; ?>" data-position="bottom" data-tooltip="Cancel editing"><i class="material-icons">cancel</i></a>
       <!-- @todo integrare nella toolbar di simplemde -->
       <a class="btn btn-floating btn-small tooltipped waves-effect waves-light blue modal-trigger" href="#modal_uploader" data-position="bottom" data-tooltip="Images"><i class="material-icons">image</i></a>
       <a class="btn btn-floating btn-small tooltipped waves-effect waves-light red" href="<?php echo $APP->PATH; ?>submit.php?act=content_delete&document=<?php echo $DOC->ID; ?>" data-position="bottom" data-tooltip="Delete this content" onClick="return(confirm('Do you really want to delete this content?'))"><i class="material-icons">delete</i></a>
       <button id="editor-revision" class="btn btn-floating btn-small tooltipped waves-effect waves-light orange" data-position="bottom" data-tooltip="Backup current version"><i id="editor-revision-checkbox" class="material-icons">check_box</i></button>
       <button id="editor-save" class="btn btn-floating btn-small tooltipped waves-effect waves-light green" data-position="bottom" data-tooltip="Save"><i class="material-icons">save</i></button>
      </span>
<?php } ?>
     </div><!-- /col -->
    </div><!-- /row -->
    <div class="divider"></div>
     <div class="row">
      <div class="col s12 m10 offset-m1">
<article>
<?php
 if(MODE=="view"){
  echo $PARSER->text($DOC->render())."\n";
 }
?>
<?php if(MODE=="auth"){ ?>
       <form id="auth-form" method="post" action="<?php echo $APP->PATH; ?>submit.php?act=authentication">
        <input type="hidden" name="document" value="<?php echo $DOC->ID; ?>">
        <div class="row" style="margin-top:36px">
         <div class="input-field col s9">
          <input type="password" name="password" required autofocus>
          <label for="password"><span class="green-text">Insert authentication code..</span></label>
         </div><!-- /input-field -->
         <div class="input-field col s3">
          <input type="submit" class="btn green" value="Submit">
         </div><!-- /input-field -->
        </div><!-- /row -->
       </form>
<?php } ?>
<?php if(MODE=="edit"){ ?>
       <form id="editor-form" method="post" action="<?php echo $APP->PATH; ?>submit.php?act=content_save">
        <input type="hidden" name="revision" value="1">
        <input type="hidden" name="document" value="<?php echo $DOC->ID; ?>">
        <textarea id="simplemde" name="content"><?php $source=$DOC->loadContent(); echo (strlen($source)?$source:"# ".$DOC->TITLE); ?></textarea>
       </form>
<?php } ?>
<?php if(MODE=="edit"){ ?>
       <!-- modal_uploader -->
       <div id="modal_uploader" class="modal">
        <div class="modal-content">
         <h4>Images</h4>
         <form id="uploader-form" method="post" action="<?php echo $APP->PATH; ?>submit.php?act=image_upload_ajax" enctype="multipart/form-data">
          <input type="hidden" name="document" value="<?php echo $DOC->ID; ?>">
          <div class="row" style="margin-top:36px">
           <div class="input-field file-field col s9">
            <div class="btn waves-effect waves-light green">
             <span>Browse</span>
             <input type="file" name="image" required>
            </div><!-- /btn -->
            <div class="file-path-wrapper">
             <input type="text" id="uploader-path" class="file-path validate" placeholder="Select an image to upload..">
            </div><!-- /file-path-wrapper -->
           </div><!-- /input-field -->
           <div class="input-field col s3">
            <input id="uploader-submit" type="submit" class="btn green right" value="Upload">
           </div><!-- /input-field -->
          </div><!-- /row -->
         </form>
         <div class="row" id="images-list">
<?php foreach($DOC->images() as $image){ ?>
          <div class="col s6 m3">
           <a href="#" class="image-picker waves-effect waves-light" image="<?php echo $image; ?>"><img class="polaroid" src="<?php echo $DOC->PATH."/".$image; ?>"/></a>
          </div><!-- /col -->
<?php } ?>
         </div><!-- /row -->
        </div><!-- /modal-content-->
       </div><!-- /modal_uploader -->
<?php } ?>
<?php
 if(MODE=="search"){
  echo "<h1>Search results</h1>";
  // search in all documents
  $matches_array=wdf_document_search($_GET['search']);
  // cycle all matches documents
  foreach($matches_array as $document_fe=>$matches_fe){
   echo "\n<hr><h5><a href=\"".URL.$document_fe."\" target=\"_blank\"><b>".$document_fe."</b></a></h5>";
   // cycle all mathes lines
   foreach($matches_fe as $match_fe){
    echo "<p>".$match_fe."</p>";
   }
  }
  // check for no results
  if(!count($matches_array)){echo "\n<p>No results found for <mark>".$_GET['search']."</mark>..</p>\n";}else{echo "\n";}
 }
?>
</article>
     </div><!-- /col -->
    </div><!-- /row -->
    <div class="divider"></div>
    <div class="row">
     <div class="col m5 offset-m1 hide-on-med-and-down">
      <p class="left-align"><small>This page was last edited on <?php echo wdf_timestamp_format($DOC->TIMESTAMP,"Y-m-d H:i"); ?></small></p>
     </div><!-- /col -->
     <div class="col m5 hide-on-med-and-down">
      <p class="right-align"><small>Powered by <a href="https://github.com/Zavy86/wikidocs" target="_blank">Wiki|Docs</a><?php if($APP->DEBUG){echo " ".$APP->VERSION;} if(wdf_authenticated()){echo " - <a href=\"".$DOC->URL."?exit\">Logout</a>";} ?></small></p>
     </div><!-- /col -->
     <div class="col s12 hide-on-large-only">
     <p class="center-align"><small>This page was last edited on <?php echo wdf_timestamp_format($DOC->TIMESTAMP,"Y-m-d H:i"); ?></small></p>
     <p class="center-align"><small><b><?php echo $APP->OWNER; ?></b><br><?php echo $APP->NOTICE; ?></p></small></p>
     <p class="center-align"><small>Powered by <a href="https://github.com/Zavy86/wikidocs" target="_blank">Wiki|Docs</a><?php if($APP->DEBUG){echo " ".$APP->VERSION;} if(wdf_authenticated()){echo " - <a href=\"".$DOC->URL."?exit\">Logout</a>";} ?></small></p>
     </div><!-- /col -->
    </div><!-- /row -->
<?php
 // debug
 if($APP->DEBUG){
  echo "    <div class=\"divider\"></div>\n\n";
  echo "<!-- debug -->\n<section class=\"debug\">\n";
  wdf_dump($DOC,"DOCUMENT");
  wdf_dump($APP,"APPLICATION");
  echo "\n</section><!-- /debug -->\n\n";
 }
?>
   </div><!-- /container -->
  </main>
  <script type="text/javascript">var APP=<?php echo json_encode($APP->export()); ?>;</script>
  <script type="text/javascript">var DOC=<?php echo json_encode($DOC->export()); ?>;</script>
  <script type="text/javascript" src="<?php echo $APP->PATH; ?>helpers/jquery-3.3.1/js/jquery.min.js"></script>
  <script type="text/javascript" src="<?php echo $APP->PATH; ?>helpers/materialize-1.0.0/js/materialize.min.js"></script>
  <script type="text/javascript" src="<?php echo $APP->PATH; ?>js/initializations.js"></script>
<?php if(MODE=="edit"){ ?>
  <script type="text/javascript" src="<?php echo $APP->PATH; ?>helpers/simplemde-1.11.2/js/simplemde.min.js"></script>
  <script type="text/javascript" src="<?php echo $APP->PATH; ?>js/editor.js"></script>
  <script type="text/javascript" src="<?php echo $APP->PATH; ?>js/images.js"></script>
<?php } ?>
  <script type="text/javascript">
   function new_document(){
    var new_path=prompt("Enter the new document path (like argument/section/title)",DOC.ID+"/");
    if(new_path!==DOC.ID+"/"){
     new_path=new_path.replace(" ","-").toLowerCase()+"?edit";
     window.location.href=APP.URL+new_path;
    }
   }
  </script>
<?php
 // cycle all alerts
 foreach($_SESSION['wikidocs']['alerts'] as $index=>$alert){
  // swicth class
  switch($alert->class){
   case "success":$class="green";break;
   case "warning":$class="orange";break;
   case "danger":$class="red";break;
   case "info":$class="blue";break;
  }
  // show alert
  echo "  <script type=\"text/javascript\">M.toast({html:\"".$alert->message."\",classes:\"rounded ".$class."\"});</script>\n";
  // remove from session
  unset($_SESSION['wikidocs']['alerts'][$index]);
 }
?>
 </body>
</html>
