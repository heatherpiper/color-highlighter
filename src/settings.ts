import { App, ButtonComponent, PluginSettingTab, Setting } from 'obsidian';
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
    backgroundVerticalPadding: number;
    backgroundHorizontalPadding: number;
    backgroundBorderRadius: number;
    borderThickness: number;
    borderBorderRadius: number;
    underlineThickness: number;
    squareBorderRadius: number;
}

export const DEFAULT_SETTINGS: ColorHighlighterSettings = {
    highlightEverywhere: true,
    highlightInBackticks: false,
    highlightInCodeblocks: false,
    highlightStyle: HighlightStyle.Background,
    enableColorPicker: true,
    useContrastingBorder: false,
    scaleSquareWithText: false,
    squarePosition: 'after',
    backgroundVerticalPadding: 0.1,
    backgroundHorizontalPadding: 0.2,
    backgroundBorderRadius: 3,
    borderThickness: 2,
    borderBorderRadius: 3,
    underlineThickness: 2,
    squareBorderRadius: 1
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

        if (this.plugin.settings.highlightStyle === HighlightStyle.Background) {
            this.addSliderWithReset(containerEl, 'Background highlight vertical padding', 'Adjust the vertical padding of background highlights (in em)', 'backgroundVerticalPadding', 0, 0.5, 0.05);
            this.addSliderWithReset(containerEl, 'Background highlight horizontal padding', 'Adjust the horizontal padding of background highlights (in em)', 'backgroundHorizontalPadding', 0, 0.5, 0.05);
            this.addSliderWithReset(containerEl, 'Background highlight border radius', 'Adjust the border radius of background highlights (in pixels)', 'backgroundBorderRadius', 0, 10, 1);
        } else if (this.plugin.settings.highlightStyle === HighlightStyle.Border) {
            this.addSliderWithReset(containerEl, 'Border highlight thickness', 'Adjust the thickness of border highlights (in pixels)', 'borderThickness', 1, 6, 1);
            this.addSliderWithReset(containerEl, 'Border highlight border radius', 'Adjust the border radius of border style highlights (in pixels)', 'borderBorderRadius', 0, 10, 1);
        } else if (this.plugin.settings.highlightStyle === HighlightStyle.Square) {
            this.addSliderWithReset(containerEl, 'Square highlight border radius', 'Adjust the border radius of square highlights (in pixels)', 'squareBorderRadius', 0, 10, 1);
        } else if (this.plugin.settings.highlightStyle === HighlightStyle.Underline) {
            this.addSliderWithReset(containerEl, 'Underline highlight thickness', 'Adjust the thickness of underline highlights (in pixels)', 'underlineThickness', 1, 6, 1);
        }
            
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

    addSliderWithReset(containerEl: HTMLElement, name: string, desc: string, settingKey: keyof ColorHighlighterSettings, min: number, max: number, step: number) {
        new Setting(containerEl)
            .setName(name)
            .setDesc(desc)
            .addSlider(slider => slider
                .setLimits(min, max, step)
                .setValue(this.plugin.settings[settingKey] as number)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    (this.plugin.settings[settingKey] as number) = value;
                    await this.plugin.saveSettings();
                })
            )
            .addButton((button: ButtonComponent) => {
                button
                    .setButtonText("Reset")
                    .onClick(async () => {
                        (this.plugin.settings[settingKey] as number) = DEFAULT_SETTINGS[settingKey] as number;
                        await this.plugin.saveSettings();
                        this.display();
                    });
            });
    }
}