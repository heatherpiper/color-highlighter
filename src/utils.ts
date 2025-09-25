import { App, MarkdownView } from 'obsidian';
import { ColorString, HSLAComponents, RGBComponents, RGBAComponents } from '../types';

export const COLOR_PATTERNS = {
    hex: /#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?![0-9A-Fa-f])/,
    rgb: /rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/,
    rgba: /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)/,
    hsl: /hsl\(\s*[\d.]+\s*,\s*[\d.]+%?\s*,\s*[\d.]+%?\s*\)/,
    hsla: /hsla\(\s*[\d.]+\s*,\s*[\d.]+%?\s*,\s*[\d.]+%?\s*,\s*[\d.]+\s*\)/
};

export const COLOR_REGEX = new RegExp(Object.values(COLOR_PATTERNS).map(pattern => pattern.source).join('|'), 'gi');

/**
 * Attempts to retrieve the background color of the active Markdown view. If the background color 
 * cannot be determined from the editor or content elements, it falls back to the body background color, 
 * and finally to a theme-dependent fallback color.
 *
 * @param app The Obsidian app instance.
 * @returns The background color in RGB format. 
 */
export function getBackgroundColor(app: App): ColorString {
    const view = app.workspace.getActiveViewOfType(MarkdownView);
    if (view instanceof MarkdownView) {
        // Try getting the background from the editor element
        const editorEl = view.contentEl.querySelector('.cm-editor');
        if (editorEl instanceof HTMLElement) {
            const bgColor = window.getComputedStyle(editorEl).backgroundColor;
            if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
                return bgColor;
            }
        }
        
        // If that fails, try getting it from the content element
        const contentEl = view.contentEl;
        if (contentEl instanceof HTMLElement) {
            const bgColor = window.getComputedStyle(contentEl).backgroundColor;
            if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
                return bgColor;
            }
        }
    }
    
    // If that fails, try to get the body background color
    const bodyBgColor = window.getComputedStyle(document.body).backgroundColor;
    if (bodyBgColor && bodyBgColor !== 'rgba(0, 0, 0, 0)' && bodyBgColor !== 'transparent') {
        return bodyBgColor;
    }

    // Only use fallback if all other methods fail
    return getThemeFallbackColor();
}

/**
 * Retrieves the fallback background color based on whether the current theme is a light or dark theme.
 * 
 * If the current theme is a dark theme, the fallback color is set to the default Obsidian dark theme's background color (rgb(30, 30, 30)).
 * Otherwise, if the current theme is a light theme, the fallback color is set to white (rgb(255, 255, 255)).
 * 
 * This function is used as a last resort when the background color cannot be determined from the active Markdown view or the body element.
 * 
 * @returns The fallback background color in RGB format.
 */
export function getThemeFallbackColor(): ColorString {
    const isDarkTheme = document.body.classList.contains('theme-dark') || 
                        document.documentElement.classList.contains('theme-dark');
    return isDarkTheme ? 'rgb(30, 30, 30)' : 'rgb(255, 255, 255)';
}

/**
 * Extracts the RGB components from a color string, formatted as either hexadecimal or RGB
 * 
 * @param rgbString The color string to extract the components from.
 * @returns An array containing the red, green, and blue components of the color string.
 */
export function extractRgbComponents(rgbString: ColorString): RGBComponents {
    if (!rgbString) {
        console.warn('Received null or undefined rgbString in extractRgbComponents')
        // Fallback to black if the string is empty
        return [0, 0, 0];
    }
    if (rgbString.startsWith('#')) {
        // Handle hex color
        const hex = rgbString.slice(1);
        if (hex.length === 3) {
            // Handle shorthand hex
            return [
                parseInt(hex[0] + hex[0], 16),
                parseInt(hex[1] + hex[1], 16),
                parseInt(hex[2] + hex[2], 16)
            ];
        } else if (hex.length === 6 || hex.length === 8) {
            // Handle 6-digit and 8-digit hex
            return [
                parseInt(hex.slice(0, 2), 16),
                parseInt(hex.slice(2, 4), 16),
                parseInt(hex.slice(4, 6), 16)
            ];
        }
    }
    const match = rgbString.match(/\d+/g);
    if (!match || match.length < 3) {
        console.warn('Invalid RGB string in extractRgbComponents:', rgbString);
        return [0, 0, 0]; // Fallback to black if the string is invalid
    }
    return match.slice(0, 3).map(Number) as [number, number, number];
}

/**
 * Extracts the RGBA components from a color string, formatted as either hexadecimal or RGB
 * 
 * @param rgbaString The RGBA string to extract the components from.
 * @returns An array containing the red, green, blue, and alpha components of the color string.
 */
export function extractRgbaComponents(rgbaString: ColorString): RGBAComponents | null {
    const match = rgbaString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!match) {
        console.warn('Invalid RGBA string:', rgbaString);
        return null;
    }
    
    const r = parseInt(match[1], 10);
    const g = parseInt(match[2], 10);
    const b = parseInt(match[3], 10);
    const a = match[4] ? parseFloat(match[4]) : 1;
    
    return [r, g, b, a];
}

/**
 * Extracts the HSLA components from a given HSLA string.
 * 
 * @param hsla The HSLA string to extract components from.
 * @returns An array containing the HSLA components [h, s, l, a], or null if the HSLA string is invalid.
 */
export function extractHslaComponents(hsla: ColorString): HSLAComponents | null {
    const match = hsla.match(/hsla?\((\s*[\d.]+)\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?,?\s*([\d.]+)?\)/);

    // Validate HSLA string format
    if (!match) {
        console.warn('Invalid HSLA string format:', hsla);
        return null;
    }
    
    // Extract HSLA components
    const h = parseFloat(match[1]);
    const s = parseFloat(match[2]) / 100;
    const l = parseFloat(match[3]) / 100;
    const a = match[4] ? parseFloat(match[4]) : 1;

    // Validate HSLA components
    if (isNaN(h) || isNaN(s) || isNaN(l) || isNaN(a)) {
        console.warn('Invalid HSLA component values:', { h, s, l, a });
        return null;
    }

    if (h < 0 || h > 360 || s < 0 || s > 1 || l < 0 || l > 1 || a < 0 || a > 1) {
        console.warn('HSLA values out of valid range:', { h, s, l, a });
        return null;
    }

    return [h, s, l, a];
}

/**
 * Determines if a given color string contains an alpha channel (transparency).
 * 
 * @param color The color string to check.
 * @returns True if the color string contains an alpha channel, false otherwise.
 */
export function hasAlphaChannel(color: ColorString): boolean {
    if (color.startsWith('rgba') || color.startsWith('hsla')) {
        return true;
    }
    if (color.startsWith('#')) {
        return color.length === 5 || color.length === 9; // 4 digits (with alpha) or 8 digits (with alpha)
    }
    return false;
}
