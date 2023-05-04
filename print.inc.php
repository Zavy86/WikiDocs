<?php
/**
 * Print
 *
 * @package WikiDocs
 * @repository https://github.com/Zavy86/wikidocs
 *
 * @var WikiDocs $APP
 * @var Document $DOC
 * @var ParsedownExtra $PARSER
 */
?>
<!DOCTYPE html>
<html lang="en">
<head>
	<link type="text/css" rel="stylesheet" href="<?= $APP->PATH ?>helpers/priss-0.0.1/css/print.css" media="print,screen,projection"/>
	<link type="text/css" rel="stylesheet" href="<?= $APP->PATH ?>helpers/katex-0.16.7/css/katex.min.css" media="screen,projection">
	<title><?= ($DOC->ID!="homepage"?$DOC->TITLE." - ":null).$APP->TITLE ?></title>
</head>
<body>
<?= $PARSER->text($DOC->loadContent())."\n" ?>
<script>window.print();</script>
<script src="<?= $APP->PATH ?>helpers/katex-0.16.7/js/katex.min.js"></script>
<script src="<?= $APP->PATH ?>helpers/katex-0.16.7/js/auto-render.js"></script>
<script>renderMathInElement(document.body);</script>
</body>
</html>
