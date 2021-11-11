'use strict';

const parse = require('@textlint/markdown-to-ast').parse;
const Grapheme = require('grapheme-splitter');
const splitter = new Grapheme();


const defaultInlineStyles = {
  Strong: {
    type: 'BOLD',
    symbol: '**'
  },
  Emphasis: {
    type: 'ITALIC',
    symbol: '*'
  },
  Delete: {
    type: 'STRIKETHROUGH',
    symbol: '~~'
  },
  Code: {
    type: 'CODE',
    symbol: '`'
  }
};

const defaultBlockStyles = {
  List: 'unordered-list-item',
  Header1: 'header-one',
  Header2: 'header-two',
  Header3: 'header-three',
  Header4: 'header-four',
  Header5: 'header-five',
  Header6: 'header-six',
  CodeBlock: 'code-block',
  BlockQuote: 'blockquote'
};

const getBlockStyleForMd = (node, blockStyles) => {
  const style = node.type;
  const ordered = node.ordered;
  const depth = node.depth;
  if (style === 'List' &&
    node.raw &&
    (node.raw.startsWith("- [ ]") || node.raw.startsWith("- [x]"))) {
    return 'todo';
  } else if (style === 'List' && ordered) {
    return 'ordered-list-item';
  } else if (style === 'Header') {
    return blockStyles[`${style}${depth}`];
  } else if (
    node.type === 'Paragraph' &&
    node.children &&
    node.children[0] &&
    node.children[0].type === 'Image'
  ) {
    return 'atomic:image';
  } else if (node.type === 'Paragraph' && node.raw && node.raw.match(/^\[\[\s\S+\s.*\S+\s\]\]/)) {
    return 'atomic';
  } else if (node.type === 'HorizontalRule' && node.raw === "---") {
    return 'atomic';
  }
  return blockStyles[style];
};


const joinCodeBlocks = splitMd => {
  const opening = splitMd.indexOf('```');
  const closing = splitMd.indexOf('```', opening + 1);

  if (opening >= 0 && closing >= 0) {
    const codeBlock = splitMd.slice(opening, closing + 1);
    const codeBlockJoined = codeBlock.join('\n');
    const updatedSplitMarkdown = [
      ...splitMd.slice(0, opening),
      codeBlockJoined,
      ...splitMd.slice(closing + 1)
    ];

    return joinCodeBlocks(updatedSplitMarkdown);
  }

  return splitMd;
};

const splitMdBlocks = md => {
  //const splitMd = md.split('\n');
  const splitMdWithCodeBlocks = splitByCodeBlock(md);
  return splitMdWithCodeBlocks;
};

