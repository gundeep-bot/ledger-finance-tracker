export const CURRENCIES = [
  { code: 'USD', label: 'US Dollar', symbol: '$' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'GBP', label: 'British Pound', symbol: '£' },
  { code: 'INR', label: 'Indian Rupee', symbol: '₹' },
  { code: 'JPY', label: 'Japanese Yen', symbol: '¥' },
  { code: 'AUD', label: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', label: 'Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', label: 'Swiss Franc', symbol: 'Fr' },
  { code: 'CNY', label: 'Chinese Yuan', symbol: '¥' },
  { code: 'BTC', label: 'Bitcoin', symbol: '₿' },
  { code: 'ETH', label: 'Ethereum', symbol: 'Ξ' },
  { code: 'USDT', label: 'Tether', symbol: '₮' },
];

export function symbolFor(code) {
  return CURRENCIES.find((c) => c.code === code)?.symbol || '$';
}
