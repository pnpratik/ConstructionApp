const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen',
  'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
];
const tensArr = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigits(n) {
  if (n < 20) return ones[n];
  return tensArr[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
}

function threeDigits(n) {
  if (n >= 100) {
    const h = Math.floor(n / 100);
    const rem = n % 100;
    return ones[h] + ' Hundred' + (rem ? ' ' + twoDigits(rem) : '');
  }
  return twoDigits(n);
}

function numberToWords(n) {
  if (!n || n === 0) return 'Zero';
  n = Math.floor(n);
  const parts = [];
  const crore    = Math.floor(n / 10000000); n %= 10000000;
  const lakh     = Math.floor(n / 100000);   n %= 100000;
  const thousand = Math.floor(n / 1000);     n %= 1000;
  if (crore)    parts.push(threeDigits(crore)    + ' Crore');
  if (lakh)     parts.push(twoDigits(lakh)       + ' Lakh');
  if (thousand) parts.push(twoDigits(thousand)   + ' Thousand');
  if (n)        parts.push(threeDigits(n));
  return parts.join(' ');
}

export function amountInWords(amount) {
  const num   = Math.floor(amount);
  const paise = Math.round((amount - num) * 100);
  let result  = 'Rupees ' + numberToWords(num);
  if (paise)  result += ' and ' + numberToWords(paise) + ' Paise';
  return result + ' Only';
}
