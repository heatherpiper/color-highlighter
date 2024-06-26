import { Plugin, MarkdownView, MarkdownPostProcessorContext } from 'obsidian';
import { EditorView, ViewUpdate, ViewPlugin, Decoration, DecorationSet } from '@codemirror/view';
import { RangeSetBuilder, EditorState } from '@codemirror/state';
import { ColorHighlighterSettings, DEFAULT_SETTINGS, ColorHighlighterSettingTab } from './settings';
import { syntaxTree } from '@codemirror/language';

const COLOR_REGEX = /#[0-9A-Fa-f]{3,6}|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)|rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)|hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)|hsla\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*[\d.]+\s*\)/g;

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
            .color-highlighter-inline-code {
                font-family: var(--font-monospace);
                padding: 0.2em 0.4em;
                border-radius: 3px;
                box-decoration-break: clone;
                -webkit-box-decoration-break: clone;
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
                    const { highlightEverywhere, highlightInBackticks, highlightInCodeblocks } = plugin.settings;

                    for (const { from, to } of view.visibleRanges) {
                        const text = view.state.doc.sliceString(from, to);
                        let match;
                        while ((match = COLOR_REGEX.exec(text)) !== null) {
                            const start = from + match.index;
                            const end = start + match[0].length;
                            
                            if (this.shouldHighlight(view.state, start, end, highlightEverywhere, highlightInBackticks, highlightInCodeblocks)) {
                                this.addDecoration(builder, start, end, match[0], view);
                            }
                        }
                    }
                    return builder.finish();
                }

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
            
                addDecoration(builder: RangeSetBuilder<Decoration>, start: number, end: number, color: string, view: EditorView) {
                    const editorBackground = getComputedStyle(view.dom).backgroundColor;
                    const contrastColor = this.getContrastColor(color, editorBackground);
                    
                    builder.add(start, end, Decoration.mark({
                        attributes: { 
                            class: "color-highlighter-inline-code",
                            style: `background-color: ${color}; color: ${contrastColor}; border-radius: 3px; padding: 1px 3px;`
                        }
                    }));
                }
            
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
            },
            {
                decorations: v => v.decorations
            }
        );
    }

    postProcessor(el: HTMLElement, ctx: MarkdownPostProcessorContext) {
        const { highlightEverywhere, highlightInBackticks, highlightInCodeblocks } = this.settings;

        const processNode = (node: Node) => {
            if (node.nodeType === Node.TEXT_NODE && node.textContent) {
                const parent = node.parentElement;
                if (
                    (highlightEverywhere) ||
                    (highlightInBackticks && parent && parent.tagName === 'CODE' && parent.parentElement && parent.parentElement.tagName !== 'PRE') ||
                    (highlightInCodeblocks && parent && parent.tagName === 'CODE' && parent.parentElement && parent.parentElement.tagName === 'PRE')
                ) {
                    const fragment = document.createDocumentFragment();
                    let lastIndex = 0;
                    let match;    

                    while ((match = COLOR_REGEX.exec(node.textContent)) !== null) {
                        const colorCode = match[0];
                        const startIndex = match.index;
                        const endIndex = startIndex + colorCode.length;
    
                        // Add text before the color code
                        if (startIndex > lastIndex) {
                            fragment.appendChild(document.createTextNode(node.textContent.slice(lastIndex, startIndex)));
                        }
    
                        // Add highlighted color code
                        const span = document.createElement('span');
                        span.textContent = colorCode;
                        const backgroundColor = this.getEffectiveBackgroundColor(colorCode, window.getComputedStyle(el).backgroundColor);
                        span.style.backgroundColor = backgroundColor;
                        span.style.color = this.getContrastColor(backgroundColor, 'white');
                        span.style.padding = '1px 3px';
                        span.style.borderRadius = '3px';
                        fragment.appendChild(span);
    
                        lastIndex = endIndex;
                    }

                    // Add any remaining text
                    if (lastIndex < node.textContent.length) {
                        fragment.appendChild(document.createTextNode(node.textContent.slice(lastIndex)));
                    }

                    if (node.parentNode) {
                        node.parentNode.replaceChild(fragment, node);
                    }
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                Array.from(node.childNodes).forEach(processNode);
            }
        };

        try {
            processNode(el);
        } catch (error) {
            console.error('Error in postProcessor:', error);
        }
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
        try {
            color = this.convertNamedColor(color);
            background = this.convertNamedColor(background);

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
        } catch (error) {
            return 'black'; // Fallback to black if there's an error
        }
    }

    rgbToHex(rgb: string): string {
        try {
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
            console.error('Error in blendRgbaWithBackground:', error);
            return background; // Fallback to background color if there's an error
        }
    }

    getEffectiveBackgroundColor(color: string, background: string): string {
        if (color.startsWith('rgba')) {
            return this.blendRgbaWithBackground(color, background);
        }
        return color;
    }

    extractRgbComponents(rgbString: string): [number, number, number] {
        rgbString = this.convertNamedColor(rgbString);
        if (rgbString.startsWith('#')) {
            // Handle hex color
            const hex = rgbString.slice(1);
            return [
                parseInt(hex.slice(0, 2), 16),
                parseInt(hex.slice(2, 4), 16),
                parseInt(hex.slice(4, 6), 16)
            ];
        }
        const match = rgbString.match(/\d+/g);
        if (!match || match.length < 3) {
            return [0, 0, 0]; // Fallback to black if the string is invalid
        }
        return match.slice(0, 3).map(Number) as [number, number, number];
    }


    hslToRgb(hsl: string): string {
        try {
            const [h, s, l] = hsl.match(/\d+/g)?.map(Number) || [];
            if (h === undefined || s === undefined || l === undefined) {
                throw new Error('Invalid HSL values');
            }
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
        } catch (error) {
            return 'rgb(0,0,0)'; // Fallback to black if there's an error
        }
    }
}
