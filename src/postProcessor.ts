import { MarkdownPostProcessorContext } from 'obsidian';
import { blendColorWithBackground, getContrastColor, getContrastRatio } from './colorProcessor';
import ColorHighlighterPlugin from './main';
import { COLOR_REGEX, getBackgroundColor } from './utils';

/**
 * Processes the DOM of a rendered Markdown note file, highlighting color codes within text nodes.
 *
 * @param plugin The ColorHighlighterPlugin instance.
 * @returns A post-processor function to be used in an Obsidian plugin.
 */
export function createPostProcessor(plugin: ColorHighlighterPlugin) {
    return (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
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
    };
}

/**
 * Processes a node in the DOM, highlighting color codes within text nodes and handling Dataview inline queries.
 *
 * @param node The node to be processed.
 * @param isDataviewInline A function that checks if a node is part of a Dataview inline query.
 * @param plugin The ColorHighlighterPlugin instance.
 */
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
        // Make sure Dataview inline queries are displayed inline
        if (isDataviewInline(node)) {
            handleDataviewInline(node as HTMLElement);
            return;
        }

        // Skip processing of SVG elements
        if ((node as Element).tagName.toLowerCase() !== 'svg') {
            Array.from(node.childNodes).forEach(childNode => processNode(childNode, isDataviewInline, plugin));
        }
    }
}

/**
 * Highlights color codes within a text node by creating highlighted span elements.
 *
 * @param node The text node containing the color codes to be highlighted.
 * @param plugin The ColorHighlighterPlugin instance.
 */
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

        // Add the text before the color code
        if (startIndex > lastIndex) {
            fragment.appendChild(document.createTextNode(node.textContent.slice(lastIndex, startIndex)));
        }

        // Add highlighted color code
        const span = createHighlightedSpan(colorCode, node.parentElement, plugin);
        fragment.appendChild(span);

        lastIndex = endIndex;
    }

    // Add any remaining text
    if (lastIndex < node.textContent.length) {
        fragment.appendChild(document.createTextNode(node.textContent.slice(lastIndex)));
    }

    // Replace the original text node with the fragment
    if (hasColorMatch) {
        node.parentNode?.replaceChild(fragment, node);
    }
}

/**
 * Creates a highlighted span element with the specified color code and applies the appropriate highlight style based on the plugin settings.
 *
 * @param colorCode The color code to be highlighted.
 * @param parent The parent element of the color code.
 * @param plugin The ColorHighlighterPlugin instance.
 * @returns A highlighted span element.
 */
function createHighlightedSpan(colorCode: string, parent: Element | null, plugin: ColorHighlighterPlugin): HTMLSpanElement {
    const span = document.createElement('span');
    span.textContent = colorCode;

    const backgroundColor = getBackgroundColor(plugin.app);

    // Get the effective color based on the background color
    let effectiveColor;
    try {
        effectiveColor = blendColorWithBackground(colorCode, backgroundColor, plugin.app);
    } catch (error) {
        effectiveColor = colorCode; // Fallback to original color if blending fails
    }

    // Set the highlight style based on the settings
    span.classList.add('color-highlighter');

    switch (plugin.settings.highlightStyle) {
        case 'background':
            span.classList.add('background');
            const contrastColor = getContrastColor(effectiveColor, backgroundColor);
            span.style.backgroundColor = effectiveColor;
            span.style.color = contrastColor;

            if (plugin.settings.useContrastingBorder) {
                const contrastRatio = getContrastRatio(effectiveColor, backgroundColor);
                if (contrastRatio < 1.33) {
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
                if (contrastRatio < 1.33) {
                    square.dataset.contrastBorder = 'true';
                }
            }
            break;
        case 'border':
            span.classList.add('border');
            span.style.borderColor = effectiveColor;
            break;
    }

    return span;
}

/**
 * Handles the inline display of Dataview elements within the given HTML element.
 * 
 * This function processes all `p` and `div` elements within the provided `element`,
 * replacing them with inline `span` elements that contain the original HTML content.
 * It also removes any newline characters from the element's HTML and sets the
 * element's display style to `inline`.
 *
 * @param element The HTML element containing the Dataview elements to be processed.
 */
function handleDataviewInline(element: HTMLElement) {
    element.querySelectorAll('p, div').forEach(el => {
        const span = document.createElement('span');
        span.innerHTML = el.innerHTML;
        el.parentNode?.replaceChild(span, el);
    });

    element.innerHTML = element.innerHTML.replace(/\n/g, ' ');
    element.style.display = 'inline';
}