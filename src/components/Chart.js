import React from "react";
import PropTypes from "prop-types";

import { format } from "d3-format";
import { timeFormat } from "d3-time-format";

import { ChartCanvas, Chart } from "react-stockcharts";
import { CandlestickSeries } from "react-stockcharts/lib/series";
import { XAxis, YAxis } from "react-stockcharts/lib/axes";
import {
  CrossHairCursor,
  EdgeIndicator,
  CurrentCoordinate,
  MouseCoordinateX,
  MouseCoordinateY
} from "react-stockcharts/lib/coordinates";

import { ema, sma, macd } from "react-stockcharts/lib/indicator";
import { fitWidth } from "react-stockcharts/lib/helper";
import { Brush } from "react-stockcharts/lib/interactive";
import { last, isDefined } from "react-stockcharts/lib/utils";

import { discontinuousTimeScaleProviderBuilder } from "react-stockcharts/lib/scale";

import {
  saveInteractiveNode,
  formatDate
} from "../_helpers/";

const ema26 = ema()
  .id(0)
  .options({
    windowSize: 26,
  })
  .merge((d, c) => { d.ema26 = c; })
  .accessor(d => d.ema26);

const ema12 = ema()
  .id(1)
  .options({
    windowSize: 12,
  })
  .merge((d, c) => { d.ema12 = c; })
  .accessor(d => d.ema12);

const macdCalculator = macd()
  .options({
    fast: 12,
    slow: 26,
    signal: 9,
  })
  .merge((d, c) => { d.macd = c; })
  .accessor(d => d.macd);

const smaVolume50 = sma()
  .id(3)
  .options({
    windowSize: 10,
    sourcePath: "volume",
  })
  .merge((d, c) => { d.smaVolume50 = c; })
  .accessor(d => d.smaVolume50);

const BRUSH_TYPE = "2D"; // Valid values = "2D", "1D"

function getMaxUndefined(calculators) {
  return calculators.map(each => each.undefinedLength()).reduce((a, b) => Math.max(a, b));
}


const LENGTH_TO_SHOW = 100;

class CandlestickChart extends React.Component {
  constructor(props) {
    super(props);
    const { data: inputData, timeStep } = props;
    this.handleBrush1 = this.handleBrush1.bind(this);
    this.saveInteractiveNode = saveInteractiveNode.bind(this);

    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleDownloadMore = this.handleDownloadMore.bind(this);

    let canvas = React.createRef();

    const ema26 = ema()
      .id(0)
      .options({ windowSize: 26 })
      .merge((d, c) => {d.ema26 = c;})
      .accessor(d => d.ema26);

    const ema12 = ema()
      .id(1)
      .options({ windowSize: 12 })
      .merge((d, c) => {d.ema12 = c;})
      .accessor(d => d.ema12);

    const macdCalculator = macd()
      .options({
        fast: 12,
        slow: 26,
        signal: 9,
      })
      .merge((d, c) => {d.macd = c;})
      .accessor(d => d.macd);

    const smaVolume50 = sma()
      .id(3)
      .options({
        windowSize: 50,
        sourcePath: "volume",
      })
      .merge((d, c) => {d.smaVolume50 = c;})
      .accessor(d => d.smaVolume50);

    const maxWindowSize = getMaxUndefined([ema26,
      ema12,
      macdCalculator,
      smaVolume50
    ]);
    /* SERVER - START */
    const dataToCalculate = inputData.slice(-LENGTH_TO_SHOW * 2);

    const calculatedData = ema26(ema12(macdCalculator(smaVolume50(dataToCalculate))));
    const indexCalculator = discontinuousTimeScaleProviderBuilder().indexCalculator();

    const { index } = indexCalculator(calculatedData);
    /* SERVER - END */

    const xScaleProvider = discontinuousTimeScaleProviderBuilder()
      .withIndex(index);
    const { data: linearData, xScale, xAccessor, displayXAccessor } = xScaleProvider(inputData);


    this.state = {
      ema26,
      ema12,
      macdCalculator,
      smaVolume50,
      linearData,
      data: linearData,
      xScale, xAccessor, displayXAccessor,
      brushEnabled: false,
      showDate: false,
      startDate: '',
      endDate: '',
      holding: false,
      xOld: 0,
      hourlyChanged: false,
      moved: false
    };

  }

  saveCanvasNode(node) {
    this.canvasNode = node;
  }

