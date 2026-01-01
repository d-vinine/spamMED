import React, { useState } from 'react';
import SmartEditor from '../components/SmartEditor';
import SummaryPanel from '../components/SummaryPanel';

const Billing = ({ items, setItems }) => {

    return (
        <>
            <main className="workspace">
                <header className="bill-header">
                    <div>
                        <label>Patient Name</label>
                        <input type="text" defaultValue="Walk-in Customer" />
                    </div>
                    <div>
                        <label>Doctor</label>
                        <input type="text" placeholder="Dr. Name" />
                    </div>
                    <div>
                        <label>Date</label>
                        <input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                    </div>
                </header>

                <SmartEditor items={items} setItems={setItems} />
            </main>

            <SummaryPanel items={items} />
        </>
    );
};

export default Billing;
