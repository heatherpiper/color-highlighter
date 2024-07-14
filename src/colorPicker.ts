import { EditorView } from '@codemirror/view';
import { EditorSelection } from '@codemirror/state';
import { App, ColorComponent } from 'obsidian';
import { hslToRgb } from './colorProcessor';
import { extractRgbComponents } from './utils';

export class ColorPicker {
    private colorPicker: ColorComponent;
    private containerEl: HTMLElement;
    private app: App;
    private currentFrom: number | null = null;
    private currentTo: number | null = null;
    private view: EditorView | null = null;
    private originalColor: string = '';
    private originalFormat: string = '';
    private isUserChange: boolean = false;

    private debugLog(message: string, ...args: any[]) {
        console.log(`[ColorPicker Debug] ${message}`, ...args);
    }

    constructor(app: App) {
        this.app = app;
        this.containerEl = createDiv({ cls: 'color-highlighter-picker' });
        this.colorPicker = new ColorComponent(this.containerEl);
    }

    show(view: EditorView, from: number, to: number, initialColor: string) {
        this.debugLog('show called with initialColor', initialColor);
        this.hide(); // Hide any existing color picker

        this.currentFrom = from;
        this.currentTo = to;
        this.view = view;
        this.originalColor = initialColor;
        this.originalFormat = this.getColorFormat(initialColor);
        this.isUserChange = false;

        const startCoords = view.coordsAtPos(from);
        const endCoords = view.coordsAtPos(to);
        if (!startCoords || !endCoords) return;

        const normalizedColor = this.normalizeColor(initialColor);
        this.debugLog('Normalized color', normalizedColor);
        if (normalizedColor) {
            // Position the color picker
            const rect = view.dom.getBoundingClientRect();
            this.containerEl.style.position = 'absolute';
            this.containerEl.style.left = `${endCoords.right - rect.left + 5}px`;
            this.containerEl.style.top = `${startCoords.top - rect.top}px`;
            view.dom.appendChild(this.containerEl);

            // Delay setting the initial color
            setTimeout(() => {
                this.colorPicker.setValue(normalizedColor);
                this.debugLog('Color picker value set to', normalizedColor);
                
                this.colorPicker.onChange(color => {
                    this.debugLog('Color picker onChange triggered with', color);
                    if (this.isUserChange) {
                        this.updateColor(color);
                    }
                });

                // Set isUserChange to true after setting the initial color
                setTimeout(() => {
                    this.isUserChange = true;
                    this.debugLog('isUserChange set to true');
                }, 50);
            }, 0);

            this.containerEl.onmouseenter = () => {
                if (this.hideTimeout) {
                    clearTimeout(this.hideTimeout);
                }
            };

            this.containerEl.onmouseleave = () => {
                this.scheduleHide();
            };

            this.adjustPosition(view);
        } else {
            this.debugLog('Failed to normalize color', initialColor);
        }
    }
    
    private hideTimeout: number | null = null;

