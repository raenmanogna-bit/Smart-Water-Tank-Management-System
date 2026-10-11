
#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>

#define TRIG_PIN 5
#define ECHO_PIN 18
#define RELAY_PIN 27
#define GREEN_LED 25
#define RED_LED 26
#define BUZZER_PIN 33

const char* ssid = "motorola edge 60_8489";
const char* password = "Manogna@123";

const char* serverURL =
    "http://10.116.189.7:5000/api/water-level";

const float TANK_HEIGHT_CM = 15.0;
const float PUMP_ON_LEVEL = 20.0;
const float PUMP_OFF_LEVEL = 95.0;

// Set according to relay module behavior.
// This assumes LOW activates the relay.
const int RELAY_ON = LOW;
const int RELAY_OFF = HIGH;

bool pumpOn = false;

void setPump(bool state) {
  pumpOn = state;
  digitalWrite(RELAY_PIN, pumpOn ? RELAY_ON : RELAY_OFF);

  Serial.print("Pump: ");
  Serial.println(pumpOn ? "ON" : "OFF");
}

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  Serial.print("Connecting to mobile hotspot");

  unsigned long startTime = millis();

  while (WiFi.status() != WL_CONNECTED &&
         millis() - startTime < 20000) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("ESP32 IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi connection failed!");
  }
}

void sendToBackend(float level, const String& status) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi unavailable - data not sent");
    return;
  }

  HTTPClient http;
  http.begin(serverURL);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000);

  String payload = "{\"overheadLevel\":" +
      String(level, 1) +
      ",\"boreLevel\":90,\"status\":\"" +
      status + "\"}";

  int responseCode = http.POST(payload);

  Serial.print("Backend HTTP response: ");
  Serial.println(responseCode);

  if (responseCode > 0) {
    Serial.println(http.getString());
  } else {
    Serial.println("Backend request failed");
  }

  http.end();
}

void setup() {
  Serial.begin(115200);

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  pinMode(RELAY_PIN, OUTPUT);
  pinMode(GREEN_LED, OUTPUT);
  pinMode(RED_LED, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  // Keep pump off during startup.
  digitalWrite(RELAY_PIN, RELAY_OFF);
  digitalWrite(GREEN_LED, LOW);
  digitalWrite(RED_LED, LOW);
  digitalWrite(BUZZER_PIN, LOW);

  connectWiFi();

  Serial.println("Smart Water Tank Monitoring Started");
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Reconnecting...");
    connectWiFi();
  }

  // Trigger the ultrasonic sensor.
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);

  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  unsigned long duration = pulseIn(ECHO_PIN, HIGH, 30000);

  // Invalid reading: keep pump OFF.
  if (duration == 0) {
    Serial.println("Sensor error - no reading");

    digitalWrite(GREEN_LED, LOW);
    digitalWrite(RED_LED, HIGH);
    setPump(false);
    digitalWrite(BUZZER_PIN, LOW);

    delay(2000);
    return;
  }

  float distance = duration / 58.0;

  // Out-of-range reading: keep pump OFF.
  if (distance > TANK_HEIGHT_CM || distance < 0.5) {
    Serial.println("Invalid reading - check sensor position");

    digitalWrite(GREEN_LED, LOW);
    digitalWrite(RED_LED, HIGH);
    setPump(false);
    digitalWrite(BUZZER_PIN, LOW);

    delay(2000);
    return;
  }

  float overheadLevel =
      ((TANK_HEIGHT_CM - distance) / TANK_HEIGHT_CM) * 100.0;

  overheadLevel = constrain(overheadLevel, 0.0, 100.0);

  String status = "NORMAL";

  if (overheadLevel < PUMP_ON_LEVEL) {
    status = "LOW OVERHEAD WATER";
    digitalWrite(GREEN_LED, LOW);
    digitalWrite(RED_LED, HIGH);

    setPump(true);
  } else if (overheadLevel >= PUMP_OFF_LEVEL) {
    status = "TANK FULL";
    digitalWrite(GREEN_LED, HIGH);
    digitalWrite(RED_LED, LOW);

    setPump(false);
  } else {
    digitalWrite(GREEN_LED, HIGH);
    digitalWrite(RED_LED, LOW);

    // Maintain the existing pump state between 20% and 95%.
    setPump(pumpOn);
  }

  digitalWrite(BUZZER_PIN, LOW);

  Serial.print("Distance: ");
  Serial.print(distance);
  Serial.print(" cm | Overhead level: ");
  Serial.print(overheadLevel);
  Serial.println("%");

  Serial.print("Status: ");
  Serial.println(status);

  sendToBackend(overheadLevel, status);

  delay(2000);
}