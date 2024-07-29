import { EditorSelection, EditorState as CodeMirrorEditorState } from '@codemirror/state';
import { EditorView as CodeMirrorEditorView, Decoration, WidgetType } from '@codemirror/view';

interface SyntaxTreeNode {
    type: {
        name: string;
    };
}

interface Transaction {
    changes: {
        from: number;
        to: number;
        insert: string;
    };
    selection: EditorSelection;
}

interface Editor {
    cm: EditorView;
    getCursor(): { line: number, ch: number };
    getLine(line: number): string;
    posToOffset(pos: { line: number, ch: number }): number;
}

type ColorString = string;

type RGBComponents = [number, number, number];
type RGBAComponents = [number, number, number, number];
type HSLComponents = [number, number, number];
type HSLAComponents = [number, number, number, number];

type EditorState = CodeMirrorEditorState & {
    doc: CodeMirrorEditorState['doc'] & {
        sliceString(from: number, to: number): string;
        lineAt(pos: number): { text: string, from: number };
    };
};

type EditorView = CodeMirrorEditorView & {
    state: EditorState;
    dispatch(transaction: Transaction): void;
    coordsAtPos(pos: number): { top: number, left: number, bottom: number, right: number } | null;
};

export {
    SyntaxTreeNode,
    Transaction,
    Editor,
    ColorString,
    RGBComponents,
    RGBAComponents,
    HSLComponents,
    HSLAComponents,
    EditorState,
    EditorView,
    Decoration,
    WidgetType
};