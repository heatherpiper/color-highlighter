import { RangeSetBuilder, SelectionRange } from '@codemirror/state';
import { Decoration, DecorationSet, EditorView, WidgetType } from '@codemirror/view';
import { App } from 'obsidian';
import { ColorPicker } from '../colorPicker';
import { blendColorWithBackground, getContrastColor, getContrastRatio } from '../colorProcessor';
import { ColorHighlighterSettings } from '../settings';
import { getBackgroundColor, hasAlphaChannel } from '../utils';
import { addHoverListeners } from './hoverHandler';
import { HighlightStyle } from '../HighlightStyle';

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
export function addDecoration(builder: RangeSetBuilder<Decoration>, start: number, end: number, color: string, view: EditorView, highlightStyle: HighlightStyle, settings: ColorHighlighterSettings, app: App, colorPicker: ColorPicker) {
    try {
        let editorBackground = getBackgroundColor(app);
        let effectiveColor = hasAlphaChannel(color) ? blendColorWithBackground(color, editorBackground, app) : color;
        const contrastColor = getContrastColor(effectiveColor, editorBackground);

        // Get the decoration attributes based on the selected style
        const decorationAttributes = getDecorationAttributes(highlightStyle, effectiveColor, contrastColor, editorBackground, settings);

        decorationAttributes['data-decoration-id'] = `${start}-${end}`;

        let decoration = Decoration.mark({
            attributes: decorationAttributes,
            class: 'color-highlighter-decoration'
        });

        const isHexColor = color.startsWith('#');
        const decorationStart = isHexColor ? start + 1 : start;

        // Add square widget before the color code if necessary
        if (highlightStyle === HighlightStyle.Square && settings.squarePosition === 'before') {
            addSquareWidget(builder, start, effectiveColor, editorBackground, settings, `${start}-${end}`);
        }

        builder.add(decorationStart, end, decoration);

        // Add square widget after the color code if necessary
        if (highlightStyle === HighlightStyle.Square && settings.squarePosition === 'after') {
            addSquareWidget(builder, end, effectiveColor, editorBackground, settings, `${start}-${end}`);
        }

        addHoverListeners(view, start, end, color, settings, colorPicker);
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
export function getDecorationAttributes(highlightStyle: HighlightStyle, effectiveColor: string, contrastColor: string, backgroundColor: string, settings: ColorHighlighterSettings): { [key: string]: string } {
    const attributes: { [key: string]: string } = {
        class: `color-highlighter ${highlightStyle}`,
        'data-color': effectiveColor
    };

    switch (highlightStyle) {
        case HighlightStyle.Background:
            attributes.style = `--highlight-color: ${effectiveColor}; --contrast-color: ${contrastColor}; --caret-color: ${contrastColor};`;
            if (settings.useContrastingBorder) {
                const contrastRatio = getContrastRatio(effectiveColor, backgroundColor);
                if (contrastRatio < 1.25) {
                    attributes['data-contrast-border'] = 'true';
                }
            }
            break;
        case HighlightStyle.Border:
        case HighlightStyle.Underline:
            attributes.style = `--highlight-color: ${effectiveColor};`;
            break;
        case HighlightStyle.Square:
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
export function addSquareWidget(builder: RangeSetBuilder<Decoration>, end: number, color: string, backgroundColor: string, settings: ColorHighlighterSettings, decorationId: string) {
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
                span.classList.add(this.settings.scaleSquareWithText ? 'color-highlighter-square-scalable' : 'color-highlighter-square-fixed');
                span.classList.add(`color-highlighter-square-${this.settings.squarePosition}`);
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
 * Updates the cursor color based on its position relative to color decorations.
 * This method checks if the cursor is inside a color highlight decoration and
 * updates the caret color accordingly. If the cursor is not inside any color
 * highlight, it resets the caret color by default.
 * 
 * @param view The current EditorView.
 * @param cursor The current cursor selection range.
 */
export function updateCursorColor(view: EditorView, cursor: SelectionRange, decorations: DecorationSet) {
    let insideHighlight = false;

    decorations.between(cursor.from, cursor.to, (from, to, decoration) => {
        if (decoration.spec.class && decoration.spec.class.includes('color-highlighter-decoration')) {
            insideHighlight = true;
            const contrastColor = (decoration.spec.attributes as { style?: string })?.style?.match(/--contrast-color:\s*([^;]+)/)?.[1];
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