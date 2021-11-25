import React from 'react';
import { MemoryRouter as Router, Switch, Route } from 'react-router-dom';
import { Editor, createEditorState, Block, rendererFn, findLinkEntities, Link } from "medium-draft";
import {
  convertToRaw,
  convertFromRaw,
  CompositeDecorator,
} from "draft-js";
import { myKeyBindingFn } from './util/myKeyBinding';
import {setRenderOptions, blockToHTML, entityToHTML, styleToHTML} from 'medium-draft/lib/exporter';
import { HANDLED, NOT_HANDLED } from "medium-draft/lib/util/constants";
import PrismDecorator from 'draft-js-prism';
import mdToDraftjs from "./draftjs-md-converter/mdToDraftjs";
import draftjsToMd from "./draftjs-md-converter/draftjsToMd";
import { CustomImageSideButton } from "./buttons/CustomImageSideButton";
import { SeparatorSideButton } from "./buttons/SeparatorSideButton";
import CodeSideButton from "./buttons/CodeSideButton";
import { BLOCK_BUTTONS, INLINE_BUTTONS } from "./buttons/constants";
import { debounce } from "./util/debounce";
import MultiDecorator from "./decorator/MultiDecorator";
import Prism from 'prismjs';
import SnackBarUpdate from './components/SnackBarUpdate';

import 'font-awesome/css/font-awesome.min.css';
import 'medium-draft/lib/index.css';
import 'prismjs/themes/prism.css'
import './App.css';


const decorator = new MultiDecorator([
  // Code highlight
  // https://github.com/SamyPesse/draft-js-prism
  new PrismDecorator({
    prism: Prism,
    defaultSyntax: 'javascript',
  }),
  // Add link style
  new CompositeDecorator([
    {
      strategy: findLinkEntities,
      component: Link,
    }
  ])
]);


const sideButtons = [{
    title: 'Image',
    component: CustomImageSideButton,
  }, {
    title: 'Separator',
    component: SeparatorSideButton,
  }, {
    title: 'Code',
    component: CodeSideButton,
}];


const newBlockToHTML = (block) => {
  const blockType = block.type;
  if (block.type === Block.ATOMIC) {
    if (block.text === 'E') {
      return {
        start: '<figure class="md-block-atomic md-block-atomic-embed">',
        end: '</figure>',
      };
    } else if (block.text === '-') {
      return <div className="md-block-atomic md-block-atomic-break"><hr/></div>;
    }
  }
  return blockToHTML(block);
};

const newEntityToHTML = (entity, originalText) => {
  if (entity.type === 'embed') {
    return (
      <div>
        <a
          className="embedly-card"
          href={entity.data.url}
          data-card-controls="0"
          data-card-theme="dark"
        >Embedded ― {entity.data.url}
        </a>
      </div>
    );
  }
  return entityToHTML(entity, originalText);
};

const exporter = setRenderOptions({
  styleToHTML,
  blockToHTML: newBlockToHTML,
  entityToHTML: newEntityToHTML,
});



const AtomicSeparatorComponent = (props) => (
  <hr />
);

const AtomicBlock = (props) => {
  const { blockProps, block, contentState } = props;
  const entity = contentState.getEntity(block.getEntityAt(0));
  const data = entity.getData();
  const type = entity.getType();
  if (blockProps.components[type]) {
    const AtComponent = blockProps.components[type];
    return (
      <div className={`md-block-atomic-wrapper md-block-atomic-wrapper-${type}`}>
        <AtComponent data={data} />
      </div>
    );
  }
  return <p>Block of type <b>{type}</b> is not supported.</p>;
};


