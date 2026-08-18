<?php
/**
 * Functions
 *
 * @package WikiDocs
 * @repository https://github.com/Zavy86/wikidocs
 */

/**
 * Dump a variable into a debug box (only if debug is enabled)
 *
 * @param mixed $variable Dump variable
 * @param ?string $label Dump label
 * @param ?string $class Dump class
 * @param bool $force Force dump also if debug is disabled
 */
function wdf_dump($variable,?string $label=null,?string $class=null,bool $force=false):void{
  if(!DEBUG && !$force){return;}
  echo "\n<!-- dump -->\n";
  echo "<pre class='debug ".$class."'>\n";
  if($label<>null){echo "<b>".$label."</b>\n";}
  if(is_string($variable)){$variable=str_replace(array("<",">"),array("&lt;","&gt;"),$variable);}
  print_r($variable);
  echo "</pre>\n<!-- /dump -->\n";
}

/**
 * Redirect (if debug is enabled show a redirect link)
 *
 * @param string $location Location URL
 */
function wdf_redirect(string $location):void{
  if(DEBUG){die("<a href=\"".$location."\">".$location."</a>");}
  header("location: ".$location);
  exit;
}

/**
 * Safe Internal Path
 *
 * Force a user supplied path to stay inside the application, blocking absolute,
 * protocol relative and scheme prefixed targets so it cannot be used as an open
 * redirect.
 *
 * @param string $path Requested path
 * @return string Internal path prefixed with PATH
 */
function wdf_safe_internal_path(string $path):string{
  // strip control characters (tab, CR, LF) that browsers remove from URLs and
  // could otherwise hide a leading "//host"
  $path=preg_replace('/[\x00-\x1F\x7F]/','',$path);
  // normalize backslashes so "\evil.com" cannot be read as an authority
  $path=str_replace("\\","/",$path);
  // drop any scheme prefix (http:, javascript:, ...)
  $path=preg_replace('#^[a-z][a-z0-9+.\-]*:#i','',$path);
  // strip leading slashes so the result can never leave the current host
  return PATH.ltrim($path,'/');
}

/**
 * Alert (if debug is enabled show a debug message)
 *
 * @param string $message Alert message
 * @param string $class Alert class (success|info|warning|danger)
 * @return bool
 */
function wdf_alert(string $message,string $class="info"):bool{
  // checks
  if(!$message){return false;}
  // build alert object
  $alert=new stdClass();
  $alert->timestamp=time();
  $alert->message=$message;
  $alert->class=$class;
  // check for debug
  if(!DEBUG){
    // add alert to session alerts
    $_SESSION['wikidocs']['alerts'][]=$alert;
  }else{
    // swicth class
    switch($class){
      case "success":$message="(!) ".$message;break;
      case "warning":$message="/!\\ ".$message;break;
      case "danger":$message="<!> ".$message;break;
      default:$message="(?) ".$message;
    }
    wdf_dump($message,"ALERT");
  }
  return true;
}

/**
 * Retrieve the latest Wiki|Docs release from Pulse.
 *
 * Homepage checks share a file cache for eight hours. Authentication checks
 * bypass that interval so an authenticated user immediately sees a release
 * notification when one is available.
 *
 * @param bool $force Whether to bypass the homepage cache interval
 * @return ?string The latest version, or null when Pulse is unavailable
 */
function wdf_pulse_latest_version(bool $force=false):?string{
  $cachePath=BASE.'datasets/pulse.json';
  $cacheHandle=@fopen($cachePath,'c+');
  // Never turn a Pulse outage or an unwritable runtime cache into a site error.
  if($cacheHandle===false){
    if(!$force){return null;}
    return wdf_pulse_request_latest_version();
  }
  if(!flock($cacheHandle,LOCK_EX)){
    fclose($cacheHandle);
    return null;
  }
  rewind($cacheHandle);
  $cache=json_decode(stream_get_contents($cacheHandle),true);
  if(!is_array($cache)){$cache=[];}
  $attemptedAt=(int)($cache['attemptedAt'] ?? 0);
  if(!$force && $attemptedAt>(time()-(8*60*60))){
    $version=$cache['version'] ?? null;
    flock($cacheHandle,LOCK_UN);
    fclose($cacheHandle);
    return (is_string($version) && strlen($version))?$version:null;
  }
  $version=wdf_pulse_request_latest_version();
  $newCache=['attemptedAt'=>time(),'version'=>$version];
  rewind($cacheHandle);
  ftruncate($cacheHandle,0);
  fwrite($cacheHandle,json_encode($newCache));
  fflush($cacheHandle);
  flock($cacheHandle,LOCK_UN);
  fclose($cacheHandle);
  return $version;
}

/**
 * Request the Pulse endpoint with the current version and privacy mode.
 *
 * @return ?string The latest version, or null for any transport/API failure
 */
