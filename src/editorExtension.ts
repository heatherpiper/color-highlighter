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


            /**
             * Initializes the color highlight decorations for the given editor view.
             *
             * This constructor is called when the ColorHighlighterView plugin is created. It builds the initial set of
             * color highlight decorations to be displayed in the editor view.
             *
             * @param view - The EditorView instance for which the color highlight decorations should be created.
             */
            constructor(view: EditorView) {
                this.decorations = this.buildDecorations(view);
            }


            /**
             * Updates the color highlight decorations in the editor view when the document or viewport changes.
             *
             * @param update - The ViewUpdate object containing information about the changes to the editor view.
             */
            update(update: ViewUpdate) {
                if (update.docChanged || update.viewportChanged) {
                    this.decorations = this.buildDecorations(update.view);
                }
            }

            /**
             * Builds decorations for color highlighting in the editor view.
             * 
             * @param view - the EditorView instance.
             * @returns A DecorationSet containing all the color highlight decorations.
             */            
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

            /**
             * Determines whether a given text range in the editor should be highlighted for color.
             * 
             * The function checks if the range is within inline code (backticks) or a code block, and
             * whether the user has enabled highlighting for those cases.
             *
             * @param state - The current EditorState.
             * @param start - The start position of the text range.
             * @param end - The end position of the text range.
             * @param highlightEverywhere - Whether to highlight colors everywhere, regardless of code context.
             * @param highlightInBackticks - Whether to highlight colors within inline code (backticks).
             * @param highlightInCodeblocks - Whether to highlight colors within code blocks.
             * @returns True if the text range should be highlighted, false otherwise.
             */
            private shouldHighlight(state: EditorState, start: number, end: number, highlightEverywhere: boolean, highlightInBackticks: boolean, highlightInCodeblocks: boolean): boolean {
                if (highlightEverywhere) {
                    return true;
                }

                const isInBackticks = this.isWithinInlineCode(state, start, end);
                const isInCodeblock = this.isWithinCodeBlock(state, start);

                return (highlightInBackticks && isInBackticks) || (highlightInCodeblocks && isInCodeblock);
            }

            /**
             * Determines whether the given text range is within an inline code block (backticks).
             *
             * This function checks the text around the given start and end positions to see if they are
             * enclosed within backticks, which indicates an inline code block.
             *
             * @param state - The current EditorState.
             * @param start - The start position of the text range.
             * @param end - The end position of the text range.
             * @returns True if the text range is within an inline code block, false otherwise.
             */
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

            /**
             * Determines whether the given position is within a code block.
             *
             * This function recursively traverses the syntax tree to check if the given position
             * is contained within a code block node.
             *
             * @param state - The current EditorState.
             * @param pos - The position to check for being within a code block.
             * @returns True if the position is within a code block, false otherwise.
             */
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

            /**
             * Determines whether the given syntax tree node represents a code block by checking 
             * if the node's type name includes certain keywords.
             *
             * @param node - The syntax tree node to check.
             * @returns True if the node represents a code block, false otherwise.
             */
            private isCodeBlockNode(node: any): boolean {
                return node.type.name.includes('CodeBlock') ||
                       node.type.name.includes('FencedCode') ||
                       node.type.name.includes('hmd-codeblock') ||
                       node.type.name.includes('HyperMD-codeblock');
            }


            /**
             * Applies the appropriate styles and attributes based on the selected highlight style. It
             * adds a square widget for the 'square' highlight style.
             *
             * @param builder - The RangeSetBuilder instance to add the decoration to.
             * @param start - The starting position of the decoration.
             * @param end - The ending position of the decoration.
             * @param color - The color to use for the decoration.
             * @param view - The EditorView instance.
             * @param highlightStyle - The highlight style to use ('background', 'border', 'square', or 'underline').
             */
            private addDecoration(builder: RangeSetBuilder<Decoration>, start: number, end: number, color: string, view: EditorView, highlightStyle: 'background' | 'border' | 'square' | 'underline') {
                try {
                    let editorBackground = getBackgroundColor(plugin.app);
                    
                    const effectiveColor = blendColorWithBackground(color, editorBackground, plugin.app);
                    const contrastColor = getContrastColor(effectiveColor, editorBackground, plugin.app);
            
                    // Get the decoration attributes based on the selected style
                    const decorationAttributes = this.getDecorationAttributes(highlightStyle, effectiveColor, contrastColor);
                        
                    if (color.startsWith('#')) {
                        // For hex colors, only style the part after the hash
                        builder.add(start + 1, end, Decoration.mark({
                            attributes: decorationAttributes
                        }));
                    } else {
                        // For other color formats, use the original decoration
                        builder.add(start, end, Decoration.mark({
                            attributes: decorationAttributes
                        }));
                    }
            
                    // Add a square widget for the 'square' highlight style
                    if (highlightStyle === 'square') {
                        this.addSquareWidget(builder, end, effectiveColor);
                    }
                } catch (error) {
                    console.warn('Error adding decoration:', error, { color, highlightStyle });
                }
            }


            /**
             * Generates the appropriate decoration attributes based on the selected highlight style.
             *
             * @param highlightStyle - The highlight style to use ('background', 'border', 'square', or 'underline').
             * @param effectiveColor - The color to use for the decoration, blended with the editor background.
             * @param contrastColor - The contrasting color to use for the text, based on the effective color.
             * @returns The decoration attributes to apply to the highlighted text.
             */
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

            /**
             * Adds a square widget to the editor decoration at the specified position.
             *
             * The square widget is a 10x10 pixel square with the provided color, displayed inline with the text.
             *
             * @param builder - The RangeSetBuilder to add the decoration to.
             * @param end - The position in the editor where the square widget should be added.
             * @param color - The color to use for the square widget.
             */
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