    scheduleHide() {
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
        }
        this.hideTimeout = window.setTimeout(() => this.hide(), 300);
    }

    hide() {
        if (this.containerEl.parentNode) {
            this.containerEl.parentNode.removeChild(this.containerEl);
        }
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }
        this.currentFrom = null;
        this.currentTo = null;
        this.view = null;
    }

    private updateColor(newColor: string) {
        this.debugLog('updateColor called with', newColor);
        if (this.view && this.currentFrom !== null && this.currentTo !== null) {
            const formattedColor = this.formatColor(newColor);
            this.debugLog('Formatted color', formattedColor);
            if (this.originalColor !== formattedColor) {
                this.debugLog('Updating color from', this.originalColor, 'to', formattedColor);
                this.view.dispatch({
                    changes: { from: this.currentFrom, to: this.currentTo, insert: formattedColor },
                    selection: EditorSelection.single(this.currentFrom + formattedColor.length)
                });
                this.originalColor = formattedColor;
            }
        }
    }

    private adjustPosition(view: EditorView) {
        const rect = this.containerEl.getBoundingClientRect();
        const editorRect = view.dom.getBoundingClientRect();

        if (rect.right > editorRect.right) {
            const overflow = rect.right - editorRect.right;
            this.containerEl.style.left = `${parseInt(this.containerEl.style.left) - overflow - 10}px`;
        }
    }

    private normalizeColor(color: string): string {
        this.debugLog('normalizeColor called with', color);
        try {
            if (color.startsWith('hsl')) {
                return this.to6DigitHex(hslToRgb(color));
            }
            if (color.startsWith('#')) {
                return this.to6DigitHex(color);
            }
            if (color.startsWith('rgb')) {
                return this.to6DigitHex(color);
            }
            throw new Error('Unsupported color format');
        } catch (error) {
            this.debugLog('Error in normalizeColor', error);
            return '#000000'; // Fallback to black if there's an error
        }
    }

    private to6DigitHex(color: string): string {
        let hex = color;
        if (color.startsWith('rgb')) {
            const [r, g, b] = extractRgbComponents(color);
            hex = `#${this.componentToHex(r)}${this.componentToHex(g)}${this.componentToHex(b)}`;
        } else if (color.startsWith('#')) {
            if (color.length === 4) {
                // Convert #RGB to #RRGGBB
                hex = `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
            } else if (color.length === 5) {
                // Convert #RGBA to #RRGGBB (dropping alpha)
                hex = `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
            } else if (color.length === 9) {
                // Convert #RRGGBBAA to #RRGGBB (dropping alpha)
                hex = color.slice(0, 7);
            }
        }
        return hex;
    }

    private componentToHex(c: number): string {
        const hex = c.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }

    private formatColor(color: string): string {
        const [r, g, b] = this.hexToRgb(color);
        switch (this.originalFormat) {
            case 'hex':
                if (this.originalColor.length === 4) {
                    return `#${Math.round(r / 17).toString(16)}${Math.round(g / 17).toString(16)}${Math.round(b / 17).toString(16)}`;
                } else if (this.originalColor.length === 5) {
                    return `#${Math.round(r / 17).toString(16)}${Math.round(g / 17).toString(16)}${Math.round(b / 17).toString(16)}${this.originalColor[4]}`;
                } else if (this.originalColor.length === 9) {
                    return `${color}${this.originalColor.slice(7)}`;
                }
                return color;
            case 'rgb':
                return `rgb(${r}, ${g}, ${b})`;
            case 'rgba':
                const alphaMatch = this.originalColor.match(/[\d.]+\)$/);
                const alpha = alphaMatch ? alphaMatch[0] : '1)';
                return `rgba(${r}, ${g}, ${b}, ${alpha}`;
            case 'hsl':
                const [h, s, l] = this.rgbToHsl(r, g, b);
                return `hsl(${h}, ${s}%, ${l}%)`;
            case 'hsla':
                const [h2, s2, l2] = this.rgbToHsl(r, g, b);
                const alphaMatch2 = this.originalColor.match(/[\d.]+\)$/);
                const alpha2 = alphaMatch2 ? alphaMatch2[0] : '1)';
                return `hsla(${h2}, ${s2}%, ${l2}%, ${alpha2}`;
            default:
                return color;
        }
    }

    private getColorFormat(color: string): string {
        if (color.startsWith('#')) return 'hex';
        if (color.startsWith('rgb(')) return 'rgb';
        if (color.startsWith('rgba(')) return 'rgba';
        if (color.startsWith('hsl(')) return 'hsl';
        if (color.startsWith('hsla(')) return 'hsla';
        return 'unknown';
    }
    
    private hexToRgb(hex: string): [number, number, number] {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : [0, 0, 0];
    }

    private rgbToHsl(r: number, g: number, b: number): [number, number, number] {
        r /= 255, g /= 255, b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s, l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        } else {
            s = 0;
        }

        return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
    }
}