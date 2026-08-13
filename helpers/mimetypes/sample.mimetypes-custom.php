<?php
/**
 * MIME Types (custom)
 *
 * User maintained map of file extension => accepted MIME types.
 *
 * Copy this file to mimetypes-custom.php in the same directory and add your
 * own entries. The file is optional, is never overwritten by an upgrade and
 * is merged on top of mimetypes.php, so an extension listed here replaces the
 * default entry for that extension.
 *
 * The value may be a single MIME type or an array of accepted types:
 *
 *   "midi" => "audio/midi",
 *   "kml"  => array("application/vnd.google-earth.kml+xml","text/xml"),
 *
 * Adding an extension here does not allow it to be uploaded: the upload
 * allow-list is configured separately in the settings page. This file only
 * declares which content types are plausible for an extension that is already
 * allowed.
 *
 * @package WikiDocs
 * @repository https://github.com/Zavy86/wikidocs
 */

return array(

  // "midi" => "audio/midi",

);
