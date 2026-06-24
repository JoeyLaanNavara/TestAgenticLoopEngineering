# ds-card



<!-- Auto Generated Below -->


## Properties

| Property     | Attribute    | Description                                                                                                                    | Type                                    | Default     |
| ------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------- | ----------- |
| `clickable`  | `clickable`  | When true the card receives hover/focus styles and emits `dsCardClick`. Sets `role="button"` and `tabindex="0"` automatically. | `boolean`                               | `false`     |
| `disabled`   | `disabled`   | Disables the card — suppresses interaction and dims the surface                                                                | `boolean`                               | `false`     |
| `heading`    | `heading`    | The card heading text. Use the named `header` slot for richer markup.                                                          | `string`                                | `''`        |
| `padding`    | `padding`    | Controls internal padding. Use `none` when the card contains full-bleed media.                                                 | `"lg" \| "md" \| "none" \| "sm"`        | `'md'`      |
| `subheading` | `subheading` | Secondary text displayed below the heading                                                                                     | `string`                                | `''`        |
| `variant`    | `variant`    | Visual variant controlling border and shadow treatment                                                                         | `"default" \| "elevated" \| "outlined"` | `'default'` |


## Events

| Event         | Description                                                                | Type                |
| ------------- | -------------------------------------------------------------------------- | ------------------- |
| `dsCardClick` | Emitted when a clickable card is activated (click or Enter/Space keypress) | `CustomEvent<void>` |


## CSS Custom Properties

| Name                         | Description                                           |
| ---------------------------- | ----------------------------------------------------- |
| `--ds-card-bg`               | Card surface background color                         |
| `--ds-card-border-color`     | Border color (used in `outlined` variant and default) |
| `--ds-card-divider-color`    | Color of internal dividers (header/footer borders)    |
| `--ds-card-heading-color`    | Color of the heading text                             |
| `--ds-card-padding`          | Internal padding (overridden by the `padding` prop)   |
| `--ds-card-radius`           | Corner border radius                                  |
| `--ds-card-shadow`           | Resting box shadow                                    |
| `--ds-card-shadow-hover`     | Box shadow applied on hover for clickable cards       |
| `--ds-card-subheading-color` | Color of the subheading / body text                   |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
