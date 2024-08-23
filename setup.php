<?php
/**
 * Setup
 *
 * @package WikiDocs
 * @repository https://github.com/Zavy86/wikidocs
 */

// initialize session
session_start();
// errors configuration
error_reporting(E_ALL & ~E_NOTICE);
ini_set("display_errors",true);
// definitions
$errors=false;
$configured=false;
$checks_array=array();
// acquire variables
$g_act=($_GET['act'] ?? '');
if(!$g_act){$g_act="setup";}
// include configuration sample
include("datasets/sample.config.inc.php");
// defines constants
define('PATH_URI',explode("setup.php",$_SERVER['REQUEST_URI'])[0]);
// die if configuration already exist
if(file_exists("datasets/config.inc.php")){die("Wiki|Docs is already configured..");}
// make root dir from given path
$original_dir=str_replace("\\","/",realpath(dirname(__FILE__))."/");
$root_dir=substr($original_dir,0,strrpos($original_dir,($_POST['path'] ?? ''))).($_POST['path'] ?? '');
// check action
if($g_act=="check"){
	// reset session setup
	$_SESSION['wikidocs']['setup']=null;
	// check setup
	if(file_exists($root_dir."setup.php")){$checks_array['path']=true;}else{$checks_array['path']=false;$errors=true;}
	if(strlen($_POST['title'])){$checks_array['title']=true;}else{$checks_array['title']=false;$errors=true;}
	if(strlen($_POST['subtitle'])){$checks_array['subtitle']=true;}else{$checks_array['subtitle']=false;$errors=true;}
	if(strlen($_POST['owner'])){$checks_array['owner']=true;}else{$checks_array['owner']=false;$errors=true;}
	if(strlen($_POST['notice'])){$checks_array['notice']=true;}else{$checks_array['notice']=false;$errors=true;}
	if(strlen($_POST['editcode']) && $_POST['editcode']===$_POST['editcode_repeat']){$checks_array['editcode']=true;}else{$checks_array['editcode']=false;$errors=true;}
	// set session setup
	if(!$errors){$_SESSION['wikidocs']['setup']=$_POST;}
}
// conclude action
if($g_act=="conclude"){
	// build configuration file
	$config="<?php\n";
	$config.="define('DEBUGGABLE',false);\n";
	$config.="define('PATH',\"".$_SESSION['wikidocs']['setup']['path']."\");\n";
	$config.="define('TITLE',\"".$_SESSION['wikidocs']['setup']['title']."\");\n";
	$config.="define('SUBTITLE',\"".$_SESSION['wikidocs']['setup']['subtitle']."\");\n";
	$config.="define('OWNER',\"".$_SESSION['wikidocs']['setup']['owner']."\");\n";
	$config.="define('NOTICE',\"".$_SESSION['wikidocs']['setup']['notice']."\");\n";
	$config.="define('PRIVACY',null);\n";
	$config.="define('EDITCODE',\"".str_replace("$","\\$",password_hash($_SESSION['wikidocs']['setup']['editcode'],PASSWORD_DEFAULT))."\");\n";
	$config.="define('VIEWCODE',null);\n";
	$config.="define('COLOR',\"#4CAF50\");\n";
	$config.="define('DARK',false);\n";
	$config.="define('GTAG',null);\n";
	// write configuration file
	file_put_contents($root_dir."datasets/config.inc.php",$config);
	// build htacess file
	$htaccess="<IfModule mod_rewrite.c>\n";
	$htaccess.="\tRewriteEngine On\n";
	$htaccess.="\tRewriteBase ".$_SESSION['wikidocs']['setup']['path']."\n";
	$htaccess.="\tRewriteCond %{REQUEST_URI} \.md$ [NC]\n";
	$htaccess.="\tRewriteRule ^.*$ / [R=301,L]\n";
	$htaccess.="\tRewriteCond %{REQUEST_FILENAME} !-f\n";
	$htaccess.="\tRewriteRule ^(.*)$ index.php?doc=$1 [NC,L,QSA]\n";
	$htaccess.="</IfModule>\n";
	// write htaccess
	file_put_contents($root_dir.".htaccess",$htaccess);
	// check for configuration and apache access files
	if(file_exists($root_dir."datasets/config.inc.php") && file_exists($root_dir.".htaccess")){$configured=true;}else{$configured=false;}
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
		<?php if($g_act=="setup"){ ?>
			<div class="col s12">
				<h2>Configuration</h2>
				<p>Setup your wiki engine..</p>
				<form action="setup.php?act=check" method="post">
					<div class="row">
						<div class="input-field col s12">
							<input type="text" name="path" id="path" class="validate" value="<?= PATH_URI ?>" required>
							<label for="path"><span class="green-text">Path</span></label>
						</div>
					</div>
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
					<li class="collection-item"><div>PATH: <?= $_POST['path'].($checks_array['path']?$check_ok:$check_ko) ?></div></li>
					<li class="collection-item"><div>TITLE: <?= $_POST['title'].($checks_array['title']?$check_ok:$check_ko) ?></div></li>
					<li class="collection-item"><div>SUBTITLE: <?= $_POST['subtitle'].($checks_array['subtitle']?$check_ok:$check_ko) ?></div></li>
					<li class="collection-item"><div>OWNER: <?= $_POST['owner'].($checks_array['owner']?$check_ok:$check_ko) ?></div></li>
					<li class="collection-item"><div>NOTICE: <?= $_POST['notice'].($checks_array['notice']?$check_ok:$check_ko) ?></div></li>
					<li class="collection-item"><div>EDITCODE: <?= str_repeat('*',strlen($_POST['editcode'])).($checks_array['editcode']?$check_ok:$check_ko) ?></div></li>
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
				<p><a href="<?= $_SESSION['wikidocs']['setup']['path'] ?>">Continue</a> to your wiki!</p>
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
