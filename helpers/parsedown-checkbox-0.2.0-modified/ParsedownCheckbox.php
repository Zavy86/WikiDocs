<?php

/**
 * This file is part of the ParsedownCheckbox package.
 *
 * (c) Simon Leblanc <contact@leblanc-simon.eu>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
class ParsedownCheckbox extends ParsedownExtra
{
    const VERSION = '0.2.0';

    public function __construct()
    {
        parent::__construct();

        array_unshift($this->BlockTypes['['], 'Checkbox');
    }

    protected function blockCheckbox($line)
    {
        $text = trim($line['text']);
        $begin_line = substr($text, 0, 4);
        if ('[ ] ' === $begin_line) {
            return [
                'handler' => 'checkboxUnchecked',
                'text' => substr(trim($text), 4),
            ];
        }

        if ('[x] ' === $begin_line) {
            return [
                'handler' => 'checkboxChecked',
                'text' => substr(trim($text), 4),
            ];
        }
    }

    protected function blockListComplete(array $block)
    {
        foreach ($block['element']['elements'] as &$li_element) {
            foreach ($li_element['handler']['argument'] as $text) {
                $begin_line = substr(trim($text), 0, 4);
                if ('[ ] ' === $begin_line) {
                    $li_element['attributes'] = ['class' => 'parsedown-task-list parsedown-task-list-open'];
                } elseif ('[x] ' === $begin_line) {
                    $li_element['attributes'] = ['class' => 'parsedown-task-list parsedown-task-list-close'];
                }
            }
        }

        return $block;
    }

    protected function blockCheckboxContinue(array $block)
    {
    }

    protected function blockCheckboxComplete(array $block)
    {
        $block['element'] = [
            'rawHtml' => $this->{$block['handler']}($block['text']),
            'allowRawHtmlInSafeMode' => true,
        ];

        return $block;
    }

    protected function checkboxUnchecked($text)
    {
        if ($this->markupEscaped || $this->safeMode) {
            $text = self::escape($text);
        }
        # modified original package to make it work with materialize
        return '<p><label><input type="checkbox" disabled /><span>' . $this->format($text) . '</span></label></p>';
    }

    protected function checkboxChecked($text)
    {
        if ($this->markupEscaped || $this->safeMode) {
            $text = self::escape($text);
        }
        # modified original package to make it work with materialize
        return '<p><label><input type="checkbox" checked disabled /><span>' . $this->format($text) . '</span></label></p>';
    }

    /**
     * Formats the checkbox label without double escaping.
     * @param string $text the string to format
     * @return string the formatted text
     */
    protected function format($text)
    {
        // backup settings
        $markup_escaped = $this->markupEscaped;
        $safe_mode = $this->safeMode;

        // disable rules to prevent double escaping.
        $this->setMarkupEscaped(false);
        $this->setSafeMode(false);

        // format line
        $text = $this->line($text);

        // reset old values
        $this->setMarkupEscaped($markup_escaped);
        $this->setSafeMode($safe_mode);

        return $text;
    }
}
