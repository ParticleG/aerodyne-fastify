const INTRANET_PATTERN = new RegExp(
  '^((localhost)|(127\\.0\\.0\\.1)|' + // localhost
    '(\\d|10)(\\.((2(5[0-5]|[0-4]\\d))|[0-1]?\\d{1,2})){3}|' + // Class A address
    '(172\\.)(1[6-9]|2\\d|3[01])(\\.((2(5[0-5]|[0-4]\\d))|[0-1]?\\d{1,2})){2}|' + // Class B address
    '(192\\.168)(\\.((2(5[0-5]|[0-4]\\d))|[0-1]?\\d{1,2})){2})$' // Class C address
);

const EXTRANET_PATTERN = new RegExp(
  '^((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))$' // OR IPv4 address
);

export function isIntranet(host: string): boolean {
  return INTRANET_PATTERN.test(host);
}

export function isExtranet(host: string): boolean {
  return EXTRANET_PATTERN.test(host);
}
