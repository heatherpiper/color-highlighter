import { Plugin, MarkdownPostProcessorContext } from 'obsidian';
import { getBackgroundColor } from './utils';
import { COLOR_REGEX } from './utils';
import { blendColorWithBackground, getContrastColor } from './colorProcessor';
import ColorHighlighterPlugin from './main';

export function createPostProcessor(plugin: Plugin) {
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

        processNode(el, isDataviewInline, plugin as ColorHighlighterPlugin);
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

function createHighlightedSpan(colorCode: string, parent: Element | null, plugin: ColorHighlighterPlugin): HTMLSpanElement {
    const span = document.createElement('span');
    span.textContent = colorCode;

    const backgroundColor = getBackgroundColor(plugin.app);

    // Get the effective color based on the background color
    let effectiveColor;
    try {
        effectiveColor = blendColorWithBackground(colorCode, backgroundColor, plugin.app);
    } catch (error) {
        console.warn('Error blending color:', error);
        effectiveColor = colorCode; // Fallback to original color if blending fails
    }

    // Set the highlight style based on the settings
    span.classList.add('color-highlighter');

    switch (plugin.settings.highlightStyle) {
        case 'background':
            span.classList.add('background');
            const contrastColor = getContrastColor(effectiveColor, backgroundColor, plugin.app);
            span.style.backgroundColor = effectiveColor;
            span.style.color = contrastColor;
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
            break;
        case 'border':
            span.classList.add('border');
            span.style.borderColor = effectiveColor;
            break;
    }

    return span;
}

function handleDataviewInline(element: HTMLElement) {
    element.querySelectorAll('p, div').forEach(el => {
        const span = document.createElement('span');
        span.innerHTML = el.innerHTML;
        el.parentNode?.replaceChild(span, el);
    });

    element.innerHTML = element.innerHTML.replace(/\n/g, ' ');
    element.style.display = 'inline';
}

function highlightColors(text: string, wrapInBackticks: boolean, plugin: ColorHighlighterPlugin): string {
    return text.replace(COLOR_REGEX, (match) => {
        const editorBackground = getBackgroundColor(plugin.app);
        const contrastColor = getContrastColor(match, editorBackground, plugin.app);
        const highlighted = `<span style="background-color: ${match}; color: ${contrastColor}; border-radius: 3px; padding: 1px 3px;">${match}</span>`;
        
        return wrapInBackticks ? `\`${highlighted}\`` : highlighted;
    });
}