  handleBrush1(brushCoords, moreProps) {
    const { start, end } = brushCoords;
    const left = Math.min(start.xValue, end.xValue);
    const right = Math.max(start.xValue, end.xValue);

    const low = Math.min(start.yValue, end.yValue);
    const high = Math.max(start.yValue, end.yValue);

    // uncomment the line below to make the brush to zoom
    // xExtents: [left, right],
    // yExtents1: BRUSH_TYPE === "2D" ? [low, high] : this.state.yExtents1,
    this.setState({
      ...this.state,
      brushEnabled: false,
      startDate: start.item.date,
      endDate: end.item.date,
      showDate: true
    });
  }

  switchBrush = (boolVal) => {
    if (boolVal) {
      this.setState({
        ...this.state,
        brushEnabled: boolVal,
      });
    } else {
      this.setState({
        ...this.state,
        brushEnabled: boolVal,
        showDate: false
      });
    }
  };

  handleMouseDown(event) {
    this.setState({
      ...this.state,
      holding: true
    });
  };

  handleMouseMove(event) {
    if (this.state.holding === true) {
      this.setState({
        ...this.state,
        showDate: false,
        holding: 'moving',
        startDate: null,
        endDate: null,
        xOld: event.clientX
      });
    }

    if (this.state.holding === 'moving') {
      this.setState({
        ...this.state,
        moved: true
      })
    }
  };

  handleMouseUp(event) {
    this.setState({
      ...this.state,
      holding: false
    });
  };

  reset = () => {
    this.forceUpdate()
  };


  handleDownloadMore(start, end, rows) {
    if (Math.ceil(start) === end) return;

    let rowsToDownload = end - Math.ceil(start);
    if (rows) rowsToDownload = rows;

    // console.log("rows to download", rowsToDownload, start, end);
    const { data: prevData, ema26, ema12, macdCalculator, smaVolume50 } = this.state;
    const { data: inputData } = this.props;

    this.props.updateDate(rowsToDownload);

    if (inputData.length === prevData.length) return;


    const maxWindowSize = getMaxUndefined([ema26,
      ema12,
      macdCalculator,
      smaVolume50
    ]);

    /* SERVER - START */
    const dataToCalculate = inputData
      .slice(-rowsToDownload - maxWindowSize - prevData.length, - prevData.length);

    const calculatedData = ema26(ema12(macdCalculator(smaVolume50(dataToCalculate))));
    const indexCalculator = discontinuousTimeScaleProviderBuilder()
      .initialIndex(Math.ceil(start))
      .indexCalculator();
    const { index } = indexCalculator(
      calculatedData
        .slice(-rowsToDownload)
        .concat(prevData));
    /* SERVER - END */

    const xScaleProvider = discontinuousTimeScaleProviderBuilder()
      .initialIndex(Math.ceil(start))
      .withIndex(index);

    const { data: linearData, xScale, xAccessor, displayXAccessor } = xScaleProvider(calculatedData.slice(-rowsToDownload).concat(prevData));

    this.setState({
      data: linearData,
      xScale,
      xAccessor,
      displayXAccessor,
    });
  }


