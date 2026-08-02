// Parses the content of a fancy-charts code block.
// Detects simple mode (YAML config + markdown table) vs advanced mode (echarts: passthrough).
// Returns a ParseResult — success with a ChartOption, or failure with an error message.
