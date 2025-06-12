// addService.js

import { data } from './data';
import { data2 } from './data2';

const fetch = require('node-fetch'); // Only required if you're using Node <18



for(let d in data2) {

    const service = data2[d]

    async function addService() {
        try {
            const response = await fetch('http://localhost:3000/api/services', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(service)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                console.log("✅ Service added successfully:", data);
            } else {
                console.error("❌ Failed to add service:", data);
            }
        } catch (err) {
            console.error("🔥 Error while sending request:", err);
        }
    }
    
    addService();
}
