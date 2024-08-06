import { StateEffect } from '@codemirror/state';
import { DecorationSet, EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view';
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
                this.decorations = buildDecorations(view, plugin.settings, plugin.app, this.colorPicker);
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
                    this.decorations = buildDecorations(update.view, plugin.settings, plugin.app, this.colorPicker);
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