function wdf_pulse_request_latest_version():?string{
  $query=http_build_query(['version'=>trim(VERSION),'mode'=>(strlen(VIEWCODE ?? '')?'private':'public')]);
  $context=stream_context_create(['http'=>['method'=>'GET','timeout'=>2,'ignore_errors'=>true,'header'=>"Accept: application/json\r\n" ]]);
  $response=@file_get_contents('https://pulse.wikidocs.app/api/latest?'.$query,false,$context);
  if($response===false){return null;}
  $payload=json_decode($response,true);
  if(!is_array($payload) || !isset($payload['version']) || !is_string($payload['version'])){return null;}
  $version=trim($payload['version']);
  return strlen($version)?$version:null;
}

/**
 * CSRF Check
 *
 * @return bool
 */
function wdf_csrf_check():bool{
  if(!isset($_POST['token']) || $_POST['token'] !== Session::getInstance()->token()){
    return false;
  }
  return true;
}

/**
 * Document ID Check
 *
 * @param string $id Document ID
 * @return bool
 */
function wdf_document_id_check(string $id):bool{
  // reject control characters, null bytes, backslashes and drive/scheme colons
  if (preg_match('/[\x00-\x1F\x7F\\\\:]/', $id)) {
    return false;
  }
  // reject parent traversal and absolute paths
  if (substr_count($id, "..") > 0 || strpos($id, '/') === 0) {
    return false;
  }
  return true;
}

/**
 * Safe File Name
 *
 * Reduce a user supplied file name to a single path component so it can never
 * escape the document directory it is joined to.
 *
 * @param string $name File name
 * @return string Sanitized file name (empty string if nothing usable remains)
 */
function wdf_safe_filename(string $name):string{
  // normalize windows separators, then keep the last path component only
  $name = basename(str_replace("\\", "/", $name));
  // strip control characters and null bytes
  $name = preg_replace('/[\x00-\x1F\x7F]/', '', $name);
  // drop leading dots so "." and ".." cannot survive
  $name = ltrim($name, ".");
  return $name;
}

/**
 * MIME Types
 *
 * Load the project maintained extension => MIME types map from
 * helpers/mimetypes/mimetypes.php and merge the optional user maintained
 * helpers/mimetypes/mimetypes-custom.php on top of it, so an extension
 * defined by the user replaces the default entry for that extension.
 *
 * Extensions are lowercased and every entry is normalized to an array of MIME
 * types, so a custom file may declare a single type as a plain string.
 *
 * @return array Map of lowercase extension => array of accepted MIME types
 */
function wdf_mimetypes():array{
  static $mimetypes=null;
  if($mimetypes!==null){return $mimetypes;}
  $dir=(defined("BASE")?BASE:__DIR__.DIRECTORY_SEPARATOR)."helpers".DIRECTORY_SEPARATOR."mimetypes".DIRECTORY_SEPARATOR;
  $mimetypes=array();
  foreach(array("mimetypes.php","mimetypes-custom.php") as $file){
    if(!file_exists($dir.$file)){continue;}
    $loaded=require($dir.$file);
    if(!is_array($loaded)){continue;}
    foreach($loaded as $extension=>$types){
      $extension=strtolower(trim((string)$extension));
      if(!strlen($extension)){continue;}
      $types=array_values(array_filter(array_map(
        fn($type)=>strtolower(trim((string)$type)),
        is_array($types)?$types:array($types)
      ),fn($type)=>strlen($type)>0));
      if(!count($types)){continue;}
      $mimetypes[$extension]=$types;
    }
  }
  return $mimetypes;
}

/**
 * MIME Type Allowed
 *
 * Check the content type reported for an uploaded file against the MIME types
 * declared for its extension. An extension that is not declared is not
 * checked, so an unusual format can be enabled through the attachment
 * settings without also having to describe it in the MIME map.
 *
 * The reported content type is supplied by the client and can be forged, so
 * this is a usability filter and not a security boundary: the extension
 * allow-list remains the gate that decides what may be uploaded.
 *
 * @param string $extension File extension (case insensitive)
 * @param ?string $type Content type reported for the uploaded file
 * @return bool True if the content type is plausible for the extension
 */
function wdf_mimetype_allowed(string $extension,?string $type):bool{
  $mimetypes=wdf_mimetypes();
  $extension=strtolower(trim($extension));
  // unknown extension, nothing to check against
  if(!isset($mimetypes[$extension])){return true;}
  // strip any parameters, e.g. "text/plain; charset=utf-8"
  $type=strtolower(trim(explode(";",(string)$type)[0]));
  return in_array($type,$mimetypes[$extension],true);
}

/**
 * Timestamp Format
 *
 * @param ?int $timestamp Unix timestamp
 * @param string $format Date Time format (see php.net/manual/en/function.date.php)
 * @return string|boolean Formatted timestamp or false
 * @throws Exception
 */
