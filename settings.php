<?php
/**
 * Settings
 *
 * @package WikiDocs
 * @repository https://github.com/Zavy86/wikidocs
 *
 */
require_once("bootstrap.inc.php");
// get localization
$TXT=Localization::getInstance();
// check authentication
if(Session::getInstance()->autenticationLevel()!=2){
  // alert and redirect
  wdf_alert($TXT->SubmitNotAuthenticated,"danger");
  wdf_redirect(PATH);
}
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
  $config.="define('LANG',\"".$_POST['lang']."\");\n";
  $config.="define('TIMEZONE',".($_POST['timezone']?"\"".$_POST['timezone']."\"":"null").");\n";
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
  wdf_alert($TXT->SettingsStored,"success");
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
  <title><?= $TXT->Settings ?> - Wiki|Docs</title>
</head>
<body>
<div class="container">
  <div class="row">
    <div class="col s12">
      <h1>Wiki|Docs</h1>
      <p><?= $TXT->Payoff ?></p>
    </div><!-- /col -->
    <div class="col s12">
      <h2><?= $TXT->Settings ?></h2>
      <p><?= $TXT->SettingsConfigure ?>..</p>
      <form action="settings.php?act=store" method="post">
        <div class="row">
          <div class="input-field col s12 m5">
            <input type="text" name="title" id="title" class="validate" value="<?= TITLE ?>" required>
            <label for="title"><span class="main-color-text"><?= $TXT->SettingsTitle ?></span></label>
          </div>
          <div class="input-field col s12 m7">
            <input type="text" name="subtitle" id="subtitle" class="validate" value="<?= SUBTITLE ?>" required>
            <label for="subtitle"><span class="main-color-text"><?= $TXT->SettingsSubtitle ?></span></label>
          </div>
        </div>
        <div class="row">
          <div class="input-field col s12 m5">
            <input type="text" name="owner" id="owner" class="validate" placeholder="<?= $TXT->SettingsOwnerPlaceholder ?>" value="<?= OWNER ?>" required>
            <label for="owner"><span class="main-color-text"><?= $TXT->SettingsOwner ?></span></label>
          </div>
          <div class="input-field col s12 m7">
            <input type="text" name="notice" id="notice" class="validate" placeholder="<?= $TXT->SettingsNoticePlaceholder ?>" value="<?= NOTICE ?>" required>
            <label for="notice"><span class="main-color-text"><?= $TXT->SettingsNotice ?></span></label>
          </div>
        </div>
        <div class="row">
          <div class="input-field col s12 m12">
            <input type="text" name="privacy" id="privacy" class="validate" placeholder="<?= $TXT->SettingsPrivacyPlaceholder ?>" value="<?= PRIVACY ?>">
            <label for="privacy"><span class="main-color-text"><?= $TXT->SettingsPrivacy ?></span></label>
          </div>
        </div>
        <div class="row">
          <div class="input-field col s12 m5">
            <input type="password" name="editcode" id="editcode" class="validate" placeholder="<?= $TXT->SettingsEditCodePlaceholder ?>.." value="<?= EDITCODE ?>" required>
            <label for="editcode"><span class="main-color-textt"><?= $TXT->SettingsEditCode ?></span></label>
          </div>
          <div class="input-field col s12 m7">
            <input type="password" name="viewcode" id="viewcode" class="validate" placeholder="<?= $TXT->SettingsViewCodePlaceholder ?>.." value="<?= VIEWCODE ?>">
            <label for="viewcode"><span class="main-color-text"><?= $TXT->SettingsViewCode ?></span></label>
          </div>
        </div>
        <div class="row">
          <div class="input-field col s6 m3">
            <input type="text" name="color" id="color" class="validate" placeholder="<?= $TXT->SettingsColorPlaceholder ?>.. (#4CAF50)" value="<?= COLOR ?>" required>
            <label for="color"><span class="main-color-text"><?= $TXT->SettingsColor ?></span></label>
          </div>
          <div class="input-field col s6 m2">
            <label for="check-dark">
              <input type="checkbox" name="dark" id="check-dark"<?php if(DARK){echo " checked";}?>>
              <span><?= $TXT->SettingsDark ?></span>
            </label>
          </div>
          <div class="input-field col s12 m7">
            <input type="text" name="gtag" id="gtag" class="validate" placeholder="<?= $TXT->SettingsGtagPlaceholder ?>.. (like UA-123456789-1)" value="<?= GTAG ?>">
            <label for="gtag"><span class="main-color-text"><?= $TXT->SettingsGtag ?></span></label>
          </div>
        </div>
        <div class="row">
          <div class="input-field col s12 m5">
            <select name="lang" id="lang" class="validate" value="<?= LANG ?>">
              <?php foreach(Localization::available() as $value=>$label): ?>
                <option value="<?= $value ?>"<?= ($value==LANG?" selected":null) ?>><?= $label ?></option>
              <?php endforeach; ?>
            </select>
            <label for="lang"><span class="main-color-text"><?= $TXT->SettingsLanguage ?></span></label>
          </div>
          <div class="input-field col s12 m7">
            <select name="timezone" id="timezone" class="validate" value="<?= TIMEZONE ?>">
              <option value="default"<?= ("default"==TIMEZONE?" selected":null) ?>>Default</option>
              <?php foreach(DateTimeZone::listIdentifiers() as $timezone):var_dump($timezone); ?>
                <option value="<?= $timezone ?>"<?= ($timezone==TIMEZONE?" selected":null) ?>><?= $timezone ?></option>
              <?php endforeach; ?>
            </select>
            <label for="timezone"><span class="main-color-text"><?= $TXT->SettingsTimezone ?></span></label>
          </div>
        </div>
        <div class="row">
          <div class="input-field col s12 m12">
            <button type="button" class="btn btn-block waves-effect waves-light grey left" onclick="location.href='<?= PATH ?>';"><?= $TXT->SettingsCancel ?><i class="material-icons left">keyboard_arrow_left</i></button>
            <button type="submit" class="btn btn-block waves-effect waves-light main-color right"><?= $TXT->SettingsSubmit ?><i class="material-icons right">check</i></button>
          </div>
        </div>
      </form>
    </div><!-- /col -->
  </div><!-- /row-->
</div><!-- /container-->
<script src="helpers/jquery-3.7.0/js/jquery.min.js"></script>
<script src="helpers/materialize-1.0.0/js/materialize.min.js"></script>
<script>
  document.addEventListener('DOMContentLoaded',function(){
    let selectElements=document.querySelectorAll('select');
    let instances=M.FormSelect.init(selectElements);
  });
</script>
</body>
</html>
