
// No require needed for Node 18+

async function testFlightStatus(flightIata) {
    console.log(`Testing flight status for: ${flightIata}`);
    const url = `http://localhost:3001/api/flight-status?flightIata=${encodeURIComponent(flightIata)}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`HTTP Error: ${response.status}`);
            const text = await response.text();
            console.error('Response:', text);
            return;
        }
        const data = await response.json();
        console.log('Response Status:', response.status);
        console.log('Response Data:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error fetching flight status:', error);
    }
}

const flight = process.argv[2] || "UA123";
testFlightStatus(flight);
