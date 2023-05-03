<?php
/**
 * Settings
 *
 * @package WikiDocs
 * @repository https://github.com/Zavy86/wikidocs
 */
require_once("bootstrap.inc.php");
// acquire variables
$g_act=($_GET['act'] ?? '');
// store action
if($g_act=="store"){
 // sed codes
 $EDITCODE=($_POST['editcode']===EDITCODE?EDITCODE:md5($_POST['editcode']));
 $VIEWCODE=($_POST['viewcode']===VIEWCODE?VIEWCODE:(strlen($_POST['viewcode'])?md5($_POST['viewcode']):null));
 // build configuration file
 $config="<?php\n";
 $config.="const DEBUGGABLE=false;\n";
 $config.="const PATH=\"".PATH."\";\n";
 $config.="const TITLE=\"".$_POST['title']."\";\n";
 $config.="const SUBTITLE=\"".$_POST['subtitle']."\";\n";
 $config.="const OWNER=\"".$_POST['owner']."\";\n";
 $config.="const NOTICE=".($_POST['notice']?"\"".$_POST['notice']."\"":"null").";\n";
 $config.="const PRIVACY=".($_POST['privacy']?"\"".$_POST['privacy']."\"":"null").";\n";
 $config.="const EDITCODE=\"".$EDITCODE."\";\n";
 $config.="const VIEWCODE=".($VIEWCODE?"\"".$VIEWCODE."\"":"null").";\n";
 $config.="const COLOR=\"".$_POST['color']."\";\n";
 $config.="const DARK=".(isset($_POST['dark'])?"true":"false").";\n";
 $config.="const GTAG=".($_POST['gtag']?"\"".$_POST['gtag']."\"":"null").";\n";
 // write configuration file
 file_put_contents(BASE."datasets/config.inc.php",$config);
 // alert and redirect
 wdf_alert("Settings stored!","success");
 wdf_redirect(PATH);
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
 <link type="text/css" rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" media="screen,projection"/>
 <link type="text/css" rel="stylesheet" href="helpers/materialize-1.0.0/css/materialize.min.css" media="screen,projection"/>
 <link type="text/css" rel="stylesheet" href="styles/styles.css" media="screen,projection"/>
 <link type="text/css" rel="stylesheet" href="styles/styles-<?php echo (DARK?"dark":"light"); ?>.css" media="screen,projection"/>
 <link  type="image/png" rel="icon" href="favicon.png" sizes="any"/>
 <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
 <meta name="theme-color" content="<?php echo COLOR; ?>">
 <style>:root{--theme-color:<?php echo COLOR; ?>;}</style>
 <title>Settings - Wiki|Docs</title>
</head>
<body>
<div class="container">
 <div class="row">
  <div class="col s12">
   <h1>Wiki|Docs</h1>
   <p>Just a databaseless markdown flat-file wiki engine..</p>
  </div><!-- /col -->
  <div class="col s12">
   <h2>Settings</h2>
   <p>Configure your wiki engine..</p>
   <form action="settings.php?act=store" method="post">
    <div class="row">
     <div class="input-field col s12 m5">
      <input type="text" name="title" id="title" class="validate" value="<?php echo TITLE; ?>" required>
      <label for="title"><span class="green-text">Title</span></label>
     </div>
     <div class="input-field col s12 m7">
      <input type="text" name="subtitle" id="subtitle" class="validate" value="<?php echo SUBTITLE; ?>" required>
      <label for="subtitle"><span class="green-text">Subtitle</span></label>
     </div>
    </div>
    <div class="row">
     <div class="input-field col s12 m5">
      <input type="text" name="owner" id="owner" class="validate" placeholder="Contents owner" value="<?php echo OWNER; ?>" required>
      <label for="owner"><span class="green-text">Owner</span></label>
     </div>
     <div class="input-field col s12 m7">
      <input type="text" name="notice" id="notice" class="validate" placeholder="Contents copyright notice" value="<?php echo NOTICE; ?>" required>
      <label for="notice"><span class="green-text">Notice</span></label>
     </div>
    </div>
    <div class="row">
     <div class="input-field col s12 m12">
      <input type="text" name="privacy" id="privacy" class="validate" placeholder="Privacy banner for GDPR compliant" value="<?php echo PRIVACY; ?>">
      <label for="privacy"><span class="green-text">Privacy banner</span></label>
     </div>
    </div>
    <div class="row">
     <div class="input-field col s12 m5">
      <input type="password" name="editcode" id="editcode" class="validate" placeholder="Choose a strong password for editing.." value="<?php echo EDITCODE; ?>" required>
      <label for="editcode"><span class="green-text">Edit authentication code</span></label>
     </div>
     <div class="input-field col s12 m7">
      <input type="password" name="viewcode" id="viewcode" class="validate" placeholder="Leave it blank if you want to make this wiki public.." value="<?php echo VIEWCODE; ?>">
      <label for="viewcode"><span class="green-text">View authentication code</span></label>
     </div>
    </div>
    <div class="row">
     <div class="input-field col s6 m3">
      <input type="text" name="color" id="color" class="validate" placeholder="Choose the main color.. (#4CAF50)" value="<?php echo COLOR; ?>" required>
      <label for="color"><span class="green-text">Color</span></label>
     </div>
     <div class="input-field col s6 m2">
      <label for="check-dark">
       <input type="checkbox" name="dark" id="check-dark"<?php if(DARK){echo " checked";}?>>
       <span>Dark Mode</span>
      </label>
     </div>
     <div class="input-field col s12 m7">
      <input type="text" name="gtag" id="gtag" class="validate" placeholder="Insert you Google Analytics tag.. (like UA-123456789-1)" value="<?php echo GTAG; ?>">
      <label for="gtag"><span class="green-text">Google Analytics tag</span></label>
     </div>
    </div>
    <div class="row">
     <div class="input-field col s12 m12">
      <button type="button" class="btn btn-block waves-effect waves-light grey left" onclick="location.href='<?php echo PATH ?>';">Cancel<i class="material-icons left">keyboard_arrow_left</i></button>
      <button type="submit" class="btn btn-block waves-effect waves-light green right">Save<i class="material-icons right">check</i></button>
     </div>
    </div>
   </form>
  </div><!-- /col -->
 </div><!-- /row-->
</div><!-- /container-->
<script type="text/javascript" src="helpers/jquery-3.3.1/js/jquery.min.js"></script>
<script type="text/javascript" src="helpers/materialize-1.0.0/js/materialize.min.js"></script>
</body>
</html>
