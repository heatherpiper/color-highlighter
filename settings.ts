import { App, PluginSettingTab, Setting } from 'obsidian';
import ColorHighlighterPlugin from './main';

export interface ColorHighlighterSettings {
    highlightEverywhere: boolean;
    highlightInBackticks: boolean;
    highlightInCodeblocks: boolean;
}

export const DEFAULT_SETTINGS: ColorHighlighterSettings = {
    highlightEverywhere: true,
    highlightInBackticks: false,
    highlightInCodeblocks: false
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
            text: 'NOTE: After changing any of these settings, you may need to reload any open notes in order to see the changes.',
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
                    this.display(); // Refresh the display to update other toggles
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
                    this.display(); // Refresh the display to update other toggles
                })
            );

        new Setting(containerEl)
            .setName('Highlight in codeblocks')
            .setDesc('Highlight color codes within codeblocks (triple backticks)')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.highlightInCodeblocks)
                .onChange(async (value) => {
                    this.plugin.settings.highlightInCodeblocks = value;
                    if (value) {
                        this.plugin.settings.highlightEverywhere = false;
                    }
                    await this.plugin.saveSettings();
                    this.display();})
            );
        }
    }