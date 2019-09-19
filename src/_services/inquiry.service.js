import { handleResponse } from './../_helpers';
import { baseURL } from './../_config';

export const inquiryService = {
  getDataFromInquiry
};

export function getDataFromInquiry(inquiryVal) {
  const requestOptions = {method: 'GET'};
  const promiseMSFT = fetch(`${baseURL}data/?inquiry=${inquiryVal}`, requestOptions)
    .then(handleResponse);
  return promiseMSFT;
}
