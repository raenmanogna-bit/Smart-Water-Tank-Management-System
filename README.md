# AquaSense: Smart Water Tank Management System 💧

An IoT-based full-stack solution to monitor overhead water tanks in real-time, automate pump triggers to prevent overflow, and eliminate the need for manual water level checks.

## 🚀 Key Features
* **Real-Time Monitoring:** Live water level tracking via an ESP32 and ultrasonic sensor.
* **Automated Pump Commands:** Automatically triggers a relay (simulating a pump) when the water level drops below 20% and stops it at 95%.
* **Smart Dashboard:** A responsive React-based web interface showing live percentages, system status, and historical trends.
* **Data Logging:** All sensor readings and status changes are permanently logged in a MongoDB database for historical tracking.
* **Borewell Protection:** Manual input system for borewell levels to prevent the motor from dry-running when source water is low.

## 🛠️ Tech Stack
* **Hardware:** ESP32 DOIT DevKit V1, HC-SR04 Ultrasonic Sensor, 5V Relay Module (JQC3F-05VDC-C).
* **Firmware:** C++ (PlatformIO / Arduino Framework).
* **Frontend:** React.js, Vite, Tailwind CSS (or standard CSS).
* **Backend:** Node.js, Express.js.
* **Database:** MongoDB.

## 🔌 Hardware Wiring Guide
* **HC-SR04 Sensor:** VCC -> 5V (or VIN), GND -> GND, TRIG -> GPIO 5, ECHO -> GPIO 18.
* **5V Relay Module:** VCC -> 3.3V (3V3 pin), GND -> GND, IN -> GPIO 27. 
*(Note: A 3.3V power hack is used to safely trigger the relay from the ESP32).*

## 💻 How to Run Locally
1. **Hardware:** Flash the `main.cpp` code to the ESP32 using PlatformIO. Ensure your Wi-Fi credentials and backend IP address are correctly set in the code.
2. **Backend:** Navigate to the `backend` folder, run `npm install`, add your MongoDB URI to a `.env` file, and start the server with `node server.js` (runs on port 5000).
3. **Frontend:** Navigate to the `frontend` folder, run `npm install`, and start the React app with `npm run dev` (runs on port 5173).
