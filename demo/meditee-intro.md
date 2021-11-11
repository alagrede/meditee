# Meditee
Meditee is a minimalist Markdown editor 🔥 based on Draft.js and specifically on the awesome [medium-draft](https://bitwiser.in/medium-draft/) library.
```
const array1 = [1, 4, 9, 16];
const map1 = array1.map(x => x * 2)
console.log(map1)
```
### This page is fully editable.
1. Try to select some text to open the toolbar
2. Goto an empty line to add an image.
> A medium like rich text editor built using [draft-js](https://facebook.github.io/draft-js/) with an emphasis on eliminating mouse usage by adding relevant keyboard shortcuts.
> The keyboard **shortcuts** are **mentioned** below.
### Image Block
This is an Image block. Images can be added by going to a new empty line and then clicking the **(+)** button that appears on the left of the cursor.
![Calebe Miranda](file:///Users/alagrede/Desktop/pexels-photo-793166_zzwg3t.jpeg)

### Todo Block
- [ ] This is an uncomplete todo block. To add a `todo` block, type `[]` in a new line.
- [x] This is a completed todo block.

### Keyboard shortcuts
Following are the keyboard shortcuts to toggle block types (`Alt` and `CTRL` for Windows/Linux and `Option` and `Command` for OSX.
- Alt/Option +
- `1` - Toggle **ordered-list-item**.
- `*` - Toggle **unordered-list-item**.
- `@` - Add link to selected text.
- `#` - Toggle **header-three**.
- `<` - Toggle **caption** block.
- `>` - Toggle **unstyled** block.

### Editor level commands
3. `Command/CTRL + S` - Save current data to a local file.
4. `Command/CTRL + O` - To open an existing file.
Special characters while typing: If while typing in an empty block, if the content matches one of the following, that particular block type will be changed to the corresponding block specified below -
- `--` `(2 hyphens)` - If current block is `blockquote`, it will be changed to `block-quote-caption`, else `caption`.
- `*`. `(An asterisk and a period)` - `unordered-list-item`
- `1.` `(1 and a period)` - `ordered-list-item`.
- `##` - `header-three`
- `==` - `unstyled`
- `[]` - `todo`
- `>` - `blockquote`

### Todos
- [ ] Add **Frontmatter** support
- [ ] Add **GFM** (Table) support
- [ ] Add Mermaid integration with custom block

### Issue
- [x] Currently, the toolbar that appears when text is selected needs to be fixed regrading its position in the viewport.