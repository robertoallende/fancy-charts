// Registers the fancy-charts fenced code block processor via registerMarkdownCodeBlockProcessor.
// Wraps each chart in a MarkdownRenderChild so Obsidian controls the render lifecycle.
// Calls parser → renderer pipeline; renders an error panel on parse failure.
