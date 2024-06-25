<?php
/**
 * Configuration
 *
 * @package WikiDocs
 * @repository https://github.com/Zavy86/WikiDocs
 */

// Enable debug
define('DEBUGGABLE',false);
// Localization language (availables: en, it)
define('LANG',"en");
// Application title
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
// Hashed password for editing (default',password)
define('EDITCODE',"\$2y\$10\$r6OE5vLrPtnjvLZ2l8vFnO9JySb5TlwWLWZE6xTvWB9h8tUdVSsvK");
// Hashed encoded password for reading (set null for public wiki)
define('VIEWCODE',null);
// Main theme color
define('COLOR',"#4CAF50");
// Google Analytics Tag
define('GTAG',null);
