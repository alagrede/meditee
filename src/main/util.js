/* eslint import/prefer-default-export: off, import/no-mutable-exports: off */
import { URL } from 'url';
import path from 'path';
import { dialog, shell } from "electron";
import os from "os";
import fs from "fs";
//const os = require("os");
//const fs = require("fs");


export let resolveHtmlPath;

if (process.env.NODE_ENV === 'development') {
  const port = process.env.PORT || 1212;
  resolveHtmlPath = (htmlFileName) => {
    const url = new URL(`http://localhost:${port}`);
    url.pathname = htmlFileName;
    return url.href;
  };
} else {
  resolveHtmlPath = (htmlFileName) => {
    return `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}`;
  };
}

export const confirm = () => {
  let options  = {
    buttons: ["Yes","No","Cancel"],
    message: "Do you really want to quit?"
  }
  return dialog.showMessageBoxSync(options)
};

export const printHTML = (content) => {
  const htmlPath = path.join(os.tmpdir(), 'print.html');
  try {
    fs.writeFileSync(htmlPath, content);
    shell.openPath(htmlPath)
  } catch (e) {
    return;
  }
};
