import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// Documentation for Metta keywords, core constructs, and standard library functions.
// Extracted from provided documentation (April 26, 2025).
// TODO: Verify types and add missing keywords/functions.
const mettaDocs: { [key: string]: string } = {
    // Core Constructs / Module System (Verify from core docs/tutorials)
    'register-module!': `\
**Description**
Registers a module for use. 
*See official docs for details.*

**Type Definition**
\`!(register-module! <module-path>)\` → \`void\` 
*(Verify type)*

**Example**
\`\`\`metta
!(register-module! path/to/module)
\`\`\`
*(Add more relevant examples)*`,
    'import!': `**Description**\nLoads a script or module into a new space and binds it to a token (usually starting with &). The first argument is the token, the second is the module name. If &self is used as the token, the imported space is inserted into &self, allowing pattern matching to delegate queries to the imported atoms.\n\n**Example**\n    (import! &people people_kb)\n    (import! &self stdlib)\n`,
    '&self': `\
**Description**
Refers to the current module context, typically used with \`import!\`.
*See official docs for details.*

**Type Definition**
\`Special Symbol\`
*(Verify type)*

**Example**
\`\`\`metta
!(import! &self module:path)
\`\`\`
*(Add more relevant examples)*`,
    'bind!': `**Description**\nRegisters a new token (usually starting with &) to be replaced with an atom during parsing. The first argument is a Symbol (the token), the second is the atom to bind. The atom can be any valid atom, not just grounded. The binding is done at parse time, not runtime, and the second argument is evaluated before binding. Returns the unit value ().\n\n**Example**\n    (bind! &hello (Hello world))\n    (bind! &space (new-space))\n`,
    'let': `\
**Description**
Use \`let\` for bindings and sequencing. Binds variables locally and evaluates the body.

**Syntax**
\`(let <var> <value> <body>)\`
\`(let <var1> <val1> (let <var2> <val2> ...))\`

**Example**
\`\`\`metta
(let $x 2 
     (+ $x 3)) ; → 5

(let $x 2 
     (let $y 3 
          (+ $x $y))) ; → 5
\`\`\`
*Note: Syntax file also lists \`let*\`.*`,
    'if': `\
**Description**
MeTTa’s conditional expression.

**Syntax**
\`(if <condition> <then> <else>)\`

**Example**
\`\`\`metta
(if (< 2 3) "yes" "no") ; → "yes"
(if (> 2 3) 42 "oops") ; → "oops"

; Nested if
(if (< 2 3) 
    (if (> 5 4) "both" "first") 
    "neither") ; → "both"
\`\`\` `,
    'case': `\
**Description**
Pattern matching with multiple cases. Evaluates the result associated with the first matching pattern.

**Syntax**
\`(case <value> ((pattern1 result1) (pattern2 result2) ...))\`

**Example**
\`\`\`metta
(case 42 
  ((42 "forty-two") 
   ($x "other"))) ; → "forty-two"

(case 5 
  ((42 "nope") 
   ($x (+ $x 1)))) ; → 6
\`\`\` `,
    'def!': `\
**Description**
Defines a function or value.
*See official docs for details.*

**Type Definition**
\`!(def! <name> <params>* <body>)\` → \`void\`
*(Verify type)*

**Example**
\`\`\`metta
!(def! double (x) (* x 2))
\`\`\`
*(Add more relevant examples)*`,
    'type!': `\
**Description**
Defines a new type.
*See official docs for details.*

**Type Definition**
\`!(type! <name> <constructors>*)\` → \`void\`
*(Verify type)*

**Example**
\`\`\`metta
!(type! Color Red Green Blue)
\`\`\`
*(Add more relevant examples)*`,
    'python!': `\
**Description**
Executes Python code.
*See official docs for details.*

**Type Definition**
\`!(python! <python-code-string>)\` → \`Any\`
*(Verify type)*

**Example**
\`\`\`metta
!(python! "print('Hello from Python')")
\`\`\`
*(Add more relevant examples)*`,
    'metta': `\
**Description**
Executes MeTTa code (often used within Python).
*See official docs for details.*

**Type Definition**
\`(metta <metta-code-string>)\` → \`Any\`
*(Verify type and usage context, e.g., within Python's metta.run)*

**Example**
\`\`\`python
# Example typically within Python code
metta.run("(metta \"(+ 1 2)\")") 
\`\`\`
*(Add more relevant examples)*`,
    'Grounded': `\
**Description**
A Grounded atom represents a value or function that is implemented outside of MeTTa (e.g., in Rust or Python). It is used to interface with external code or data.\

**Example**
\`\`\`metta
; Example: a grounded function (syntax may vary by implementation)
(= (py-add $a $b) (grounded-fn "python:add" $a $b))
\`\`\`
`,
    'Atom': `\
**Description**
An Atom is the basic building block in MeTTa. It can be a Symbol, Expression, or Grounded atom.\

**Example**
\`\`\`metta
; Symbol atom
foo
; Expression atom
(foo bar)
; Grounded atom
(grounded-value)
\`\`\`
`,
    'Expression': `\
**Description**
An Expression is an atom that contains other atoms (like a list or function call).\

**Example**
\`\`\`metta
(foo bar 42)
(+ 1 2)
\`\`\`
`,

    // Standard Library Functions (from stdlib docs)
    'eval': `\
**Description**
Evaluates a Metta expression. The first atom is treated as an operation/function, applied to the arguments.

**Type Definition**
\`(eval <expression>)\` → \`Any\`
*(Verify type)*

**Example**
\`\`\`metta
; Evaluation happens implicitly or via interpreter
(+ 1 2) ; → 3
(* 2 3) ; → 6
(+ 1 (* 2 3)) ; → 7

; Explicit eval might be used differently, check docs.
; !(eval! (+ 2 3)) // Often used with ! for execution trigger
\`\`\` `,
    'match': `\
**Description**
Queries the Atomspace. Matches a pattern against atoms in a specified space and returns a result based on the template.

**Syntax**
\`(match <atomspace> <pattern> <result-template>)\`

**Details**
- \`<atomspace>\`: Where to look (e.g., \`$space\` for current).
- \`<pattern>\`: Template with variables (e.g., \`(= (is-a $x mammal) true)\`).
- \`<result-template>\`: What to return using matched variables (e.g., \`$x\` or \`($x $y)\`).
- Returns multiple results if multiple matches found, or \`(empty)\` if none.

**Example**
\`\`\`metta
; Assuming (= (is-a cat mammal) true) and (= (is-a dog mammal) true) in $space

(match $space (= (is-a $x mammal) true) $x) 
; → cat, dog

(match $space (= (is-a $x $y) true) ($x $y))
; → (cat mammal), (dog mammal), ...

(match $space (= (is-a $x bird) true) $x)
; → (empty)
\`\`\` `,
    'new-space': `\
**Description**
Creates a new, empty Atomspace.

**Type Definition**
\`(new-space)\` → \`Atomspace\`
*(Verify type)*

**Example**
\`\`\`metta
(: my-space Atomspace)
(= my-space (new-space))
\`\`\` `,
    'get-atoms': `\
**Description**
Retrieves all atoms from a specified space.

**Type Definition**
\`(get-atoms <space>)\` → \`List[Atom]\`
*(Verify type)*

**Example**
\`\`\`metta
!(get-atoms &my-space)
\`\`\`
*(Add more relevant examples)*`,
    'add-atom': `\
**Description**
Adds an atom to the specified Atomspace.

**Syntax**
\`(add-atom <space> <atom>)\` → \`()\`

**Example**
\`\`\`metta
(add-atom my-space (= (is-a cat mammal) true))
(add-atom my-space (= (is-a dog mammal) true))
\`\`\` `,
    'remove-atom': `\
**Description**
Removes an exact atom from the specified Atomspace.

**Syntax**
\`(remove-atom <space> <atom>)\` → \`()\`
*(Verify return type - docs suggest (), syntax file suggests boolean?)*

**Example**
\`\`\`metta
(remove-atom my-space (= (is-a cat mammal) true))
\`\`\` `,
    '+': `\
**Description**
Arithmetic addition. Supports multiple arguments.

**Syntax**
\`(+ <num1> <num2> ...)\` → \`Number\`

**Example**
\`\`\`metta
(+ 2 3)       ; → 5
(+ 1 2 3)     ; → 6
\`\`\` `,
    '-': `\
**Description**
Arithmetic subtraction. Left-associative for multiple arguments.

**Syntax**
\`(- <num1> <num2> ...)\` → \`Number\`

**Example**
\`\`\`metta
(- 5 2)       ; → 3
(- 10 3 2)    ; → 5
\`\`\` `,
    '*': `\
**Description**
Arithmetic multiplication. Supports multiple arguments.

**Syntax**
\`(* <num1> <num2> ...)\` → \`Number\`

**Example**
\`\`\`metta
(* 2 3)       ; → 6
(* 2 3 4)     ; → 24
\`\`\` `,
    '/': `\
**Description**
Arithmetic division. Left-associative for multiple arguments.

**Syntax**
\`(/ <num1> <num2> ...)\` → \`Number\`

**Example**
\`\`\`metta
(/ 6 2)       ; → 3
(/ 10 2 2)    ; → 2.5
\`\`\` `,
    '=': `\
**Description**
1. Equality check (numeric or structural).
2. Used to define facts or functions/rules in the Atomspace.

**Syntax (Equality)**
\`(= <val1> <val2>)\` → \`Bool\`

**Syntax (Definition)**
\`(= <pattern> <result>)\`

**Example (Equality)**
\`\`\`metta
(= 2 2)         ; → true
(= 2 3)         ; → false
(= (1 2) (1 2)) ; → true
\`\`\`

**Example (Definition)**
\`\`\`metta
(= x 42)
(= (is-a cat mammal) true)
(= (double $x) (* 2 $x))
(= (factorial 0) 1)
(= (factorial $n) (* $n (factorial (- $n 1))))
\`\`\` `,
    '!=': `\
**Description**
Inequality check.

**Syntax**
\`(!= <val1> <val2>)\` → \`Bool\`

**Example**
\`\`\`metta
(!= 2 3)       ; → true
(!= 2 2)       ; → false
\`\`\` `,
    '<': `\
**Description**
Less than comparison.

**Syntax**
\`(< <num1> <num2>)\` → \`Bool\`

**Example**
\`\`\`metta
(< 2 3)       ; → true
(< 5 2)       ; → false
\`\`\` `,
    '>': `\
**Description**
Greater than comparison.

**Syntax**
\`(> <num1> <num2>)\` → \`Bool\`

**Example**
\`\`\`metta
(> 5 2)       ; → true
(> 2 3)       ; → false
\`\`\` `,
    // >= and <= are in syntax file but not docs provided
    '>=': `\
**Description**
Greater than or equal to comparison.
*Documentation not provided, syntax based on convention.*

**Syntax**
\`(>= <num1> <num2>)\` → \`Bool\`

**Example**
\`\`\`metta
(>= 3 2) ; → true
(>= 2 2) ; → true
(>= 1 2) ; → false
\`\`\` `,
    '<=': `\
**Description**
Less than or equal to comparison.
*Documentation not provided, syntax based on convention.*

**Syntax**
\`(<= <num1> <num2>)\` → \`Bool\`

**Example**
\`\`\`metta
(<= 2 3) ; → true
(<= 2 2) ; → true
(<= 3 2) ; → false
\`\`\` `,
    'and': `\
**Description**
Logical AND.

**Syntax**
\`(and <bool1> <bool2> ...)\` → \`Bool\`

**Example**
\`\`\`metta
(and true true)   ; → true
(and true false)  ; → false
\`\`\` `,
    'or': `\
**Description**
Logical OR.

**Syntax**
\`(or <bool1> <bool2> ...)\` → \`Bool\`

**Example**
\`\`\`metta
(or false true)   ; → true
(or false false)  ; → false
\`\`\` `,
    'not': `\
**Description**
Logical NOT.

**Syntax**
\`(not <bool>)\` → \`Bool\`

**Example**
\`\`\`metta
(not false)     ; → true
(not true)      ; → false
\`\`\` `,
    'print': `\
**Description**
The basic console output function. Takes one argument, prints its evaluated form to the console, and returns the argument unchanged.

**Syntax**
\`(print <atom>)\` → \`<atom>\`

**Example**
\`\`\`metta
(print "Hello, world!") ; Console: Hello, world! Returns: "Hello, world!"
(print 42)             ; Console: 42. Returns: 42
(print (+ 1 2))         ; Console: 3. Returns: 3
(print (list 1 2 3))    ; Console: (list 1 2 3). Returns: (list 1 2 3) (if list undefined)
\`\`\` `,
    'println!': `\
**Description**
Prints multiple arguments to the console, space-separated, followed by a newline. Returns \`()\` (unit/empty value).
*Note: Syntax file has \`println!\`, docs have \`println\`.* 

**Syntax**
\`(println <arg1> <arg2> ...)\` → \`()\`

**Example**
\`\`\`metta
(println "Sum:" (+ 2 3)) ; Console: Sum: 5. Returns: ()
(println "x =" 42)       ; Console: x = 42. Returns: ()
\`\`\` `,
    'superpose': `\
**Description**
Creates a superposition of values from an expression (often list-like), returning each element as a separate result.

**Syntax**
\`(superpose <expression>)\` → \`<result1>, <result2>, ...\`

**Example**
\`\`\`metta
(superpose (1 2 3)) ; → 1, 2, 3 (as separate results)

; With match:
; Assuming (= (is-a cat mammal) true), (= (is-a dog mammal) true)
(match $space (= (is-a $x mammal) true) (superpose ($x "is a mammal")))
; → cat, "is a mammal", dog, "is a mammal" (as separate results)
\`\`\` `,
    'collapse': `\
**Description**
Gathers multiple results (often from a superposition or match) into a single list expression.

**Syntax**
\`(collapse <multi-result-expression>)\` → \`<list-expression>\`

**Example**
\`\`\`metta
(collapse (superpose (1 2 3))) ; → (1 2 3)

; With match:
; Assuming (= (is-a cat mammal) true), (= (is-a dog mammal) true)
(collapse (match $space (= (is-a $x mammal) true) $x)) ; → (cat dog)

(println "Mammals:" (collapse (match $space (= (is-a $x mammal) true) $x)))
; Console: Mammals: (cat dog)
\`\`\` `,
    'cons': `\
**Description**
Constructs an expression by prepending a head element to a tail (which is usually an expression/list).

**Syntax**
\`(cons <head> <tail>)\` → \`<expression>\`

**Example**
\`\`\`metta
(cons 1 (2 3))   ; → (1 2 3)
(cons 1 ())      ; → (1)
\`\`\` `,
    'car': `\
**Description**
Gets the first element (head) of an expression.
*Note: Syntax file has \`car-atom\`.* 

**Syntax**
\`(car <expression>)\` → \`<atom>\`

**Example**
\`\`\`metta
(car (1 2 3))   ; → 1
\`\`\` `,
    'cdr': `\
**Description**
Gets the rest of the expression (tail) after removing the first element.
*Note: Syntax file has \`cdr-atom\`.* 

**Syntax**
\`(cdr <expression>)\` → \`<expression>\`

**Example**
\`\`\`metta
(cdr (1 2 3))   ; → (2 3)
(cdr (1))       ; → ()
\`\`\` `,
    'list': `\
**Description**
Creates a list (expression) from its arguments.

**Syntax**
\`(list <arg1> <arg2> ...)\` → \`<expression>\`

**Example**
\`\`\`metta
(list 1 2 3)   ; → (1 2 3)
(list)         ; → ()
\`\`\` `,
    'atom-type': `\
**Description**
Returns the type of an atom.

**Syntax**
\`(atom-type <atom>)\` → \`<TypeSymbol>\`

**Example**
\`\`\`metta
(atom-type 42)       ; → Number
(atom-type "hello")  ; → String
(atom-type (1 2))    ; → Expression
(atom-type +)        ; → Symbol (or Function type if defined)
\`\`\` `,
    'is-empty': `\
**Description**
Checks if an expression is empty (i.e., \`()\`).

**Syntax**
\`(is-empty <expression>)\` → \`Bool\`

**Example**
\`\`\`metta
(is-empty ())       ; → true
(is-empty (1 2))    ; → false
\`\`\` `,
    ':': `\
**Description**
Declares the type of an atom.

**Syntax**
\`(: <atom> <TypeExpression>)\`

**Example**
\`\`\`metta
(: + (Function Number Number Number))
(: 42 Number)
(: "hello" String)
(: cat Symbol)
(: (1 2 3) (List Number))
(: List (Type -> Type))
(: Number Type)
\`\`\` `,

    // Keywords from syntax file not explicitly in provided docs (add placeholders)
    '%': `**Operator**: Modulo. *Documentation not provided.*`,
    '==': `**Operator**: Equality check (likely same as \`=\`). *Documentation not provided.*`,
    'xor': `**Keyword**: Logical XOR. *Documentation not provided.*`,
    'flip': `**Keyword**: *Documentation not provided.*`,
    'empty': `**Keyword**: Represents an empty result/collection. *Documentation not provided.*`,
    'let*': `\
**Description**\
let* allows for multiple sequential variable bindings. Each binding can use variables defined in previous bindings. The first argument is a tuple of bindings, and the second is the resulting expression.\
\
**Syntax**\
\`(let* ((($a 1) ($b (+ $a 2)))) (+ $a $b))\`\
\
**Example**\
\`\`\`metta\
(let* ((($a 1) ($b (+ $a 2)))) (+ $a $b)) ; 4\
\`\`\`\
`,
    'pragma!': `**Keyword**: Pragma/directive. *Documentation not provided.*`,
    'get-type': `**Keyword**: Get type of an atom (similar to \`atom-type\`?). *Documentation not provided.*`,
    'get-metatype': `**Keyword**: Get metatype of a type. *Documentation not provided.*`,
    'trace!': `**Keyword**: Debug tracing. *Documentation not provided.*`,
    'nop': `**Keyword**: No operation. *Documentation not provided.*`,
    'new-state': `**Keyword**: State management. *Documentation not provided.*`,
    'get-state': `**Keyword**: State management. *Documentation not provided.*`,
    'change-state!': `**Keyword**: State management (side effect). *Documentation not provided.*`,
    'car-atom': `**Keyword**: Get head of atom (likely same as \`car\`). *Documentation not provided.*`,
    'cdr-atom': `**Keyword**: Get tail of atom (likely same as \`cdr\`). *Documentation not provided.*`,
    'cons-atom': `**Keyword**: Construct atom (likely same as \`cons\`). *Documentation not provided.*`,
    'assertEqual': `**Keyword**: Assertion for testing. *Documentation not provided.*`,
    'assertEqualToResult': `**Keyword**: Assertion for testing. *Documentation not provided.*`,
    'load-ascii': `**Keyword**: File loading? *Documentation not provided.*`,
    'call': `**Keyword**: Function call mechanism? *Documentation not provided.*`,
    'regex': `**Keyword**: Regular expression matching. *Documentation not provided.*`,
    'unify': `**Keyword**: Explicit unification. *Documentation not provided.*`,
    'quote': `\
**Description**\
quote is a constructor that prevents its argument from being evaluated. It is used for quoting MeTTa code or data.\
\
**Syntax**\
\`(quote <atom>)\`\
\
**Example**\
\`\`\`metta\
(quote (+ 1 2)) ; (quote (+ 1 2))\
\`\`\`\
`,
    'add-reduct': `**Keyword**: Add reduction rule? *Documentation not provided.*`,
    'decons-atom': `**Keyword**: Deconstruct atom? *Documentation not provided.*`,
    'min-atom': `**Keyword**: Minimum of atoms? *Documentation not provided.*`,
    'max-atom': `**Keyword**: Maximum of atoms? *Documentation not provided.*`,
    'size-atom': `**Keyword**: Get size of atom? *Documentation not provided.*`,
    'index-atom': `**Keyword**: Get element by index? *Documentation not provided.*`,
    // Math functions from syntax file (add placeholders)
    'pow-math': `**Math Function**: Power. *Documentation not provided.*`,
    'sqrt-math': `**Math Function**: Square root. *Documentation not provided.*`,
    'abs-math': `**Math Function**: Absolute value. *Documentation not provided.*`,
    'log-math': `**Math Function**: Logarithm. *Documentation not provided.*`,
    'trunc-math': `**Math Function**: Truncate. *Documentation not provided.*`,
    'ceil-math': `**Math Function**: Ceiling. *Documentation not provided.*`,
    'floor-math': `**Math Function**: Floor. *Documentation not provided.*`,
    'round-math': `**Math Function**: Round. *Documentation not provided.*`,
    'sin-math': `**Math Function**: Sine. *Documentation not provided.*`,
    'asin-math': `**Math Function**: Arcsine. *Documentation not provided.*`,
    'cos-math': `**Math Function**: Cosine. *Documentation not provided.*`,
    'acos-math': `**Math Function**: Arccosine. *Documentation not provided.*`,
    'tan-math': `**Math Function**: Tangent. *Documentation not provided.*`,
    'atan-math': `**Math Function**: Arctangent. *Documentation not provided.*`,
    'isnan-math': `**Math Function**: Is Not a Number check. *Documentation not provided.*`,
    'isinf-math': `**Math Function**: Is Infinity check. *Documentation not provided.*`,
    'random-int': `\
**Description**
Generates a random integer. *Documentation not provided.*

**Syntax**
\`(random-int <min> <max>)\` → \`Integer\`

**Example**
\`\`\`metta
(random-int 1 10) ; → 7
\`\`\` `,
    'random-float': `\
**Description**
Generates a random floating-point number. *Documentation not provided.*

**Syntax**
\`(random-float <min> <max>)\` → \`Float\`

**Example**
\`\`\`metta
(random-float 1.0 10.0) ; → 3.14
\`\`\` `,
    'collapse-bind': `**Keyword**: Related to collapse/superpose and binding. *Documentation not provided.*`,
    'superpose-bind': `**Keyword**: Related to collapse/superpose and binding. *Documentation not provided.*`,
    'id': `**Keyword**: Identity function? *Documentation not provided.*`

};

