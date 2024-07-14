import { Plugin, Editor, Notice } from 'obsidian';
import { ColorHighlighterSettings, ColorHighlighterSettingTab, DEFAULT_SETTINGS } from './settings';
import { createEditorExtension } from './editorExtension';
import { createPostProcessor } from './postProcessor';
import { addStyles, COLOR_REGEX } from './utils';
import { ColorPicker } from './colorPicker';

class ColorHighlighterPlugin extends Plugin {
    settings: ColorHighlighterSettings;
    colorPicker: ColorPicker;

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new ColorHighlighterSettingTab(this.app, this));
        this.registerEditorExtension(createEditorExtension(this));
        this.registerMarkdownPostProcessor(createPostProcessor(this));
        addStyles(this);

        this.colorPicker = new ColorPicker(this.app);

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

    showColorPicker(editor: Editor) {
        const cursor = editor.getCursor();
        const line = editor.getLine(cursor.line);
        const colorMatch = this.findColorAtCursor(line, cursor.ch);

        if (colorMatch) {
            const from = editor.posToOffset({ line: cursor.line, ch: colorMatch.index });
            const to = editor.posToOffset({ line: cursor.line, ch: colorMatch.index + colorMatch[0].length });
            
            // Get the EditorView instance
            const view = (editor as any).cm;
            
            if (view) {
                // Use the existing show method of ColorPicker
                this.colorPicker.show(view, from, to, colorMatch[0]);
            } else {
                new Notice('Unable to show color picker for this editor');
            }
        } else {
            new Notice('No color code found at cursor position');
        }
    }

    private findColorAtCursor(line: string, cursorCh: number): RegExpExecArray | null {
        COLOR_REGEX.lastIndex = 0; // Reset lastIndex to ensure we start from the beginning of the line
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