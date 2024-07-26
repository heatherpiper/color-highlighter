import { App, MarkdownView } from 'obsidian';

export const HTML_NAMED_COLORS = [
    'aliceblue', 'antiquewhite', 'aqua', 'aquamarine', 'azure', 'beige', 'bisque', 'black', 'blanchedalmond', 'blue',
    'blueviolet', 'brown', 'burlywood', 'cadetblue', 'chartreuse', 'chocolate', 'coral', 'cornflowerblue', 'cornsilk',
    'crimson', 'cyan', 'darkblue', 'darkcyan', 'darkgoldenrod', 'darkgray', 'darkgreen', 'darkgrey', 'darkkhaki',
    'darkmagenta', 'darkolivegreen', 'darkorange', 'darkorchid', 'darkred', 'darksalmon', 'darkseagreen', 'darkslateblue',
    'darkslategray', 'darkslategrey', 'darkturquoise', 'darkviolet', 'deeppink', 'deepskyblue', 'dimgray', 'dimgrey',
    'dodgerblue', 'firebrick', 'floralwhite', 'forestgreen', 'fuchsia', 'gainsboro', 'ghostwhite', 'gold', 'goldenrod',
    'gray', 'green', 'greenyellow', 'grey', 'honeydew', 'hotpink', 'indianred', 'indigo', 'ivory', 'khaki', 'lavender',
    'lavenderblush', 'lawngreen', 'lemonchiffon', 'lightblue', 'lightcoral', 'lightcyan', 'lightgoldenrodyellow',
    'lightgray', 'lightgreen', 'lightgrey', 'lightpink', 'lightsalmon', 'lightseagreen', 'lightskyblue', 'lightslategray',
    'lightslategrey', 'lightsteelblue', 'lightyellow', 'lime', 'limegreen', 'linen', 'magenta', 'maroon',
    'mediumaquamarine', 'mediumblue', 'mediumorchid', 'mediumpurple', 'mediumseagreen', 'mediumslateblue',
    'mediumspringgreen', 'mediumturquoise', 'mediumvioletred', 'midnightblue', 'mintcream', 'mistyrose', 'moccasin',
    'navajowhite', 'navy', 'oldlace', 'olive', 'olivedrab', 'orange', 'orangered', 'orchid', 'palegoldenrod', 'palegreen',
    'paleturquoise', 'palevioletred', 'papayawhip', 'peachpuff', 'peru', 'pink', 'plum', 'powderblue', 'purple', 'rebeccapurple', 'red',
    'rosybrown', 'royalblue', 'saddlebrown', 'salmon', 'sandybrown', 'seagreen', 'seashell', 'sienna', 'silver', 'skyblue',
    'slateblue', 'slategray', 'slategrey', 'snow', 'springgreen', 'steelblue', 'tan', 'teal', 'thistle', 'tomato',
    'turquoise', 'violet', 'wheat', 'white', 'whitesmoke', 'yellow', 'yellowgreen'
];

