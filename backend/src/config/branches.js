const BRANCHES = [
  { id: 'simba-remera', name: 'Simba Supermarket Remera', district: 'Gasabo', area: 'Remera', pickup_enabled: 1, rating: 4.5 },
  { id: 'simba-kimironko', name: 'Simba Supermarket Kimironko', district: 'Gasabo', area: 'Kimironko', pickup_enabled: 1, rating: 4.3 },
  { id: 'simba-kacyiru', name: 'Simba Supermarket Kacyiru', district: 'Gasabo', area: 'Kacyiru', pickup_enabled: 1, rating: 4.6 },
  { id: 'simba-nyamirambo', name: 'Simba Supermarket Nyamirambo', district: 'Nyarugenge', area: 'Nyamirambo', pickup_enabled: 1, rating: 4.2 },
  { id: 'simba-gikondo', name: 'Simba Supermarket Gikondo', district: 'Kicukiro', area: 'Gikondo', pickup_enabled: 1, rating: 4.4 },
  { id: 'simba-kanombe', name: 'Simba Supermarket Kanombe', district: 'Kicukiro', area: 'Kanombe', pickup_enabled: 1, rating: 4.5 },
  { id: 'simba-kinyinya', name: 'Simba Supermarket Kinyinya', district: 'Gasabo', area: 'Kinyinya', pickup_enabled: 1, rating: 4.1 },
  { id: 'simba-kibagabaga', name: 'Simba Supermarket Kibagabaga', district: 'Kicukiro', area: 'Kibagabaga', pickup_enabled: 1, rating: 4.3 },
  { id: 'simba-nyanza', name: 'Simba Supermarket Nyanza', district: 'Nyanza', area: 'Nyanza', pickup_enabled: 1, rating: 4.0 }
];

const PICKUP_TIME_SLOTS = [
  '08:00 - 10:00',
  '10:00 - 12:00',
  '12:00 - 14:00',
  '14:00 - 16:00',
  '16:00 - 18:00',
  '18:00 - 20:00'
];

function branchDepositAmount(branchId) {
  const branch = BRANCHES.find((item) => item.id === branchId);
  if (!branch) return 500;
  return branch.district === 'Gasabo' ? 1000 : 500;
}

module.exports = {
  BRANCHES,
  PICKUP_TIME_SLOTS,
  branchDepositAmount
};
