<?php

class ParsedownPlus extends ParsedownFilter
{
    protected $embedingMode = true;
    protected $cssAdded = false;
    protected $predefinedColors = [];
    protected $monospaceFont = 'monospace';

    // patterns
    const CODE_BLOCK_PATTERN = '/(```[\s\S]*?```|~~~[\s\S]*?~~~|<pre>[\s\S]*?<\/pre>)/';
    const VIDEO_TAG_PATTERN = '/\[video.*src="([^"]*)".*\]/';
    const COLOR_TAG_PATTERN = '/\[color=([^\]]+)\](.*?)\[\/color\]/s';
    const RTL_TAG_PATTERN = '/\[rtl\](.*?)\[\/rtl\]/s';
    const LTR_TAG_PATTERN = '/\[ltr\](.*?)\[\/ltr\]/s';
    const MONO_TAG_PATTERN = '/\[mono\](.*?)\[\/mono\]/s';
    const COLLAPSIBLE_SECTION_PATTERN = '/\+\+\+(.*?)\n(.*?)\n\+\+\+/s';

    public function __construct(array $params = null)
    {
        parent::__construct($params);
        if (version_compare(parent::version, '0.8.0-beta-1') < 0) {
            throw new Exception('ParsedownPlus requires a later version of Parsedown');
        }
        $this->loadConfig();
    }

    protected function loadConfig()
    {
        $configFile = __DIR__ . '/config.php';
        if (file_exists($configFile)) {
            $config = include($configFile);
            if (is_array($config)) {
                if (isset($config['colors']) && is_array($config['colors'])) {
                    $this->predefinedColors = $config['colors'];
                }
                if (isset($config['fonts']) && isset($config['fonts']['monospace'])) {
                    $this->monospaceFont = $config['fonts']['monospace'];
                }
            }
        }
    }

    public function text($text)
    {
        // process special quotes first (which now handles collapsible sections within them)
        $text = $this->processSpecialQuotesOutsideCode($text);
        // then process top-level collapsible sections
        $text = $this->processCollapsibleSections($text);
        // process the rest as before
        $text = $this->processDetailsTags($text);
        $text = $this->processCustomTagsOutsideCode($text, false);
        $text = parent::text($text);
        $text = $this->processColorTags($text);
        if (!$this->cssAdded) {
            $text = $this->addCss($text);
            $this->cssAdded = true;
        }
        return $text;
    }

    protected function addCss($text)
    {
        $css = "<style>
            .video-responsive {
                position: relative;
                padding-bottom: 56.25%;
                height: 0;
                overflow: hidden;
                max-width: 100%;
                background: #000;
                margin: 1.75rem 0 1rem 0;
            }
            .video-responsive iframe {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
            }
            .rtl, .rtl * {
                direction: rtl;
                unicode-bidi: isolate;
                text-align: right;
            }
            .ltr, .ltr * {
                direction: ltr;
                unicode-bidi: isolate;
                text-align: left;
            }
            .mono {
                font-family: {$this->monospaceFont};
            }
            details {
                border: 1px solid #aaa;
                border-radius: 4px;
                padding: 0.5em 0.5em 0;
                margin: 1.75rem 0 1rem 0;
            }
            summary {
                font-weight: bold;
                margin: -0.5em -0.5em 0;
                padding: 0.5em;
                cursor: pointer;
            }
            details[open] {
                padding: 0.5em;
                margin: 1.75rem 0 1rem 0;
            }
            details[open] summary {
                border-bottom: 1px solid #aaa;
                margin-bottom: 0.5em;
            }
            blockquote.special-quote p {
                margin: 0 0 10px;
            }
            .special-quote-header {
                font-weight: bold;
                color: inherit;
                display: flex;
                align-items: center;
            }
            .special-quote-header i {
                margin-right: 5px;
            }
            blockquote.special-quote.caution {
                border-left-color: #dc3545;
            }
            blockquote.special-quote.caution .special-quote-header {
                color: #dc3545;
            }
            blockquote.special-quote.important {
                border-left-color: #007bff;
            }
            blockquote.special-quote.important .special-quote-header {
                color: #007bff;
            }
            blockquote.special-quote.warning {
                border-left-color: #ffc107;
            }
            blockquote.special-quote.warning .special-quote-header {
                color: #ffc107;
            }
            blockquote.special-quote.tip {
                border-left-color: #28a745;
            }
            blockquote.special-quote.tip .special-quote-header {
                color: #28a745;
            }
            blockquote.special-quote.question {
                border-left-color: #17a2b8;
            }
            blockquote.special-quote.question .special-quote-header {
                color: #17a2b8;
            }
            </style>\n";
        return $css . $text;
    }

