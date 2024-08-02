import { syntaxTree } from '@codemirror/language';
import { RangeSetBuilder } from '@codemirror/state';
import { Decoration, DecorationSet, EditorView } from '@codemirror/view';
import { App } from 'obsidian';
import { ColorPicker } from '../colorPicker';
import { ColorHighlighterSettings } from '../settings';
import { COLOR_REGEX } from '../utils';
import { addDecoration } from './colorDecorationUtils';
import { getFrontmatterRange, isWithinFrontmatter, isWithinTag, shouldHighlightColor } from './syntaxTreeUtils';

export function buildDecorations(view: EditorView, settings: ColorHighlighterSettings, app: App, colorPicker: ColorPicker): DecorationSet {
    const { highlightEverywhere, highlightInBackticks, highlightInCodeblocks, highlightStyle } = settings;
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
        addDecoration(builder, from, to, color, view, settings.highlightStyle, settings, app, colorPicker);
    }

    return builder.finish();
}