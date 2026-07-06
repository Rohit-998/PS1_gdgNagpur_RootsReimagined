'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  Truck, Package, Clock, AlertTriangle, CheckCircle2, MapPin,
  Plus, Search, X, Loader2, ChevronRight, Play, XCircle, Building2,
} from 'lucide-react';
import { buildAuthHeaders } from '@/lib/authHelpers';
import SupplyChainTimeline from './SupplyChainTimeline';
import CarrierInsights from './CarrierInsights';
import styles from './SupplyChainTracker.module.css';

const SupplyChainMap = dynamic(() => import('./SupplyChainMap'), { ssr: false });

const STATUS_LABELS = {
  preparing: 'Preparing',
  packed: 'Packed',
  dispatched: 'Dispatched',
  in_transit: 'In Transit',
  reached_checkpoint: 'Reached',
  delayed: 'Delayed',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_BADGE_MAP = {
  preparing: styles.badgePreparing,
  packed: styles.badgePacked,
  dispatched: styles.badgeDispatched,
  in_transit: styles.badgeInTransit,
  reached_checkpoint: styles.badgeReached,
  delayed: styles.badgeDelayed,
  out_for_delivery: styles.badgeOutForDelivery,
  delivered: styles.badgeDelivered,
  cancelled: styles.badgeCancelled,
};

const CHECKPOINT_TYPES = [
  'factory', 'warehouse', 'distribution_center', 'shipment_yard',
  'regional_hub', 'transport_hub', 'retail_warehouse', 'pharmacy', 'custom',
];

const DEMO_SHIPMENTS = [
  {
    batch_id: 'BATCH-SUN-2024-001',
    medicine_name: 'Paracetamol 500mg',
    checkpoints: [
      { name: 'Sun Pharma Factory', type: 'factory', lat: 23.0225, lng: 72.5714, address: 'Ahmedabad, Gujarat', expected_arrival: new Date().toISOString() },
      { name: 'Gujarat Warehouse', type: 'warehouse', lat: 22.3072, lng: 73.1812, address: 'Vadodara, Gujarat', expected_arrival: new Date(Date.now() + 86400000).toISOString() },
      { name: 'Western Distribution Hub', type: 'distribution_center', lat: 19.076, lng: 72.8777, address: 'Mumbai, Maharashtra', expected_arrival: new Date(Date.now() + 172800000).toISOString() },
      { name: 'Pune Regional Warehouse', type: 'regional_hub', lat: 18.5204, lng: 73.8567, address: 'Pune, Maharashtra', expected_arrival: new Date(Date.now() + 259200000).toISOString() },
      { name: 'MedPlus Pharmacy', type: 'pharmacy', lat: 18.5362, lng: 73.8978, address: 'Kalyani Nagar, Pune', expected_arrival: new Date(Date.now() + 345600000).toISOString() },
    ],
  },
  {
    batch_id: 'BATCH-CIP-2024-017',
    medicine_name: 'Azithromycin 250mg',
    checkpoints: [
      { name: 'Cipla Factory', type: 'factory', lat: 19.076, lng: 72.8777, address: 'Mumbai, Maharashtra', expected_arrival: new Date().toISOString() },
      { name: 'Mumbai Central Warehouse', type: 'warehouse', lat: 19.0176, lng: 72.8562, address: 'Lower Parel, Mumbai', expected_arrival: new Date(Date.now() + 43200000).toISOString() },
      { name: 'Southern Logistics Hub', type: 'transport_hub', lat: 15.3173, lng: 75.7139, address: 'Hubli, Karnataka', expected_arrival: new Date(Date.now() + 172800000).toISOString() },
      { name: 'Bangalore Distribution Center', type: 'distribution_center', lat: 12.9716, lng: 77.5946, address: 'Bangalore, Karnataka', expected_arrival: new Date(Date.now() + 259200000).toISOString() },
      { name: 'HSR Retail Warehouse', type: 'retail_warehouse', lat: 12.9121, lng: 77.6446, address: 'HSR Layout, Bangalore', expected_arrival: new Date(Date.now() + 302400000).toISOString() },
      { name: 'Apollo Pharmacy HSR', type: 'pharmacy', lat: 12.9141, lng: 77.6501, address: 'HSR Layout, Bangalore', expected_arrival: new Date(Date.now() + 345600000).toISOString() },
    ],
  },
];

export default function SupplyChainTracker() {
  const [shipments, setShipments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [advanceNote, setAdvanceNote] = useState('');
  const [error, setError] = useState('');
  const pollingRef = useRef(null);

  const headers = buildAuthHeaders();

  // Fetch shipments
  const fetchShipments = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await fetch(`/api/supply-chain?${params}`, { headers });
      const data = await res.json();
      if (data.shipments) setShipments(data.shipments);
    } catch { /* silent */ }
  }, [search, statusFilter]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/supply-chain/stats', { headers });
      const data = await res.json();
      setStats(data);
    } catch { /* silent */ }
  }, []);

  // Fetch single shipment detail
  const fetchDetail = useCallback(async (id) => {
    try {
      const res = await fetch(`/api/supply-chain/${id}`, { headers });
      const data = await res.json();
      if (data.shipment) setSelectedShipment(data.shipment);
    } catch { /* silent */ }
  }, []);

  // Initial load
  useEffect(() => {
    Promise.all([fetchShipments(), fetchStats()]).finally(() => setLoading(false));
  }, [fetchShipments, fetchStats]);

  // Polling every 5s
  useEffect(() => {
    pollingRef.current = setInterval(() => {
      fetchShipments();
      fetchStats();
      if (selectedId) fetchDetail(selectedId);
    }, 5000);
    return () => clearInterval(pollingRef.current);
  }, [fetchShipments, fetchStats, fetchDetail, selectedId]);

  // Re-fetch on filter change
  useEffect(() => {
    fetchShipments();
  }, [search, statusFilter, fetchShipments]);

  // Select a shipment
  const handleSelect = (id) => {
    if (selectedId === id) {
      setSelectedId(null);
      setSelectedShipment(null);
    } else {
      setSelectedId(id);
      fetchDetail(id);
    }
  };

  // Advance checkpoint
  const handleAdvance = async () => {
    if (!selectedId) return;
    setAdvancing(true);
    try {
      const res = await fetch(`/api/supply-chain/${selectedId}/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ notes: advanceNote.trim() || undefined }),
      });
      const data = await res.json();
      if (data.shipment) {
        setSelectedShipment(data.shipment);
        setAdvanceNote('');
        fetchShipments();
        fetchStats();
      }
    } catch { setError('Failed to advance checkpoint'); }
    finally { setAdvancing(false); }
  };

  // Cancel shipment
  const handleCancel = async () => {
    if (!selectedId) return;
    try {
      await fetch(`/api/supply-chain/${selectedId}`, {
        method: 'DELETE',
        headers,
      });
      setSelectedId(null);
      setSelectedShipment(null);
      fetchShipments();
      fetchStats();
    } catch { /* silent */ }
  };

  // Seed demo data
  const handleSeedDemo = async () => {
    setLoading(true);
    for (const demo of DEMO_SHIPMENTS) {
      try {
        await fetch('/api/supply-chain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify(demo),
        });
      } catch { /* silent */ }
    }
    await fetchShipments();
    await fetchStats();
    setLoading(false);
  };

  // Progress percentage
  const getProgress = (shipment) => {
    if (!shipment.checkpoints?.length) return 0;
    const completed = shipment.checkpoints.filter(cp => cp.status === 'completed').length;
    return Math.round((completed / shipment.checkpoints.length) * 100);
  };

  // Current location name
  const getCurrentLocation = (shipment) => {
    const idx = shipment.current_checkpoint_index || 0;
    if (idx >= shipment.checkpoints?.length) {
      return shipment.checkpoints[shipment.checkpoints.length - 1]?.name || '—';
    }
    return shipment.checkpoints[idx]?.name || '—';
  };

  // A shipment is "behind schedule" when the current checkpoint's expected
  // arrival has passed but the shipment hasn't reached it yet.
  const isBehindSchedule = (shipment) => {
    if (['delivered', 'cancelled'].includes(shipment.status)) return false;
    const idx = shipment.current_checkpoint_index ?? 0;
    const cp = shipment.checkpoints?.[idx];
    if (!cp || !cp.expected_arrival || cp.actual_arrival) return false;
    return new Date(cp.expected_arrival).getTime() < Date.now();
  };

  if (loading) {
    return (
      <div className={styles.loadingCenter}>
        <Loader2 size={20} className="animate-spin" /> Loading supply chain data...
      </div>
    );
  }

  return (
    <div>
      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        {[
          { label: 'Active Shipments', value: stats?.activeShipments ?? 0, icon: <Truck size={18} /> },
          { label: 'Completed', value: stats?.completedDeliveries ?? 0, icon: <CheckCircle2 size={18} /> },
          { label: 'Delayed', value: stats?.delayedShipments ?? 0, icon: <AlertTriangle size={18} /> },
          { label: 'Behind Schedule', value: stats?.behindSchedule ?? 0, icon: <Clock size={18} /> },
          { label: 'Avg Delivery', value: stats?.avgDeliveryHours ? `${stats.avgDeliveryHours}h` : '—', icon: <Clock size={18} /> },
          { label: 'In Transit', value: stats?.inTransit ?? 0, icon: <Package size={18} /> },
          { label: 'Pharmacies', value: stats?.pharmaciesServed ?? 0, icon: <Building2 size={18} /> },
        ].map(({ label, value, icon }) => (
          <div key={label} className={styles.statCard}>
            <div style={{ color: 'var(--color-brand-primary)', marginBottom: '2px' }}>{icon}</div>
            <span className={styles.statValue}>{value}</span>
            <span className={styles.statLabel}>{label}</span>
          </div>
        ))}
      </div>

      {/* Bento Container */}
      <div className={styles.bentoContainer}>
        {/* Left Column: Data & Actions */}
        <div className={styles.bentoLeft}>
          {/* Toolbar */}
          <div className={styles.toolbar}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className={styles.searchInput}
                style={{ paddingLeft: 38 }}
                placeholder="Search by medicine, batch ID, or destination..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select className={styles.filterSelect} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <button className={styles.createBtn} onClick={() => setShowCreateModal(true)}>
              <Plus size={16} /> New Shipment
            </button>
          </div>

          {error && <p className={styles.errorText}>{error}</p>}

          {/* Empty State */}
          {shipments.length === 0 && (
            <div className={styles.emptyState}>
              <Truck size={48} className={styles.emptyIcon} />
              <p className={styles.emptyTitle}>No shipments yet</p>
              <p className={styles.emptyDesc}>Create a new shipment to start tracking medicine batches through the supply chain.</p>
              <button className={styles.seedBtn} onClick={handleSeedDemo}>
                <Play size={16} /> Load Demo Data
              </button>
            </div>
          )}

          {/* Shipment Table */}
          {shipments.length > 0 && (
            <div className={styles.tableWrapper}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Freight Order</th>
                    <th>Status</th>
                    <th>Max Utilization</th>
                    <th>Source Location</th>
                    <th>Destination Location</th>
                    <th>Departure</th>
                    <th>Arrival</th>
                  </tr>
                </thead>
                <tbody>
                  {shipments.map(s => {
                    const isActive = selectedId === s._id;
                    const checkpoints = s.checkpoints || [];
                    const source = checkpoints.length > 0 ? checkpoints[0] : null;
                    const dest = checkpoints.length > 1 ? checkpoints[checkpoints.length - 1] : null;
                    
                    // Mock utilization percentage between 60-95% for UI
                    const utilPct = Math.floor(Math.random() * 35) + 60; 

                    return (
                      <tr 
                        key={s._id} 
                        className={isActive ? styles.activeRow : ''}
                        onClick={() => handleSelect(s._id)}
                      >
                        <td>
                          <div className={styles.cellFreight}>
                            <Truck size={14} className={styles.freightIcon} />
                            {s.batch_id}
                          </div>
                        </td>
                        <td>
                          <div className={styles.cellStatus}>
                            <span className={`${styles.statusSquare} ${STATUS_BADGE_MAP[s.status] || ''}`} />
                          </div>
                        </td>
                        <td>
                          <div className={styles.cellUtil}>
                            <div className={styles.utilBarBg}>
                              <div className={styles.utilBarFill} style={{ width: `${utilPct}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className={styles.cellLocation}>{source ? source.name : '—'}</td>
                        <td className={styles.cellLocation}>{dest ? dest.name : '—'}</td>
                        <td className={styles.cellTime}>
                          {source && source.actual_arrival ? new Date(source.actual_arrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td className={styles.cellTime}>
                          {dest && dest.expected_arrival ? new Date(dest.expected_arrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Detail Panel */}
          {selectedShipment && (
            <div className={styles.detailPanel}>
              <div className={styles.detailHeader}>
                <h3 className={styles.detailTitle}>
                  <MapPin size={16} />
                  {selectedShipment.medicine_name} — {selectedShipment.batch_id}
                </h3>
                <div className={styles.detailActions} style={{ flexWrap: 'wrap' }}>
                  {selectedShipment.status !== 'delivered' && selectedShipment.status !== 'cancelled' && (
                    <>
                      <input
                        className={styles.advanceNote}
                        placeholder="Optional note for this checkpoint…"
                        value={advanceNote}
                        onChange={e => setAdvanceNote(e.target.value)}
                      />
                      <button className={styles.advanceBtn} onClick={handleAdvance} disabled={advancing}>
                        {advancing ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
                        Advance to Next Checkpoint
                      </button>
                      <button className={styles.cancelBtn} onClick={handleCancel}>
                        <XCircle size={14} /> Cancel
                      </button>
                    </>
                  )}
                  <button className={styles.closeBtn} onClick={() => { setSelectedId(null); setSelectedShipment(null); }}>
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Summary row */}
              <div className={styles.detailSummary}>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Status</span>
                  <span style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}>
                    <span className={`${styles.badge} ${STATUS_BADGE_MAP[selectedShipment.status] || ''}`}>
                      {STATUS_LABELS[selectedShipment.status] || selectedShipment.status}
                    </span>
                    {isBehindSchedule(selectedShipment) && (
                      <span className={styles.behindChip}><AlertTriangle size={12} /> Behind Schedule</span>
                    )}
                  </span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Progress</span>
                  <span className={styles.summaryValue}>{getProgress(selectedShipment)}%</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Current Location</span>
                  <span className={styles.summaryValue}>{getCurrentLocation(selectedShipment)}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Last Updated</span>
                  <span className={styles.summaryValue}>
                    {new Date(selectedShipment.updatedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>{selectedShipment.actual_delivery ? 'Delivered' : 'Est. Delivery'}</span>
                  <span className={styles.summaryValue}>
                    {selectedShipment.actual_delivery
                      ? new Date(selectedShipment.actual_delivery).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                      : selectedShipment.estimated_delivery
                        ? new Date(selectedShipment.estimated_delivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'}
                  </span>
                </div>
              </div>

              <div className={styles.detailBody}>
                <div className={styles.detailSidebar} style={{ width: '100%', borderRight: 'none' }}>
                  <SupplyChainTimeline checkpoints={selectedShipment.checkpoints || []} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Map & Insights */}
        <div className={styles.bentoRight}>
          <div className={styles.mapSection}>
            <div className={styles.mapHeader}>
              <MapPin size={16} />
              <h3>Map Display {selectedShipment ? `- ${selectedShipment.batch_id}` : '(Global)'}</h3>
            </div>
            <div className={styles.prominentMap}>
              {selectedShipment ? (
                <SupplyChainMap checkpoints={selectedShipment.checkpoints || []} height={400} />
              ) : shipments.length > 0 ? (
                <SupplyChainMap checkpoints={shipments[0].checkpoints || []} height={400} />
              ) : (
                <SupplyChainMap checkpoints={[]} height={400} />
              )}
            </div>
          </div>
          
          <CarrierInsights />
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateShipmentModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { setShowCreateModal(false); fetchShipments(); fetchStats(); }}
          headers={headers}
        />
      )}
    </div>
  );
}

/* ──────────────────────────────────────────── */
/*  Create Shipment Modal                       */
/* ──────────────────────────────────────────── */
function CreateShipmentModal({ onClose, onCreated, headers }) {
  const [form, setForm] = useState({
    medicine_name: '',
    batch_id: '',
    estimated_delivery: '',
  });
  const [checkpoints, setCheckpoints] = useState([
    { name: '', type: 'factory', lat: '', lng: '', address: '', contact_person: '', expected_arrival: '' },
    { name: '', type: 'pharmacy', lat: '', lng: '', address: '', contact_person: '', expected_arrival: '' },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const updateCheckpoint = (i, field, value) => {
    setCheckpoints(prev => {
      const cp = [...prev];
      cp[i] = { ...cp[i], [field]: value };
      return cp;
    });
  };

  const addCheckpoint = () => {
    setCheckpoints(prev => [
      ...prev.slice(0, -1),
      { name: '', type: 'warehouse', lat: '', lng: '', address: '', contact_person: '', expected_arrival: '' },
      prev[prev.length - 1],
    ]);
  };

  const removeCheckpoint = (i) => {
    if (checkpoints.length <= 2) return;
    setCheckpoints(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const payload = {
      ...form,
      checkpoints: checkpoints.map(cp => ({
        ...cp,
        lat: parseFloat(cp.lat) || 0,
        lng: parseFloat(cp.lng) || 0,
      })),
    };

    try {
      const res = await fetch('/api/supply-chain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create shipment');
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Create Shipment</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.formRow}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Medicine Name *</label>
                <input className={styles.formInput} required value={form.medicine_name} onChange={e => setForm(p => ({ ...p, medicine_name: e.target.value }))} placeholder="e.g. Paracetamol 500mg" />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Batch ID *</label>
                <input className={styles.formInput} required value={form.batch_id} onChange={e => setForm(p => ({ ...p, batch_id: e.target.value }))} placeholder="e.g. BATCH-SUN-2024-001" />
              </div>
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Estimated Delivery Date</label>
              <input className={styles.formInput} type="date" value={form.estimated_delivery} onChange={e => setForm(p => ({ ...p, estimated_delivery: e.target.value }))} />
            </div>

            <p className={styles.sectionLabel}>Supply Chain Route ({checkpoints.length} checkpoints)</p>

            {checkpoints.map((cp, i) => (
              <div key={i} className={styles.checkpointEntry}>
                <div className={styles.checkpointHeader}>
                  <span className={styles.checkpointNumber}>
                    {i === 0 ? 'Origin' : i === checkpoints.length - 1 ? 'Destination' : `Stop ${i}`}
                  </span>
                  {checkpoints.length > 2 && i !== 0 && i !== checkpoints.length - 1 && (
                    <button type="button" className={styles.removeCheckpointBtn} onClick={() => removeCheckpoint(i)}>
                      <X size={14} />
                    </button>
                  )}
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Name *</label>
                    <input className={styles.formInput} required value={cp.name} onChange={e => updateCheckpoint(i, 'name', e.target.value)} placeholder="e.g. Sun Pharma Factory" />
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Type</label>
                    <select className={styles.formSelect} value={cp.type} onChange={e => updateCheckpoint(i, 'type', e.target.value)}>
                      {CHECKPOINT_TYPES.map(t => (
                        <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Latitude *</label>
                    <input className={styles.formInput} required type="number" step="any" value={cp.lat} onChange={e => updateCheckpoint(i, 'lat', e.target.value)} placeholder="e.g. 19.076" />
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Longitude *</label>
                    <input className={styles.formInput} required type="number" step="any" value={cp.lng} onChange={e => updateCheckpoint(i, 'lng', e.target.value)} placeholder="e.g. 72.877" />
                  </div>
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Address</label>
                  <input className={styles.formInput} value={cp.address} onChange={e => updateCheckpoint(i, 'address', e.target.value)} placeholder="e.g. Andheri East, Mumbai" />
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Contact Person</label>
                    <input className={styles.formInput} value={cp.contact_person} onChange={e => updateCheckpoint(i, 'contact_person', e.target.value)} placeholder="Optional" />
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Expected Arrival</label>
                    <input className={styles.formInput} type="datetime-local" value={cp.expected_arrival} onChange={e => updateCheckpoint(i, 'expected_arrival', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}

            <button type="button" className={styles.addCheckpointBtn} onClick={addCheckpoint}>
              <Plus size={16} /> Add Checkpoint
            </button>

            {error && <p className={styles.errorText}>{error}</p>}
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.modalCancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.modalSubmitBtn} disabled={submitting}>
              {submitting ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : <><Truck size={16} /> Create Shipment</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