const parseMdLine = (line, existingEntities, extraStyles = {}) => {
  const inlineStyles = { ...defaultInlineStyles, ...extraStyles.inlineStyles };
  const blockStyles = { ...defaultBlockStyles, ...extraStyles.blockStyles };

  const astString = parse(line);
  let text = '';
  let data = null; // FIX for image
  const inlineStyleRanges = [];
  const entityRanges = [];
  const entityMap = existingEntities;

  const addInlineStyleRange = (offset, length, style) => {
    inlineStyleRanges.push({ offset, length, style });
  };

  const getRawLength = children =>
    children.reduce((prev, current) => {
      if (current.value) {
        return prev + splitter.splitGraphemes(current.value).length;
      } else if (current.children && current.children.length) {
        return prev + getRawLength(current.children);
      }
      return prev;
    }, 0);

  const addLink = child => {
    const entityKey = Object.keys(entityMap).length;
    entityMap[entityKey] = {
      type: 'LINK',
      mutability: 'MUTABLE',
      data: {
        url: child.url
      }
    };
    entityRanges.push({
      key: entityKey,
      length: getRawLength(child.children),
      offset: splitter.splitGraphemes(text).length
    });
  };

  const addImage = child => {
    data = {
        url: child.url,
        src: child.url,
        fileName: child.alt || ''
    };
    text = data.fileName;
    /*
    const entityKey = Object.keys(entityMap).length;
    entityMap[entityKey] = {
      type: 'IMAGE',
      mutability: 'IMMUTABLE',
      data: {
        url: child.url,
        src: child.url,
        fileName: child.alt || ''
      }
    };
    entityRanges.push({
      key: entityKey,
      length: 1,
      offset: text.length
    });
     */
  };

  const addBreak = child => {
    text = "---";
    const entityKey = Object.keys(entityMap).length;
    entityMap[entityKey] = {
      type: 'separator',
      mutability: 'IMMUTABLE',
      data: {}
    };
    entityRanges.push({
      key: entityKey,
      length: 3,
      offset: 0 //text.length
    });
  };

  const addList = child => {
    if (child.children && child.children[0] && child.children[0].checked) {
      data = {
        checked: true
      };
    }

  };

  const addVideo = child => {
    const string = child.raw;

    // RegEx: [[ embed url=<anything> ]]
    const url = string.match(/^\[\[\s(?:embed)\s(?:url=(\S+))\s\]\]/)[1];

    const entityKey = Object.keys(entityMap).length;
    entityMap[entityKey] = {
      type: 'draft-js-video-plugin-video',
      mutability: 'IMMUTABLE',
      data: {
        src: url
      }
    };
    entityRanges.push({
      key: entityKey,
      length: 1,
      offset: splitter.splitGraphemes(text).length
    });
  };

  const parseChildren = (child, style) => {
    // RegEx: [[ embed url=<anything> ]]
    const videoShortcodeRegEx = /^\[\[\s(?:embed)\s(?:url=(\S+))\s\]\]/;
    switch (child.type) {
      case 'Link':
        addLink(child);
        break;
      case 'Image':
        addImage(child);
        break;
      case 'Paragraph':
        if (videoShortcodeRegEx.test(child.raw)) {
          addVideo(child);
        }
        break;
      case 'HorizontalRule':
        addBreak(child);
        break;
      case 'List':
        addList(child);
        break;
      default:
    }

    if (!videoShortcodeRegEx.test(child.raw) && child.children && style) {
      const rawLength = getRawLength(child.children);
      addInlineStyleRange(splitter.splitGraphemes(text).length, rawLength, style.type);
      const newStyle = inlineStyles[child.type];
      child.children.forEach(grandChild => {
        parseChildren(grandChild, newStyle);
      });
    } else if (!videoShortcodeRegEx.test(child.raw) && child.children) {
      const newStyle = inlineStyles[child.type];
      child.children.forEach(grandChild => {
        parseChildren(grandChild, newStyle);
      });
    } else {
      if (style) {
        addInlineStyleRange(splitter.splitGraphemes(text).length, splitter.splitGraphemes(child.value).length, style.type);
      }
      if (inlineStyles[child.type]) {
        addInlineStyleRange(splitter.splitGraphemes(text).length, splitter.splitGraphemes(child.value).length, inlineStyles[child.type].type);
      }
      text = `${text}${
        child.type === 'Image' || videoShortcodeRegEx.test(child.raw) ? ' ' : child.value
      }`;
    }
  };

  astString.children.forEach(child => {
    const style = inlineStyles[child.type];
    parseChildren(child, style);
  });

  // add block style if it exists
  let blockStyle = 'unstyled';
  if (astString.children[0]) {
    const style = getBlockStyleForMd(astString.children[0], blockStyles);
    if (style) {
      blockStyle = style;
    }
  }

  const result = {
    text,
    inlineStyleRanges,
    entityRanges,
    blockStyle,
    entityMap
  }
  if (data) {
    result.data = data;
  }
  return result;
};

function mdToDraftjs(mdString, extraStyles) {
  const paragraphs = splitMdBlocks(mdString);
  const blocks = [];
  let entityMap = {};

  paragraphs.forEach(paragraph => {
    const result = parseMdLine(paragraph, entityMap, extraStyles);

    const block = {
      text: result.text,
      type: result.blockStyle,
      depth: 0,
      inlineStyleRanges: result.inlineStyleRanges,
      entityRanges: result.entityRanges
    };
    // FIX image. Should add a field 'data" instead of entityRanges
    if (result.data) {
      block.data = result.data;
    }

    blocks.push(block);
    entityMap = result.entityMap;
  });

  // FIX try to eliminate this
  // add a default value
  // not sure why that's needed but Draftjs convertToRaw fails without it
  //if (Object.keys(entityMap).length === 0) {
  //  entityMap = {
  //    data: '',
  //    mutability: '',
  //    type: ''
  //  };
  //}
  return {
    blocks,
    entityMap
  };
}

const GLOBAL_TYPES_FULL = {
  CODE: {type: 'codefull', regex: /```[a-zA-Z0-9-\s]*\n[\s\S]*?\n```/},
};

const splitByCodeBlock = (md) => {
  // copy string
  let markdown = (' ' + md).slice(1);
  let splitMd = [];
  const regex = GLOBAL_TYPES_FULL.CODE.regex;
  if (regex.exec(markdown) != null) {
    let match;
    while ((match = regex.exec(markdown)) != null) {
      const endMatch = match.index + match[0].length + 1; // +1 to remove new line
      const left = markdown.substr(0, match.index - 1); // -1 to remove new line
      let code = match[0];
      splitMd = splitMd.concat(left.split("\n"));
      splitMd.push(code)
      // forward and continue to loop
      markdown = markdown.substr(endMatch); // move forward
    }
    // add the end of file
    if (markdown !== '') {
      splitMd = splitMd.concat(markdown.split("\n"));
    }
  } else {
    // no code detected
    splitMd = splitMd.concat(markdown.split("\n"));
  }
  return splitMd;
};


export default mdToDraftjs;
