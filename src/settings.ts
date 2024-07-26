import { App, PluginSettingTab, Setting } from 'obsidian';
import ColorHighlighterPlugin from './main';

export interface ColorHighlighterSettings {
    highlightEverywhere: boolean;
    highlightInBackticks: boolean;
    highlightInCodeblocks: boolean;
    highlightNamedColors: boolean;
    highlightStyle: 'background' | 'border' | 'square' | 'underline';
    enableColorPicker: boolean;
    useContrastingBorder: boolean;
}

export const DEFAULT_SETTINGS: ColorHighlighterSettings = {
    highlightEverywhere: true,
    highlightInBackticks: false,
    highlightInCodeblocks: false,
    highlightNamedColors: true,
    highlightStyle: 'background',
    enableColorPicker: true,
    useContrastingBorder: false,
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
            .setName('Highlight locations')
            .setDesc('Choose where to highlight color codes')
            .addDropdown(dropdown => dropdown
                .addOption('anywhere', 'Highlight anywhere')
                .addOption('code', 'Highlight only in code')
                .setValue(this.plugin.settings.highlightEverywhere ? 'anywhere' : 'code')
                .onChange(async (value) => {
                    this.plugin.settings.highlightEverywhere = (value === 'anywhere');
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
                codeHighlightSettings.style.paddingLeft = '2em';
    
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
            .setName('Highlight named colors in HTML/CSS')
            .setDesc('Highlight named colors (e.g., "red", "blue") in HTML and CSS code blocks. This setting is independent of other highlight settings.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.highlightNamedColors)
                .onChange(async (value) => {
                    this.plugin.settings.highlightNamedColors = value;
                    await this.plugin.saveSettings();
                })
            );
            
        new Setting(containerEl)
            .setName('Highlight style')
            .setDesc('Choose how color code highlights are displayed')
            .addDropdown(dropdown => dropdown
                .addOption('background', 'Background color')
                .addOption('border', 'Border')
                .addOption('square', 'Square')
                .addOption('underline', 'Underline')
                .setValue(this.plugin.settings.highlightStyle)
                .onChange(async (value: 'background' | 'border' | 'square' | 'underline') => {
                    this.plugin.settings.highlightStyle = value;
                    await this.plugin.saveSettings();
                    this.display();
                })
            );

        if (this.plugin.settings.highlightStyle === 'background' || this.plugin.settings.highlightStyle === 'square') {
            new Setting(containerEl)
                .setName('Use contrasting border for low-contrast highlights')
                .setDesc('Adds a faint border around highlights when there is not enough contrast with the background.')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.useContrastingBorder)
                    .onChange(async (value) => {
                        this.plugin.settings.useContrastingBorder = value;
                        await this.plugin.saveSettings();
                    })
                );
            }

        new Setting(containerEl)
            .setName('Enable color picker on hover')
            .setDesc('Show color picker when hovering over highlighted color codes. If disabled, you may still show the color picker by selecting "Color Highlighter: Show color picker" in the command palette.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableColorPicker)
                .onChange(async (value) => {
                    this.plugin.settings.enableColorPicker = value;
                    await this.plugin.saveSettings();
                })
            );
    }
}