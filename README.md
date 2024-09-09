# rbxts-transformer-spoof

Last updated typescript version: `5.5.4`

## Usage

```
$spoof(string literal, numeric literal)
```

Both of them must be literals, e.g. `"this is a literal"`, `665`.

`tsconfig.json`

```json
{
    compileOptions: {
        ...,
        plugins: [
            ...,
            {
                transform: "rbxts-transformer-spoof"
            }
        ]
    }
}
```
