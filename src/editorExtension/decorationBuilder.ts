import { syntaxTree } from '@codemirror/language';
import { RangeSetBuilder } from '@codemirror/state';
import { Decoration, DecorationSet, EditorView } from '@codemirror/view';
import { App, TFile } from 'obsidian';
import { ColorPicker } from '../colorPicker';
import { HighlightStyle } from '../HighlightStyle';
import { ColorHighlighterSettings } from '../settings';
import { COLOR_REGEX } from '../utils';
import { addDecoration } from './colorDecorationUtils';
import { getFrontmatterRange, isWithinFrontmatter, isWithinTag, shouldHighlightColor } from './syntaxTreeUtils';

export function buildDecorations(view: EditorView, settings: ColorHighlighterSettings, app: App, colorPicker: ColorPicker, noteHighlightStyle?: HighlightStyle): DecorationSet {
    const file = app.workspace.getActiveFile()
    if (file && isFileExcluded(file, settings)) {
        return Decoration.none;
    }
    
    const { highlightEverywhere, highlightInBackticks, highlightInCodeblocks } = settings;
    const highlightStyle = noteHighlightStyle || settings.highlightStyle as HighlightStyle;
    const decorations: { from: number; to: number; color: string }[] = [];
    const tree = syntaxTree(view.state);
    const frontmatterRange = getFrontmatterRange(tree);

    const builder = new RangeSetBuilder<Decoration>();

    for (const { from, to } of view.visibleRanges) {
        const text = view.state.doc.sliceString(from, to);
        let match;
        while ((match = COLOR_REGEX.exec(text)) !== null) {
            const start = from + match.index;
            const end = start + match[0].length;

            const isInFrontmatter = isWithinFrontmatter(start, frontmatterRange);
            const isInTag = isWithinTag(view.state, start);
            const shouldHighlight = shouldHighlightColor(view.state, start, end, highlightEverywhere, highlightInBackticks, highlightInCodeblocks);

            if (!isInFrontmatter && !isInTag && shouldHighlight) {
                decorations.push({ from: start, to: end, color: match[0] });
            }
        }
    }

    decorations.sort((a, b) => a.from - b.from);

    for (const { from, to, color } of decorations) {
        addDecoration(builder, from, to, color, view, highlightStyle, settings, app, colorPicker);
    }

    return builder.finish();
}

/**
 * Checks if the given file is excluded from color highlighting based on the settings.
 * 
 * @param file The file to check.
 * @param settings The plugin settings containing the excluded files list.
 * @returns True if the file is excluded, false otherwise.
 */
function isFileExcluded(file: TFile, settings: ColorHighlighterSettings): boolean {
    return settings.excludedFiles.includes(file.path);
}