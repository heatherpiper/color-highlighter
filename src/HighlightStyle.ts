export enum HighlightStyle {
    Background = 'background',
    Border = 'border',
    Square = 'square',
    Underline = 'underline'
}

export function isHighlightStyle(value: string): value is HighlightStyle {
    return (Object.values(HighlightStyle) as string[]).includes(value);
}