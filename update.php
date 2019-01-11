<?php
/**
 * Update
 *
 * @package WikiDocs
 * @author  Manuel Zavatta <manuel.zavatta@gmail.com>
 * @link    https://github.com/Zavy86/wikidocs
 */

 // include functions
 require_once("functions.inc.php");
 // mode definition
 define(MODE,"engine");
 // check for localhost
 /*if(in_array($_SERVER['HTTP_HOST'],array("localhost","127.0.0.1"))){
  // alert and redirect
  wdf_alert("Git pull denied on localhost!","danger");
  wdf_redirect(PATH);
 }*/
 // check for git
 if(!is_dir(DIR.".git")){
  // alert and redirect
  wdf_alert("Git directory not found!","danger");
  wdf_redirect(PATH);
 }
 // make command
 $command="cd ".DIR." ; pwd ; git stash 2>&1 ; git stash clear ; git pull 2>&1 ; chmod 755 -R ./";
 // debug
 wdf_dump($command,"command");
 // exec shell commands
 $shell_output=exec('whoami')."@".exec('hostname')/*.":".shell_exec($command)*/;
 // debug
 wdf_dump($shell_output,"output");
?>