const DISTRICTS = {
  'Nyarugenge': { distance: 2, zone: 'central' },
  'Gasabo': { distance: 5, zone: 'central' },
  'Kicukiro': { distance: 4, zone: 'central' },
  'Muhanga': { distance: 75, zone: 'south' },
  'Huye': { distance: 130, zone: 'south' },
  'Rubavu': { distance: 160, zone: 'west' },
  'Musanze': { distance: 95, zone: 'north' },
  'Kayonza': { distance: 110, zone: 'east' },
  'Rwamagana': { distance: 50, zone: 'east' },
  'Bugesera': { distance: 60, zone: 'east' },
  'Other': { distance: 80, zone: 'other' }
};

const BASE_FEE = 1000;
const PER_KM_FEE = 15;

exports.calculateDelivery = (req, res) => {
  const { district, order_total = 0 } = req.body;

  if (!district) {
    return res.status(400).json({ success: false, message: 'District is required.' });
  }

  const districtInfo = DISTRICTS[district] || DISTRICTS['Other'];
  const distance = districtInfo.distance;

  let deliveryCost = BASE_FEE + (distance * PER_KM_FEE);

  if (order_total >= 50000) deliveryCost = Math.max(0, deliveryCost - 1000);
  if (order_total >= 100000) deliveryCost = 0;

  const estimatedMinutes = 30 + (distance * 1.5);
  const hours = Math.floor(estimatedMinutes / 60);
  const minutes = Math.round(estimatedMinutes % 60);
  const timeString = hours > 0 ? `${hours}h ${minutes}min` : `${minutes} min`;

  res.json({
    success: true,
    delivery: {
      district,
      distance_km: distance,
      cost: Math.round(deliveryCost),
      estimated_time: timeString,
      free_delivery_threshold: 100000,
      free_delivery: deliveryCost === 0,
      zone: districtInfo.zone
    }
  });
};

exports.getDistricts = (req, res) => {
  const districts = Object.keys(DISTRICTS).map(name => ({
    name,
    zone: DISTRICTS[name].zone,
    base_delivery: Math.round(BASE_FEE + DISTRICTS[name].distance * PER_KM_FEE)
  }));
  res.json({ success: true, districts });
};
