import { getDefaultKeyBinding, KeyBindingUtil, Modifier, EditorState } from 'draft-js';
import { KEY_COMMANDS } from 'medium-draft/lib/util/constants';
const { changeType, showLinkInput, unlink } = KEY_COMMANDS;


function getCurrentBlock(editorState) {
  const selection = editorState.getSelection();
  const contentState = editorState.getCurrentContent();
  const startKey = selection.getStartKey();
  const currentBlock = contentState.getBlockForKey(startKey);
  return currentBlock;
}


/*
Emits various key commands to be used by `handleKeyCommand` in `Editor` based
on various key combos.
*/
export const  myKeyBindingFn = (e, editorState, setEditorState) => {

  // https://github.com/facebook/draft-js/issues/452
  // Fix ENTER add-new-line in code block and CMD+ENTER to quit block
  const block = getCurrentBlock(editorState);

  if (e.keyCode === 13 && block.getType() === 'code-block') {
    if (KeyBindingUtil.hasCommandModifier(e)) {
      // Command+Enter in code-block
      // => quit code block

      // 1. split block
      let newContentState = Modifier.splitBlock(editorState.getCurrentContent(), editorState.getSelection());
      let newEditorState = EditorState.push(editorState, newContentState, 'split-block');
      // 2. remove style on last block
      newContentState = Modifier.setBlockType(newContentState, newEditorState.getSelection(), 'unstyled');
      newEditorState = EditorState.push(newEditorState, newContentState, 'unstyled');

      setEditorState(newEditorState);
      return 'quit-code-block';
    } else {
      // Enter in code-block
      // add new line in current code-block
      const newContentState = Modifier.insertText(editorState.getCurrentContent(), editorState.getSelection(), '\n');
      const newEditorState = EditorState.push(editorState, newContentState, "insert-characters");
      setEditorState(newEditorState);
      return 'add-newline';
    }
  }

  // add save binding
  if (e.keyCode === 83 /* `S` key */ && KeyBindingUtil.hasCommandModifier(e)) {
    return 'myeditor-save';
  }

  if (KeyBindingUtil.hasCommandModifier(e) && e.which === 75) {
    if (e.shiftKey) {
      return unlink();
    }
    return showLinkInput();
  }
  if (e.altKey === true && !e.ctrlKey) {
    if (e.shiftKey === true) {
      switch (e.which) {
        // Alt + Shift + A
        // case 65: return addNewBlock();
        default: return getDefaultKeyBinding(e);
      }
    }
    switch (e.which) {
      // 1
      case 49: return changeType('ordered-list-item');
      // @
      case 50: return showLinkInput();
      // #
      case 51: return changeType('header-three');
      // *
      case 56: return changeType('unordered-list-item');
      // <
      case 188: return changeType('caption');
      // // -
      // case 189: return 'changetype:caption';
      // >
      case 190: return changeType('unstyled');
      // "
      case 222: return changeType('blockquote');
      default: return getDefaultKeyBinding(e);
    }
  }
  // if (e.keyCode === 46 && !e.ctrlKey) {
  //   return KEY_COMMANDS.deleteBlock();
  // }
  return getDefaultKeyBinding(e);
};
