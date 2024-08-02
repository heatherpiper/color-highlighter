import { EditorView } from '@codemirror/view';
import { ColorPicker } from '../colorPicker';
import { ColorHighlighterSettings } from '../settings';

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
export function addHoverListeners(view: EditorView, from: number, to: number, color: string, settings: ColorHighlighterSettings, colorPicker: ColorPicker) {
    const { enableColorPicker, highlightStyle } = settings;
    if (!enableColorPicker) return;

    if (!colorPicker) {
        console.error('ColorPicker is undefined in addHoverListeners');
        return;
    }

    let showTimeout: number | null = null;

    const showColorPicker = (event: MouseEvent) => {
        if (showTimeout) {
            clearTimeout(showTimeout);
        }
        showTimeout = window.setTimeout(() => {
            const currentColor = view.state.doc.sliceString(from, to);
            colorPicker.show(view, from, to, currentColor);
        }, 200);
    };

    const hideColorPicker = () => {
        if (showTimeout) {
            clearTimeout(showTimeout);
            showTimeout = null;
        }
        colorPicker.scheduleHide();
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