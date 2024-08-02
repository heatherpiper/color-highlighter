import { Editor, Notice, Plugin } from 'obsidian';
import { ColorPicker } from './src/colorPicker';
import { createEditorExtension } from './src/editorExtension/editorExtension';
import { createPostProcessor } from './src/postProcessor';
import { ColorHighlighterSettings, ColorHighlighterSettingTab, DEFAULT_SETTINGS } from './src/settings';
import { COLOR_REGEX } from './src/utils';
import './styles.css';
import { Editor as CustomEditor } from './types';

class ColorHighlighterPlugin extends Plugin {
    settings: ColorHighlighterSettings;
    colorPicker: ColorPicker;

    async onload() {
        await this.loadSettings();
        this.colorPicker = new ColorPicker(this.app);
        this.addSettingTab(new ColorHighlighterSettingTab(this.app, this));
        this.registerEditorExtension(createEditorExtension(this));
        this.registerMarkdownPostProcessor(createPostProcessor(this));

        this.addCommand({
            id: 'show-color-picker',
            name: 'Show color picker',
            editorCallback: (editor: Editor) => {
                this.showColorPicker(editor);
            }
        });
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
        this.app.workspace.updateOptions();
    }

    /**
     * Shows the color picker for the current cursor position in the editor.
     * 
     * @param editor The current editor instance.
     */
    showColorPicker(editor: Editor) {
        const cursor = editor.getCursor();
        const line = editor.getLine(cursor.line);
        const colorMatch = this.findColorAtCursor(line, cursor.ch);
    
        if (colorMatch) {
            const from = editor.posToOffset({ line: cursor.line, ch: colorMatch.index });
            const to = editor.posToOffset({ line: cursor.line, ch: colorMatch.index + colorMatch[0].length });
            
            const view = (editor as unknown as CustomEditor).cm;
            
            if (view) {
                this.colorPicker.show(view, from, to, colorMatch[0]);
            } else {
                new Notice('Unable to show color picker for this editor');
            }
        } else {
            new Notice('No color code found at cursor position');
        }
    }

    /**
     * Finds a color code at the current cursor position in the given line of text.
     * 
     * @param line The line of text to search.
     * @param cursorCh The cursor position within the line.
     * @returns A RegExpExecArray if a color code is found, null otherwise.
     */
    private findColorAtCursor(line: string, cursorCh: number): RegExpExecArray | null {
        COLOR_REGEX.lastIndex = 0;
        let match;
        while ((match = COLOR_REGEX.exec(line)) !== null) {
            if (cursorCh >= match.index && cursorCh <= match.index + match[0].length) {
                return match;
            }
        }
        return null;
    }
}

export default ColorHighlighterPlugin;