import ColorHighlighterPlugin from '../main';
import { blendColorWithBackground, getContrastColor, getContrastRatio } from './colorProcessor';
import { COLOR_REGEX, getBackgroundColor } from './utils';
import { HighlightStyle } from './HighlightStyle';

/**
 * Processes the DOM of a rendered Markdown note file, highlighting color codes within text nodes.
 *
 * @param plugin The ColorHighlighterPlugin instance.
 * @returns A post-processor function to be used in an Obsidian plugin.
 */
export function createPostProcessor(plugin: ColorHighlighterPlugin) {
    return (el: HTMLElement) => {
        // Clean up any existing highlights
        const existingHighlights = el.querySelectorAll('.color-highlighter');
        if (existingHighlights.length > 0) {
            existingHighlights.forEach(h => h.replaceWith(h.textContent || ''))
        }

        const noteHighlightStyle = getNoteHighlightStyle(el, plugin);
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

        processNode(el, isDataviewInline, plugin, noteHighlightStyle);

        // Process code blocks after a short delay
        setTimeout(() => {
            el.querySelectorAll('pre code').forEach(codeBlock => {
                processCodeBlock(codeBlock as HTMLElement, plugin, noteHighlightStyle);
            });
        }, 100);
    };
}

/**
 * Extracts the highlight style from a note's frontmatter properties, if specified.
 * 
 * @param el The root HTML element of the rendered note.
 * @returns HighlightStyle | undefined - The highlight style specified in the note's frontmatter, or undefined if no valid highlight style is found.
 */
function getNoteHighlightStyle(el: HTMLElement, plugin: ColorHighlighterPlugin): HighlightStyle | undefined {
    const activeFile = plugin.app.workspace.getActiveFile();
    
    if (activeFile) {
        const fileCache = plugin.app.metadataCache.getFileCache(activeFile);
        
        if (fileCache && fileCache.frontmatter) {
            const highlightStyle = fileCache.frontmatter.highlightStyle;
            if (highlightStyle) {
                const style = highlightStyle.toLowerCase();
                if (Object.values(HighlightStyle).includes(style as HighlightStyle)) {
                    return style as HighlightStyle;
                }
            }
        }
    }
    return undefined;
}

/**
 * Recursively processes node in the DOM, applying color highlighting where appropriate.
 * 
 * @param node The DOM node to process.
 * @param isDataviewInline Function to check if a node is part of a Dataview inline query.
 * @param plugin The ColorHighlighterPlugin instance.
 * @param noteHighlightStyle The highlight style to use. If not provided, the plugin's default style is used.
 */
function processNode(node: Node, isDataviewInline: (node: Node) => boolean, plugin: ColorHighlighterPlugin, noteHighlightStyle?: HighlightStyle): void {
    if (node.nodeType === Node.TEXT_NODE && node.textContent) {
        const parent = node.parentElement;

        if (parent && isDataviewInline(node)) {
            handleDataviewInline(parent);
            return;
        }

        if (isPartOfTag(node)) {
            return; // Skip processing if it's part of a tag
        }

        // Check if the color should be highlighted based on the settings
        if (
            (plugin.settings.highlightEverywhere) ||
            (plugin.settings.highlightInBackticks && parent?.tagName === 'CODE' && parent.parentElement?.tagName !== 'PRE') ||
            (plugin.settings.highlightInCodeblocks && parent?.tagName === 'CODE' && parent.parentElement?.tagName === 'PRE')
        ) {
            highlightColorInNode(node as Text, plugin, noteHighlightStyle);
        }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (isDataviewInline(node)) {
            handleDataviewInline(node as HTMLElement);
            return;
        }

        if ((node as Element).tagName.toLowerCase() !== 'svg') {
            Array.from(node.childNodes).forEach(childNode => processNode(childNode, isDataviewInline, plugin, noteHighlightStyle));
        }
    }
}

/**
 * Processes a code block, highlighting color codes within it.
 * 
 * @param codeBlock The code block element to process.
 * @param plugin The ColorHighlighterPlugin instance.
 */
