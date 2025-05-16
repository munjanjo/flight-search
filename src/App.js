// src/App.js
import React, { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [passengers, setPassengers] = useState(1);
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);

  const getAccessToken = async () => {
    try {
      const response = await axios.post(
        "https://test.api.amadeus.com/v1/security/oauth2/token",
        new URLSearchParams({
          grant_type: "client_credentials",
          client_id: process.env.REACT_APP_AMADEUS_API_KEY,
          client_secret: process.env.REACT_APP_AMADEUS_API_SECRET,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
      return response.data.access_token;
    } catch (error) {
      console.error("Error fetching access token:", error);
      return null;
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        console.error("No access token available.");
        return;
      }

      const response = await axios.get(
        "https://test.api.amadeus.com/v2/shopping/flight-offers",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            originLocationCode: origin.toUpperCase(),
            destinationLocationCode: destination.toUpperCase(),
            departureDate: departureDate,
            returnDate: returnDate || undefined,
            adults: passengers,
            currencyCode: currency,
            max: 5,
          },
        }
      );

      console.log("Flight Data:", response.data.data);
      setFlights(response.data.data || []);
    } catch (error) {
      console.error("Error searching for flights:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1>Flight Search</h1>
      <div className="search-container">
        <div className="search-box">
          <input
            type="text"
            placeholder="Origin"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
          />
          <input
            type="text"
            placeholder="Destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
          <input
            type="date"
            value={departureDate}
            onChange={(e) => setDepartureDate(e.target.value)}
          />
          <input
            type="date"
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
          />
          <select
            value={passengers}
            onChange={(e) => setPassengers(e.target.value)}
          >
            {[...Array(10)].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1} Passenger{i > 0 ? "s" : ""}
              </option>
            ))}
          </select>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            <option value="EUR">EUR (€)</option>
            <option value="USD">USD ($)</option>
            <option value="HRK">HRK (kn)</option>
          </select>

          <button className="search" onClick={handleSearch} disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </div>

      {/* Flight Results Table */}
      {flights.length > 0 && (
        <table className="flight-table">
          <thead>
            <tr>
              <th>Airline</th>
              <th>From</th>
              <th>To</th>
              <th>Departure</th>
              <th>Return</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {flights.map((flight, index) => {
              const { itineraries, price } = flight;
              const departureSegment = itineraries[0].segments[0];
              const returnSegment =
                itineraries.length > 1
                  ? itineraries[1].segments[0]
                  : departureSegment;

              return (
                <tr key={index}>
                  <td>{departureSegment.carrierCode}</td>
                  <td>{departureSegment.departure.iataCode}</td>
                  <td>{departureSegment.arrival.iataCode}</td>
                  <td>{departureSegment.departure.at}</td>
                  <td>{returnSegment.arrival.at}</td>
                  <td>
                    {price.total} {currency}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}

export default App;
