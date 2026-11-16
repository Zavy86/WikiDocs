<?php
/**
 * Router for the PHP built-in web server
 *
 * Reproduces the rewrite rules of the .htaccess file, which the built-in server ignores.
 *
 * Usage: php -S localhost:8080 router.php
 *
 * @package WikiDocs
 * @repository https://github.com/Zavy86/wikidocs
 */

// refuse to work outside of the built-in web server
if(PHP_SAPI!=='cli-server'){http_response_code(404);exit;}

// make base path from the router position inside the document root (equivalent to RewriteBase)
$document_root=str_replace("\\","/",(string)realpath($_SERVER['DOCUMENT_ROOT']));
$router_dir=str_replace("\\","/",(string)realpath(__DIR__));
$base_path=rtrim(substr($router_dir,strlen($document_root)),"/")."/";

// get the decoded request path
$request_path=rawurldecode((string)parse_url($_SERVER['REQUEST_URI'],PHP_URL_PATH));

// leave requests outside of the wiki to the built-in server
if(strpos($request_path,$base_path)!==0 && $request_path.'/'!==$base_path){return false;}

// get the request path relative to the base path
$relative_path=(string)substr($request_path,strlen($base_path));

// deny access to hidden files and directories (.htaccess, .git, etc.)
if(preg_match('#(^|/)\.#',$relative_path)){http_response_code(403);exit;}

// redirect markdown files to the homepage instead of exposing their sources
if(preg_match('#\.md$#i',$request_path)){header("location: ".$base_path,true,302);exit;}

// serve existing files as they are (assets, attachments, setup.php, etc.)
$requested_file=realpath(__DIR__."/".$relative_path);
if($requested_file!==false && is_file($requested_file) && strpos(str_replace("\\","/",$requested_file),$router_dir."/")===0){return false;}

// rewrite every other request to the index passing the document id (query string parameters are preserved)
$_GET['doc']=$relative_path;
$_REQUEST['doc']=$relative_path;

// run the index from its own directory, as apache does, so relative paths are resolved correctly
chdir(__DIR__);
require __DIR__."/index.php";