function wdf_timestamp_format(?int $timestamp,string $format="Y-m-d H:i:s"){
  if(!is_numeric($timestamp) || $timestamp==0){return false;}
  // build date time object
  $datetime=new DateTime("@".$timestamp);
  if(defined('TIMEZONE') && TIMEZONE != 'default'){
    $datetime->setTimezone(new DateTimeZone(TIMEZONE));
  }
  // return date time formatted
  return $datetime->format($format);
}

/**
 * Regenerate Sitemap
 */
function wdf_regenerate_sitemap(){
  $baseURL=URL;
  $lastMod=date('Y-m-d\TH:i:sP',Document::getUpdateDate("/homepage"));
  // open sitemap
  $sitemap=<<<EOS
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
 <url>
  <loc>$baseURL</loc>
  <lastmod>$lastMod</lastmod>
 </url>

EOS;
  // add documents from root
  $sitemap.=wdf_regenerate_sitemap_documents();
  // close sitemap
  $sitemap.=<<<EOS
</urlset>

EOS;
  // write sitemap to file
  file_put_contents(DIR."sitemap.xml",$sitemap);
}
function wdf_regenerate_sitemap_documents(?string $parent=null){
  $sitemap='';
  $documents=Document::index($parent);
  // cycle all documents
  foreach($documents as $document){
    // set variables
    $url=URL.$document->url;
    $lastMod=date('Y-m-d\TH:i:sP',Document::getUpdateDate($document->url));
    // add to sitemap
    $sitemap.=<<<EOS
 <url>
  <loc>$url</loc>
  <lastmod>$lastMod</lastmod>
 </url>

EOS;
    // add sub documents recursively
    $sitemap.= wdf_regenerate_sitemap_documents($document->url);
  }
  return $sitemap;
}

/**
 * Parse inline text for custom tags while ignoring code blocks and inline code
 *
 * @param string $text The text to parse
 * @param array $tags The tags to process
 * @return string Parsed text
 */
function parseCustomTags($text, $tags) {
  // Regular expression to match inline code (`code`) and code blocks (```code```)
  $codeBlockPattern = '/(```.*?```|`[^`]*`)/s';
  // Split text by code blocks
  $segments = preg_split($codeBlockPattern, $text, -1, PREG_SPLIT_DELIM_CAPTURE);
  // Process only non-code segments
  foreach ($segments as &$segment) {
    // If the segment is not a code block, process for custom tags
    if (!preg_match($codeBlockPattern, $segment)) {
      foreach ($tags as $tag => $callback) {
        if (preg_match('/\[' . $tag . '(?::(\d+))?]/', $segment, $matches)) {
          $param = isset($matches[1]) ? (int)$matches[1] : 7; // Default limit is 7
          $html = call_user_func($callback, $param);
          $segment = str_replace($matches[0], $html, $segment);
        }
      }
    }
  }
  // Join the segments back together
  return implode('', $segments);
}

/**
 * Render the recent edits
 *
 * @param int $limit Number of recent edits to show
 * @return string HTML of the recent edits
 */
function renderRecentEdits($limit = 7) {
  $docs = Document::getLastEditedDocs($limit);
  $html = "<ul>\n";
  foreach ($docs as $doc) {
    $path = rtrim($doc['path'], '/');
    $title = getDocumentTitle($path);
    $html .= '<li><a href="' . URL . $path . '">' . $title . '</a> - ' . date('Y-m-d H:i', $doc['timestamp']) . "</li>\n";
  }
  $html .= "</ul>\n";
  return $html;
}

/**
 * Get the title of a document from the first line of its content.md file
 *
 * @param string $path The path to the document
 * @return string The title of the document
 */
function getDocumentTitle($path) {
  // Construct the full path to the content.md file
  $fullPath = realpath(__DIR__ . '/../public_html/datasets/documents/' . $path . '/content.md');
  if ($fullPath && file_exists($fullPath)) {
    $file = fopen($fullPath, 'r');
    if ($file) {
      $firstLine = fgets($file);
      fclose($file);
      if ($firstLine !== false && strpos($firstLine, '# ') === 0) {
        return trim(substr($firstLine, 2));
      }
    }
  }
  return $path; // fallback to the path if title not found
}

/**
 * Render the total number of content.md files
 *
 * @return string The total number of content.md files
 */
function renderTotalContent() {
  $total = Document::getTotalContentCount();
  return (string)$total;
}

/**
 * Parse inline text for custom tags like [wd-recentedits] and [wd-total]
 *
 * @param string $text The text to parse
 * @return string Parsed text
 */
function parseInlineText($text) {
  // Define the tags and their respective callbacks
  $tags = [
    'wd-recentedits' => function($limit = 7) {
      return renderRecentEdits($limit);
    },
    'wd-total' => function() {
      return renderTotalContent();
    }
  ];
  return parseCustomTags($text, $tags);
}
