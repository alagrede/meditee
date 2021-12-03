import { EditorState, SelectionState } from "draft-js";

const moveSelectionToStart = (editorState) => {
  const content = editorState.getCurrentContent();
  const firstBlock = content.getFirstBlock();
  const firstKey = firstBlock.getKey();
  //var length = firstBlock.getLength();

  return EditorState.acceptSelection(editorState, new SelectionState({
    anchorKey: firstKey,
    anchorOffset: 0,
    focusKey: firstKey,
    focusOffset: 0,
    isBackward: false
  }));
}

/**
 * Force focus to the start of the editor. This is useful in scenarios
 * where we want to programmatically focus the input and it makes sense
 * to allow the user to continue working seamlessly.
 */
export const moveFocusToStart = (editorState) => {
  const afterSelectionMove = moveSelectionToStart(editorState);
  return EditorState.forceSelection(afterSelectionMove, afterSelectionMove.getSelection());
}
