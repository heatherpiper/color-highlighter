import { App, Modal, Setting } from 'obsidian';
import { HighlightStyle } from './HighlightStyle';

export class StyleSelectionModal extends Modal {
    result: HighlightStyle;
    onSubmit: (result: HighlightStyle) => void;

    constructor(app: App, onSubmit: (result: HighlightStyle) => void) {
        super(app);
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const { contentEl } = this;

        contentEl.createEl('h2', { text: 'Select highlight style' });

        new Setting(contentEl)
            .setName('Highlight style')
            .addDropdown(drop => drop
                .addOption(HighlightStyle.Background, 'Background')
                .addOption(HighlightStyle.Border, 'Border')
                .addOption(HighlightStyle.Square, 'Square')
                .addOption(HighlightStyle.Underline, 'Underline')
                .onChange((value: HighlightStyle) => {
                    this.result = value;
                })
            );

        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText('Save')
                .setCta()
                .onClick(() => {
                    this.close();
                    this.onSubmit(this.result);
                }));
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}