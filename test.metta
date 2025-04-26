; Test file for Metta language support

!(register-module! ../../../../hyperon-openpsi)
!(register-module! ../../../utilities-module)

!(import! &self hyperon-openpsi:main:rules:rule)
!(import! &self hyperon-openpsi:main:types)
!(import! &self utilities-module:utils)

; Test hover functionality
!(test-function! arg1 arg2)
!(another-command! with:some:namespace)

; Test formatting
!(format-test!
    (nested
        (function
            (call
                (with
                    (parameters)))))) 