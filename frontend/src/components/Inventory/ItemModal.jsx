import { X, Save } from 'lucide-react';

const ItemModal = ({ onClose, item = null }) => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div className="card" style={{ width: '100%', maxWidth: '600px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                        {item ? 'Edit Inventory Item' : 'Add New Item'}
                    </h2>
                    <button onClick={onClose} style={{ color: 'var(--color-text-secondary)' }}>
                        <X size={24} />
                    </button>
                </div>

                <form style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Item Name</label>
                        <input
                            type="text"
                            defaultValue={item?.name}
                            placeholder="e.g. Paracetamol 500mg"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--border-radius-md)', border: '1px solid #e2e8f0' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Category</label>
                        <select style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--border-radius-md)', border: '1px solid #e2e8f0', backgroundColor: '#fff' }}>
                            <option>Medicine</option>
                            <option>Equipment</option>
                            <option>Consumable</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>SKU / ID</label>
                        <input
                            type="text"
                            defaultValue={item?.id ? `ITEM-${item.id}` : ''}
                            placeholder="Auto-generated"
                            disabled
                            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--border-radius-md)', border: '1px solid #e2e8f0', backgroundColor: '#f1f5f9' }}
                        />
                    </div>

                    <div style={{ gridColumn: 'span 2', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Batch & Location Tracking</h3>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Batch Number</label>
                        <input
                            type="text"
                            defaultValue={item?.batch}
                            placeholder="e.g. B-2023-X"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--border-radius-md)', border: '1px solid #e2e8f0' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Storage Location</label>
                        <input
                            type="text"
                            defaultValue={item?.location}
                            placeholder="e.g. Shelf A-5"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--border-radius-md)', border: '1px solid #e2e8f0' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Expiry Date</label>
                        <input
                            type="date"
                            defaultValue={item?.expiry}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--border-radius-md)', border: '1px solid #e2e8f0' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Quantity</label>
                        <input
                            type="number"
                            defaultValue={item?.stock}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--border-radius-md)', border: '1px solid #e2e8f0' }}
                        />
                    </div>

                    <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
                        <button type="button" className="btn btn-primary" onClick={onClose}>
                            <Save size={18} /> Save Item
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ItemModal;
