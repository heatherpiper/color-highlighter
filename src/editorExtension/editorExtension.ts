import { EditorState, StateEffect } from '@codemirror/state';
import { DecorationSet, EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view';
import { HighlightStyle } from 'src/HighlightStyle';
import ColorHighlighterPlugin from '../../main';
import { ColorPicker } from '../colorPicker';
import { updateCursorColor } from './colorDecorationUtils';
import { buildDecorations } from './decorationBuilder';

export const refreshEffect = StateEffect.define<null>();

export function createEditorExtension(plugin: ColorHighlighterPlugin) {
    return ViewPlugin.fromClass(
        class ColorHighlighterView {
            decorations: DecorationSet;
            colorPicker: ColorPicker;

            constructor(view: EditorView) {
                this.colorPicker = plugin.colorPicker;
                const noteHighlightStyle =  parseFrontmatter(view.state);
                console.log('Initial note highlight style:', noteHighlightStyle); // Debug log
                this.decorations = buildDecorations(view, plugin.settings, plugin.app, this.colorPicker, noteHighlightStyle);
            }

            /**
             * Updates the plugin state in response to editor changes.
             * This method is called by CodeMirror whenever the editor state changes.
             * It rebuilds decorations if the document or viewport has changed, or if a transaction has the refreshEffect,
             * and updates the cursor color if the selection has changed.
             *
             * @param update The ViewUpdate object containing information about what changed in the editor.
             */
            update(update: ViewUpdate) {
                if (update.docChanged || update.viewportChanged || update.transactions.some(tr => tr.effects.some(e => e.is(refreshEffect)))) {
                    const noteHighlightStyle = parseFrontmatter(update.state);
                    this.decorations = buildDecorations(update.view, plugin.settings, plugin.app, this.colorPicker, noteHighlightStyle);
                }
                
                if (update.selectionSet) {
                    updateCursorColor(update.view, update.state.selection.main, this.decorations);
                }
            }
            destroy() {
                this.colorPicker.hide();
            }
        },
        {
            decorations: v => v.decorations
        }
    );
}

/**
 * Parses the frontmatter of a note to extract the highlight style.
 * 
 * @param state The current state of the editor.
 * @returns HighlightStyle | undefined The highlight style specified in the frontmatter, or udefined if no valid highlight style is found.
 */
function parseFrontmatter(state: EditorState): HighlightStyle | undefined {
    const doc = state.doc;
    let inFrontmatter = false;

    for (let i = 1; i <= doc.lines; i++) {
        const line = doc.line(i);
        const lineContent = line.text.trim();

        if (lineContent === '---') {
            if (!inFrontmatter) {
                inFrontmatter = true;
            } else {
                break;
            }
        } else if (inFrontmatter && lineContent.startsWith('highlightStyle:')) {
            const style = lineContent.split(':')[1].trim().toLowerCase();
            if (Object.values(HighlightStyle).includes(style as HighlightStyle)) {
                return style as HighlightStyle;
            }
        } else if (!inFrontmatter && lineContent !== '') {
            break;
        }
    }

    return undefined;
}
