import { Plugin, MarkdownView, MarkdownPostProcessorContext } from 'obsidian';
import { EditorView, ViewUpdate, ViewPlugin, Decoration, DecorationSet, WidgetType } from '@codemirror/view';
import { RangeSetBuilder, EditorState } from '@codemirror/state';
import { ColorHighlighterSettings, DEFAULT_SETTINGS, ColorHighlighterSettingTab } from './settings';
import { syntaxTree } from '@codemirror/language';

const COLOR_REGEX = /#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?![0-9A-Fa-f])|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)|rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)|hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)|hsla\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*[\d.]+\s*\)/g;

export default class ColorHighlighterPlugin extends Plugin {
    settings: ColorHighlighterSettings;

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new ColorHighlighterSettingTab(this.app, this));
        this.registerMarkdownPostProcessor(this.postProcessor.bind(this));
        this.registerEditorExtension(this.createEditorExtension());

        this.addStyles();
    }

    addStyles() {
        const styles = `
            .color-highlighter {
                box-decoration-break: clone;
                -webkit-box-decoration-break: clone;
            }
            .color-highlighter.background {
                border-radius: 3px;
                padding: 0.1em 0.2em;
            }
            .color-highlighter.border {
                border-radius: 3px;
                border-width: 2px;
                border-style: solid;
                padding: 0 2px;
            }
            .color-highlighter.underline {
                text-decoration: none !important;
                border-bottom-width: 2px;
                border-bottom-style: solid;
                padding-bottom: 1px;
            }
            .color-highlighter.underline::before,
            .color-highlighter.underline::after {
                content: "";
                position: absolute;
                bottom: -2px;
                width: 0;
                height: 2px;
                background-color: inherit;
            }
            .color-highlighter.underline::before {
                left: 0;
            }
            .color-highlighter.underline::after {
                right: 0;
            }
            .color-highlighter-square {
                display: inline-block;
                width: 10px;
                height: 10px;
                margin-left: 2px;
                vertical-align: middle;
            }
        `;

        this.registerMarkdownPostProcessor((el) => {
            el.createEl('style', { text: styles });
        });
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
        this.app.workspace.updateOptions();
    }

    // Highlight colors in Source Mode
    createEditorExtension() {
        const plugin = this;
        return ViewPlugin.fromClass(
            class ColorHighlighterView {
                decorations: DecorationSet;

                constructor(view: EditorView) {
                    this.decorations = this.buildDecorations(view);
                }

                update(update: ViewUpdate) {
                    if (update.docChanged || update.viewportChanged) {
                        this.decorations = this.buildDecorations(update.view);
                    }
                }

                buildDecorations(view: EditorView) {
                    const builder = new RangeSetBuilder<Decoration>();
                    const { highlightEverywhere, highlightInBackticks, highlightInCodeblocks, highlightStyle } = plugin.settings;
    
                    for (const { from, to } of view.visibleRanges) {
                        const text = view.state.doc.sliceString(from, to);
                        let match;
                        while ((match = COLOR_REGEX.exec(text)) !== null) {
                            const start = from + match.index;
                            const end = start + match[0].length;
                            
                            if (this.shouldHighlight(view.state, start, end, highlightEverywhere, highlightInBackticks, highlightInCodeblocks)) {
                                this.addDecoration(builder, start, end, match[0], view, highlightStyle);
                            }
                        }
                    }
                    return builder.finish();
                }

                // Check where colors should be highlighted based on the settings
                shouldHighlight(state: EditorState, start: number, end: number, highlightEverywhere: boolean, highlightInBackticks: boolean, highlightInCodeblocks: boolean): boolean {
                    if (highlightEverywhere) {
                        return true;
                    }

                    const isInBackticks = this.isWithinInlineCode(state, start, end);
                    const isInCodeblock = this.isWithinCodeBlock(state, start);

                    return (highlightInBackticks && isInBackticks) || (highlightInCodeblocks && isInCodeblock);
                }

                isWithinInlineCode(state: EditorState, start: number, end: number): boolean {
                    const line = state.doc.lineAt(start);
                    const lineText = line.text;
                    const startInLine = start - line.from;
                    const endInLine = end - line.from;

                    let backtickCount = 0;
                    let withinBackticks = false;
                    for (let i = 0; i < lineText.length; i++) {
                        if (lineText[i] === '`') {
                            backtickCount++;
                            withinBackticks = !withinBackticks;
                        }
                        if (i === startInLine && withinBackticks) return true;
                        if (i === endInLine - 1 && withinBackticks) return true;
                    }
                    return false;
                }

                isWithinCodeBlock(state: EditorState, pos: number): boolean {
                    const tree = syntaxTree(state);
                    let node = tree.resolveInner(pos, 1);
                    
                    while (node) {
                        
                        if (
                            node.type.name.includes('CodeBlock') ||
                            node.type.name.includes('FencedCode') ||
                            node.type.name.includes('hmd-codeblock') ||
                            node.type.name.includes('HyperMD-codeblock')
                        ) {
                            return true;
                        }
                        
                        if (node.parent) {
                            node = node.parent;
                        } else {
                            break; // We've reached the root of the tree
                        }
                    }
                    
                    return false;
                }
            
                // Add highlight to the specified range of text based on the selected style
                addDecoration(builder: RangeSetBuilder<Decoration>, start: number, end: number, color: string, view: EditorView, highlightStyle: 'background' | 'underline' | 'square' | 'border') {
                    const editorBackground = getComputedStyle(view.dom).backgroundColor;
                    
                    let decorationAttributes: { [key: string]: string } = {
                        class: "color-highlighter-inline-code",
                    };
    
                    const effectiveColor = this.getEffectiveColor(color, editorBackground);
                    const contrastColor = plugin.getContrastColor(effectiveColor, editorBackground);
    
                    switch (highlightStyle) {
                        case 'background':
                            decorationAttributes.style = `background-color: ${effectiveColor}; color: ${contrastColor}; border-radius: 3px; padding: 0.1em 0.2em;`;
                            break;
                        case 'underline':
                            decorationAttributes.class += " color-highlighter-underline";
                            decorationAttributes.style = `border-bottom: 2px solid ${effectiveColor}; text-decoration: none !important; text-decoration-skip-ink: none; border-radius: 0;`;
                            break;
                        case 'square':
                            // No additional style for the text itself
                            break;
                        case 'border':
                            decorationAttributes.class += " color-highlighter-border";
                            decorationAttributes.style = `border: 2px solid ${effectiveColor}; border-radius: 3px;`;
                            break;
                    }
    
    
                    builder.add(start, end, Decoration.mark({
                        attributes: decorationAttributes
                    }));


                    // Add a square widget for the 'square' highlight style
                    if (highlightStyle === 'square') {
                        builder.add(end, end, Decoration.widget({
                            widget: new class extends WidgetType {
                                constructor(readonly color: string) {
                                    super();
                                }
                                
                                toDOM() {
                                    const span = document.createElement('span');
                                    span.className = 'color-highlighter-square';
                                    span.style.display = 'inline-block';
                                    span.style.width = '10px';
                                    span.style.height = '10px';
                                    span.style.backgroundColor = this.color;
                                    span.style.marginLeft = '2px';
                                    span.style.verticalAlign = 'middle';
                                    return span;
                                }

                                eq(other: WidgetType): boolean {
                                    return other instanceof this.constructor && (other as any).color === this.color;
                                }

                                updateDOM(dom: HTMLElement): boolean {
                                    return false; // The widget is static, so no update is needed
                                }

                                ignoreEvent(): boolean {
                                    return false; // Allow events to pass through
                                }

                                get estimatedHeight(): number {
                                    return 10; // The square is 10px high
                                }

                                get lineBreaks(): number {
                                    return 0; // The square doesn't introduce any line breaks
                                }

                                coordsAt(dom: HTMLElement, pos: number, side: number): { top: number, right: number, bottom: number, left: number } | null {
                                    return null; // We don't need to implement custom coordinates
                                }

                                destroy() {
                                    // No cleanup needed for this simple widget
                                }
                            }(color)
                        }));
                    }
                }
            
                // Get the most effective color for the text based on the background color
                getContrastColor(color: string, background: string): string {
                    if (color.startsWith('hsl')) {
                        color = this.hslToRgb(color);
                    } else if (color.startsWith('rgba')) {
                        color = this.blendRgbaWithBackground(color, background);
                    }
                    const hex = color.startsWith('#') ? color.slice(1) : this.rgbToHex(color);
                    const r = parseInt(hex.slice(0, 2), 16);
                    const g = parseInt(hex.slice(2, 4), 16);
                    const b = parseInt(hex.slice(4, 6), 16);
                    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
                    return (yiq >= 128) ? 'black' : 'white';
                }
    
                rgbToHex(rgb: string): string {
                    const [r, g, b] = rgb.match(/\d+/g)!.map(Number);
                    return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
                }
    
                // Blend RGBA color with the background color
                blendRgbaWithBackground(rgba: string, background: string): string {
                    const [r, g, b, a] = rgba.match(/[\d.]+/g)!.map(Number);
                    const [bgR, bgG, bgB] = this.extractRgbComponents(background);
                    const alpha = a !== undefined ? a : 1;
    
                    const blendedR = Math.round((1 - alpha) * bgR + alpha * r);
                    const blendedG = Math.round((1 - alpha) * bgG + alpha * g);
                    const blendedB = Math.round((1 - alpha) * bgB + alpha * b);
    
                    return `rgb(${blendedR}, ${blendedG}, ${blendedB})`;
                }
    
                extractRgbComponents(rgbString: string): [number, number, number] {
                    const [r, g, b] = rgbString.match(/\d+/g)!.map(Number);
                    return [r, g, b];
                }
    
                hslToRgb(hsl: string): string {
                    const [h, s, l] = hsl.match(/\d+/g)!.map(Number);
                    const sNorm = s / 100;
                    const lNorm = l / 100;
                    const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
                    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
                    const m = lNorm - c / 2;
                    let r = 0, g = 0, b = 0;
                    if (h < 60) { r = c; g = x; b = 0; }
                    else if (h < 120) { r = x; g = c; b = 0; }
                    else if (h < 180) { r = 0; g = c; b = x; }
                    else if (h < 240) { r = 0; g = x; b = c; }
                    else if (h < 300) { r = x; g = 0; b = c; }
                    else { r = c; g = 0; b = x; }
                    r = Math.round((r + m) * 255);
                    g = Math.round((g + m) * 255);
                    b = Math.round((b + m) * 255);
                    return `rgb(${r},${g},${b})`;
                }

                // Get the blended color based on the background color
                getEffectiveColor(color: string, background: string): string {
                    if (color.startsWith('#')) {
                        if (color.length === 4) {
                            // Expand 3-digit hex to 6-digit hex
                            color = `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
                        } else if (color.length === 5) {
                            // Handle 4-digit hex with alpha
                            const r = parseInt(color[1] + color[1], 16);
                            const g = parseInt(color[2] + color[2], 16);
                            const b = parseInt(color[3] + color[3], 16);
                            const a = parseInt(color[4] + color[4], 16) / 255;
                            return this.blendRgbaWithBackground(`rgba(${r},${g},${b},${a})`, background);
                        } else if (color.length === 9) {
                            // Handle 8-digit hex with alpha
                            const r = parseInt(color.slice(1, 3), 16);
                            const g = parseInt(color.slice(3, 5), 16);
                            const b = parseInt(color.slice(5, 7), 16);
                            const a = parseInt(color.slice(7, 9), 16) / 255;
                            return this.blendRgbaWithBackground(`rgba(${r},${g},${b},${a})`, background);
                        }
                    }
                    return color;
                }
            },
            {
                decorations: v => v.decorations
            }
        );
    }

    // Highlight colors in Live Preview and Reading Mode
    postProcessor(el: HTMLElement, ctx: MarkdownPostProcessorContext) {
        const { highlightEverywhere, highlightInBackticks, highlightInCodeblocks, highlightStyle } = this.settings;
    
        // Skip processing of Dataview inline queries
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
    
        // Process each node in the tree
        const processNode = (node: Node): void => {
            if (node.nodeType === Node.TEXT_NODE && node.textContent) {
                const parent = node.parentElement;
    
                if (isDataviewInline(node)) {
                    handleDataviewInline(parent as HTMLElement);
                    return;
                }
    
                // Check if the color should be highlighted based on the settings
                if (
                    (highlightEverywhere) ||
                    (highlightInBackticks && parent?.tagName === 'CODE' && parent.parentElement?.tagName !== 'PRE') ||
                    (highlightInCodeblocks && parent?.tagName === 'CODE' && parent.parentElement?.tagName === 'PRE')
                ) {
                    const fragment = document.createDocumentFragment();
                    let lastIndex = 0;
                    let match;
                    let hasColorMatch = false;
    
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
                        const span = document.createElement('span');
                        span.textContent = colorCode;
                        const backgroundColor = this.getEffectiveBackgroundColor(colorCode, window.getComputedStyle(el).backgroundColor);
    
                        span.classList.add('color-highlighter');
    
                        switch (highlightStyle) {
                            case 'background':
                                span.classList.add('background');
                                const contrastColor = this.getContrastColor(backgroundColor, 'white');
                                span.style.backgroundColor = backgroundColor;
                                span.style.color = contrastColor;
                                break;
                            case 'underline':
                                span.classList.add('underline');
                                span.style.borderBottomColor = backgroundColor;
                                break;
                            case 'square':
                                const square = document.createElement('span');
                                square.classList.add('color-highlighter-square');
                                square.style.backgroundColor = backgroundColor;
                                span.appendChild(square);
                                break;
                            case 'border':
                                span.classList.add('border');
                                span.style.borderColor = backgroundColor;
                                break;
                        }
    
                        fragment.appendChild(span);
        
                        lastIndex = endIndex;
                    }
    
                    // Add any remaining text
                    if (lastIndex < node.textContent.length) {
                        fragment.appendChild(document.createTextNode(node.textContent.slice(lastIndex)));
                    }
    
                    if (hasColorMatch) {
                        node.parentNode?.replaceChild(fragment, node);
                    }
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                // Make sure Dataview inline queries are displayed inline
                if (isDataviewInline(node)) {
                    handleDataviewInline(node as HTMLElement);
                    return;
                }
    
                // Skip processing of SVG elements
                if ((node as Element).tagName.toLowerCase() !== 'svg') {
                    Array.from(node.childNodes).forEach(processNode);
                }
            }
        };
    
        // Make sure Dataview inline queries are displayed inline
        const handleDataviewInline = (element: HTMLElement) => {
            element.querySelectorAll('p, div').forEach(el => {
                const span = document.createElement('span');
                span.innerHTML = el.innerHTML;
                el.parentNode?.replaceChild(span, el);
            });
    
            element.innerHTML = element.innerHTML.replace(/\n/g, ' ');
            element.style.display = 'inline';
        };
    
        processNode(el);
    }
    
    namedColors: { [key: string]: string } = {
        white: '#FFFFFF',
        black: '#000000'
    };

    convertNamedColor(color: string): string {
        return this.namedColors[color.toLowerCase()] || color;
    }

    highlightColors(text: string, wrapInBackticks: boolean): string {
        return text.replace(COLOR_REGEX, (match) => {
            const editorBackground = getComputedStyle(document.body).backgroundColor;
            const contrastColor = this.getContrastColor(match, editorBackground);
            const highlighted = `<span style="background-color: ${match}; color: ${contrastColor}; border-radius: 3px; padding: 1px 3px;">${match}</span>`;
            return wrapInBackticks ? `\`${highlighted}\`` : highlighted;
        });
    }

    getContrastColor(color: string, background: string): string {
        if (color.startsWith('hsl')) {
            color = this.hslToRgb(color);
        } else if (color.startsWith('rgba')) {
            color = this.blendRgbaWithBackground(color, background);
        } else if (color.startsWith('#')) {
            if (color.length === 9 || color.length === 5) {
                // Handle 8-digit and 4-digit hex color codes with alpha
                const r = parseInt(color.slice(1, 3), 16);
                const g = parseInt(color.slice(3, 5), 16);
                const b = parseInt(color.slice(5, 7), 16);
                const a = color.length === 9 ? parseInt(color.slice(7, 9), 16) / 255 : parseInt(color.slice(4, 5), 16) / 15;
                color = this.blendRgbaWithBackground(`rgba(${r},${g},${b},${a})`, background);
            } else if (color.length === 4) {
                // Expand 3-digit hex to 6-digit hex
                color = `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
            }
        }
    
        const hex = color.startsWith('#') ? color.slice(1) : this.rgbToHex(color);
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? 'black' : 'white';
    }

    rgbToHex(rgb: string): string {
        try {
            if (rgb.startsWith('#')) {
                // If it's already a hex code, return it as is
                return rgb.slice(1);
            }
            const [r, g, b] = this.extractRgbComponents(rgb);
            return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        } catch (error) {
            return '000000'; // Fallback to black if there's an error
        }
    }

    blendRgbaWithBackground(rgba: string, background: string): string {
        try {
            const [r, g, b, a] = rgba.match(/[\d.]+/g)?.map(Number) || [];
            const [bgR, bgG, bgB] = this.extractRgbComponents(background);
            const alpha = a !== undefined ? a : 1;
    
            const blendedR = Math.round((1 - alpha) * bgR + alpha * r);
            const blendedG = Math.round((1 - alpha) * bgG + alpha * g);
            const blendedB = Math.round((1 - alpha) * bgB + alpha * b);
    
            return `rgb(${blendedR}, ${blendedG}, ${blendedB})`;
        } catch (error) {
            return background; // Fallback to background color if there's an error
        }
    }

    blendHslaWithBackground(hsla: string, background: string): string {
        try {
            const [h, s, l, a] = this.extractHslaComponents(hsla);
            const [bgR, bgG, bgB] = this.extractRgbComponents(background);
            
            // Convert HSLA to RGBA
            const rgba = this.hslaToRgba(h, s, l, a);
            
            // Blend with background
            const blendedR = Math.round((1 - a) * bgR + a * rgba[0]);
            const blendedG = Math.round((1 - a) * bgG + a * rgba[1]);
            const blendedB = Math.round((1 - a) * bgB + a * rgba[2]);
    
            return `rgb(${blendedR}, ${blendedG}, ${blendedB})`;
        } catch (error) {
            return background; // Fallback to background color if there's an error
        }
    }

    getEffectiveBackgroundColor(color: string, background: string): string {
        if (color.startsWith('rgba')) {
            return this.blendRgbaWithBackground(color, background);
        } else if (color.startsWith('hsla')) {
            return this.blendHslaWithBackground(color, background);
        } else if (color.startsWith('#')) {
            if (color.length === 9) {
                // Handle 8-digit HEX
                const hex = color.slice(1);
                const r = parseInt(hex.slice(0, 2), 16);
                const g = parseInt(hex.slice(2, 4), 16);
                const b = parseInt(hex.slice(4, 6), 16);
                const a = parseInt(hex.slice(6, 8), 16) / 255;
                return this.blendRgbaWithBackground(`rgba(${r},${g},${b},${a})`, background);
            } else if (color.length === 5) {
                // Handle 4-digit HEX
                const r = parseInt(color[1] + color[1], 16);
                const g = parseInt(color[2] + color[2], 16);
                const b = parseInt(color[3] + color[3], 16);
                const a = parseInt(color[4] + color[4], 16) / 255;
                return this.blendRgbaWithBackground(`rgba(${r},${g},${b},${a})`, background);
            }
        }
        return color;
    }

    extractRgbComponents(rgbString: string): [number, number, number] {
        rgbString = this.convertNamedColor(rgbString);
        if (rgbString.startsWith('#')) {
            // Handle hex color
            const hex = rgbString.slice(1);
            if (hex.length === 3) {
                // Handle shorthand hex
                return [
                    parseInt(hex[0] + hex[0], 16),
                    parseInt(hex[1] + hex[1], 16),
                    parseInt(hex[2] + hex[2], 16)
                ];
            } else if (hex.length === 6 || hex.length === 8) {
                // Handle 6-digit and 8-digit hex
                return [
                    parseInt(hex.slice(0, 2), 16),
                    parseInt(hex.slice(2, 4), 16),
                    parseInt(hex.slice(4, 6), 16)
                ];
            }
        }
        const match = rgbString.match(/\d+/g);
        if (!match || match.length < 3) {
            console.error('Invalid RGB string:', rgbString);
            return [0, 0, 0]; // Fallback to black if the string is invalid
        }
        return match.slice(0, 3).map(Number) as [number, number, number];
    }

    extractHslaComponents(hsla: string): [number, number, number, number] {
        const match = hsla.match(/hsla?\((\d+),\s*(\d+)%?,\s*(\d+)%?,?\s*([\d.]+)?\)/);
        if (!match) {
            throw new Error('Invalid HSLA string');
        }
        const h = parseInt(match[1], 10);
        const s = parseInt(match[2], 10) / 100;
        const l = parseInt(match[3], 10) / 100;
        const a = match[4] ? parseFloat(match[4]) : 1;
        return [h, s, l, a];
    }

    hslToRgb(hsl: string): string {
        try {
            const [h, s, l] = hsl.match(/\d+%?/g)?.map(val => {
                if (val.endsWith('%')) {
                    return parseFloat(val) / 100;
                }
                return parseFloat(val);
            }) || [];
            if (h === undefined || s === undefined || l === undefined) {
                throw new Error('Invalid HSL values');
            }
            const sNorm = s;
            const lNorm = l;
            const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
            const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
            const m = lNorm - c / 2;
            let r = 0, g = 0, b = 0;
            if (h < 60) { r = c; g = x; b = 0; }
            else if (h < 120) { r = x; g = c; b = 0; }
            else if (h < 180) { r = 0; g = c; b = x; }
            else if (h < 240) { r = 0; g = x; b = c; }
            else if (h < 300) { r = x; g = 0; b = c; }
            else { r = c; g = 0; b = x; }
            r = Math.round((r + m) * 255);
            g = Math.round((g + m) * 255);
            b = Math.round((b + m) * 255);
            return `rgb(${r},${g},${b})`;
        } catch (error) {
            return 'rgb(0,0,0)'; // Fallback to black if there's an error
        }
    }

    hslaToRgba(h: number, s: number, l: number, a: number): [number, number, number, number] {
        let r, g, b;
    
        if (s === 0) {
            r = g = b = l; // achromatic
        } else {
            const hue2rgb = (p: number, q: number, t: number) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
    
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h / 360 + 1/3);
            g = hue2rgb(p, q, h / 360);
            b = hue2rgb(p, q, h / 360 - 1/3);
        }
    
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), a];
    }
    
}
