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
<html>
 <head>
  <link type="text/css" rel="stylesheet" href="<?php echo $APP->PATH; ?>public/helpers/priss-0.0.1/css/print.css" media="print,screen,projection" charset="utf-8"/>
  <title><?php echo ($DOC->ID!="homepage"?$DOC->TITLE." - ":null).$APP->TITLE; ?></title>
 </head>
 <body>
  <?php echo $PARSER->text($DOC->loadContent())."\n"; ?>
  <script type="text/javascript">window.print();</script>
 </body>
</html>
