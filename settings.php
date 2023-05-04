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
 $config.="define('DEBUGGABLE',".(DEBUGGABLE?"true":"false").");\n";
 $config.="define('PATH',\"".PATH."\");\n";
 $config.="define('TITLE',\"".$_POST['title']."\");\n";
 $config.="define('SUBTITLE',\"".$_POST['subtitle']."\");\n";
 $config.="define('OWNER',\"".$_POST['owner']."\");\n";
 $config.="define('NOTICE',".($_POST['notice']?"\"".$_POST['notice']."\"":"null").");\n";
 $config.="define('PRIVACY',".($_POST['privacy']?"\"".$_POST['privacy']."\"":"null").");\n";
 $config.="define('EDITCODE',\"".$EDITCODE."\");\n";
 $config.="define('VIEWCODE',".($VIEWCODE?"\"".$VIEWCODE."\"":"null").");\n";
 $config.="define('COLOR',\"".$_POST['color']."\");\n";
 $config.="define('DARK',".(isset($_POST['dark'])?"true":"false").");\n";
 $config.="define('GTAG',".($_POST['gtag']?"\"".$_POST['gtag']."\"":"null").");\n";
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
 <link type="text/css" rel="stylesheet" href="styles/styles-<?= (DARK?"dark":"light") ?>.css" media="screen,projection"/>
 <link  type="image/ico" rel="icon" href="favicon.ico" sizes="any"/>
 <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
 <meta name="theme-color" content="<?= COLOR ?>">
 <style>:root{--theme-color:<?= COLOR ?>;}</style>
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
      <input type="text" name="title" id="title" class="validate" value="<?= TITLE ?>" required>
      <label for="title"><span class="green-text">Title</span></label>
     </div>
     <div class="input-field col s12 m7">
      <input type="text" name="subtitle" id="subtitle" class="validate" value="<?= SUBTITLE ?>" required>
      <label for="subtitle"><span class="green-text">Subtitle</span></label>
     </div>
    </div>
    <div class="row">
     <div class="input-field col s12 m5">
      <input type="text" name="owner" id="owner" class="validate" placeholder="Contents owner" value="<?= OWNER ?>" required>
      <label for="owner"><span class="green-text">Owner</span></label>
     </div>
     <div class="input-field col s12 m7">
      <input type="text" name="notice" id="notice" class="validate" placeholder="Contents copyright notice" value="<?= NOTICE ?>" required>
      <label for="notice"><span class="green-text">Notice</span></label>
     </div>
    </div>
    <div class="row">
     <div class="input-field col s12 m12">
      <input type="text" name="privacy" id="privacy" class="validate" placeholder="Privacy banner for GDPR compliant" value="<?= PRIVACY ?>">
      <label for="privacy"><span class="green-text">Privacy banner</span></label>
     </div>
    </div>
    <div class="row">
     <div class="input-field col s12 m5">
      <input type="password" name="editcode" id="editcode" class="validate" placeholder="Choose a strong password for editing.." value="<?= EDITCODE ?>" required>
      <label for="editcode"><span class="green-text">Edit authentication code</span></label>
     </div>
     <div class="input-field col s12 m7">
      <input type="password" name="viewcode" id="viewcode" class="validate" placeholder="Leave it blank if you want to make this wiki public.." value="<?= VIEWCODE ?>">
      <label for="viewcode"><span class="green-text">View authentication code</span></label>
     </div>
    </div>
    <div class="row">
     <div class="input-field col s6 m3">
      <input type="text" name="color" id="color" class="validate" placeholder="Choose the main color.. (#4CAF50)" value="<?= COLOR ?>" required>
      <label for="color"><span class="green-text">Color</span></label>
     </div>
     <div class="input-field col s6 m2">
      <label for="check-dark">
       <input type="checkbox" name="dark" id="check-dark"<?php if(DARK){echo " checked";}?>>
       <span>Dark Mode</span>
      </label>
     </div>
     <div class="input-field col s12 m7">
      <input type="text" name="gtag" id="gtag" class="validate" placeholder="Insert you Google Analytics tag.. (like UA-123456789-1)" value="<?= GTAG ?>">
      <label for="gtag"><span class="green-text">Google Analytics tag</span></label>
     </div>
    </div>
    <div class="row">
     <div class="input-field col s12 m12">
      <button type="button" class="btn btn-block waves-effect waves-light grey left" onclick="location.href='<?= PATH ?>';">Cancel<i class="material-icons left">keyboard_arrow_left</i></button>
      <button type="submit" class="btn btn-block waves-effect waves-light green right">Save<i class="material-icons right">check</i></button>
     </div>
    </div>
   </form>
  </div><!-- /col -->
 </div><!-- /row-->
</div><!-- /container-->
<script src="helpers/jquery-3.3.1/js/jquery.min.js"></script>
<script src="helpers/materialize-1.0.0/js/materialize.min.js"></script>
</body>
</html>
