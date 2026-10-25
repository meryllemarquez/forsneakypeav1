// "Our usual orders": doodles a food can wear (ordered), and who loves it.
export const FOOD_DOODLES = [
  { value: 'matcha', label: 'Matcha' },
  { value: 'cookie', label: 'Cookie' },
  { value: 'yogurt', label: 'Yogurt' },
  { value: 'fries', label: 'Fries' },
  { value: 'churro', label: 'Churro' },
  { value: 'lasagna', label: 'Lasagna' },
  { value: 'pizza', label: 'Pizza' },
  { value: 'donut', label: 'Donut' },
  { value: 'bowl', label: 'Bowl' },
  { value: 'lechon', label: 'Lechon' },
  { value: 'utensils', label: 'Utensils' },
  { value: 'burger', label: 'Burger' },
  { value: 'ramen', label: 'Ramen' },
  { value: 'milkTea', label: 'Milk tea' },
  { value: 'iceCream', label: 'Ice cream' },
  { value: 'cake', label: 'Cake' },
  { value: 'sushi', label: 'Sushi' },
  { value: 'coffee', label: 'Coffee' },
  { value: 'siomai', label: 'Siomai' },
];

export const LOVED_BY = [
  { value: 'her', label: 'Hers' },
  { value: 'him', label: 'His' },
  { value: 'both', label: 'Both of us' },
];

export const MENU_FILTERS = [{ value: 'all', label: 'All' }, ...LOVED_BY.map((o) => ({ value: o.value, label: o.label.replace(' of us', '') }))];

export const formatPrice = (pricePhp) => `₱${Number(pricePhp).toLocaleString('en-PH')}`;
