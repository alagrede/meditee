import { EditorState, Modifier, RichUtils } from "draft-js";

// https://github.com/jpuri/draftjs-utils/blob/master/js/block.js
const removeSelectedBlocksStyle = (editorState)  => {
  const newContentState = RichUtils.tryToRemoveBlockStyle(editorState);
  if (newContentState) {
    return EditorState.push(editorState, newContentState, 'change-block-type');
  }
  return editorState;
}

// https://github.com/jpuri/draftjs-utils/blob/master/js/block.js
export const getResetEditorState = (editorState) => {
  const blocks = editorState
    .getCurrentContent()
    .getBlockMap()
    .toList();
  const updatedSelection = editorState.getSelection().merge({
    anchorKey: blocks.first().get('key'),
    anchorOffset: 0,
    focusKey: blocks.last().get('key'),
    focusOffset: blocks.last().getLength(),
  });
  const newContentState = Modifier.removeRange(
    editorState.getCurrentContent(),
    updatedSelection,
    'forward'
  );

  const newState = EditorState.push(editorState, newContentState, 'remove-range');
  return removeSelectedBlocksStyle(newState)
}



/**
 * Function will clear all content from the editor.
 */
export function clearEditorContent(editorState) {
  const blocks = editorState
    .getCurrentContent()
    .getBlockMap()
    .toList();
  const updatedSelection = editorState.getSelection().merge({
    anchorKey: blocks.first().get('key'),
    anchorOffset: 0,
    focusKey: blocks.last().get('key'),
    focusOffset: blocks.last().getLength(),
  });
  const newContentState = Modifier.removeRange(
    editorState.getCurrentContent(),
    updatedSelection,
    'forward'
  );
  return EditorState.push(editorState, newContentState, 'remove-range');
}
