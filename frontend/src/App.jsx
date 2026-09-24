import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [reading, setReading] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReading = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/tank/readings"
      );

      const result = await response.json();

      if (result.data && result.data.length > 0) {
        setReading(result.data[0]);
      }
    } catch (error) {
      console.error("Error fetching tank data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReading();

    const interval = setInterval(fetchReading, 3000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <h2>Loading Smart Water Tank...</h2>;
  }

  return (
    <div className="dashboard">
      <header>
        <h1>💧 Smart Water Tank Management</h1>
        <p>Real-Time Water Monitoring Dashboard</p>
      </header>

      <main>
        <div className="card tank-card">
  <h2>Water Tank Level</h2>

  <div className="tank">
    <div
      className="water"
      style={{
        height: `${reading ? reading.waterLevel : 0}%`
      }}
    >
      <span>
        {reading ? `${reading.waterLevel}%` : "0%"}
      </span>
    </div>
  </div>

  <p className="tank-status">
    {reading
      ? reading.waterLevel >= 90
        ? "Tank Full"
        : reading.waterLevel <= 25
        ? "Low Water"
        : "Normal Level"
      : "No Data"}
  </p>
</div>

<div className="card">
  <h2>Distance</h2>
  <div className="value">
    {reading ? `${reading.distance} cm` : "--"}
  </div>
</div>

<div className="card">
  <h2>Motor Status</h2>
  <div className="value">
    {reading ? reading.motorStatus : "--"}
  </div>
</div>

<div className="card">
  <h2>Water Source</h2>
  <div className="value">
    {reading ? reading.source : "--"}
  </div>
</div>
      </main>
    </div>
  );
}

export default App;