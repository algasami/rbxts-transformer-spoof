# rbxts-transformer-spoof

Last updated typescript version: `5.5.4`

## Usage

```
$spoof(string literal)
$uuid() = returns uuid at compile time
```

If an enum ends with `_spoof` and `spoof_enum` in the config is true, then the enum will be spoofed with uuid.

must be literals, e.g. `"this is a literal"`.

`tsconfig.json`

```json
{
  "compileOptions": {
    "plugins": [
      {
        "transform": "rbxts-transformer-spoof",
        "verbose": true,
        "spoof_enum": true
      }
    ]
  }
}
```
