<?php
/**
 * Configuration
 *
 * @package WikiDocs
 * @repository https://github.com/Zavy86/WikiDocs
 */

// Enable debug
define('DEBUGGABLE',false);
// Virtualhost path or subdirectory with trailing slashes
define('PATH',"/");
// Application title
define('TITLE',"Wiki|Docs");
// Application subtitle
define('SUBTITLE',"flat-file markdown wiki engine");
// Contents owner
define('OWNER',"Owner");
// Contents credits notice
define('NOTICE',"Credits");
// Privacy banner for GDPR-compliant
define('PRIVACY',null);
// MD5 encoded password for editing (default',password)
define('EDITCODE',"5f4dcc3b5aa765d61d8327deb882cf99");
// MD5 encoded password for reading (set null for public wiki)
define('VIEWCODE',null);
// Main theme color
define('COLOR',"#4CAF50");
// Dark mode
define('DARK',false);
// Google Analytics Tag
define('GTAG',null);
