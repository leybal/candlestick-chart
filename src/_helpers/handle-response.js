export function handleResponse(response) {
  return response.text().then(text => {
    const data = text;

    if (!data || data === 'No records') {
      const error = 'Response Error';
      return Promise.reject(error);
    }

    let arrData = data.split(/\n/);

    return arrData;
  });
}
