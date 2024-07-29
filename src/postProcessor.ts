import { blendColorWithBackground, getContrastColor, getContrastRatio } from './colorProcessor';
import ColorHighlighterPlugin from '../main';
import { COLOR_REGEX, getBackgroundColor } from './utils';

/**
 * Processes the DOM of a rendered Markdown note file, highlighting color codes within text nodes.
 *
 * @param plugin The ColorHighlighterPlugin instance.
 * @returns A post-processor function to be used in an Obsidian plugin.
 */
export function createPostProcessor(plugin: ColorHighlighterPlugin) {
    return (el: HTMLElement) => {
        const isDataviewInline = (node: Node): boolean => {
            let parent = node.parentElement;
            while (parent) {
                if (parent.classList.contains('dataview-inline-query') || parent.classList.contains('dataview-result-inline-query') || parent.classList.contains('dataview-inline')) {
                    return true;
                }
                parent = parent.parentElement;
            }
            return false;
        };

        processNode(el, isDataviewInline, plugin);

        // Process code blocks after a short delay
        setTimeout(() => {
            el.querySelectorAll('pre code').forEach(codeBlock => {
                processCodeBlock(codeBlock as HTMLElement, plugin);
            });
        }, 100);
    };
}

function processNode(node: Node, isDataviewInline: (node: Node) => boolean, plugin: ColorHighlighterPlugin): void {
    if (node.nodeType === Node.TEXT_NODE && node.textContent) {
        const parent = node.parentElement;

        if (parent && isDataviewInline(node)) {
            handleDataviewInline(parent);
            return;
        }

        // Check if the color should be highlighted based on the settings
        if (
            (plugin.settings.highlightEverywhere) ||
            (plugin.settings.highlightInBackticks && parent?.tagName === 'CODE' && parent.parentElement?.tagName !== 'PRE') ||
            (plugin.settings.highlightInCodeblocks && parent?.tagName === 'CODE' && parent.parentElement?.tagName === 'PRE')
        ) {
            highlightColorInNode(node as Text, plugin);
        }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (isDataviewInline(node)) {
            handleDataviewInline(node as HTMLElement);
            return;
        }

        if ((node as Element).tagName.toLowerCase() !== 'svg') {
            Array.from(node.childNodes).forEach(childNode => processNode(childNode, isDataviewInline, plugin));
        }
    }
}

function processCodeBlock(codeBlock: HTMLElement, plugin: ColorHighlighterPlugin) {
    const content = codeBlock.textContent || '';
    const matches = Array.from(content.matchAll(COLOR_REGEX));

    if (matches.length === 0) return;

    const fragment = document.createDocumentFragment();
    let lastIndex = 0;

    matches.forEach(match => {
        const colorCode = match[0];
        const startIndex = match.index!;
        const endIndex = startIndex + colorCode.length;

        // Add text before the color code
        if (startIndex > lastIndex) {
            fragment.appendChild(document.createTextNode(content.slice(lastIndex, startIndex)));
        }

        // Add highlighted color code
        const span = document.createElement('span');
        span.textContent = colorCode;
        applyHighlightStyle(span, colorCode, plugin);
        fragment.appendChild(span);

        lastIndex = endIndex;
    });

    // Add any remaining text
    if (lastIndex < content.length) {
        fragment.appendChild(document.createTextNode(content.slice(lastIndex)));
    }

    // Replace the content of the code block
    codeBlock.textContent = '';
    codeBlock.appendChild(fragment);
}

function highlightColorInNode(node: Text, plugin: ColorHighlighterPlugin) {
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    let match;
    let hasColorMatch = false;

    if (node.textContent === null) return;

    while ((match = COLOR_REGEX.exec(node.textContent)) !== null) {
        hasColorMatch = true;

        const colorCode = match[0];
        const startIndex = match.index;
        const endIndex = startIndex + colorCode.length;

        if (startIndex > lastIndex) {
            fragment.appendChild(document.createTextNode(node.textContent.slice(lastIndex, startIndex)));
        }

        const span = document.createElement('span');
        span.textContent = colorCode;
        applyHighlightStyle(span, colorCode, plugin);
        fragment.appendChild(span);

        lastIndex = endIndex;
    }

    if (lastIndex < node.textContent.length) {
        fragment.appendChild(document.createTextNode(node.textContent.slice(lastIndex)));
    }

    if (hasColorMatch) {
        node.parentNode?.replaceChild(fragment, node);
    }
}

function applyHighlightStyle(span: HTMLSpanElement, colorCode: string, plugin: ColorHighlighterPlugin) {
    const backgroundColor = getBackgroundColor(plugin.app);
    let effectiveColor;
    try {
        effectiveColor = blendColorWithBackground(colorCode, backgroundColor, plugin.app);
    } catch (error) {
        effectiveColor = colorCode;
    }

    span.classList.add('color-highlighter');

    switch (plugin.settings.highlightStyle) {
        case 'background':
            span.classList.add('background');
            const contrastColor = getContrastColor(effectiveColor, backgroundColor);
            span.style.backgroundColor = effectiveColor;
            span.style.color = contrastColor;

            if (plugin.settings.useContrastingBorder) {
                const contrastRatio = getContrastRatio(effectiveColor, backgroundColor);
                if (contrastRatio < 1.25) {
                    span.dataset.contrastBorder = 'true';
                }
            }
            break;
        case 'underline':
            span.classList.add('underline');
            span.style.borderBottomColor = effectiveColor;
            break;
        case 'square':
            const square = document.createElement('span');
            square.classList.add('color-highlighter-square');
            square.style.backgroundColor = effectiveColor;
            span.appendChild(square);

            if (plugin.settings.useContrastingBorder) {
                const contrastRatio = getContrastRatio(effectiveColor, backgroundColor);
                if (contrastRatio < 1.25) {
                    square.dataset.contrastBorder = 'true';
                }
            }
            break;
        case 'border':
            span.classList.add('border');
            span.style.borderColor = effectiveColor;
            break;
    }
}

/**
 * Processes Dataview inline elements to ensure proper rendering within notes.
 * 
 * @param element The HTML element containing Dataview inline query results to be processed
 */
function handleDataviewInline(element: HTMLElement) {
    // Convert p and div elements to spans
    element.querySelectorAll('p, div').forEach(el => {
        const span = document.createElement('span');
        while (el.firstChild) {
            span.appendChild(el.firstChild);
        }
        el.parentNode?.replaceChild(span, el);
    });

    // Remove newlines and extra spaces
    const removeExtraWhitespace = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            node.textContent = node.textContent?.replace(/\s+/g, ' ') || '';
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            Array.from(node.childNodes).forEach(removeExtraWhitespace);
        }
    };
    
    removeExtraWhitespace(element);

    // Set display to inline
    element.style.display = 'inline';
}
