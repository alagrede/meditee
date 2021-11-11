import React from 'react';

import {
  Block,
  addNewBlock,
} from 'medium-draft';

export default class CodeSideButton extends React.Component {
  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
  }

  onClick() {
    this.props.setEditorState(addNewBlock(
      this.props.getEditorState(),
      Block.CODE
    ));
  }

  render() {
    return (
      <button className="md-sb-button md-sb-img-button" onClick={this.onClick} type="button">
        <i className="fa fa-code" />
      </button>
    );
  }
}