export function activate(context: vscode.ExtensionContext) {
    // Register hover provider with documentation
    const hoverProvider = vscode.languages.registerHoverProvider('metta', {
        provideHover(document, position, token) {
            // Use a regex that includes hyphens in word characters
            const wordRange = document.getWordRangeAtPosition(position, /[a-zA-Z0-9_\\-]+/); 
            if (!wordRange) {
                return null;
            }

            const word = document.getText(wordRange);
            // const line = document.lineAt(position.line).text; // Keep line if needed for other checks

            // Check if the identified word (potentially with hyphens) is in mettaDocs
            if (word in mettaDocs) {
                return new vscode.Hover(mettaDocs[word]);
            }

            // Keep existing checks for commands and other identifiers if needed
            // (Adjust logic if the regex approach conflicts with !() command detection)
            const commandMatch = word.match(/^!\(([^\s!]+)\)/); // Match command name inside !(...)
            if (commandMatch) {
                const commandName = commandMatch[1];
                if (commandName in mettaDocs) {
                    return new vscode.Hover(mettaDocs[commandName]);
                }
                // Consider if the base 'word' could be the command itself now
                if (word.startsWith('!(') && word.endsWith(')')) {
                     const potentialCmd = word.substring(2, word.length - 1).split(' ')[0];
                     if (potentialCmd in mettaDocs) {
                         return new vscode.Hover(mettaDocs[potentialCmd]);
                     }
                     return new vscode.Hover(`Command: ${potentialCmd}`);
                }
                // Fallback if original commandMatch logic was intended
                // return new vscode.Hover(`Command: ${commandName}`); 
            }
            
            // Handle other identifiers (this part might be less relevant now)
            // if (word.includes(':')) {
            //     return new vscode.Hover(`Module/Namespace: ${word}`);
            // } else {
            //     return new vscode.Hover(`Identifier: ${word}`);
            // }

            // If no documentation found after regex check, return null or a default message
             return null; // Or potentially return new vscode.Hover(`Identifier: ${word}`); if desired
        }
    });

    // Register import navigation with visual feedback
    const importNavigationProvider = vscode.languages.registerDefinitionProvider('metta', {
        async provideDefinition(document, position, token) {
            const line = document.lineAt(position.line).text;
            // Regex to match the full module path (e.g., hyperon-openpsi:main:feeling-updaters)
            const importRegex = /!\(import!\s+&self\s+([a-zA-Z0-9_\-:]+)/;
            let modulePath = null;
            let match = line.match(importRegex);
            if (match) {
                modulePath = match[1];
            } else {
                // fallback: try to get the word under cursor if regex fails
                const wordRange = document.getWordRangeAtPosition(position, /[a-zA-Z0-9_\-:]+/);
                if (wordRange) {
                    modulePath = document.getText(wordRange);
                }
            }
            if (!modulePath) {
                return null;
            }
            // Convert colons to slashes and append .metta
            const filePath = modulePath.replace(/:/g, path.sep) + '.metta';
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (workspaceFolders) {
                for (const folder of workspaceFolders) {
                    const absPath = path.join(folder.uri.fsPath, filePath);
                    if (fs.existsSync(absPath)) {
                        return new vscode.Location(
                            vscode.Uri.file(absPath),
                            new vscode.Position(0, 0)
                        );
                    }
                }
            }
            return null;
        }
    });

    // Register document symbol provider for better navigation
    const documentSymbolProvider = vscode.languages.registerDocumentSymbolProvider('metta', {
        provideDocumentSymbols(document, token) {
            const symbols: vscode.SymbolInformation[] = [];
            const text = document.getText();
            const lines = text.split('\n');

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (line.includes('register-module!') || line.includes('import!')) {
                    const match = line.match(/!\((?:register-module!|import!)\s+([^)]+)\)/);
                    if (match) {
                        const modulePath = match[1].trim();
                        symbols.push(new vscode.SymbolInformation(
                            modulePath,
                            vscode.SymbolKind.Module,
                            new vscode.Range(i, 0, i, line.length)
                        ));
                    }
                }
            }

            return symbols;
        }
    });

    // Register formatting provider
    const formattingProvider = vscode.languages.registerDocumentFormattingEditProvider('metta', {
        provideDocumentFormattingEdits(document, options, token) {
            const edits: vscode.TextEdit[] = [];
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
                
                edits.push(
                    vscode.TextEdit.replace(
                        line.range,
                        newIndent + trimmedText
                    )
                );

                if (text.includes('(')) {
                    currentIndent++;
                }
            }

            return edits;
        }
    });

    context.subscriptions.push(hoverProvider, importNavigationProvider, documentSymbolProvider, formattingProvider);

    // --- Decoration for import paths on Ctrl/Cmd hover ---
    const importPathDecoration = vscode.window.createTextEditorDecorationType({
        fontWeight: 'bold',
        textDecoration: 'underline wavy yellow',
        cursor: 'pointer',
    });

    let activeImportRanges = [];
    let ctrlOrCmdDown = false;

    function updateImportDecorations(editor: vscode.TextEditor) {
        if (!editor) return;
        const doc = editor.document;
        const importRanges = [];
        for (let i = 0; i < doc.lineCount; i++) {
            const line = doc.lineAt(i);
            const match = line.text.match(/!\(import!\s+&self\s+([a-zA-Z0-9_\-:]+)/);
            if (match) {
                const modulePath = match[1];
                const start = line.text.indexOf(modulePath);
                if (start !== -1) {
                    const range = new vscode.Range(i, start, i, start + modulePath.length);
                    importRanges.push(range);
                }
            }
        }
        activeImportRanges = importRanges;
        if (ctrlOrCmdDown) {
            editor.setDecorations(importPathDecoration, importRanges);
        } else {
            editor.setDecorations(importPathDecoration, []);
        }
    }

    vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor && editor.document.languageId === 'metta') {
            updateImportDecorations(editor);
        }
    }, null, context.subscriptions);

    vscode.workspace.onDidChangeTextDocument(event => {
        const editor = vscode.window.activeTextEditor;
        if (editor && event.document === editor.document && editor.document.languageId === 'metta') {
            updateImportDecorations(editor);
        }
    }, null, context.subscriptions);

    vscode.window.onDidChangeTextEditorSelection(event => {
        const editor = event.textEditor;
        if (editor.document.languageId === 'metta') {
            updateImportDecorations(editor);
        }
    }, null, context.subscriptions);

    // Listen for Ctrl/Cmd keydown/up
    vscode.window.onDidChangeTextEditorSelection(event => {
        const isMac = process.platform === 'darwin';
        const modKey = isMac ? 'metaKey' : 'ctrlKey';
        // This event doesn't provide key info, so we use global keydown/keyup listeners
    });

    // Use global keydown/keyup listeners
    // const onKey = (e: KeyboardEvent) => {
    //     const isMac = process.platform === 'darwin';
    //     const pressed = isMac ? e.metaKey : e.ctrlKey;
    //     if (pressed !== ctrlOrCmdDown) {
    //         ctrlOrCmdDown = pressed;
    //         const editor = vscode.window.activeTextEditor;
    //         if (editor && editor.document.languageId === 'metta') {
    //             updateImportDecorations(editor);
    //         }
    //     }
    // };
    // window.addEventListener('keydown', onKey, true);
    // window.addEventListener('keyup', onKey, true);
}

export function deactivate() {}