export const HTML_NAMED_COLOR_MAP: { [key: string]: string } = {
    aliceblue: '#f0f8ff',
    antiquewhite: '#faebd7',
    aqua: '#00ffff',
    aquamarine: '#7fffd4',
    azure: '#f0ffff',
    beige: '#f5f5dc',
    bisque: '#ffe4c4',
    black: '#000000',
    blanchedalmond: '#ffebcd',
    blue: '#0000ff',
    blueviolet: '#8a2be2',
    brown: '#a52a2a',
    burlywood: '#deb887',
    cadetblue: '#5f9ea0',
    chartreuse: '#7fff00',
    chocolate: '#d2691e',
    coral: '#ff7f50',
    cornflowerblue: '#6495ed',
    cornsilk: '#fff8dc',
    crimson: '#dc143c',
    cyan: '#00ffff',
    darkblue: '#00008b',
    darkcyan: '#008b8b',
    darkgoldenrod: '#b8860b',
    darkgray: '#a9a9a9',
    darkgreen: '#006400',
    darkgrey: '#a9a9a9',
    darkkhaki: '#bdb76b',
    darkmagenta: '#8b008b',
    darkolivegreen: '#556b2f',
    darkorange: '#ff8c00',
    darkorchid: '#9932cc',
    darkred: '#8b0000',
    darksalmon: '#e9967a',
    darkseagreen: '#8fbc8f',
    darkslateblue: '#483d8b',
    darkslategray: '#2f4f4f',
    darkslategrey: '#2f4f4f',
    darkturquoise: '#00ced1',
    darkviolet: '#9400d3',
    deeppink: '#ff1493',
    deepskyblue: '#00bfff',
    dimgray: '#696969',
    dimgrey: '#696969',
    dodgerblue: '#1e90ff',
    firebrick: '#b22222',
    floralwhite: '#fffaf0',
    forestgreen: '#228b22',
    fuchsia: '#ff00ff',
    gainsboro: '#dcdcdc',
    ghostwhite: '#f8f8ff',
    gold: '#ffd700',
    goldenrod: '#daa520',
    gray: '#808080',
    green: '#008000',
    greenyellow: '#adff2f',
    grey: '#808080',
    honeydew: '#f0fff0',
    hotpink: '#ff69b4',
    indianred: '#cd5c5c',
    indigo: '#4b0082',
    ivory: '#fffff0',
    khaki: '#f0e68c',
    lavender: '#e6e6fa',
    lavenderblush: '#fff0f5',
    lawngreen: '#7cfc00',
    lemonchiffon: '#fffacd',
    lightblue: '#add8e6',
    lightcoral: '#f08080',
    lightcyan: '#e0ffff',
    lightgoldenrodyellow: '#fafad2',
    lightgray: '#d3d3d3',
    lightgreen: '#90ee90',
    lightgrey: '#d3d3d3',
    lightpink: '#ffb6c1',
    lightsalmon: '#ffa07a',
    lightseagreen: '#20b2aa',
    lightskyblue: '#87cefa',
    lightslategray: '#778899',
    lightslategrey: '#778899',
    lightsteelblue: '#b0c4de',
    lightyellow: '#ffffe0',
    lime: '#00ff00',
    limegreen: '#32cd32',
    linen: '#faf0e6',
    magenta: '#ff00ff',
    maroon: '#800000',
    mediumaquamarine: '#66cdaa',
    mediumblue: '#0000cd',
    mediumorchid: '#ba55d3',
    mediumpurple: '#9370db',
    mediumseagreen: '#3cb371',
    mediumslateblue: '#7b68ee',
    mediumspringgreen: '#00fa9a',
    mediumturquoise: '#48d1cc',
    mediumvioletred: '#c71585',
    midnightblue: '#191970',
    mintcream: '#f5fffa',
    mistyrose: '#ffe4e1',
    moccasin: '#ffe4b5',
    navajowhite: '#ffdead',
    navy: '#000080',
    oldlace: '#fdf5e6',
    olive: '#808000',
    olivedrab: '#6b8e23',
    orange: '#ffa500',
    orangered: '#ff4500',
    orchid: '#da70d6',
    palegoldenrod: '#eee8aa',
    palegreen: '#98fb98',
    paleturquoise: '#afeeee',
    palevioletred: '#db7093',
    papayawhip: '#ffefd5',
    peachpuff: '#ffdab9',
    peru: '#cd853f',
    pink: '#ffc0cb',
    plum: '#dda0dd',
    powderblue: '#b0e0e6',
    purple: '#800080',
    rebecapurple: '#663399',
    red: '#ff0000',
    rosybrown: '#bc8f8f',
    royalblue: '#4169e1',
    saddlebrown: '#8b4513',
    salmon: '#fa8072',
    sandybrown: '#f4a460',
    seagreen: '#2e8b57',
    seashell: '#fff5ee',
    sienna: '#a0522d',
    silver: '#c0c0c0',
    skyblue: '#87ceeb',
    slateblue: '#6a5acd',
    slategray: '#708090',
    slategrey: '#708090',
    snow: '#fffafa',
    springgreen: '#00ff7f',
    steelblue: '#4682b4',
    tan: '#d2b48c',
    teal: '#008080',
    thistle: '#d8bfd8',
    tomato: '#ff6347',
    turquoise: '#40e0d0',
    violet: '#ee82ee',
    wheat: '#f5deb3',
    white: '#ffffff',
    whitesmoke: '#f5f5f5',
    yellow: '#ffff00',
    yellowgreen: '#9acd32'
}

