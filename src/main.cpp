#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>

#define TRIG_PIN 5
#define ECHO_PIN 18

#define SUPPLY_SWITCH 14
#define RELAY_PIN 27

#define GREEN_LED 25
#define RED_LED 26
#define BUZZER_PIN 33

const float TANK_HEIGHT = 100.0;
const float FULL_DISTANCE = 10.0;

// Backend API running on your computer
const char* WIFI_SSID = "Wokwi-GUEST";
const char* WIFI_PASSWORD = "";

const char* SERVER_URL =
    "http://host.wokwi.internal:5000/api/tank/readings";

float getDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);

  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);

  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000);

  if (duration == 0) {
    return TANK_HEIGHT;
  }

  return duration / 58.0;
}

float getWaterLevel(float distance) {
  float level =
      ((TANK_HEIGHT - distance) / TANK_HEIGHT) * 100.0;

  if (level < 0)
    level = 0;

  if (level > 100)
    level = 100;

  return level;
}

void connectWiFi() {
  Serial.print("Connecting to Wokwi WiFi");

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD, 6);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi connected!");
  Serial.print("ESP32 IP: ");
  Serial.println(WiFi.localIP());
}

void sendDataToServer(
    float distance,
    float waterLevel,
    bool filling,
    bool waterAvailable
) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected.");
    return;
  }

  HTTPClient http;

  http.begin(SERVER_URL);

  http.addHeader("Content-Type", "application/json");

  String motorStatus = filling ? "ON" : "OFF";

  String source;

  if (waterAvailable) {
    source = "Municipal Supply";
  } else {
    source = "No Supply";
  }

  String jsonData = "{";
  jsonData += "\"distance\":" + String(distance, 2) + ",";
  jsonData += "\"waterLevel\":" + String(waterLevel, 2) + ",";
  jsonData += "\"motorStatus\":\"" + motorStatus + "\",";
  jsonData += "\"source\":\"" + source + "\"";
  jsonData += "}";

  Serial.println("Sending data to server:");
  Serial.println(jsonData);

  int httpResponseCode = http.POST(jsonData);

  Serial.print("HTTP Response Code: ");
  Serial.println(httpResponseCode);

  if (httpResponseCode > 0) {
    String response = http.getString();

    Serial.println("Server Response:");
    Serial.println(response);
  } else {
    Serial.println("Failed to send data.");
  }

  http.end();
}

void setup() {
  Serial.begin(115200);

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  pinMode(SUPPLY_SWITCH, INPUT_PULLUP);

  pinMode(RELAY_PIN, OUTPUT);
  pinMode(GREEN_LED, OUTPUT);
  pinMode(RED_LED, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  digitalWrite(RELAY_PIN, LOW);
  digitalWrite(GREEN_LED, LOW);
  digitalWrite(RED_LED, LOW);
  digitalWrite(BUZZER_PIN, LOW);

  connectWiFi();
}

void loop() {

  bool waterAvailable =
      digitalRead(SUPPLY_SWITCH) == LOW;

  float distance = getDistance();

  float waterLevel =
      getWaterLevel(distance);

  bool tankFull =
      (waterLevel >= 90.0);

  bool filling =
      waterAvailable && !tankFull;

  // Control relay
  digitalWrite(
      RELAY_PIN,
      filling ? HIGH : LOW
  );

  // Green LED = motor/filling ON
  digitalWrite(
      GREEN_LED,
      filling ? HIGH : LOW
  );

  // Red LED = tank full
  digitalWrite(
      RED_LED,
      tankFull ? HIGH : LOW
  );

  // Buzzer when tank is full
  if (tankFull) {
    tone(BUZZER_PIN, 1000);
  } else {
    noTone(BUZZER_PIN);
  }

  // Send data to backend
  sendDataToServer(
      distance,
      waterLevel,
      filling,
      waterAvailable
  );

  delay(3000);
}