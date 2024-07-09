import { Plugin } from 'obsidian';
import { ColorHighlighterSettings, ColorHighlighterSettingTab, DEFAULT_SETTINGS } from './settings';
import { createEditorExtension } from './editorExtension';
import { createPostProcessor } from './postProcessor';
import { addStyles } from './utils';

class ColorHighlighterPlugin extends Plugin {
    settings: ColorHighlighterSettings;

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new ColorHighlighterSettingTab(this.app, this));
        this.registerEditorExtension(createEditorExtension(this));
        this.registerMarkdownPostProcessor(createPostProcessor(this));
        addStyles(this);
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
        this.app.workspace.updateOptions();
    }
}

export default ColorHighlighterPlugin;