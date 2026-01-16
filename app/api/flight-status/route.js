export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const flightIata = searchParams.get('flightIata');
    const flightDate = searchParams.get('flightDate'); // Optional: YYYY-MM-DD format

    if (!flightIata) {
        return Response.json({ error: 'flightIata parameter required' }, { status: 400 });
    }

    const apiKey = process.env.AVIATIONSTACK_API_KEY;

    if (!apiKey || apiKey === 'your_api_key_here' || apiKey.length < 20) {
        // Return mock data if no valid API key configured
        console.warn('AVIATIONSTACK_API_KEY not configured or invalid, returning mock data');
        return Response.json({
            status: 'scheduled',
            statusLabel: 'On Time',
            delay: null,
            gate: null,
            terminal: null,
            lastUpdated: new Date().toISOString(),
            isMock: true,
        });
    }

    try {
        // Build API URL - Note: Free tier only supports HTTP, not HTTPS
        // Note: Free tier does NOT support flight_date parameter, only real-time data
        let apiUrl = `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&flight_iata=${flightIata}`;

        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.error) {
            console.error('AviationStack API error:', data.error);
            return Response.json({
                error: data.error.message || 'API error',
                status: 'unknown',
                statusLabel: 'Unknown',
            }, { status: 400 });
        }

        // Get the first matching flight
        const flight = data.data?.[0];

        if (!flight) {
            return Response.json({
                status: 'not_found',
                statusLabel: 'Not Found',
                message: `No flight found for ${flightIata}`,
            });
        }

        // Normalize the response
        const flightStatus = flight.flight_status || 'scheduled';
        const statusLabels = {
            scheduled: 'Scheduled',
            active: 'In Flight',
            landed: 'Landed',
            cancelled: 'Cancelled',
            incident: 'Incident',
            diverted: 'Diverted',
        };

        const statusColors = {
            scheduled: 'blue',
            active: 'green',
            landed: 'green',
            cancelled: 'red',
            incident: 'red',
            diverted: 'yellow',
        };

        return Response.json({
            status: flightStatus,
            statusLabel: statusLabels[flightStatus] || flightStatus,
            statusColor: statusColors[flightStatus] || 'gray',

            // Departure info
            departureDelay: flight.departure?.delay || null,
            departureGate: flight.departure?.gate || null,
            departureTerminal: flight.departure?.terminal || null,
            departureScheduled: flight.departure?.scheduled || null,
            departureEstimated: flight.departure?.estimated || null,
            departureActual: flight.departure?.actual || null,
            departureAirport: flight.departure?.airport || null,

            // Arrival info
            arrivalDelay: flight.arrival?.delay || null,
            arrivalGate: flight.arrival?.gate || null,
            arrivalTerminal: flight.arrival?.terminal || null,
            arrivalScheduled: flight.arrival?.scheduled || null,
            arrivalEstimated: flight.arrival?.estimated || null,
            arrivalActual: flight.arrival?.actual || null,
            arrivalAirport: flight.arrival?.airport || null,

            // Flight info
            airline: flight.airline?.name || null,
            flightNumber: flight.flight?.iata || flightIata,
            flightDate: flight.flight_date || null,

            lastUpdated: new Date().toISOString(),
            isMock: false,
        });

    } catch (error) {
        console.error('Flight status fetch error:', error);
        return Response.json({
            error: 'Failed to fetch flight status',
            status: 'error',
            statusLabel: 'Error',
        }, { status: 500 });
    }
}
