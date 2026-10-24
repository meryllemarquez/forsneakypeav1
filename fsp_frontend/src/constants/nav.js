// Primary destinations, shared by the top nav pill, the phone tab bar and the footer.
export const NAV_ITEMS = [
  { path: '/home', label: 'Home', icon: 'house' },
  { path: '/memories', label: 'Memories', icon: 'camera' },
  { path: '/dates', label: 'Dates', icon: 'motmot' },
  { path: '/letters', label: 'Letters', icon: 'envelope' },
];

// Phones switch from the top nav pill to the bottom tab bar at this width.
export const PHONE_NAV_QUERY = '(max-width: 900px)';
