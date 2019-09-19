import { CSVToArray, CSVToTradesArray } from './parse-csv'

export function handleResponseCsv(response, requestFor='') {
  return response.text().then(text => {
    if (text === 'No records') {
      return Promise.reject('No records');
    }

    let data = [];
    if (requestFor === 'allTrades') {
      data = text && CSVToTradesArray(text);
    } else {
      data = text && CSVToArray(text);
    }

    if (!data) {
      const error = 'Response Error';
      return Promise.reject(error);
    }

    return data;
  });
}