function processCodeBlock(codeBlock: HTMLElement, plugin: ColorHighlighterPlugin, noteHighlightStyle?: HighlightStyle) {
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
        applyHighlightStyle(span, colorCode, plugin, noteHighlightStyle);
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

/**
 * Highlights color codes within a text node by replacing it with a document fragment.
 * 
 * @param node The text node to process.
 * @param plugin The ColorHighlighterPlugin instance.
 * @param noteHighlightStyle The highlight style to use. If not provided, the plugin's default style is used.
 */
function highlightColorInNode(node: Text, plugin: ColorHighlighterPlugin, noteHighlightStyle?: HighlightStyle) {
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
        applyHighlightStyle(span, colorCode, plugin, noteHighlightStyle);
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

/**
 * Applies the appropriate highlight style to a span element containing color code.
 * 
 * @param span The span element to style.
 * @param colorCode The color code to highlight.
 * @param plugin The ColorHighlighterPlugin instance.
 * @param noteHighlightStyle The highlight style to use. If not provided, the plugin's default style is used.
 */
function applyHighlightStyle(span: HTMLSpanElement, colorCode: string, plugin: ColorHighlighterPlugin, noteHighlightStyle?: HighlightStyle) {
    const backgroundColor = getBackgroundColor(plugin.app);
    let effectiveColor;
    try {
        effectiveColor = blendColorWithBackground(colorCode, backgroundColor, plugin.app);
    } catch (error) {
        effectiveColor = colorCode;
    }

    span.classList.add('color-highlighter');

    const highlightStyle = noteHighlightStyle || plugin.settings.highlightStyle;

    switch (highlightStyle) {
        case HighlightStyle.Background:
            span.classList.add('background');
            const contrastColor = getContrastColor(effectiveColor, backgroundColor);
            span.style.setProperty('--highlight-color', effectiveColor);
            span.style.setProperty('--contrast-color', contrastColor);
            span.style.setProperty('--background-vertical-padding', `${plugin.settings.backgroundVerticalPadding}em`);
            span.style.setProperty('--background-horizontal-padding', `${plugin.settings.backgroundHorizontalPadding}em`);
            span.style.setProperty('--background-border-radius', `${plugin.settings.backgroundBorderRadius}px`);

            if (plugin.settings.useContrastingBorder) {
                const contrastRatio = getContrastRatio(effectiveColor, backgroundColor);
                if (contrastRatio < 1.25) {
                    span.dataset.contrastBorder = 'true';
                }
            }
            break;
        case HighlightStyle.Border:
            span.classList.add('border');
            span.style.setProperty('--highlight-color', effectiveColor);
            span.style.setProperty('--border-thickness', `${plugin.settings.borderThickness}px`);
            span.style.setProperty('--border-radius', `${plugin.settings.borderBorderRadius}px`);
            break;
        case HighlightStyle.Square:
            const square = document.createElement('span');
            square.classList.add('color-highlighter-square');
            square.classList.add(plugin.settings.scaleSquareWithText ? 'color-highlighter-square-scalable' : 'color-highlighter-square-fixed');
            square.classList.add(`color-highlighter-square-${plugin.settings.squarePosition}`);
            square.style.setProperty('--highlight-color', effectiveColor);
            square.style.setProperty('--square-border-radius', `${plugin.settings.squareBorderRadius}px`);
            
            if (plugin.settings.squarePosition === 'before') {
                span.insertBefore(square, span.firstChild);
            } else {
                span.appendChild(square);
            }

            if (plugin.settings.useContrastingBorder) {
                const contrastRatio = getContrastRatio(effectiveColor, backgroundColor);
                if (contrastRatio < 1.25) {
                    square.dataset.contrastBorder = 'true';
                }
            }
            break;
        case HighlightStyle.Underline:
            span.classList.add('underline');
            span.style.setProperty('--highlight-color', effectiveColor);
            span.style.setProperty('--underline-thickness', `${plugin.settings.underlineThickness}px`);
            break;
    }
}

/**
 * Processes Dataview inline elements to ensure proper rendering within notes.
 * 
 * @param element The HTML element containing Dataview inline query results to be processed.
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

    element.style.display = 'inline';
}

/**
 * Checks if a node is part of a tag element.
 * 
 * @param node The node to check.
 * @returns True if the node is part of a tag, false otherwise.
 */
function isPartOfTag(node: Node): boolean {
    const parent = node.parentElement;
    if (!parent) return false;

    if (parent.tagName === 'A' && parent.classList.contains('tag')) {
        return true;
    }

    return false;
}
