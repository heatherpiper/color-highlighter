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
            .setName('Highlight mode')
            .setDesc('Choose where to highlight color codes')
            .addDropdown(dropdown => dropdown
                .addOption('everywhere', 'Highlight everywhere')
                .addOption('code', 'Highlight only in code')
                .setValue(this.plugin.settings.highlightEverywhere ? 'everywhere' : 'code')
                .onChange(async (value) => {
                    this.plugin.settings.highlightEverywhere = (value === 'everywhere');
                    if (value === 'code') {
                        this.plugin.settings.highlightInBackticks = true;
                        this.plugin.settings.highlightInCodeblocks = true;
                    }
                    await this.plugin.saveSettings();
                    this.display();
                })
            );

            if (!this.plugin.settings.highlightEverywhere) {
                const codeHighlightSettings = containerEl.createDiv('code-highlight-settings');
                codeHighlightSettings.style.paddingLeft = '20px';
    
                new Setting(codeHighlightSettings)
                    .setName('Highlight in inline code')
                    .setDesc('Highlight color codes within inline code (single backticks)')
                    .addToggle(toggle => toggle
                        .setValue(this.plugin.settings.highlightInBackticks)
                        .onChange(async (value) => {
                            this.plugin.settings.highlightInBackticks = value;
                            if (!value && !this.plugin.settings.highlightInCodeblocks) {
                                this.plugin.settings.highlightInCodeblocks = true;
                            }
                            await this.plugin.saveSettings();
                            this.display();
                        })
                    );
    
                new Setting(codeHighlightSettings)
                    .setName('Highlight in code blocks')
                    .setDesc('Highlight color codes within code blocks (triple backticks)')
                    .addToggle(toggle => toggle
                        .setValue(this.plugin.settings.highlightInCodeblocks)
                        .onChange(async (value) => {
                            this.plugin.settings.highlightInCodeblocks = value;
                            if (!value && !this.plugin.settings.highlightInBackticks) {
                                this.plugin.settings.highlightInBackticks = true;
                            }
                            await this.plugin.saveSettings();
                            this.display();
                        })
                    );
            }
            
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
            .setName('Enable color picker on hover')
            .setDesc('Show color picker when hovering over highlighted color codes. If disabled, you can still show the color picker tool from the command palette.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableColorPicker)
                .onChange(async (value) => {
                    this.plugin.settings.enableColorPicker = value;
                    await this.plugin.saveSettings();
                })
            );
    }
}