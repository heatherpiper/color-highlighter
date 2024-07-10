import { getBackgroundColor, extractRgbComponents, extractHslaComponents } from './utils';
import { App } from 'obsidian';

// Blend color with background color
export function blendColorWithBackground(color: string, background: string, app: App): string {
    if (background === 'rgba(0, 0, 0, 0)' || background === 'transparent') {
        background = getBackgroundColor(app);
    }

    if (color.startsWith('rgba')) {
        return blendRgbaWithBackground(color, background);
    } else if (color.startsWith('hsla')) {
        return blendHslaWithBackground(color, background);
    } else if (color.startsWith('#')) {
        if (color.length === 9) {
            // Handle 8-digit HEX
            const hex = color.slice(1);
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            const a = parseInt(hex.slice(6, 8), 16) / 255;

            return blendRgbaWithBackground(`rgba(${r},${g},${b},${a})`, background);

        } else if (color.length === 5) {
            // Handle 4-digit HEX
            const r = parseInt(color[1] + color[1], 16);
            const g = parseInt(color[2] + color[2], 16);
            const b = parseInt(color[3] + color[3], 16);
            const a = parseInt(color[4] + color[4], 16) / 255;

            return blendRgbaWithBackground(`rgba(${r},${g},${b},${a})`, background);
        }
    }
    return color;
}

// Blend RGBA color with the background color
export function blendRgbaWithBackground(rgba: string, background: string): string {
    if (!rgba || !background) {
        console.warn('Invalid input in blendRgbaWithBackground:', rgba, background);
        return background;  // Fallback to background color if RGBA is invalid
    }

    try {
        // Extract RGBA components
        const [r, g, b, a] = rgba.match(/[\d.]+/g)?.map(Number) || [];
        if (r===undefined || g===undefined || b===undefined || a===undefined) {
            throw new Error('Invalid RGBA string');
        }
        const bgComponents = extractRgbComponents(background);
        if (bgComponents === null) {
            throw new Error('Invalid background color');
        }
        const [bgR, bgG, bgB] = bgComponents;
        const alpha = a !== undefined ? a : 1;

        // Blend with background
        const blendedR = Math.round((1 - alpha) * bgR + alpha * r);
        const blendedG = Math.round((1 - alpha) * bgG + alpha * g);
        const blendedB = Math.round((1 - alpha) * bgB + alpha * b);

        return `rgb(${blendedR}, ${blendedG}, ${blendedB})`;
    } catch (error) {
        console.warn('Error in blendRgbaWithBackground:', error);
        return background; // Fallback to background color if there's an error
    }
}

// Blend HSLA color with the background color
export function blendHslaWithBackground(hsla: string, background: string): string {
    // Extract HSLA components
    const components = extractHslaComponents(hsla);

    if (components === null) {
        console.warn('Invalid HSLA color:', hsla);
        return background; // Return the background color if HSLA is invalid
    }

    const [h, s, l, a] = components;
    
    try {
        // Extract RGB components from the background color
        const [bgR, bgG, bgB] = extractRgbComponents(background);
        
        // Convert HSLA to RGBA
        const rgba = hslaToRgba(h, s, l, a);
        
        // Blend RGBA color with the background
        const blendedR = Math.round((1 - a) * bgR + a * rgba[0]);
        const blendedG = Math.round((1 - a) * bgG + a * rgba[1]);
        const blendedB = Math.round((1 - a) * bgB + a * rgba[2]);

        return `rgb(${blendedR}, ${blendedG}, ${blendedB})`;
    } catch (error) {
        console.error('Error in blendHslaWithBackground:', error);
        return background; // Fallback to background color if there's an error
    }
}

// Get the most effective color for the text based on the background color
export function getContrastColor(color: string, background: string, app: App): string {
    if (color.startsWith('hsl')) {
        color = hslToRgb(color);
    } else if (color.startsWith('rgba')) {
        color = blendRgbaWithBackground(color, background);
    } else if (color.startsWith('#')) {
        if (color.length === 9 || color.length === 5) {
            // Handle 8-digit and 4-digit hex color codes with alpha
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            const a = color.length === 9 ? parseInt(color.slice(7, 9), 16) / 255 : parseInt(color.slice(4, 5), 16) / 15;
            color = blendRgbaWithBackground(`rgba(${r},${g},${b},${a})`, background);
        } else if (color.length === 4) {
            // Expand 3-digit hex to 6-digit hex
            color = `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
        }
    }
    // Get the contrast color based on the effective color
    const hex = color.startsWith('#') ? color.slice(1) : rgbToHex(color);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

    return (yiq >= 128) ? 'black' : 'white';
}

// Color conversion methods

export function hslToRgb(hsl: string): string {
    try {
        // Extract HSL values
        const [h, s, l] = hsl.match(/\d+%?/g)?.map(val => {
            if (val.endsWith('%')) {
                return parseFloat(val) / 100;
            }
            return parseFloat(val);
        }) || [];

        // Validate HSL values
        if (h === undefined || s === undefined || l === undefined) {
            throw new Error('Invalid HSL values');
        }

        // Normalize HSL values
        const sNorm = s;
        const lNorm = l;
        const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
        const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
        const m = lNorm - c / 2;
        let r = 0, g = 0, b = 0;

        // Calculate RGB values
        if (h < 60) { r = c; g = x; b = 0; }
        else if (h < 120) { r = x; g = c; b = 0; }
        else if (h < 180) { r = 0; g = c; b = x; }
        else if (h < 240) { r = 0; g = x; b = c; }
        else if (h < 300) { r = x; g = 0; b = c; }
        else { r = c; g = 0; b = x; }
        r = Math.round((r + m) * 255);
        g = Math.round((g + m) * 255);
        b = Math.round((b + m) * 255);
        
        return `rgb(${r},${g},${b})`;
    } catch (error) {
        console.warn('Error converting HSL to RGB:', error, hsl)
        return 'rgb(0,0,0)'; // Fallback to black if there's an error
    }
}

export function hslaToRgba(h: number, s: number, l: number, a: number): [number, number, number, number] {
    let r, g, b;
    
    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        // Helper function to convert hue to RGB
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };

        // Calculate RGB values
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h / 360 + 1/3);
        g = hue2rgb(p, q, h / 360);
        b = hue2rgb(p, q, h / 360 - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), a];
}

export function rgbToHex(rgb: string): string {
    try {
        if (rgb.startsWith('#')) {
            // If it's already a hex code, return it as is
            return rgb.slice(1);
        }
        const [r, g, b] = extractRgbComponents(rgb);

        return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    } catch (error) {
        // Fallback to black if there's an error
        return '000000'; 
    }
}