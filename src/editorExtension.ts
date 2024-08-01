import { syntaxTree } from '@codemirror/language';
import { EditorState, RangeSetBuilder, SelectionRange } from '@codemirror/state';
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate, WidgetType } from '@codemirror/view';
import ColorHighlighterPlugin from '../main';
import { SyntaxTreeNode } from '../types';
import { ColorPicker } from './colorPicker';
import { blendColorWithBackground, getContrastColor, getContrastRatio } from './colorProcessor';
import { ColorHighlighterSettings } from './settings';
import { COLOR_REGEX, getBackgroundColor, hasAlphaChannel } from './utils';

export function createEditorExtension(plugin: ColorHighlighterPlugin) {
    return ViewPlugin.fromClass(
        class ColorHighlighterView {
                decorations: DecorationSet;
                colorPicker: ColorPicker;

            constructor(view: EditorView) {
                this.decorations = this.buildDecorations(view, plugin.settings);
                this.colorPicker = new ColorPicker(plugin.app);
            }

            /**
             * Updates the plugin state in response to editor changes.
             * This method is called by CodeMirror whenever the editor state changes.
             * It rebuilds decorations if the document or viewport has changed,
             * and updates the cursor color if the selection has changed.
             *
             * @param update - The ViewUpdate object containing information about what changed in the editor.
             */
            update(update: ViewUpdate) {
                if (update.docChanged || update.viewportChanged) {
                    this.decorations = this.buildDecorations(update.view, plugin.settings);
                }
                
                if (update.selectionSet) {
                    this.updateCursorColor(update.view, update.state.selection.main);
                }
            }

            /**
             * Builds decorations for color highlighting.
             * 
             * @param view The current EditorView.
             * @param settings The current Color Highlighter plugin settings.
             * @returns A DecorationSet containing all the color highlight decorations.
             */
            private buildDecorations(view: EditorView, settings: ColorHighlighterSettings) {
                try {
                    const builder = new RangeSetBuilder<Decoration>();
                    const { highlightEverywhere, highlightInBackticks, highlightInCodeblocks, highlightStyle } = settings;

                    for (const { from, to } of view.visibleRanges) {
                        const text = view.state.doc.sliceString(from, to);
                        let match;
                        while ((match = COLOR_REGEX.exec(text)) !== null) {
                            const start = from + match.index;
                            const end = start + match[0].length;

                            if (this.shouldHighlight(view.state, start, end, highlightEverywhere, highlightInBackticks, highlightInCodeblocks)) {
                                this.addDecoration(builder, start, end, match[0], view, highlightStyle, settings);
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
             * Updates the cursor color based on its position relative to color decorations.
             * This method checks if the cursor is inside a color highlight decoration and
             * updates the caret color accordingly. If the cursor is not inside any color
             * highlight, it resets the caret color by default.
             * 
             * @param view The current EditorView.
             * @param cursor The currentn cursor selection range.
             */
            private updateCursorColor(view: EditorView, cursor: SelectionRange) {
                let insideHighlight = false;

                this.decorations.between(cursor.from, cursor.to, (from, to, decoration) => {
                    if (decoration.spec.class && decoration.spec.class.includes('color-highlighter-decoration')) {
                        insideHighlight = true;
                        const contrastColor = (decoration.spec.attributes as any)?.style?.match(/--contrast-color:\s*([^;]+)/)?.[1];
                        if (contrastColor) {
                            view.dom.style.setProperty('--caret-color', contrastColor);
                        }
                        return false;
                    }
                });

                if (!insideHighlight) {
                    view.dom.style.setProperty('--caret-color', '');
                }
            }

            /**
             * Determines whether a given text range in the editor should be highlighted for color.
             * 
             * The function checks if the range is within inline code (backticks) or a code block, and
             * whether the user has enabled highlighting for those cases.
             *
             * @param state The current EditorState.
             * @param start The start position of the text range.
             * @param end The end position of the text range.
             * @param highlightEverywhere Whether to highlight colors everywhere, regardless of code context.
             * @param highlightInBackticks Whether to highlight colors within inline code (backticks).
             * @param highlightInCodeblocks Whether to highlight colors within code blocks.
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
             * @param state The current EditorState.
             * @param start The start position of the text range.
             * @param end The end position of the text range.
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
             * @param state The current EditorState.
             * @param pos The position to check for being within a code block.
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
             * @param node The syntax tree node to check.
             * @returns True if the node represents a code block, false otherwise.
             */
            private isCodeBlockNode(node: SyntaxTreeNode): boolean {
                return node.type.name.includes('CodeBlock') ||
                    node.type.name.includes('FencedCode') ||
                    node.type.name.includes('hmd-codeblock') ||
                    node.type.name.includes('HyperMD-codeblock');
            }

            /**
             * Applies the appropriate styles and attributes based on the selected highlight style. It
             * adds a square widget for the 'square' highlight style.
             *
             * @param builder The RangeSetBuilder instance to add the decoration to.
             * @param start The starting position of the decoration.
             * @param end The ending position of the decoration.
             * @param color The color to use for the decoration.
             * @param view The EditorView instance.
             * @param highlightStyle The highlight style to use ('background', 'border', 'square', or 'underline').
             */
            private addDecoration(builder: RangeSetBuilder<Decoration>, start: number, end: number, color: string, view: EditorView, highlightStyle: 'background' | 'border' | 'square' | 'underline', settings: ColorHighlighterSettings) {
                try {
                    let editorBackground = getBackgroundColor(plugin.app);

                    let effectiveColor: string;
                    if (!hasAlphaChannel(color)) {
                        effectiveColor = color;
                    } else {
                        effectiveColor = blendColorWithBackground(color, editorBackground, plugin.app);
                    }

                    const contrastColor = getContrastColor(effectiveColor, editorBackground);

                    // Get the decoration attributes based on the selected style
                    const decorationAttributes = this.getDecorationAttributes(highlightStyle, effectiveColor, contrastColor, editorBackground, settings);

                    decorationAttributes['data-decoration-id'] = `${start}-${end}`;

                    let decoration: Decoration;
                    if (color.startsWith('#')) {
                        // For hex colors, only style the part after the hash
                        decoration = Decoration.mark({
                            attributes: decorationAttributes,
                            class: 'color-highlighter-decoration'
                        });
                        builder.add(start + 1, end, decoration);
                    } else {
                        // For other color formats, use the original decoration
                        decoration = Decoration.mark({
                            attributes: decorationAttributes,
                            class: 'color-highlighter-decoration'
                        });
                        builder.add(start, end, decoration);
                    }

                    // Add hover listeners
                    this.addHoverListeners(view, start, end, color, settings);

                    // Add a square widget for the 'square' highlight style
                    if (highlightStyle === 'square') {
                        this.addSquareWidget(builder, end, effectiveColor, editorBackground, settings, `${start}-${end}`);
                    }
                } catch (error) {
                    console.warn('Error adding decoration:', error, { color, highlightStyle });
                }
            }

            /**
             * Generates the appropriate decoration attributes based on the selected highlight style.
             *
             * @param highlightStyle The highlight style to use ('background', 'border', 'square', or 'underline').
             * @param effectiveColor The color to use for the decoration, blended with the editor background.
             * @param contrastColor The contrasting color to use for the text and caret, based on the effective color.
             * @returns The decoration attributes to apply to the highlighted text.
             */
            private getDecorationAttributes(highlightStyle: string, effectiveColor: string, contrastColor: string, backgroundColor: string, settings: ColorHighlighterSettings): { [key: string]: string } {
                const attributes: { [key: string]: string } = {
                    class: `color-highlighter ${highlightStyle}`,
                    'data-color': effectiveColor
                };

                switch (highlightStyle) {
                    case 'background':
                        attributes.style = `--highlight-color: ${effectiveColor}; --contrast-color: ${contrastColor}; --caret-color: ${contrastColor};`;
                        if (settings.useContrastingBorder) {
                            const contrastRatio = getContrastRatio(effectiveColor, backgroundColor);
                            if (contrastRatio < 1.25) {
                                attributes['data-contrast-border'] = 'true';
                            }
                        }
                        break;
                    case 'border':
                    case 'underline':
                        attributes.style = `--highlight-color: ${effectiveColor};`;
                        break;
                    case 'square':
                        // No additional styles for square, handled in addSquareWidget
                        break;
                }

                return attributes;
            }

            /**
             * Adds a square widget to the editor decoration at the specified position.
             *
             * @param builder The RangeSetBuilder to add the decoration to.
             * @param end The position in the editor where the square widget should be added.
             * @param color The color to use for the square widget.
             */
            private addSquareWidget(builder: RangeSetBuilder<Decoration>, end: number, color: string, backgroundColor: string, settings: ColorHighlighterSettings, decorationId: string) {
                type ColorSquareWidget = WidgetType & {
                    color: string;
                    backgroundColor: string;
                    settings: ColorHighlighterSettings;
                    decorationId: string;
                };

                builder.add(end, end, Decoration.widget({
                    widget: new class extends WidgetType {
                        constructor(readonly color: string, readonly backgroundColor: string, readonly settings: ColorHighlighterSettings, readonly decorationId: string) {
                            super();
                        }

                        toDOM() {
                            const span = document.createElement('span');
                            span.className = 'color-highlighter-square';
                            span.setAttribute('data-decoration-id', this.decorationId);
                            span.style.setProperty('--highlight-color', this.color);

                            if (this.settings.useContrastingBorder) {
                                const contrastRatio = getContrastRatio(this.color, this.backgroundColor);
                                if (contrastRatio < 1.25) {
                                    span.setAttribute('data-contrast-border', 'true');
                                }
                            }

                            return span;
                        }

                        eq(other: ColorSquareWidget): boolean {
                            return other instanceof this.constructor && other.color === this.color;
                        }

                        updateDOM(): boolean {
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

                        coordsAt(): { top: number, right: number, bottom: number, left: number } | null {
                            return null; // We don't need to implement custom coordinates
                        }

                        destroy() { }
                    }(color, backgroundColor, settings, decorationId)
                }));
            }

            /**
             * Adds hover listeners to color decorations to show the color picker.
             * 
             * @param view The EditorView instance where the decorations are applied.
             * @param from The starting position of the color decoration in the document.
             * @param to The ending position of the color decoration in the document.
             * @param color The color string associated with this decoration.
             * @param settings The plugin settings object, containing color highlighter options.
             * 
             * @returns A cleanup function that removes the added event listeners when called.
             */
            private addHoverListeners(view: EditorView, from: number, to: number, color: string, settings: ColorHighlighterSettings) {
                const { enableColorPicker, highlightStyle } = settings;
                if (!enableColorPicker) return;

                let showTimeout: number | null = null;

                const showColorPicker = (event: MouseEvent) => {
                    if (showTimeout) {
                        clearTimeout(showTimeout);
                    }
                    showTimeout = window.setTimeout(() => {
                        const currentColor = view.state.doc.sliceString(from, to);
                        this.colorPicker.show(view, from, to, currentColor);
                    }, 200);
                };

                const hideColorPicker = () => {
                    if (showTimeout) {
                        clearTimeout(showTimeout);
                        showTimeout = null;
                    }
                    this.colorPicker.scheduleHide();
                };

                const handleMouseEvent = (event: MouseEvent) => {
                    const target = event.target as HTMLElement;

                    if (
                        (target.hasAttribute('data-decoration-id') && target.getAttribute('data-decoration-id') === `${from}-${to}`) ||
                        (highlightStyle === 'square' &&
                            target.classList.contains('color-highlighter-square') &&
                            (target.getAttribute('data-decoration-id') === `${from}-${to}` ||
                                target.previousElementSibling?.getAttribute('data-decoration-id') === `${from}-${to}`))
                    ) {
                        if (event.type === 'mouseover') {
                            showColorPicker(event);
                        } else if (event.type === 'mouseout') {
                            hideColorPicker();
                        }
                    }
                };

                view.dom.addEventListener('mouseover', handleMouseEvent);
                view.dom.addEventListener('mouseout', handleMouseEvent);

                return () => {
                    view.dom.removeEventListener('mouseover', handleMouseEvent);
                    view.dom.removeEventListener('mouseout', handleMouseEvent);
                    if (showTimeout) {
                        clearTimeout(showTimeout);
                    }
                };
            }
        },
        {
            decorations: v => v.decorations
        }
    );
}