  render() {
    const { type, width, ratio } = this.props;
    let { data, xScale, xAccessor, displayXAccessor, brushEnabled } = this.state;

    const yExtents1 = isDefined(this.state.yExtents1)
      ? this.state.yExtents1
      : [d => [d.high, d.low], ema26.accessor(), ema12.accessor()];

    let dataNew = [];
    if (data[data.length - 1]['idx']['index'] < 0 && this.props.timeStep === 'candles_daily') {
      dataNew = data.map((val, i, arr) => {
        val['idx']['index'] = i;
        return val
      });

      data = dataNew;
    } else if (data[0]['idx']['index'] < -200 && data[0]['idx']['index'] > -299
      && this.state.hourlyChanged === false && this.props.timeStep === 'candles_hourly') {
      dataNew = data.map((val, i, arr) => {
        // val['idx']['index'] = val['idx']['index'] + LENGTH_TO_SHOW + 25;
        val['idx']['index'] = val['idx']['index'] + LENGTH_TO_SHOW - 3;
        return val
      });

      data = dataNew;
      this.setState({
        ...this.state,
        hourlyChanged: true
      })
    }

    let start = null,
      end = null,
      xExtents = null;
    if (!this.state.moved) {
      start = xAccessor(last(data));
      end = xAccessor(data[Math.max(0, data.length - LENGTH_TO_SHOW )]);
      xExtents = [start, end];
    }


    return (
      <div>
        <section
          onMouseDown = {(e) => this.handleMouseDown(e.nativeEvent)}
          onMouseMove = {(e) => this.handleMouseMove(e.nativeEvent)}
          onMouseUp = {(e) => this.handleMouseUp(e.nativeEvent)}
        >

        {this.state.moved ? (
          <ChartCanvas
            height={500}
            width={width}
            ratio={ratio}
            margin={{ left: 70, right: 70, top: 20, bottom: 0 }}
            type={type}
            seriesName="MSFT"
            data={data}
            xScale={xScale}
            xAccessor={xAccessor}
            displayXAccessor={displayXAccessor}
            zoomEvent={false}
            panEvent={true}
            onLoadMore={this.handleDownloadMore}
          >
            <Chart id={1} height={400}
                   yPanEnabled={isDefined(this.state.yExtents1)}
                   yExtents={yExtents1}
                   padding={{ top: 10, bottom: 0 }}
            >

              <XAxis axisAt="bottom" orient="bottom"/>
              <YAxis axisAt="right" orient="right" ticks={8} />
              <MouseCoordinateX
                at="bottom"
                orient="bottom"
                displayFormat={timeFormat("%Y-%m-%d %H:%M")} />

              <MouseCoordinateY
                at="right"
                orient="right"
                displayFormat={format(".8f")} />

              <CandlestickSeries />

              <CurrentCoordinate yAccessor={ema26.accessor()} fill={ema26.stroke()} />
              <CurrentCoordinate yAccessor={ema12.accessor()} fill={ema12.stroke()} />

              <EdgeIndicator
                itemType="last"
                orient="right"
                edgeAt="right"
                yAccessor={d => d.close}
                fill={d => d.close > d.open ? "#6BA583" : "#FF0000"}
                displayFormat={format(".8f")}/>

              { brushEnabled &&
              <Brush
                ref={this.saveInteractiveNode(1)}
                enabled={brushEnabled}
                type={BRUSH_TYPE}
                onBrush={this.handleBrush1}/>
              }
            </Chart>
            <CrossHairCursor/>
          </ChartCanvas> ) : (
          <ChartCanvas
            height={500}
            width={width}
            ratio={ratio}
            margin={{ left: 70, right: 70, top: 20, bottom: 0 }}
            type={type}
            seriesName="MSFT"
            data={data}
            xScale={xScale}
            xAccessor={xAccessor}
            displayXAccessor={displayXAccessor}
            zoomEvent={false}
            panEvent={true}
            xExtents={xExtents}
          >
            <Chart id={1} height={400}
                   yPanEnabled={isDefined(this.state.yExtents1)}
                   yExtents={yExtents1}
                   padding={{ top: 10, bottom: 0 }}
            >

              <XAxis axisAt="bottom" orient="bottom"/>
              <YAxis axisAt="right" orient="right" ticks={8} />
              <MouseCoordinateX
                at="bottom"
                orient="bottom"
                displayFormat={timeFormat("%Y-%m-%d %H:%M")} />

              <MouseCoordinateY
                at="right"
                orient="right"
                displayFormat={format(".8f")} />

              <CandlestickSeries />

              <CurrentCoordinate yAccessor={ema26.accessor()} fill={ema26.stroke()} />
              <CurrentCoordinate yAccessor={ema12.accessor()} fill={ema12.stroke()} />

              <EdgeIndicator
                itemType="last"
                orient="right"
                edgeAt="right"
                yAccessor={d => d.close}
                fill={d => d.close > d.open ? "#6BA583" : "#FF0000"}
                displayFormat={format(".8f")}/>

              { brushEnabled &&
              <Brush
                ref={this.saveInteractiveNode(1)}
                enabled={brushEnabled}
                type={BRUSH_TYPE}
                onBrush={this.handleBrush1}/>
              }
            </Chart>
            <CrossHairCursor />
          </ChartCanvas>)
        }

        </section>

        <div>
          <button className={"btn " + (!this.state.brushEnabled ? 'active' : '')} type="button" onClick={() => this.switchBrush(false)}>View mode</button>
          <button className={"btn " + (this.state.brushEnabled ? 'active' : '')} onClick={() => this.switchBrush(true)}>Select mode</button>
        </div>

        {this.state.showDate && this.state.startDate && <p>Left: {formatDate(this.state.startDate)} Right: {formatDate(this.state.endDate)}</p>}

      </div>

    );
  }
}

CandlestickChart.propTypes = {
  data: PropTypes.array.isRequired,
  width: PropTypes.number.isRequired,
  ratio: PropTypes.number.isRequired,
  type: PropTypes.oneOf(["svg", "hybrid"]).isRequired,
};

CandlestickChart.defaultProps = {
  type: "svg"
};

const CandleStickChartWithBrush = fitWidth(CandlestickChart);

export default CandleStickChartWithBrush;