export const COLOR_PATTERNS = {
    hex: /#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?![0-9A-Fa-f])/,
    rgb: /rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/,
    rgba: /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)/,
    hsl: /hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)/,
    hsla: /hsla\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*[\d.]+\s*\)/,
    namedColor: new RegExp(`\\b(${HTML_NAMED_COLORS.join('|')})\\b`, 'i')
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
export function getBackgroundColor(app: App): string {
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
export function getThemeFallbackColor(): string {
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
export function extractRgbComponents(rgbString: string): [number, number, number] {
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

export function extractRgbaComponents(rgbaString: string): [number, number, number, number] | null {
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
export function extractHslaComponents(hsla: string): [number, number, number, number] | null {
    const match = hsla.match(/hsla?\((\d+),\s*(\d+)%?,\s*(\d+)%?,?\s*([\d.]+)?\)/);

    // Validate HSLA string format
    if (!match) {
        console.warn('Invalid HSLA string format:', hsla);
        return null;
    }
    
    // Extract HSLA components
    const h = parseInt(match[1], 10);
    const s = parseInt(match[2], 10) / 100;
    const l = parseInt(match[3], 10) / 100;
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

export function hasAlphaChannel(color: string): boolean {
    if (HTML_NAMED_COLORS.includes(color.toLowerCase())) {
        return false;
    }
    if (color.startsWith('rgba') || color.startsWith('hsla')) {
        return true;
    }
    if (color.startsWith('#')) {
        return color.length === 5 || color.length === 9; // 4 digits (with alpha) or 8 digits (with alpha)
    }
    return false;
}

export function isValidColorContext(text: string, index: number): boolean {
    // Check if the color is a value in a CSS property
    const beforeText = text.slice(0, index).trim();
    const cssPropertyRegex = /:\s*$/;
    if (cssPropertyRegex.test(beforeText)) {
        return true;
    }

    // Check if the color is a value in an HTML color attribute
    const htmlColorAttributeRegex = /(?:color|background-color|border-color)=["']?$/i;
    if (htmlColorAttributeRegex.test(beforeText)) {
        return true;
    }

    // Check if the color is a value in an HTML style attribute
    const styleAttributeRegex = /style\s*=\s*["'][^"']*$/i;
    if (styleAttributeRegex.test(beforeText)) {
        return true;
    }

    return false;
}

/**
 * Registers a Markdown post-processor that adds custom CSS styles to the plugin.
 * The styles define the appearance of color highlights in the various highlight styles available in the settings.
 *
 * @param plugin The plugin object that the styles are registered with.
 */
export function addStyles(plugin: any) {
    const styles = `
        .color-highlighter {
            -webkit-box-decoration-break: clone;
        }
        .color-highlighter.background {
            border-radius: 3px;
            padding: 0.1em 0.2em;
        }
        .color-highlighter.background[data-contrast-border="true"] {
            border: 1px solid var(--background-modifier-border-hover);
            padding: calc(0.1em - 1px) calc(0.2em - 1px);
        }
        .color-highlighter.border {
            border-radius: 3px;
            border: 2px solid;
            padding: 0 0.2em;
        }
        .color-highlighter.underline {
            border-bottom: 2px solid;
        }
        .color-highlighter-square {
            display: inline-block;
            width: 10px;
            height: 10px;
            margin-left: 0.25em;
            vertical-align: middle;
            border-radius: 1px;
        }
        .color-highlighter-square[data-contrast-border="true"] {
            border: 1px solid var(--background-modifier-border-hover);
        }
    `;

    plugin.registerMarkdownPostProcessor((el: HTMLElement) => {
        el.createEl('style', { text: styles });
    });
}