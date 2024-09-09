# rbxts-transformer-spoof

Last updated typescript version: `5.5.4`

## Usage

```
$spoof(string literal)
```

must be literals, e.g. `"this is a literal"`.

`tsconfig.json`

```json
{
  "compileOptions": {
    "plugins": [
      {
        "transform": "rbxts-transformer-spoof",
        "verbose": true
      }
    ]
  }
}
```
