"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
function activate(context) {
    // Register hover provider
    const hoverProvider = vscode.languages.registerHoverProvider('metta', {
        provideHover(document, position, token) {
            const wordRange = document.getWordRangeAtPosition(position);
            if (!wordRange) {
                return null;
            }
            const word = document.getText(wordRange);
            // Add hover information for different types of identifiers
            if (word.startsWith('!')) {
                return new vscode.Hover(`Command: ${word}`);
            }
            else if (word.includes(':')) {
                return new vscode.Hover(`Module/Namespace: ${word}`);
            }
            else {
                return new vscode.Hover(`Identifier: ${word}`);
            }
        }
    });
    // Register import navigation
    const importNavigationProvider = vscode.languages.registerDefinitionProvider('metta', {
        async provideDefinition(document, position, token) {
            const wordRange = document.getWordRangeAtPosition(position);
            if (!wordRange) {
                return null;
            }
            const word = document.getText(wordRange);
            const line = document.lineAt(position.line).text;
            // Handle import paths
            if (line.includes('register-module!') || line.includes('import!')) {
                const importPath = word.replace(/[&self:]/g, '');
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (workspaceFolders) {
                    for (const folder of workspaceFolders) {
                        const possiblePath = path.join(folder.uri.fsPath, importPath);
                        if (fs.existsSync(possiblePath)) {
                            return new vscode.Location(vscode.Uri.file(possiblePath), new vscode.Position(0, 0));
                        }
                    }
                }
            }
            return null;
        }
    });
    // Register formatting provider
    const formattingProvider = vscode.languages.registerDocumentFormattingEditProvider('metta', {
        provideDocumentFormattingEdits(document, options, token) {
            const edits = [];
            const indentSize = options.tabSize || 4;
            let currentIndent = 0;
            for (let i = 0; i < document.lineCount; i++) {
                const line = document.lineAt(i);
                const text = line.text;
                // Skip empty lines
                if (text.trim() === '') {
                    continue;
                }
                // Handle indentation
                if (text.includes(')')) {
                    currentIndent = Math.max(0, currentIndent - 1);
                }
                const newIndent = ' '.repeat(currentIndent * indentSize);
                const trimmedText = text.trim();
                edits.push(vscode.TextEdit.replace(line.range, newIndent + trimmedText));
                if (text.includes('(')) {
                    currentIndent++;
                }
            }
            return edits;
        }
    });
    context.subscriptions.push(hoverProvider, importNavigationProvider, formattingProvider);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map