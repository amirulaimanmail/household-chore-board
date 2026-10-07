"use client";

import { useState } from "react";
import { CloudSun, MapPin, RefreshCw } from "lucide-react";

function getWeatherDescription(code) {
  if (code === 0) return "Clear sky";
  if ([1, 2, 3].includes(code)) return "Partly cloudy";
  if ([45, 48].includes(code)) return "Foggy";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return "Current conditions";
}

function isRainyWeatherCode(code) {
  return [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code);
}

function getLocationError(error) {
  if (error.code === 1) {
    return "Location permission was denied. Allow location access and try again.";
  }
  if (error.code === 2) {
    return "Your location is unavailable. Please try again.";
  }
  if (error.code === 3) {
    return "Location lookup timed out. Please try again.";
  }
  return "Could not read your location.";
}

export default function WeatherCard() {
  const [weather, setWeather] = useState(null);
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  function loadWeather() {
    if (!navigator.geolocation) {
      setStatus("error");
      setErrorMessage("Location access is not supported by this browser.");
      return;
    }

    setStatus("loading");
    setErrorMessage("");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const params = new URLSearchParams({
            latitude: String(coords.latitude),
            longitude: String(coords.longitude),
            current:
              "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m",
            timezone: "auto",
          });
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?${params}`,
          );
          if (!response.ok) {
            throw new Error("Weather service is unavailable. Please try again.");
          }

          const data = await response.json();
          const current = data.current;
          if (
            !current ||
            typeof current.temperature_2m !== "number" ||
            typeof current.weather_code !== "number"
          ) {
            throw new Error("The weather service returned an invalid response.");
          }

          setWeather({
            current,
            units: data.current_units,
            timezone: data.timezone,
          });
          setStatus("loaded");
        } catch (error) {
          setStatus("error");
          setErrorMessage(error.message || "Could not load current weather.");
        }
      },
      (error) => {
        setStatus("error");
        setErrorMessage(getLocationError(error));
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  return (
    <section className="weather-card" aria-labelledby="weather-title">
      <div className="weather-card-content">
        <p className="simple-kicker">Local forecast</p>
        <h2 id="weather-title">
          {weather && isRainyWeatherCode(weather.current.weather_code)
            ? "It's rainy outside — save outdoor chores for later"
            : "It's a good time for outdoor chores!"}
        </h2>
        {status === "idle" && (
          <p className="weather-muted">
            Share your location to see current conditions.
          </p>
        )}
        {status === "loading" && (
          <p className="weather-muted" role="status">
            Finding your location and checking the weather…
          </p>
        )}
        {status === "error" && (
          <p className="weather-error" role="alert">
            {errorMessage}
          </p>
        )}
        {status === "loaded" && weather && (
          <div className="weather-current" aria-live="polite">
            <CloudSun aria-hidden="true" />
            <strong>
              {Math.round(weather.current.temperature_2m)}
              {weather.units?.temperature_2m || "°C"}
            </strong>
            <span>{getWeatherDescription(weather.current.weather_code)}</span>
            <span>
              Feels like {Math.round(weather.current.apparent_temperature)}
              {weather.units?.apparent_temperature || "°C"}
            </span>
            {weather.timezone && (
              <span className="weather-location">
                <MapPin aria-hidden="true" />
                {weather.timezone.replaceAll("_", " ")}
              </span>
            )}
          </div>
        )}
      </div>
      <button
        className="simple-secondary weather-button"
        onClick={loadWeather}
        disabled={status === "loading"}
      >
        <RefreshCw aria-hidden="true" />
        {status === "loaded" || status === "error"
          ? "Refresh weather"
          : "Use my location"}
      </button>
    </section>
  );
}
