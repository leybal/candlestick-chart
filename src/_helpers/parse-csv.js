function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes*60000);
}

export function CSVToArray(strData){
  let arrData = strData.split(/\n/);
  let finalArr = [];

  arrData.pop();
  arrData.map((el, i) => {
    let tempArr = el.split(/\t/),
      date = new Date(tempArr[0]),
      localDate = addMinutes(date, -1 * date.getTimezoneOffset());

    finalArr[i] = {
      'date':  localDate,
      'open':  tempArr[1],
      'close': tempArr[2],
      'low':   tempArr[3],
      'high':  tempArr[4],
      'volume': 1,
      'dividend': "",
      'split': ""
    }

 });

  return finalArr;
}


export function CSVToTradesArray(strData){
  let arrData = strData.split(/\n/);
  let finalArr = [];

  arrData.pop();
  arrData.map((el, i) => {
    let tempArr = el.split(/\t/),
      serverDate  = new Date(tempArr[0]),
      localDate = addMinutes(serverDate, -1 * serverDate.getTimezoneOffset());

    finalArr[i] = {
      'data': localDate,
      'pair':  tempArr[1],
      'price':  tempArr[3],
      'quantity':  tempArr[4],
      'amount':  tempArr[5],
      'operation': (tempArr[6] == 1) ? 'buy': 'sell',
    }
  });

  return finalArr;
}
