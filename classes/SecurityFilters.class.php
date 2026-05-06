<?php
/**
 * SecurityFilters
 *
 * Collection of security filters for content sanitization
 */
class SecurityFilters {
    /**
     * Main filter method - applies all content filters
     *
     * @param string $content Content to filter
     * @return string Filtered content
     */
    public static function filterContent($content) {
        // apply katex filter
        $content = self::filterKaTeX($content);
        // add additional filters here as needed
        return $content;
    }

    /**
     * SVG Sanitizer
     *
     * @param string $svgContent SVG content to sanitize
     * @return string|false Sanitized SVG content or false on error
     */
    public static function sanitizeSVG($svgContent) {
        if (!strlen($svgContent)) {
            return false;
        }
        // create DOMDocument and load SVG
        $dom = new DOMDocument();
        libxml_use_internal_errors(true);
        // disable loading external entities for security
        if (function_exists('libxml_set_external_entity_loader')) {
            libxml_set_external_entity_loader(function ($public, $system, $context) {
                return null;
            });
        }
        // load SVG content
        if (!$dom->loadXML($svgContent, LIBXML_NOENT | LIBXML_DTDLOAD | LIBXML_DTDATTR | LIBXML_NONET)) {
            libxml_clear_errors();
            return false;
        }
        // create XPath
        $xpath = new DOMXPath($dom);
        $xpath->registerNamespace('svg', 'http://www.w3.org/2000/svg');
        // collect nodes to remove
        $nodesToRemove = [];
        // remove script tags
        $scripts = $xpath->query('//svg:script | //script');
        foreach ($scripts as $script) {
            $nodesToRemove[] = $script;
        }
        // remove foreignObject tags
        $foreignObjects = $xpath->query('//svg:foreignObject | //foreignObject');
        foreach ($foreignObjects as $fo) {
            $nodesToRemove[] = $fo;
        }
        // remove style tags
        $styles = $xpath->query('//svg:style | //style');
        foreach ($styles as $style) {
            $nodesToRemove[] = $style;
        }
        // remove animate and set tags
        $animates = $xpath->query('//svg:animate | //animate | //svg:set | //set');
        foreach ($animates as $animate) {
            $nodesToRemove[] = $animate;
        }
        // remove collected nodes
        foreach ($nodesToRemove as $node) {
            if ($node->parentNode) {
                $node->parentNode->removeChild($node);
            }
        }
        // remove on* attributes and javascript:/data: in any attribute
        $allNodes = $xpath->query('//*');
        foreach ($allNodes as $node) {
            if ($node instanceof DOMElement) {
                $attributesToRemove = [];
                foreach ($node->attributes as $attr) {
                    $attrName = strtolower($attr->nodeName);
                    // check for on* attributes
                    if (strpos($attrName, 'on') === 0) {
                        $attributesToRemove[] = $attr->nodeName;
                    }
                    // check for javascript: or data: in any attribute value
                    $attrValue = str_replace([' ', "\r", "\n", "\t"], '', strtolower($attr->nodeValue));
                    if (strpos($attrValue, 'javascript:') === 0 || strpos($attrValue, 'data:') === 0) {
                        $attributesToRemove[] = $attr->nodeName;
                    }
                }
                foreach ($attributesToRemove as $attrName) {
                    $node->removeAttribute($attrName);
                }
            }
        }
        // save and return sanitized SVG
        $result = $dom->saveXML();
        libxml_clear_errors();
        return $result;
    }

    /**
     * KaTeX Filter
     */
    private static function filterKaTeX($content) {
        $blacklistedCommands = [
            '\html',
            '\htmlStyle',
            '\href',
            '\def',
            '\newcommand',
            '\renewcommand',
            '\mathml',
            '\style'
        ];

        $blacklistedTags = [
            '<script',
            '<img',
            '<iframe',
            '<object',
            '<embed',
            '<math',
            '<svg',
            'javascript:',
            'data:',
            'vbscript:'
        ];

        // extract and filter all katex blocks
        $pattern = '/\$\$(.*?)\$\$|\$(.*?)\$/s';
        return preg_replace_callback($pattern, function($matches) use ($blacklistedCommands, $blacklistedTags) {
            $math = !empty($matches[1]) ? $matches[1] : $matches[2];
            $isDisplay = !empty($matches[1]);
            // remove blacklisted commands
            foreach ($blacklistedCommands as $command) {
                $math = str_replace($command, '\\text{BLOCKED}', $math);
            }
            // remove malicious tags
            foreach ($blacklistedTags as $tag) {
                $math = str_ireplace($tag, '&lt;blocked&gt;', $math);
            }
            // prevent math mode escaping
            $math = preg_replace('/\\\\(?![\w\s{},\\\\_^])/u', '\\\\textbackslash', $math);
            // return with appropriate delimiters
            return $isDisplay ? "$$" . $math . "$$" : "$" . $math . "$";
        }, $content);
    }
}
