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
  exit(header("location: ".$location));
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
    // dump alert
    wdf_dump($message,"ALERT");
  }
  // return
  return true;
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
 * Parse inline text for custom tags like [recentedits]
 *
 * @param string $text The text to parse
 * @return string Parsed text
 */
function parseInlineText($text) {
    if (preg_match('/\[recentedits(?::(\d+))?\]/', $text, $matches)) {
        $limit = isset($matches[1]) ? (int)$matches[1] : 7;
        $html = renderRecentEdits($limit);
        $text = str_replace($matches[0], $html, $text);
    }
    return $text;
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
