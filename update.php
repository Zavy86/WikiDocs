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
 // check authentication
 if(wdf_authenticated()!=2){die("You are not authenticated!");}
 // check for git
 if(is_dir(DIR.".git")){
  wdf_dump("Git repository found!",null,null,true);
  // check for localhost
  if(in_array($_SERVER['HTTP_HOST'],array("localhost","127.0.0.1"))){
   die("Git pull denied non localhost!");
  }else{
   // make command
   $command="cd ".DIR." ; pwd ; git stash 2>&1 ; git stash clear ; git pull 2>&1 ; chmod 755 -R ./";
   // exec shell commands
   $shell_output=exec('whoami')."@".exec('hostname').":".shell_exec($command);
   // debug
   wdf_dump($shell_output,"shell_exec",null,true);
  }
 }else{
  die("Git repository not found!");
 }
?>