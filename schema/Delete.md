---
title: Delete
authors: []
---

include: ../public/Delete.schema.md
:::
Content that is marked for deletion

## Properties

| **content _(required)_** | `array`  | The content that is marked.                    | [Mark](./Mark.html)     |
| ------------------------ | -------- | ---------------------------------------------- | ----------------------- |
| **type _(required)_**    | `string` | The name of the type and all descendant types. | [Entity](./Entity.html) |
| id                       | `string` | The identifier for this item.                  | [Entity](./Entity.html) |
| meta                     | `object` | Metadata associated with this item.            | [Entity](./Entity.html) |

:::

# Examples

To illustrate how `Delete` nodes are encoded in alternative formats, we'll use the following example, in context, within a `Paragraph`:

```json import=ex1
{
  "type": "Paragraph",
  "content": [
    "The following is ",
    {
      "type": "Delete",
      "content": ["marked for deletion"]
    },
    "."
  ]
}
```

# Encodings

include: ../docs/type-encodings-intro.md
:::
This section describes common encodings for this node type. These samples are generated from the above examples by [Encoda](https://stencila.github.io/encoda), but you can also author them in each format.
:::

## Markdown

Most Markdown parsers support the use of tildes (`~`) to mark content for deletion. For example, MDAST also has a [`Delete`](https://github.com/syntax-tree/mdast#delete) node type, which renders the above example like this:

```md export=ex1
The following is ~~marked for deletion~~.
```

## HTML

HTML natively supports `Delete` nodes with the [`<del>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/del) element.

```html export=ex1
<p>The following is <del>marked for deletion</del>.</p>
```

## JATS

In JATS, `Delete` nodes are encoded as [`<strike>`](https://jats.nlm.nih.gov/archiving/tag-library/1.2/element/strike.html) elements.

```xml export=ex1 to=jats
<p>The following is <strike>marked for deletion</strike>.</p>

```

## Microsoft Word

`Delete` nodes are supported in Microsoft Word files. This [`docx`](delete-ex1.out.docx){export=ex1} file was generated from the above example.

## Open Document Text

`Delete` nodes are supported in Open Document Text files. This [`odt`](delete-ex1.out.odt){export=ex1} file was generated from the above example.

## Pandoc

The equivalent of `Delete` in Pandoc is the [`Strikeout`](https://github.com/jgm/pandoc-types/blob/1.17.5.4/Text/Pandoc/Definition.hs#L258) element. The above example in Pandoc JSON:

```json export=ex1 to=pandoc
{
  "blocks": [
    {
      "t": "Para",
      "c": [
        {
          "t": "Str",
          "c": "The following is "
        },
        {
          "t": "Strikeout",
          "c": [
            {
              "t": "Str",
              "c": "marked for deletion"
            }
          ]
        },
        {
          "t": "Str",
          "c": "."
        }
      ]
    }
  ],
  "pandoc-api-version": [1, 17, 5, 4],
  "meta": {}
}
```
