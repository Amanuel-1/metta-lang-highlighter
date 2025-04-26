# metta-extensin-pack README

## Special Token Highlighting

To make special tokens like `&self`, `&space`, etc. stand out with a custom color and bold font in VS Code, add the following to your `settings.json`:

```
"editor.tokenColorCustomizations": {
  "textMateRules": [
    {
      "scope": "constant.language.special-token.metta",
      "settings": {
        "foreground": "#FF00FF",
        "fontStyle": "bold"
      }
    },
    {
      "scope": "variable.other.constant.metta",
      "settings": {
        "foreground": "#FF8800",
        "fontStyle": "bold"
      }
    }
  ]
}
```

You can change the colors as you like. VS Code does not support "extrabold" font weight, but "bold" is the strongest available.

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
