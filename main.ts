import { EditorView } from '@codemirror/view';
import { Editor, MarkdownView, Notice, Plugin, TFile } from 'obsidian';
import { HighlightStyle } from 'src/HighlightStyle';
import { ColorPicker } from './src/colorPicker';
import { createEditorExtension, refreshEffect } from './src/editorExtension/editorExtension';
import { createPostProcessor } from './src/postProcessor';
import { ColorHighlighterSettings, ColorHighlighterSettingTab, DEFAULT_SETTINGS } from './src/settings';
import { StyleSelectionModal } from './src/StyleSelectionModal';
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

        this.registerEvent(
            this.app.workspace.on('active-leaf-change', (leaf) => {
                if (leaf?.view instanceof MarkdownView) {
                    this.refreshAllViews();
                }
            })
        );

        this.registerEvent(
            this.app.metadataCache.on('changed', (file) => {
                this.refreshAllViews();
            })
        );

        this.addCommand({
            id: 'show-color-picker',
            name: 'Show color picker',
            editorCallback: (editor: Editor) => {
                this.showColorPicker(editor);
            }
        });

        this.addCommand({
            id: 'set-highlight-style',
            name: 'Set highlight style for this note',
            callback: () => this.showStyleSelectionModal(),
        });

    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
        this.app.workspace.updateOptions();
        this.refreshAllViews();
    }

    public refreshAllViews() {
        this.app.workspace.iterateAllLeaves(leaf => {
            if (leaf.view instanceof MarkdownView) {
                if (leaf.view.getMode() === 'source') {
                    const editor = leaf.view.editor as unknown as CustomEditor;
                    if (editor.cm instanceof EditorView) {
                        editor.cm.dispatch({
                            effects: refreshEffect.of(null)
                        });
                    }
                } else if (leaf.view.getMode() === 'preview') {
                    leaf.view.previewMode.rerender(true);
                    requestAnimationFrame(() => {
                        const contentEl = leaf.view.containerEl.querySelector('.markdown-preview-view');
                        if (contentEl instanceof HTMLElement) {
                            const postProcessor = createPostProcessor(this);
                            postProcessor(contentEl);
                        }
                    });
                }
            }
        });
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
     * Shows a modal for selecting a highlight style for the current note. If a style is selected, the frontmatter of the note is updated with the new style.
     */
    showStyleSelectionModal() {
        const modal = new StyleSelectionModal(this.app, (style: HighlightStyle) => {
            this.updateFrontmatter(style);
        });
        modal.open();
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

    /**
     * Updates the frontmatter of a note to include a specified highlight style. 
     * If the note already has a highlight style, it is replaced with the new one. 
     * If the note does not have any frontmatter, new frontmatter is added with the specified highlight style.
     * 
     * @param style The highlight style to update the frontmatter with.
     */
    async updateFrontmatter(style: HighlightStyle) {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
            new Notice('No active file');
            return;
        }
    
        const content = await this.app.vault.read(activeFile);
        const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
        const frontmatterMatch = content.match(frontmatterRegex);
    
        let newContent: string;
        if (frontmatterMatch) {
            const frontmatter = frontmatterMatch[1];
            const updatedFrontmatter = frontmatter.includes('highlightStyle:')
                ? frontmatter.replace(/highlightStyle:.*/, `highlightStyle: ${style}`)
                : `${frontmatter}\nhighlightStyle: ${style}`;
            newContent = content.replace(frontmatterRegex, `---\n${updatedFrontmatter}\n---`);
        } else {
            newContent = `---\nhighlightStyle: ${style}\n---\n\n${content}`;
        }
    
        await this.app.vault.modify(activeFile, newContent);
        new Notice(`Highlight style set to ${style}`);
        this.refreshAllViews();
    }
}

export default ColorHighlighterPlugin;