import { App, PluginSettingTab, Setting } from 'obsidian';
import ColorHighlighterPlugin from './main';

export interface ColorHighlighterSettings {
    highlightEverywhere: boolean;
    highlightInBackticks: boolean;
    highlightInCodeblocks: boolean;
    highlightStyle: 'background' | 'border' | 'square' | 'underline';
    enableColorPicker: boolean;
}

export const DEFAULT_SETTINGS: ColorHighlighterSettings = {
    highlightEverywhere: true,
    highlightInBackticks: false,
    highlightInCodeblocks: false,
    highlightStyle: 'background',
    enableColorPicker: true
}

export class ColorHighlighterSettingTab extends PluginSettingTab {
    plugin: ColorHighlighterPlugin;

    constructor(app: App, plugin: ColorHighlighterPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const {containerEl} = this;

        containerEl.empty();

        const descEl = containerEl.createEl('p', {
            text: 'NOTE: After changing any of these settings, you may need to reload any open notes in order to see the changes take effect.',
            cls: 'setting-item-description'
        });

        new Setting(containerEl)
            .setName('Highlight everywhere')
            .setDesc('Highlight color codes everywhere in notes')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.highlightEverywhere)
                .onChange(async (value) => {
                    this.plugin.settings.highlightEverywhere = value;
                    if (value) {
                        this.plugin.settings.highlightInBackticks = false;
                        this.plugin.settings.highlightInCodeblocks = false;
                    }
                    await this.plugin.saveSettings();
                    this.display();
                })
            );

        new Setting(containerEl)
            .setName('Highlight in inline code')
            .setDesc('Highlight color codes within inline code (single backticks)')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.highlightInBackticks)
                .onChange(async (value) => {
                    this.plugin.settings.highlightInBackticks = value;
                    if (value) {
                        this.plugin.settings.highlightEverywhere = false;
                    }
                    await this.plugin.saveSettings();
                    this.display();
                })
            );

        new Setting(containerEl)
            .setName('Highlight in code blocks')
            .setDesc('Highlight color codes within code blocks (triple backticks)')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.highlightInCodeblocks)
                .onChange(async (value) => {
                    this.plugin.settings.highlightInCodeblocks = value;
                    if (value) {
                        this.plugin.settings.highlightEverywhere = false;
                    }
                    await this.plugin.saveSettings();
                    this.display();
                })
            );

        new Setting(containerEl)
            .setName('Highlight style')
            .setDesc('Choose how color codes are highlighted')
            .addDropdown(dropdown => dropdown
                .addOption('background', 'Background color')
                .addOption('border', 'Border')
                .addOption('square', 'Colored square')
                .addOption('underline', 'Underline')
                .setValue(this.plugin.settings.highlightStyle)
                .onChange(async (value: 'background' | 'border' | 'square' | 'underline') => {
                    this.plugin.settings.highlightStyle = value;
                    await this.plugin.saveSettings();
                    this.display();
                })
            );
        
        new Setting(containerEl)
            .setName('Enable color picker')
            .setDesc('Show color picker when hovering over highlighted color codes')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableColorPicker)
                .onChange(async (value) => {
                    this.plugin.settings.enableColorPicker = value;
                    await this.plugin.saveSettings();
                })
            );
    }
}