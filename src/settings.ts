import { App, PluginSettingTab, Setting } from 'obsidian';
import ColorHighlighterPlugin from '../main';
import { HighlightStyle } from './HighlightStyle';

export interface ColorHighlighterSettings {
    highlightEverywhere: boolean;
    highlightInBackticks: boolean;
    highlightInCodeblocks: boolean;
    highlightStyle: HighlightStyle;
    enableColorPicker: boolean;
    useContrastingBorder: boolean;
    scaleSquareWithText: boolean;
    squarePosition: 'before' | 'after';
}

export const DEFAULT_SETTINGS: ColorHighlighterSettings = {
    highlightEverywhere: true,
    highlightInBackticks: false,
    highlightInCodeblocks: false,
    highlightStyle: HighlightStyle.Background,
    enableColorPicker: true,
    useContrastingBorder: false,
    scaleSquareWithText: false,
    squarePosition: 'after'
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

        new Setting(containerEl)
            .setName('Highlight locations')
            .setDesc('Choose where to highlight color codes.')
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
    
                new Setting(containerEl)
                    .setName('Highlight in inline code')
                    .setDesc('Highlight color codes within inline code (single backticks).')
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
    
                new Setting(containerEl)
                    .setName('Highlight in code blocks')
                    .setDesc('Highlight color codes within code blocks (triple backticks).')
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
            .setDesc('Choose how color code highlights are displayed.')
            .addDropdown(dropdown => dropdown
                .addOption(HighlightStyle.Background, 'Background color')
                .addOption(HighlightStyle.Border, 'Border')
                .addOption(HighlightStyle.Square, 'Square')
                .addOption(HighlightStyle.Underline, 'Underline')
                .setValue(this.plugin.settings.highlightStyle)
                .onChange(async (value: HighlightStyle) => {
                    this.plugin.settings.highlightStyle = value;
                    await this.plugin.saveSettings();
                    this.display();
                })
            );

        if (this.plugin.settings.highlightStyle === HighlightStyle.Square) {
            new Setting(containerEl)
                .setName('Square position')
                .setDesc('Choose whether the square appears before or after the color code text.')
                .addDropdown(dropdown => dropdown
                    .addOption('before', 'Before text')
                    .addOption('after', 'After text')
                    .setValue(this.plugin.settings.squarePosition)
                    .onChange(async (value: 'before' | 'after') => {
                    this.plugin.settings.squarePosition = value;
                    await this.plugin.saveSettings();
                    })
                );
                
            new Setting(containerEl)
                .setName('Scale square with text size')
                .setDesc('Make the size of the square scale with the text size. If disabled, the square will always be 10 x 10 pixels.')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.scaleSquareWithText)
                    .onChange(async (value) => {
                        this.plugin.settings.scaleSquareWithText = value;
                        await this.plugin.saveSettings();
                    })
                );
        }

        if (this.plugin.settings.highlightStyle === HighlightStyle.Background || this.plugin.settings.highlightStyle === HighlightStyle.Square) {
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