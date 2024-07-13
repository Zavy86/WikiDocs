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
    <!-- override some priss css -->
    <style>
        /* bidirectional language support */
        h1,h2,h3,h4,h5,h6,p,pre,th,td{unicode-bidi:plaintext;text-align:start;}
        /* these are set too small */
        code, pre, blockquote, .mono {font-family: Consolas, 'Courier New', Courier, monospace; font-size: 11pt !important;}
        /* fixes long strings making side menu freeze */
        h1, h2, h3, h4, p, article ul li, article ol li, td {overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; hyphens: auto;}
        /* based on markdown rules, tables should be 100% */
        table{width:100%;}
        /* font must be defined for international langs to display in monospace */
        code, pre {font-family: Consolas, 'Courier New', Courier, monospace;}
        /* hide video elements */
        .video-responsive, .video-responsive iframe {display:none;}
    </style>
    <!-- start with details open -->
    <script>
    window.addEventListener('beforeprint', function() {
        document.querySelectorAll('details').forEach(function(detail) {
        detail.setAttribute('open', '');
        });
    });
    </script>
</head>
<body>
<script src="<?= $APP->PATH ?>helpers/mermaid-9.4.3/mermaid.min.js"></script>
<script>mermaid.initialize({ startOnLoad: true,'theme':'neutral' });</script>
<?= $PARSER->text($DOC->loadContent())."\n" ?>
<script src="<?= $APP->PATH ?>helpers/katex-0.16.7/js/katex.min.js"></script>
<script src="<?= $APP->PATH ?>helpers/katex-0.16.7/js/auto-render.js"></script>
<script>renderMathInElement(document.body);</script>
<script>window.print();</script>
</body>
</html>
