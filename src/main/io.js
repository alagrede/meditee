import { dialog } from 'electron';
const fs = require('fs');

export const readFile = (filename) => {
    return fs.readFileSync(String(filename), 'utf8')
}

export const saveFile = (filename, value) => {
  let finalFilename = filename;
  try {
    if (finalFilename === null) {
      finalFilename = dialog.showSaveDialogSync({defaultPath: "myNote.md"});
      if (finalFilename === null || finalFilename === undefined) {
        return null;
      }
    }

    fs.writeFileSync(finalFilename, value);
    return finalFilename;
  } catch (err) {
    console.log(err);
    return null;
  }

};

export const openDialog = () => {
    const filename = dialog.showOpenDialogSync({ properties: ['openFile'],
      filters: [
        { name: 'Text', extensions: ['md', 'txt'] },
        { name: 'All Files', extensions: ['*'] }
      ],
    });
    if (filename && filename.length > 0) {
      try {
        const value = readFile(String(filename));
        return {filename: filename[0], value: value};
      } catch (err) {
        //showError(err, filename);
      }
    } else {
      console.log('No file selected');
      return;
    }
};

