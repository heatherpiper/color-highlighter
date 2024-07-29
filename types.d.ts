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
    cm: CodeMirrorEditorView;
    getCursor(): { line: number, ch: number };
    getLine(line: number): string;
    posToOffset(pos: { line: number, ch: number }): number;
}

type ColorString = string;

// Create utility types that combine CodeMirror types with our additional properties
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

// Export our types
export {
    SyntaxTreeNode,
    Transaction,
    Editor,
    ColorString,
    EditorState,
    EditorView,
    Decoration,
    WidgetType
};