    protected function processCustomTagsOutsideCode($text, $includeColor = true)
    {
        $parts = preg_split(self::CODE_BLOCK_PATTERN, $text, -1, PREG_SPLIT_DELIM_CAPTURE);
        foreach ($parts as &$part) {
            if (!preg_match(self::CODE_BLOCK_PATTERN, $part)) {
                $part = $this->processCustomTags($part, $includeColor);
            }
        }
        return implode('', $parts);
    }

    protected function processCustomTags($text, $includeColor = true)
    {
        $text = $this->processVideoTags($text);
        $text = $this->processRtlTags($text);
        $text = $this->processLtrTags($text);
        $text = $this->processMonoTags($text);
        if ($includeColor) {
            $text = $this->processColorTags($text);
        }
        return $text;
    }

    protected function processVideoTags($text)
    {
        return preg_replace_callback(
            self::VIDEO_TAG_PATTERN,
            function ($matches) {
                $url = $matches[1];
                $type = '';
                $needles = ['youtube', 'vimeo'];
                foreach ($needles as $needle) {
                    if (strpos($url, $needle) !== false) {
                        $type = $needle;
                    }
                }
                switch ($type) {
                    case 'youtube':
                        $src = preg_replace('/.*\?v=([^\&\]]*).*/', 'https://www.youtube.com/embed/$1', $url);
                        return '<div class="video-responsive"><iframe src="' . $src . '" title="YouTube video player" frameborder="0" allowfullscreen></iframe></div>';
                    case 'vimeo':
                        $src = preg_replace('/(?:https?:\/\/(?:[\w]{3}\.|player\.)*vimeo\.com(?:[\/\w:]*(?:\/videos)?)?\/([0-9]+)[^\s]*)/', 'https://player.vimeo.com/video/$1', $url);
                        return '<div class="video-responsive"><iframe src="' . $src . '" title="Vimeo video player" frameborder="0" allowfullscreen></iframe></div>';
                    default:
                        return $matches[0]; // return the original if no match
                }
            },
            $text
        );
    }

    protected function processColorTags($text)
    {
        $parts = preg_split(self::CODE_BLOCK_PATTERN, $text, -1, PREG_SPLIT_DELIM_CAPTURE);
        foreach ($parts as &$part) {
            if (!preg_match(self::CODE_BLOCK_PATTERN, $part)) {
                $part = preg_replace_callback(
                    self::COLOR_TAG_PATTERN,
                    function ($matches) {
                        $color = $matches[1];
                        if (isset($this->predefinedColors[$color])) {
                            $color = $this->predefinedColors[$color];
                        } else {
                            $color = htmlspecialchars($color);
                        }
                        $content = $matches[2];
                        // check if the content contains block-level elements
                        if (preg_match('/<(?:p|div|h[1-6]|ul|ol|li|blockquote|pre|table|dl|address)/i', $content)) {
                            return "<div style=\"color:$color;\">$content</div>";
                        } else {
                            return "<span style=\"color:$color;\">$content</span>";
                        }
                    },
                    $part
                );
            }
        }
        return implode('', $parts);
    }

    protected function processRtlTags($text)
    {
        return preg_replace_callback(
            self::RTL_TAG_PATTERN,
            function ($matches) {
                $content = $this->text($matches[1]);
                return "<div class=\"rtl\">$content</div>";
            },
            $text
        );
    }

    protected function processLtrTags($text)
    {
        return preg_replace_callback(
            self::LTR_TAG_PATTERN,
            function ($matches) {
                $content = $this->text($matches[1]);
                return "<div class=\"ltr\">$content</div>";
            },
            $text
        );
    }

    protected function processMonoTags($text)
    {
        return preg_replace_callback(
            self::MONO_TAG_PATTERN,
            function ($matches) {
                $content = $matches[1];
                return "<span class=\"mono\">$content</span>";
            },
            $text
        );
    }

    protected function processDetailsTags($text)
    {
        $pattern = '/<details\b(.*?)>(.*?)<\/details>/is';
        return preg_replace_callback($pattern, function ($matches) {
            $attributes = $matches[1];
            $content = $matches[2];
            // process the content inside <summary> tags separately
            if (preg_match('/<summary>(.*?)<\/summary>/is', $content, $summaryMatches)) {
                $summary = $summaryMatches[0];
                $summaryContent = $summaryMatches[1];
                // remove the <summary> from content
                $contentWithoutSummary = str_replace($summary, '', $content);
                // process the summary content as inline markdown
                $processedSummaryContent = parent::line(trim($summaryContent));
                $processedSummary = "<summary>{$processedSummaryContent}</summary>";
                // process the content
                $processedContent = $this->processIndentedContent($contentWithoutSummary);
            } else {
                $processedSummary = '';
                $processedContent = $this->processIndentedContent($content);
            }
            return "<details{$attributes}>{$processedSummary}{$processedContent}</details>";
        }, $text);
    }

