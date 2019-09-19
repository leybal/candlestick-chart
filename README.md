## Candlestick charts (React + Node.js)
###There ware two files changed in ChartStock module
####lib/interactive/Brush.js
// mouseY = _moreProps$mouseXY[1],
mouseY = 0,

// mouseY = _moreProps$mouseXY2[1],
mouseY = 1000,

####ChartCanvas.js
IN key: "handlePanEnd"
// var start = head(xScale.domain());
var start = head(xScale.domain()) - 200;
