import { X, Save } from 'lucide-react';

const ItemModal = ({ onClose, item = null, batch = null, mode = 'CREATE', onSave }) => {
    // Modes: 'CREATE', 'EDIT', 'ADD_BATCH', 'EDIT_BATCH'
    const isEditMode = mode === 'EDIT';
    const isAddBatchMode = mode === 'ADD_BATCH';
    const isEditBatchMode = mode === 'EDIT_BATCH';

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        onSave({
            ...data,
            mode: mode,
            item_id: item?.id,
            batch_id: batch?.id
        });
    };

    const getTitle = () => {
        if (isEditMode) return `Edit ${item.name}`;
        if (isAddBatchMode) return `Add Batch to ${item.name}`;
        if (isEditBatchMode) return `Edit Batch #${batch?.batch_number || batch?.id}`;
        return 'Add New Item';
    };

    const getButtonText = () => {
        if (isEditMode) return 'Update Item';
        if (isAddBatchMode) return 'Add Stock';
        if (isEditBatchMode) return 'Update Batch';
        return 'Create Item';
    };

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
                        {getTitle()}
                    </h2>
                    <button onClick={onClose} style={{ color: 'var(--color-text-secondary)' }}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

                    {/* Item Details Section */}
                    <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Item Name</label>
                        <input
                            name="name"
                            type="text"
                            defaultValue={item?.name}
                            placeholder="e.g. Paracetamol 500mg"
                            required
                            disabled={isAddBatchMode || isEditBatchMode} // Locked if adding/editing batch
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: 'var(--border-radius-md)',
                                border: '1px solid #e2e8f0',
                                backgroundColor: (isAddBatchMode || isEditBatchMode) ? '#f1f5f9' : '#fff'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Category</label>
                        <select
                            name="category"
                            disabled={isAddBatchMode || isEditBatchMode}
                            defaultValue={item?.category || "Medicine"}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: 'var(--border-radius-md)',
                                border: '1px solid #e2e8f0',
                                backgroundColor: (isAddBatchMode || isEditBatchMode) ? '#f1f5f9' : '#fff'
                            }}
                        >
                            <option value="Medicine">Medicine</option>
                            <option value="Equipment">Equipment</option>
                            <option value="Consumable">Consumable</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>SKU / ID</label>
                        <input
                            type="text"
                            defaultValue={item?.id ? `ITEM-${item.id}` : 'Auto-generated'}
                            disabled
                            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--border-radius-md)', border: '1px solid #e2e8f0', backgroundColor: '#f1f5f9' }}
                        />
                    </div>

                    {/* Batch Details Section - Hidden in Edit ITEM Mode */}
                    {!isEditMode && (
                        <>
                            <div style={{ gridColumn: 'span 2', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>
                                    {isAddBatchMode ? 'New Batch Details' : (isEditBatchMode ? 'Batch Details' : 'Initial Batch Details')}
                                </h3>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Batch Number</label>
                                <input
                                    name="batch"
                                    type="text"
                                    defaultValue={batch?.batch_number}
                                    placeholder="e.g. BN-2023-X"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--border-radius-md)', border: '1px solid #e2e8f0' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Storage Location</label>
                                <input
                                    name="location"
                                    type="text"
                                    defaultValue={batch?.location}
                                    placeholder="e.g. Shelf A-5"
                                    required={!isEditMode}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--border-radius-md)', border: '1px solid #e2e8f0' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Expiry Date</label>
                                <input
                                    name="expiry"
                                    type="date"
                                    defaultValue={batch?.expiry_date ? batch.expiry_date.split('T')[0] : ''}
                                    required={!isEditMode}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--border-radius-md)', border: '1px solid #e2e8f0' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Quantity</label>
                                    <input
                                        name="stock"
                                        type="number"
                                        defaultValue={batch?.quantity}
                                        placeholder="0"
                                        required={!isEditMode}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--border-radius-md)', border: '1px solid #e2e8f0' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>MRP (Price)</label>
                                    <input
                                        name="mrp"
                                        type="number"
                                        step="0.01"
                                        defaultValue={batch?.mrp}
                                        placeholder="0.00"
                                        required={!isEditMode}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--border-radius-md)', border: '1px solid #e2e8f0' }}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
                        <button type="submit" className="btn btn-primary">
                            <Save size={18} /> {getButtonText()}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ItemModal;
