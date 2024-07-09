import { syntaxTree } from '@codemirror/language';
import { EditorState, RangeSetBuilder } from '@codemirror/state';
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate, WidgetType } from '@codemirror/view';
import { Plugin } from 'obsidian';
import { blendColorWithBackground, getContrastColor } from './colorProcessor';
import { COLOR_REGEX, getBackgroundColor } from './utils';

export function createEditorExtension(plugin: Plugin) {
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

            private buildDecorations(view: EditorView) {
                try {
                    const builder = new RangeSetBuilder<Decoration>();
                    const { highlightEverywhere, highlightInBackticks, highlightInCodeblocks, highlightStyle } = (plugin as any).settings;
    
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
                } catch (error) {
                    console.error('Error building decorations:', error);
                    return Decoration.none;
                }
            }

            private shouldHighlight(state: EditorState, start: number, end: number, highlightEverywhere: boolean, highlightInBackticks: boolean, highlightInCodeblocks: boolean): boolean {
                if (highlightEverywhere) {
                    return true;
                }

                const isInBackticks = this.isWithinInlineCode(state, start, end);
                const isInCodeblock = this.isWithinCodeBlock(state, start);

                return (highlightInBackticks && isInBackticks) || (highlightInCodeblocks && isInCodeblock);
            }

            private isWithinInlineCode(state: EditorState, start: number, end: number): boolean {
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

            private isWithinCodeBlock(state: EditorState, pos: number): boolean {
                const tree = syntaxTree(state);
                let node = tree.resolveInner(pos, 1);
                
                while (node) {
                    if (this.isCodeBlockNode(node)) {
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

            private isCodeBlockNode(node: any): boolean {
                return node.type.name.includes('CodeBlock') ||
                       node.type.name.includes('FencedCode') ||
                       node.type.name.includes('hmd-codeblock') ||
                       node.type.name.includes('HyperMD-codeblock');
            }

            private addDecoration(builder: RangeSetBuilder<Decoration>, start: number, end: number, color: string, view: EditorView, highlightStyle: 'background' | 'underline' | 'square' | 'border') {
                try {
                    let editorBackground = getBackgroundColor(plugin.app);

                    const effectiveColor = blendColorWithBackground(color, editorBackground, plugin.app);
                    const contrastColor = getContrastColor(effectiveColor, editorBackground, plugin.app);

                    // Get the decoration attributes based on the selected style
                    const decorationAttributes = this.getDecorationAttributes(highlightStyle, effectiveColor, contrastColor);
                        
                    // Add the decoration to the builder
                    builder.add(start, end, Decoration.mark({
                        attributes: decorationAttributes
                    }));
                    // Add a square widget for the 'square' highlight style
                    if (highlightStyle === 'square') {
                        this.addSquareWidget(builder, end, effectiveColor);
                    }
                } catch (error) {
                    console.warn('Error adding decoration:', error, { color, highlightStyle });
                }
            }

            private getDecorationAttributes(highlightStyle: string, effectiveColor: string, contrastColor: string): { [key: string]: string } {
                const attributes: { [key: string]: string } = {
                    class: "color-highlighter-inline-code",
                };

                switch (highlightStyle) {
                    case 'background':
                        attributes.style = `background-color: ${effectiveColor}; color: ${contrastColor}; border-radius: 3px; padding: 0.1em 0.2em;`;
                        break;
                    case 'underline':
                        attributes.class += " color-highlighter-underline";
                        attributes.style = `border-bottom: 2px solid ${effectiveColor}; text-decoration-skip-ink: none; border-radius: 0;`;
                        break;
                    case 'square':
                        // No additional style for the text itself
                        break;
                    case 'border':
                        attributes.class += " color-highlighter-border";
                        attributes.style = `border: 2px solid ${effectiveColor}; border-radius: 3px;`;
                        break;
                }

                return attributes;
            }

            private addSquareWidget(builder: RangeSetBuilder<Decoration>, end: number, color: string) {
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
        },
        {
            decorations: v => v.decorations
        }
    );
}