<?php
/**
 * Setup
 *
 * @package WikiDocs
 * @repository https://github.com/Zavy86/wikidocs
 */
session_start();
error_reporting(E_ALL & ~E_NOTICE);
ini_set("display_errors",true);
function getSetting($key,$default=''){return (string)($_SESSION['wikidocs']['setup'][$key]??$default);}
function sanitizeInput($input){return htmlspecialchars(trim($input),ENT_COMPAT,'UTF-8');}
function checkWebServer(){
  if((isset($_SERVER['SERVER_SOFTWARE']) && strpos($_SERVER['SERVER_SOFTWARE'], 'Apache') !== false)){return "apache";}
  elseif(isset($_SERVER['SERVER_SOFTWARE']) && strpos($_SERVER['SERVER_SOFTWARE'], 'nginx') !== false){return "nginx";}
  else{return null;}
}
// definitions
$errors=false;
$configured=false;
$checks_array=[];
$g_act=$_GET['act']??'preliminary_check';
// include configuration sample
include("sample.config.inc.php");
// defines constants
define('PATH_URI',explode("setup.php",$_SERVER['REQUEST_URI'])[0]);
// Check if already configured
if(file_exists("datasets/config.inc.php")){header("location:index.php");}
// make root dir from given path
$original_dir=str_replace("\\","/",realpath(dirname(__FILE__))."/");
$root_dir=substr($original_dir,0,strrpos($original_dir,($_POST['path'] ?? ''))).($_POST['path'] ?? '');
// preliminary checks
if($g_act=="preliminary_check"){
  $server_modules=[];
  if(function_exists('apache_get_modules')){
    $available_modules=apache_get_modules();
    foreach(['mod_rewrite','mod_mime'] as $module){
      $server_modules[$module]=in_array($module,$available_modules);
    }
  }
  $php_modules=[];
  foreach(['Core','dom','json','mbstring','session','xml'] as $module) {
    $label=($module=='Core'?'php_version':'php_'.$module);
    $php_modules[$label]=phpversion($module);
  }
}
// check action
if($g_act=="check"){
  $required_fields=['path','title','subtitle','owner','notice','editcode'];
  $_SESSION['wikidocs']['setup']=[];
  foreach($required_fields as $field){
    $value=$_POST[$field]??'';
    $_SESSION['wikidocs']['setup'][$field]=$value;
    $checks_array[$field]=!empty($value);
    $errors=$errors||!$checks_array[$field];
  }
  $checks_array['path']=file_exists($root_dir."setup.php");
  $errors=$errors||!$checks_array['path'];
  if($_POST['editcode']!==$_POST['editcode_repeat']){
    $checks_array['editcode']=false;
    $errors=true;
  }
}
// conclude action
if($g_act=="conclude"){
  $config="<?php\n";
  $config_items=[
    'DEBUGGABLE'=>'false',
    'PATH'=>getSetting('path'),
    'TITLE'=>getSetting('title'),
    'SUBTITLE'=>getSetting('subtitle'),
    'OWNER'=>getSetting('owner'),
    'NOTICE'=>getSetting('notice'),
    'PRIVACY'=>'null',
    'EDITCODE'=>getSetting('editcode')?password_hash(getSetting('editcode'),PASSWORD_DEFAULT):'null',
    'VIEWCODE'=>'null',
    'COLOR'=>'#4CAF50',
    'DARK'=>'false',
    'GTAG'=>'null'
  ];
  foreach($config_items as $key=>$value){
    if($value===null||$value==='null'){
      $config.="define('".$key."', null);\n";
    }elseif(is_bool($value)||$value==='true'||$value==='false'){
      $config.="define('".$key. "', ".($value==='true'?'true':'false').");\n";
    }elseif(is_numeric($value)){
      $config.="define('".$key."', ".$value.");\n";
    }else{
      $config.="define('" .$key."', '".addslashes($value)."');\n";
    }
  }
  // Write configuration file
  if(!is_dir($root_dir."datasets/")){mkdir($root_dir."datasets/",0755,true);}
  file_put_contents($root_dir."datasets/config.inc.php",$config);
  // Generate .htaccess
  $htaccess="<IfModule mod_rewrite.c>\n";
  $htaccess.="\tRewriteEngine On\n";
  $htaccess.="\tRewriteBase ".getSetting('path','/')."\n";
  $htaccess.="\tRewriteCond %{REQUEST_URI} \.md$ [NC]\n";
  $htaccess.="\tRewriteRule ^.*$ ".getSetting('path','/')." [R=301,L]\n";
  $htaccess.="\tRewriteCond %{REQUEST_FILENAME} !-f\n";
  $htaccess.="\tRewriteRule ^(.*)$ index.php?doc=$1 [NC,L,QSA]\n";
  $htaccess.="</IfModule>\n";
  // Write .htaccess file
  $htaccessPath=$root_dir.".htaccess";
  file_put_contents($htaccessPath,$htaccess);
  // Check if configuration was successful
  $configured=(file_exists($configPath)&&file_exists($htaccessPath));
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <link type="text/css" rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" media="screen,projection"/>
  <link type="text/css" rel="stylesheet" href="helpers/materialize-1.0.0/css/materialize.min.css" media="screen,projection"/>
  <link type="text/css" rel="stylesheet" href="styles/styles.css" media="screen,projection"/>
  <link type="text/css" rel="stylesheet" href="styles/styles-light.css" media="screen,projection"/>
  <link  type="image/ico" rel="icon" href="favicon.ico" sizes="any"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta name="theme-color" content="#4CAF50">
  <style>:root{--theme-color:#4CAF50;}</style>
  <title>Setup - Wiki|Docs</title>
</head>
<body>
<div class="container">
  <div class="row">
    <div class="col s12">
      <h1>Wiki|Docs</h1>
      <p>Just a databaseless markdown flat-file wiki engine..</p>
    </div><!-- /col -->
    <?php
    if($g_act=="preliminary_check"){
      // define checks
      $check_ok="<span class='secondary-content'><i class='material-icons green-text'>check_circle</i></span>";
      $check_ko="<span class='secondary-content'><i class='material-icons red-text'>cancel</i></span>";
      $check_nd="<span class='secondary-content'><i class='material-icons grey-text'>cancel</i></span>";
      ?>
      <div class="col s12">
        <h2>Checking Web Server and Modules</h2>
        Your environment has been verified..
        <ul class="collection">
          <li class="collection-item">
            webserver: <?= checkWebServer() ?? 'apache or nginx is required' ?>
            <?= checkWebServer() ? $check_ok : $check_ko ?>
          </li>
          <?php foreach($server_modules as $key => $module): ?>
            <li class="collection-item">
              <?= $key ?>: <?= $module ? 'installed' : 'not-installed' ?>
              <?= $module ? $check_ok : $check_ko ?>
            </li>
          <?php endforeach; ?>
          <?php foreach($php_modules as $key => $module): ?>
            <li class="collection-item">
              <span class="secondary-content">
              <i class="material-icons <?= $module ? 'green-text' : 'red-text' ?>">
                <?= $module ? 'check_circle' : 'cancel' ?>
              </i>
              </span>
              <?=$key?>: <?= $php_modules[$key] ?>
            </li>
          <?php endforeach; ?>
        </ul>
        <div class="input-field col s12">
          <a href="setup.php?act=setup" class="waves-effect waves-light btn green white-text right">Continue<i class="material-icons right">keyboard_arrow_right</i></a>
        </div>
      </div><!-- /col -->
      <?php
    }
    ?>
    <?php if($g_act=="setup"){ ?>
      <div class="col s12">
        <h2>Configuration</h2>
        <p>Setup your wiki engine..</p>
        <form action="setup.php?act=check" method="post">
          <div class="row">
            <div class="input-field col s12">
              <input type="text" name="path" id="path" class="validate" value="<?= sanitizeInput(PATH_URI) ?>" required>
              <label for="path"><span class="green-text">Path</span></label>
            </div>
          </div>
          <div class="row">
            <div class="input-field col s12 m5">
              <input type="text" name="title" id="title" class="validate" value="<?= sanitizeInput(TITLE) ?>" required>
              <label for="title"><span class="green-text">Title</span></label>
            </div>
            <div class="input-field col s12 m7">
              <input type="text" name="subtitle" id="subtitle" class="validate" value="<?= sanitizeInput(SUBTITLE) ?>" required>
              <label for="subtitle"><span class="green-text">Subtitle</span></label>
            </div>
          </div>
          <div class="row">
            <div class="input-field col s12 m5">
              <input type="text" name="owner" id="owner" class="validate" placeholder="Contents owner" required>
              <label for="owner"><span class="green-text">Owner</span></label>
            </div>
            <div class="input-field col s12 m7">
              <input type="text" name="notice" id="notice" class="validate" placeholder="Contents copyright notice" required>
              <label for="notice"><span class="green-text">Notice</span></label>
            </div>
          </div>
          <div class="row">
            <div class="input-field col s12 m5">
              <input type="password" name="editcode" id="editcode" class="validate" placeholder="Choose a strong password for editing.." required>
              <label for="editcode"><span class="green-text">Edit authentication code</span></label>
            </div>
            <div class="input-field col s12 m7">
              <input type="password" name="editcode_repeat" id="editcode" class="validate" placeholder="Choose a strong password for editing.." required>
              <label for="editcode"><span class="green-text">Repeat edit authentication code</span></label>
            </div>
          </div>
          <div class="row">
            <div class="input-field col s12 m12">
              <button type="submit" class="btn btn-block waves-effect waves-light green right">Continue<i class="material-icons right">keyboard_arrow_right</i></button>
            </div>
          </div>
        </form>
      </div><!-- /col -->
      <?php
    }
    if($g_act=="check"){
      // define checks
      $check_ok="<span class='secondary-content'><i class='material-icons green-text'>check_circle</i></span>";
      $check_ko="<span class='secondary-content'><i class='material-icons red-text'>cancel</i></span>";
      ?>
      <div class="col s12">
        <h2>Checking configuration</h2>
        <p>Your configuration has been verified..</p>
        <ul class="collection">
          <?php foreach ($checks_array as $key => $value): ?>
            <li class="collection-item">
              <?= ucfirst($key) ?>: <?= sanitizeInput(getSetting($key)) ?>
              <span class="secondary-content">
                <i class="material-icons <?= $value ? 'green-text' : 'red-text' ?>">
                  <?= $value ? 'check_circle' : 'cancel' ?>
                </i>
              </span>
            </li>
          <?php endforeach; ?>
        </ul>
        <div class="input-field col s12">
          <?php if($errors){ ?>
            <button onClick="window.history.back();" class="btn btn-block waves-effect waves-light green lighten-2">Edit configuration<i class="material-icons left">keyboard_arrow_left</i></button>
          <?php }else{ ?>
            <a href="setup.php?act=conclude" class="waves-effect waves-light btn green white-text right">Continue<i class="material-icons right">keyboard_arrow_right</i></a>
          <?php } ?>
        </div>
      </div><!-- /col -->
      <?php
    }
    if($g_act=="conclude"){
    ?>
    <div class="col s12">
      <h2>Saving configuration</h2>
      <?php if($configured){ ?>
        <p>Your configuration has been saved..</p>
        <p><a href="<?= sanitizeInput(getSetting('path')) ?>">Continue</a> to your wiki!</p>
        <i class="material-icons small green-text">check_circle</i>
      <?php }else{ ?>
        <p class="red-text">An error occurred while saving the configuration!</p>
        <i class="material-icons small red-text">cancel</i>
      <?php } ?>
      <?php } ?>
    </div><!-- /row-->
  </div><!-- /container-->
  <script src="helpers/jquery-3.7.0/js/jquery.min.js"></script>
  <script src="helpers/materialize-1.0.0/js/materialize.min.js"></script>
</body>
</html>
