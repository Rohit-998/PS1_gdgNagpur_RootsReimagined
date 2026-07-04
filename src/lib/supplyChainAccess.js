// Shared authorization helpers for supply-chain routes.

/**
 * The manufacturer scope for a given auth context. Mirrors how
 * POST /api/supply-chain assigns `manufacturer_id` (`manufacturer_id || _id`)
 * so that accounts without a linked Manufacturer profile still stay isolated.
 */
export function manufacturerScope(auth) {
  return auth.user.manufacturer_id || auth.user._id;
}

/**
 * Ownership guard. Manufacturers may only touch their own shipments;
 * regulators may access any.
 */
export function ownsShipment(auth, shipment) {
  if (auth.role === 'regulator') return true;
  return String(shipment.manufacturer_id) === String(manufacturerScope(auth));
}
