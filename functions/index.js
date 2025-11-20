// functions/index.js

// 1. Define your Secret Key (make this a strong, random string)
const CRON_SECRET_KEY = "YourSecretKey123456"; 

// 2. Define the time threshold (3 minutes)
const PAYMENT_GRACE_PERIOD_SECONDS = 3 * 60; 

/**
 * HTTP-triggered Cloud Function that moves orders older than 3 minutes.
 * This is triggered externally by a free cron service.
 */
exports.autoMoveToShip = functions.https.onRequest(async (req, res) => {
    
    // --- SECURITY CHECK (CRITICAL) ---
    if (req.query.key !== CRON_SECRET_KEY) {
        // Return 403 Forbidden if the key is missing or incorrect
        console.error("Unauthorized cron request received.");
        return res.status(403).send('Unauthorized');
    }
    
    // --- YOUR ORIGINAL LOGIC STARTS HERE ---

    const now = admin.firestore.Timestamp.now();
    
    // Calculate the cutoff time
    const cutoffTime = new admin.firestore.Timestamp(
        now.seconds - PAYMENT_GRACE_PERIOD_SECONDS, 
        now.nanoseconds
    );

    const ordersQuery = db.collection('orders')
        .where('status', '==', 'to pay') 
        .where('timestamp', '<', cutoffTime); 

    try {
        const snapshot = await ordersQuery.get();

        if (snapshot.empty) {
            console.log('No eligible orders found to move to "to ship".');
            return res.status(200).send('No eligible orders.'); // Send a successful response
        }

        // Process the Updates using a Batch Write
        const batch = db.batch();
        let count = 0;

        snapshot.forEach((doc) => {
            const orderRef = doc.ref;
            batch.update(orderRef, {
                status: 'to ship',
                shippedTimestamp: admin.firestore.FieldValue.serverTimestamp()
            });
            count++;
        });

        await batch.commit();
        console.log(`Successfully moved ${count} order(s) to "to ship".`);
        
        // Final successful response
        return res.status(200).send(`Moved ${count} orders successfully.`); 
        
    } catch (error) {
        console.error("Error running autoMoveToShip function:", error);
        return res.status(500).send("Error processing batch update."); // Send a clear error response
    }
});