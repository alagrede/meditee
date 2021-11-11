import React from 'react';
import {
  ImageSideButton,
  Block,
  addNewBlock,
} from 'medium-draft';
import 'isomorphic-fetch';

export class CustomImageSideButton extends ImageSideButton {

  /*
  We will only check for first file and also whether
  it is an image or not.
  */
  onChange(e) {
    const file = e.target.files[0];
    //console.log("FILE: " + file);
    if (file.type.indexOf('image/') === 0) {

      /*
      const fileReader = new FileReader();
      const that = this;
      fileReader.onload = function(fileLoadedEvent) {
        const srcData = fileLoadedEvent.target.result; // <--- data: base64
        that.props.setEditorState(addNewBlock(
          that.props.getEditorState(),
          Block.IMAGE, {
            src: srcData
          }
        ));
      }
      fileReader.readAsDataURL(file);
       */


      const finalUrl = file.path.startsWith("http") ? file.path : "file://" + file.path;
      this.props.setEditorState(addNewBlock(
        this.props.getEditorState(),
        Block.IMAGE, {
          src: finalUrl
        }
      ));

    }
    this.props.close();
  }

}
