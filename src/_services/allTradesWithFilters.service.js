import { handleResponseCsv, formatDate } from './../_helpers';
import { additionalURL } from './../_config';

export const allTradesWithFiltersService = {
  getAllTradesWithFilters
};

export function getAllTradesWithFilters(startDate = '2019-06-01 00:00:00', finalDate = formatDate(new Date()),
                                        btcPrice = 1, amount = 1) {

  const requestOptions = {method: 'GET'};
  let url = `${additionalURL}clickhouse/?query=SELECT * FROM (SELECT * FROM all_trades WHERE ServerDate >= '${startDate}' and ServerDate <= '${finalDate}' and ((Symbol like '%USDT' and Amount>=toDecimal64(${btcPrice * amount},8)) OR (Symbol like '%BTC' and Amount>=${amount})) ORDER BY ServerDate DESC LIMIT 100) ORDER BY ServerDate Asc`;
  // url = url.replace(/\n|\r/g, "");

  const promiseMSFT = fetch(url, requestOptions)
    .then(text => handleResponseCsv(text, 'allTrades'));

  return promiseMSFT;
}
