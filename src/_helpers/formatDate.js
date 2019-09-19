export function formatDate(date) {
  if (!date) return null;
  let day = date.getDate();
  let hours = date.getHours();
  let minutes = date.getMinutes();
  let seconds = date.getSeconds();

  hours = hours < 10 ? '0'+hours : hours;
  minutes = minutes < 10 ? '0'+minutes : minutes;
  seconds = seconds < 10 ? '0'+seconds : seconds;
  day = day < 10 ? '0'+day : day;
  let strTime = `${hours}:${minutes}:${seconds}`;
  let month = date.getMonth()+1;
  month = month < 10 ? '0' + month : month;

  const result = date.getFullYear() + "-" + month + "-" + day + " " + strTime

  return result;
}