    protected function processCollapsibleSections($text)
    {
        $lines = explode("\n", $text);
        $resultLines = [];
        $inCollapsible = false;
        $currentSummary = '';
        foreach ($lines as $line) {
            // preserve the original line indentation
            $originalLine = $line;
            if (preg_match('/^(\s*)\+\+\+(.*)$/', $line, $matches)) {
                $indentation = $matches[1];
                $summary = trim($matches[2]);
                if ($inCollapsible) {
                    // end of collapsible section
                    $resultLines[] = "{$indentation}</details>";
                    $inCollapsible = false;
                } else {
                    // start of collapsible section
                    $currentSummary = $summary ?: 'Click to expand';
                    $resultLines[] = "{$indentation}<details><summary>{$currentSummary}</summary>";
                    $inCollapsible = true;
                }
            } else {
                $resultLines[] = $originalLine;
            }
        }
        // close any remaining open collapsible section
        if ($inCollapsible) {
            $resultLines[] = "</details>";
        }
        return implode("\n", $resultLines);
    }

    protected function processIndentedContent($content)
    {
        // split content into lines
        $lines = explode("\n", $content);
        $processedLines = [];
        $inCodeBlock = false;
        $codeBlockContent = '';
        $currentIndent = '';
        foreach ($lines as $line) {
            $trimmedLine = trim($line);
            // handle code block markers
            if (preg_match('/^(```|~~~)(.*)$/', $trimmedLine, $matches)) {
                if ($inCodeBlock) {
                    // end of code block
                    $inCodeBlock = false;
                    $processedLines[] = $codeBlockContent . "\n" . $line;
                    $codeBlockContent = '';
                } else {
                    // start of code block
                    $inCodeBlock = true;
                    $codeBlockContent = $line;
                }
                continue;
            }
            if ($inCodeBlock) {
                // preserve code block content exactly as is
                $codeBlockContent .= "\n" . $line;
                continue;
            }
            // handle non-code-block content
            if ($trimmedLine === '') {
                // preserve empty lines
                $processedLines[] = '';
                continue;
            }
            // remove only the common indentation at the start of the line
            if (preg_match('/^(\s+)/', $line, $indentMatches)) {
                $lineIndent = $indentMatches[1];
                if ($currentIndent === '') {
                    $currentIndent = $lineIndent;
                }
                // remove only the common indent
                if (strpos($line, $currentIndent) === 0) {
                    $line = substr($line, strlen($currentIndent));
                }
            }
            $processedLines[] = $line;
        }
        // join the lines back together
        $processedContent = implode("\n", $processedLines);
        // process special quotes first
        $specialQuotesProcessed = $this->processSpecialQuotesOutsideCode($processedContent);
        // finally process as markdown
        $result = parent::text($specialQuotesProcessed);
        return $result;
    }

    protected function getSpecialQuoteIconClass($tag)
    {
        $icons = [
            'caution'   => 'fa-exclamation-triangle',
            'important' => 'fa-info-circle',
            'warning'   => 'fa-exclamation-circle',
            'tip'       => 'fa-sticky-note',
            'question'  => 'fa-question-circle',
        ];
        return $icons[$tag] ?? 'fa-info-circle'; // default to info-circle if tag not found
    }

    protected function processSpecialQuotesOutsideCode($text)
    {
        $text = $this->processSpecialQuotes($text);
        return $text;
    }

