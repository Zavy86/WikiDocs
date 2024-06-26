<?php

$filename = str_replace('\\','/',dirname(__FILE__)."/sitemap.xml");

if (!file_exists($filename)){
    header('location: '.dirname($_SERVER['REQUEST_URI']));
    return;
}

$dom = new DOMDocument;
$dom->load($filename);

$items = $dom->getElementsByTagName('loc');

$n = rand(0, count($items)-1);

header("Location: ".$items[$n]->nodeValue);
?>