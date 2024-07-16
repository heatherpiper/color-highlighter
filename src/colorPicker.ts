import { EditorSelection } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { App, ColorComponent } from 'obsidian';
import { hslToRgb } from './colorProcessor';
import { extractRgbComponents } from './utils';


/**
 * The `ColorPicker` class provides a user interface for selecting and editing colors within a note.
 * It is responsible for displaying a color picker UI component, positioning it relative to the current editor selection,
 * and handling user interactions to update the color in the editor view.
 */
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

    constructor(app: App) {
        this.app = app;
        this.containerEl = createDiv({ cls: 'color-highlighter-picker' });
        this.colorPicker = new ColorComponent(this.containerEl);
    }

    /**
     * Shows the color picker UI component and positions it relative to the current editor selection.
     *
     * This method is responsible for displaying the color picker UI component and positioning it relative to the current
     * editor selection. It first hides any existing color picker, then sets the current selection range and editor view
     * references. It then positions the color picker container element based on the coordinates of the current selection
     * range. Finally, it sets up event handlers for the color picker component to handle user interactions and update the
     * color in the editor view accordingly.
     *
     * @param view The current editor view.
     * @param from The start position of the current selection range.
     * @param to The end position of the current selection range.
     * @param initialColor The initial color to be displayed in the color picker.
     */
    show(view: EditorView, from: number, to: number, initialColor: string) {
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
                
                this.colorPicker.onChange(color => {
                    if (this.isUserChange) {
                        this.updateColor(color);
                    }
                });

                // Set isUserChange to true after setting the initial color
                setTimeout(() => {
                    this.isUserChange = true;
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
        }
    }
    
    private hideTimeout: number | null = null;

    /**
     * Schedules the hiding of the color picker container element after a 300 millisecond delay.
     */
    scheduleHide() {
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
        }
        this.hideTimeout = window.setTimeout(() => this.hide(), 300);
    }

    /**
     * Hides the color picker container element and resets the associated state.
     */
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

    /**
     * Updates the color in the editor view with the provided new color.
     *
     * This method first formats the new color to a 6-digit hexadecimal representation, 
     * and then checks if the formatted color is different from the original color.
     * If the colors are different, it dispatches a change to the editor view to update the color at the current selection
     * range.
     *
     * @param newColor The new color to be applied in the editor view.
     */
    private updateColor(newColor: string) {
        if (this.view && this.currentFrom !== null && this.currentTo !== null) {
            const formattedColor = this.formatColor(newColor);
            if (this.originalColor !== formattedColor) {
                this.view.dispatch({
                    changes: { from: this.currentFrom, to: this.currentTo, insert: formattedColor },
                    selection: EditorSelection.single(this.currentFrom + formattedColor.length)
                });
                this.originalColor = formattedColor;
            }
        }
    }

    /**
     * Adjusts the position of the color picker container element to ensure it is fully visible within the editor view.
     *
     * This method is called when the color picker is displayed to ensure it is positioned correctly relative to the
     * editor view. If the color picker container would extend beyond the right edge of the editor view, this method
     * adjusts the left position of the container to keep it fully visible.
     *
     * @param view The EditorView instance associated with the current editor.
     */
    private adjustPosition(view: EditorView) {
        const rect = this.containerEl.getBoundingClientRect();
        const editorRect = view.dom.getBoundingClientRect();

        if (rect.right > editorRect.right) {
            const overflow = rect.right - editorRect.right;
            this.containerEl.style.left = `${parseInt(this.containerEl.style.left) - overflow - 10}px`;
        }
    }

    /**
     * Normalizes the provided color string to a 6-digit hexadecimal color representation.
     *
     * This method handles various color formats, including hexadecimal, RGB, and HSL. If the
     * provided color string is in an unsupported format, it will fallback to black (#000000).
     *
     * @param color The color string to normalize.
     * @returns The 6-digit hexadecimal color representation.
     */
    private normalizeColor(color: string): string {
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
            return '#000000'; // Fallback to black if there's an error
        }
    }

    /**
     * Converts the provided color string to a 6-digit hexadecimal color representation.
     *
     * @param color The color string to convert.
     * @returns The 6-digit hexadecimal color representation.
     */
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
    
    /**
     * Converts a numeric color component to a 2-digit hexadecimal string.
     *
     * @param c The numeric color component to convert.
     * @returns The 2-digit hexadecimal string representation of the color component.
     */
    private componentToHex(c: number): string {
        const hex = c.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }

    /**
     * Formats the provided color string based on the original color format.
     *
     * @param color The color string to format.
     * @returns The formatted color string.
     */
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

    /**
     * Determines the color format of the provided color string.
     *
     * @param color The color string to analyze.
     * @returns The color format as a string, one of 'hex', 'rgb', 'rgba', 'hsl', 'hsla', or 'unknown' if the format is not recognized.
     */
    private getColorFormat(color: string): string {
        if (color.startsWith('#')) return 'hex';
        if (color.startsWith('rgb(')) return 'rgb';
        if (color.startsWith('rgba(')) return 'rgba';
        if (color.startsWith('hsl(')) return 'hsl';
        if (color.startsWith('hsla(')) return 'hsla';
        return 'unknown';
    }

    /**
     * Converts a hexadecimal color string to an RGB tuple.
     *
     * @param hex The hexadecimal color string to convert, with or without a leading '#'.
     * @returns An array containing the red, green, and blue components of the color, each as a number between 0 and 255.
     */
    private hexToRgb(hex: string): [number, number, number] {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : [0, 0, 0];
    }

    /**
     * Converts an RGB color to an HSL color.
     * 
     * @param r The red component of the RGB color, between 0 and 255.
     * @param g The green component of the RGB color, between 0 and 255.
     * @param b The blue component of the RGB color, between 0 and 255.
     * @returns An array containing the hue, saturation, and lightness components of the HSL color.
     */
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