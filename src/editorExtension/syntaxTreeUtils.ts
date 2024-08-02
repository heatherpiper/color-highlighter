import { syntaxTree } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import { SyntaxNode, Tree, TreeCursor } from '@lezer/common';
import { SyntaxTreeNode } from '../../types';

/**
 * Identifies the range of the frontmatter section in the document.
 * 
 * @param tree The syntax tree of the document
 * @returns An object with 'from and 'to' properties defining the frontmatter range, or null if not found
 */
export function getFrontmatterRange(tree: Tree): { from: number, to: number } | null {
    let frontmatterStart: number | null = null;
    let frontmatterEnd: number | null = null;

    tree.iterate({
        enter: (node: TreeCursor) => {
            if (node.type.name === "def_hmd-frontmatter") {
                if (frontmatterStart === null) {
                    frontmatterStart = node.from;
                } else {
                    frontmatterEnd = node.to;
                    return false; // Stop iteration
                }
            }
        }
    });

    if (frontmatterStart !== null && frontmatterEnd !== null) {
        return { from: frontmatterStart, to: frontmatterEnd };
    }
    return null;
}

/**
 * Checks if a given position is within the frontmatter section of the document.
 * 
 * @param pos The position to check.
 * @param frontmatterRange The range of the fontmatter section.
 * @returns True if the position is within the frontmatter, false otherwise
 */
export function isWithinFrontmatter(pos: number, frontmatterRange: { from: number, to: number } | null): boolean {
    if (!frontmatterRange) return false;
    return pos >= frontmatterRange.from && pos <= frontmatterRange.to;
}

/**
 * Determines if a given position in the document is within a tag. This includes both inline tags and tags within frontmatter.
 * 
 * @param state The current editor state.
 * @param pos The position to check.
 * @returns True if the position is within a tag, false otherwise.
 */
export function isWithinTag(state: EditorState, pos: number): boolean {
    const tree = syntaxTree(state);
    let node: SyntaxNode | null = tree.resolveInner(pos, 1);

    while (node) {
        if (isTagNode(node) || isFrontmatterTagNode(node)) {
            return true;
        }
        node = node.parent;
    }
    return false;
}

/**
 * Checks if a given syntax node represents a tag.
 * 
 * @param node The syntax node to check.
 * @returns True if the node represents a tag, false otherwise.
 */
export function isTagNode(node: SyntaxNode): boolean {
    return node.type.name.includes('hashtag') || 
           node.type.name.includes('tag') || 
           node.type.name.includes('formatting-hashtag');
}

/**
 * Checks if a given syntax node represents a tag within the frontmatter.
 * 
 * @param node The syntax node to check.
 * @returns True if the node represents a frontmatter tag, false otherwise.
 */
export function isFrontmatterTagNode(node: SyntaxNode): boolean {
    return node.type.name === "hmd-frontmatter_string" && 
           node.parent?.type.name === "hmd-frontmatter_meta";
}

/**
 * Determines whether a given text range in the editor should be highlighted for color.
 * 
 * The function checks if the range is within inline code (backticks) or a code block, and
 * whether the user has enabled highlighting for those cases.
 *
 * @param state The current EditorState.
 * @param start The start position of the text range.
 * @param end The end position of the text range.
 * @param highlightEverywhere Whether to highlight colors everywhere, regardless of code context.
 * @param highlightInBackticks Whether to highlight colors within inline code (backticks).
 * @param highlightInCodeblocks Whether to highlight colors within code blocks.
 * @returns True if the text range should be highlighted, false otherwise.
 */
export function shouldHighlightColor(state: EditorState, start: number, end: number, highlightEverywhere: boolean, highlightInBackticks: boolean, highlightInCodeblocks: boolean): boolean {
    if (highlightEverywhere) {
        return true;
    }

    const isInBackticks = isWithinInlineCode(state, start, end);
    const isInCodeblock = isWithinCodeBlock(state, start);

    return (highlightInBackticks && isInBackticks) || (highlightInCodeblocks && isInCodeblock);
}

/**
 * Determines whether the given text range is within an inline code block (backticks).
 *
 * This function checks the text around the given start and end positions to see if they are
 * enclosed within backticks, which indicates an inline code block.
 *
 * @param state The current EditorState.
 * @param start The start position of the text range.
 * @param end The end position of the text range.
 * @returns True if the text range is within an inline code block, false otherwise.
 */
export function isWithinInlineCode(state: EditorState, start: number, end: number): boolean {
    const line = state.doc.lineAt(start);
    const lineText = line.text;
    const startInLine = start - line.from;
    const endInLine = end - line.from;

    let backtickCount = 0;
    let withinBackticks = false;
    for (let i = 0; i < lineText.length; i++) {
        if (lineText[i] === '`') {
            backtickCount++;
            withinBackticks = !withinBackticks;
        }
        if (i === startInLine && withinBackticks) return true;
        if (i === endInLine - 1 && withinBackticks) return true;
    }
    return false;
}

/**
 * Determines whether the given position is within a code block.
 *
 * This function recursively traverses the syntax tree to check if the given position
 * is contained within a code block node.
 *
 * @param state The current EditorState.
 * @param pos The position to check for being within a code block.
 * @returns True if the position is within a code block, false otherwise.
 */
export function isWithinCodeBlock(state: EditorState, pos: number): boolean {
    const tree = syntaxTree(state);
    let node = tree.resolveInner(pos, 1);

    while (node) {
        if (isCodeBlockNode(node)) {
            return true;
        }

        if (node.parent) {
            node = node.parent;
        } else {
            break; // We've reached the root of the tree
        }
    }

    return false;
}

/**
 * Determines whether the given syntax tree node represents a code block by checking 
 * if the node's type name includes certain keywords.
 *
 * @param node The syntax tree node to check.
 * @returns True if the node represents a code block, false otherwise.
 */
export function isCodeBlockNode(node: SyntaxTreeNode): boolean {
    return node.type.name.includes('CodeBlock') ||
           node.type.name.includes('FencedCode') ||
           node.type.name.includes('hmd-codeblock') ||
           node.type.name.includes('HyperMD-codeblock');
}