import { handleResponseCsv, formatDate } from './../_helpers';
import { baseURL, additionalURL } from './../_config';

export const tradesService = {
  getTrades
};

export function getTrades(startDate = '2019-06-01 00:00:00', finalDate = formatDate(new Date()), symbol = 'ADABTC', inquiry = 'candles_daily') {
  const requestOptions = {method: 'GET'};
  symbol = (symbol === 'All') ? 'ADABTC' : symbol;

  if (inquiry === 'minutes') {
    const promiseMSFT =
      fetch(`${additionalURL}clickhouse/?query=select toStartOfMinute(ServerDate) as Minute, argMin(Price, ServerDate) as Open, argMax(Price, ServerDate) as Close, min(Price) as Low, max(Price) as High from all_trades WHERE Symbol='${symbol}' and ServerDate>='${startDate}' and ServerDate<='${finalDate}' Group By Minute Order By Minute`, requestOptions)
      .then(handleResponseCsv);
    return promiseMSFT;
  }

  const promiseMSFT = fetch(`${baseURL}data/?inquiry=${inquiry}&symbol=${symbol}&From=${startDate}&To=${finalDate}`, requestOptions)
    .then(handleResponseCsv);
  return promiseMSFT;
}