    protected function processSpecialQuotes($text)
    {
        $lines = explode("\n", $text);
        $outputLines = [];
        $inSpecialQuote = false;
        $specialQuoteTag = '';
        $specialQuoteHeader = '';
        $specialQuoteContent = [];
        $inCollapsible = false;
        $collapsibleContent = [];
        $currentSummary = '';
        $inCodeBlock = false;
        $codeBlockContent = '';
        foreach ($lines as $line) {
            if (preg_match('/^> \[!(CAUTION|IMPORTANT|WARNING|TIP|QUESTION)\](.*)/i', $line, $matches)) {
                // start of a special blockquote
                if ($inSpecialQuote) {
                    // close any previously opened blockquote
                    if ($inCollapsible) {
                        // close collapsible if open
                        if ($inCodeBlock) {
                            // close code block if open
                            $collapsibleContent[] = $codeBlockContent;
                            $codeBlockContent = '';
                            $inCodeBlock = false;
                        }
                        $processedCollapsible = sprintf(
                            '<details><summary>%s</summary>%s</details>',
                            $currentSummary ?: 'Click to expand',
                            parent::text(implode("\n", $collapsibleContent))
                        );
                        $specialQuoteContent[] = $processedCollapsible;
                        $inCollapsible = false;
                        $collapsibleContent = [];
                    }
                    $outputLines[] = $this->generateSpecialBlockquote($specialQuoteTag, $specialQuoteHeader, $specialQuoteContent);
                    $specialQuoteContent = []; // reset content
                }
                $inSpecialQuote = true;
                $specialQuoteTag = strtolower($matches[1]);
                $specialQuoteHeader = trim($matches[2]);
            } elseif ($inSpecialQuote && preg_match('/^> ?(.*)/', $line, $matches)) {
                $content = $matches[1];
                // handle code blocks inside special quote
                if (preg_match('/^(```|~~~)/', trim($content))) {
                    if ($inCodeBlock) {
                        // end of code block
                        $inCodeBlock = false;
                        $codeBlockContent .= $content;
                        if ($inCollapsible) {
                            $collapsibleContent[] = $codeBlockContent;
                        } else {
                            $specialQuoteContent[] = $codeBlockContent;
                        }
                        $codeBlockContent = '';
                    } else {
                        // start of code block
                        $inCodeBlock = true;
                        $codeBlockContent = $content . "\n";
                    }
                    continue;
                }
                if ($inCodeBlock) {
                    // inside code block, append line
                    $codeBlockContent .= $content . "\n";
                    continue;
                }
                // handle collapsible section markers within special quotes
                if (preg_match('/^\+\+\+(.*)$/', $content, $collapsibleMatches)) {
                    if ($inCollapsible) {
                        // close current collapsible section
                        if ($inCodeBlock) {
                            // close code block if open
                            $collapsibleContent[] = $codeBlockContent;
                            $codeBlockContent = '';
                            $inCodeBlock = false;
                        }
                        $processedCollapsible = sprintf(
                            '<details><summary>%s</summary>%s</details>',
                            $currentSummary ?: 'Click to expand',
                            parent::text(implode("\n", $collapsibleContent))
                        );
                        $specialQuoteContent[] = $processedCollapsible;
                        $inCollapsible = false;
                        $collapsibleContent = [];
                    } else {
                        // start new collapsible section
                        $currentSummary = trim($collapsibleMatches[1]);
                        $inCollapsible = true;
                    }
                } elseif ($inCollapsible) {
                    // add content to current collapsible section
                    $collapsibleContent[] = $content;
                } else {
                    // regular special quote content
                    $specialQuoteContent[] = $content;
                }
            } else {
                // line is not part of the special quote
                if ($inSpecialQuote) {
                    // close code block if open
                    if ($inCodeBlock) {
                        if ($inCollapsible) {
                            $collapsibleContent[] = $codeBlockContent;
                        } else {
                            $specialQuoteContent[] = $codeBlockContent;
                        }
                        $codeBlockContent = '';
                        $inCodeBlock = false;
                    }
                    // close collapsible if open
                    if ($inCollapsible) {
                        $processedCollapsible = sprintf(
                            '<details><summary>%s</summary>%s</details>',
                            $currentSummary ?: 'Click to expand',
                            parent::text(implode("\n", $collapsibleContent))
                        );
                        $specialQuoteContent[] = $processedCollapsible;
                        $inCollapsible = false;
                        $collapsibleContent = [];
                    }
                    // close the special quote
                    $outputLines[] = $this->generateSpecialBlockquote($specialQuoteTag, $specialQuoteHeader, $specialQuoteContent);
                    $inSpecialQuote = false;
                    $specialQuoteTag = '';
                    $specialQuoteHeader = '';
                    $specialQuoteContent = [];
                }
                $outputLines[] = $line;
            }
        }
        // handle any unclosed structures at the end
        if ($inSpecialQuote) {
            // close code block if open
            if ($inCodeBlock) {
                if ($inCollapsible) {
                    $collapsibleContent[] = $codeBlockContent;
                } else {
                    $specialQuoteContent[] = $codeBlockContent;
                }
                $codeBlockContent = '';
                $inCodeBlock = false;
            }
            // close collapsible if open
            if ($inCollapsible) {
                $processedCollapsible = sprintf(
                    '<details><summary>%s</summary>%s</details>',
                    $currentSummary ?: 'Click to expand',
                    parent::text(implode("\n", $collapsibleContent))
                );
                $specialQuoteContent[] = $processedCollapsible;
                $inCollapsible = false;
                $collapsibleContent = [];
            }
            // close special quote
            $outputLines[] = $this->generateSpecialBlockquote($specialQuoteTag, $specialQuoteHeader, $specialQuoteContent);
        }
        return implode("\n", $outputLines);
    }

    protected function generateSpecialBlockquote($tag, $header, $content)
    {
        $iconClass = $this->getSpecialQuoteIconClass($tag);
        $parsedHeader = parent::line($header);
        // join the content, let the parent markdown parser process it properly (so lists are parsed as lists)
        $parsedContent = parent::text(implode("\n", $content));
        return "<blockquote class=\"special-quote {$tag}\"><p class=\"special-quote-header\"><i class=\"fa {$iconClass}\"></i> {$parsedHeader}</p>{$parsedContent}</blockquote>";
    }
}
