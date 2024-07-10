import { App, MarkdownView } from 'obsidian';

export const COLOR_PATTERNS = {
    hex: /#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?![0-9A-Fa-f])/,
    rgb: /rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/,
    rgba: /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)/,
    hsl: /hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)/,
    hsla: /hsla\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*[\d.]+\s*\)/
};

export const COLOR_REGEX = new RegExp(Object.values(COLOR_PATTERNS).map(pattern => pattern.source).join('|'), 'g');

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

export function getThemeFallbackColor(): string {
    const isDarkTheme = document.body.classList.contains('theme-dark') || 
                        document.documentElement.classList.contains('theme-dark');
    return isDarkTheme ? 'rgb(30, 30, 30)' : 'rgb(255, 255, 255)';
}

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

export function addStyles(plugin: any) {
    const styles = `
        .color-highlighter {
            -webkit-box-decoration-break: clone;
        }
        .color-highlighter.background {
            border-radius: 3px;
            padding: 0.1em 0.2em;
        }
        .color-highlighter.border {
            border-radius: 3px;
            border-width: 2px;
            border-style: solid;
            padding: 0 2px;
        }
        .color-highlighter.underline {
            border-bottom-width: 2px;
            border-bottom-style: solid;
            padding-bottom: 1px;
        }
        .color-highlighter.underline::before,
        .color-highlighter.underline::after {
            content: "";
            position: absolute;
            bottom: -2px;
            width: 0;
            height: 2px;
            background-color: inherit;
        }
        .color-highlighter.underline::before {
            left: 0;
        }
        .color-highlighter.underline::after {
            right: 0;
        }
        .color-highlighter-square {
            display: inline-block;
            width: 10px;
            height: 10px;
            margin-left: 2px;
            vertical-align: middle;
        }
    `;

    plugin.registerMarkdownPostProcessor((el: HTMLElement) => {
        el.createEl('style', { text: styles });
    });
}