const MainView = () => {

  const [dirty, setDirty] = React.useState(false);
  const [filename, setFilename] = React.useState(null);
  const [editorState, setEditorState] = React.useState(createEditorState("", decorator));
  const originalRef = React.useRef("");
  const editor = React.useRef(null);


  /* Debounce dirty */
  const debounceDirty = React.useCallback(
    debounce((currentState, originalValue, filename) => {
      const rawData = convertToRaw(currentState.getCurrentContent());
      const currentMd = draftjsToMd(rawData);
        const isDirty = currentMd !== originalRef.current;
        setDirty(isDirty);
        window.document.title = getSimpleName(filename) + (isDirty?"*":"");
      }, 1000),
      []
  );


  const onChange = (currentEditorState) => {
    debounceDirty(currentEditorState, originalRef, filename);
    setEditorState(currentEditorState);
  };

  /*
  const mounted = React.useRef();
  React.useEffect(() => {
    if (!mounted.current) {
      // do componentDidMount logic
      mounted.current = true;
    } else {
      // do componentDidUpdate logic
      //editor.current.focus();
    }
  });
   */

  const getSimpleName = (filename) => {
    if (filename === null || filename === undefined) {
      return "New File";
    }
    if (filename.indexOf('/') !== -1) {
      return filename.substring(filename.lastIndexOf('/')+1);
    }
    return filename;
  }


  const renderHTML = () => {
    const currentContent = editorState.getCurrentContent();
    const eHTML = exporter(currentContent);
    window.electron.ipcRenderer.printHTML(eHTML);
  }


  React.useEffect(() => {

    window.electron.ipcRenderer.removeAllListeners("confirm");
    window.electron.ipcRenderer.on('confirm', (arg) => {
      if (arg === 0) { // confirm YES
        if (window.location.hash === "#quit") {
          window.electron.ipcRenderer.quit();
        } else {
          window.location.reload();
        }
      }
    });

    window.electron.ipcRenderer.removeAllListeners("command");
    window.electron.ipcRenderer.on('command', (arg) => {
      if (arg === 'open') {
        // https://github.com/facebook/draft-js/issues/1630
        // Because a DraftJS bug there is no way to correctly reset the Editor.
        // => Force reload page
        window.location.hash = 'open';
        if (dirty) {
          window.electron.ipcRenderer.confirm();
        } else {
          window.location.reload();
        }
      }
      if (arg === 'new') {
        window.location.hash = '';
        if (dirty) {
          window.electron.ipcRenderer.confirm();
        } else {
          window.location.reload();
        }
        /*
        setFilename(null);
        window.document.title = getSimpleName(filename);
        //setEditorState(createEditorState("", decorator));
        // scroll to TOP
        window.scrollTo(0,0);
         */
      }

      if (arg === 'export') {
        window.location.hash = '';
        renderHTML();
      }

      if (arg === 'quit') {
        if (dirty) {
          window.location.hash = 'quit';
          window.electron.ipcRenderer.confirm();
        } else {
          window.electron.ipcRenderer.quit();
        }
      }

    });

    window.electron.ipcRenderer.removeAllListeners("openFile");
    window.electron.ipcRenderer.on('openFile', ({ filename, value }) => {
      setFilename(filename);
      window.document.title = getSimpleName(filename);

      // read MD
      const rawData = mdToDraftjs(value);

      // new reference value
      // Use again the draft>MD converter to ensure to have the same MD serialization
      // (cover cases of unsupported MD content)
      const currentMd = draftjsToMd(rawData);
      originalRef.current = currentMd;
      setDirty(false);


      //console.log(JSON.stringify(rawData));
      const state = createEditorState(rawData, decorator);

      setEditorState(state);

      // scroll to TOP
      //window.scrollTo(0,0);

      // read RAW
      //const contentState = JSON.parse(value);
      ////const contentState = convertFromRaw(value);
      //setEditorState(createEditorState(contentState, decorator));
    });
    window.electron.ipcRenderer.removeAllListeners("saveFile");
    window.electron.ipcRenderer.on('saveFile', (filename) => {
      // update filename if use change filename
      setFilename(filename);
      window.document.title = getSimpleName(filename);
    });

  }, [dirty, editorState]);

  // Effect loaded only one time
  React.useEffect(() => {
    // open dialog after reload
    if (window.location.hash === "#open") {
      window.electron.ipcRenderer.openFile();
    }
  },[]);



  const handleKeyCommand = (command) => {

    // quit code block
    if (command === 'quit-code-block') {
      return HANDLED;
    }

    // add new line in code block
    if (command === 'add-newline') {
      return HANDLED;
    }
    if (command === 'myeditor-save') {
      // save raw
      //const value = JSON.stringify(convertToRaw(editorState.getCurrentContent()));

      // save MD
      const rawData = convertToRaw(editorState.getCurrentContent());
      const md = draftjsToMd(rawData);

      // new reference value
      originalRef.current = md;
      setDirty(false);

      // write file
      window.electron.ipcRenderer.saveFile(filename, md);
      return HANDLED;
    }
    return NOT_HANDLED;
  }

  const customRendererFn = (setEditorState, getEditorState) => {
    const atomicRenderers = {
      //embed: AtomicEmbedComponent,
      separator: AtomicSeparatorComponent,
    };
    const rFnOld = rendererFn(setEditorState, getEditorState);
    const rFnNew = (contentBlock) => {
      const type = contentBlock.getType();
      switch(type) {
        case Block.ATOMIC:
          return {
            component: AtomicBlock,
            editable: false,
            props: {
              components: atomicRenderers,
            },
          };
        default: return rFnOld(contentBlock);
      }
    };
    return rFnNew;
  }


  return (
    <>
    <SnackBarUpdate/>
    <div className={"container"}>
        <Editor
          ref={editor}
          blockButtons={BLOCK_BUTTONS}
          inlineButtons={INLINE_BUTTONS}
          editorState={editorState}
          onChange={onChange}
          keyBindingFn={(e) => myKeyBindingFn(e, editorState, setEditorState)}
          handleKeyCommand={handleKeyCommand}
          sideButtons={sideButtons}
          rendererFn={customRendererFn}
          spellcheck={true}
        />
    </div>
    </>
  );
};

export default function App() {
  return (
    <Router>
      <Switch>
        <Route path="/" component={MainView} />
      </Switch>
    </Router>
  );
}
