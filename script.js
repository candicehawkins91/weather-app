// ===== GLOBAL VARIABLES =====
let isCelsius = true;
let currentWeather = null;
let hourlyData = null;

const API_BASE = "https://api.open-meteo.com/v1/forecast";

const cityEl = document.getElementById("city");
const temperatureEl = document.getElementById("temperature");
const feelsLikeEl = document.getElementById("feelsLike");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");
const precipitationEl = document.getElementById("precipitation");
const dailyForecastEl = document.getElementById("dailyForecast");
const hourlyForecastEl = document.getElementById("hourlyForecast");
const searchBtn = document.getElementById("searchBtn");
const locationInput = document.getElementById("locationInput");
const unitsBtn = document.querySelector(".units-btn");

// ===== GET COORDINATES =====
async function getCoordinates(city) {
  const geoURL = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    city
  )}&count=1`;
  const res = await fetch(geoURL);
  const data = await res.json();
  if (!data.results || data.results.length === 0)
    throw new Error("City not found");
  return data.results[0];
}

// ===== FETCH WEATHER DATA =====
async function getWeather(city) {
  try {
    const coords = await getCoordinates(city);
    const url = `${API_BASE}?latitude=${coords.latitude}&longitude=${coords.longitude}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;

    const res = await fetch(url);
    const data = await res.json();

    currentWeather = {
      city: `${coords.name}, ${coords.country}`,
      tempC: data.current_weather.temperature,
      wind: data.current_weather.windspeed,
      humidity: data.hourly.relative_humidity_2m[0],
      precipitation: data.hourly.precipitation[0],
      daily: data.daily,
    };

    hourlyData = data.hourly;
    renderWeather();
  } catch (err) {
    alert("Error: " + err.message);
  }
}

// ===== RENDER WEATHER =====
function renderWeather() {
  if (!currentWeather) return;

  const { city, tempC, wind, humidity, precipitation, daily } = currentWeather;
  const tempF = (tempC * 9) / 5 + 32;

  cityEl.textContent = city;
  temperatureEl.textContent = isCelsius ? Math.round(tempC) : Math.round(tempF);
  feelsLikeEl.textContent = isCelsius
    ? `${Math.round(tempC - 1)}°`
    : `${Math.round(tempF - 2)}°`;
  humidityEl.textContent = `${humidity}%`;
  windEl.textContent = isCelsius
    ? `${wind} km/h`
    : `${(wind / 1.609).toFixed(1)} mph`;
  precipitationEl.textContent = isCelsius
    ? `${precipitation} mm`
    : `${(precipitation / 25.4).toFixed(2)} in`;

  renderDailyForecast(daily);
  renderHourlyForecast(hourlyData);
}

// ===== RENDER DAILY FORECAST =====
function renderDailyForecast(daily) {
  dailyForecastEl.innerHTML = "";
  const days = daily.time;

  days.forEach((day, i) => {
    const maxC = daily.temperature_2m_max[i];
    const minC = daily.temperature_2m_min[i];
    const max = isCelsius
      ? `${Math.round(maxC)}°C`
      : `${Math.round((maxC * 9) / 5 + 32)}°F`;
    const min = isCelsius
      ? `${Math.round(minC)}°C`
      : `${Math.round((minC * 9) / 5 + 32)}°F`;

    const card = document.createElement("div");
    card.classList.add("forecast-card");
    card.setAttribute(
      "aria-label",
      `Forecast for ${day}: high ${max}, low ${min}`
    );
    card.innerHTML = `
      <p>${new Date(day).toLocaleDateString(undefined, {
        weekday: "short",
      })}</p>
      <p>${max} / ${min}</p>
    `;
    dailyForecastEl.appendChild(card);
  });
}

// ===== RENDER HOURLY FORECAST =====
function renderHourlyForecast(hourly) {
  hourlyForecastEl.innerHTML = "";
  if (!hourly) return;

  const now = new Date();
  const next24 = hourly.time
    .map((t, i) => ({
      time: t,
      tempC: hourly.temperature_2m[i],
    }))
    .filter((item) => new Date(item.time) > now)
    .slice(0, 12); // show next 12 hours

  next24.forEach((h) => {
    const tempDisplay = isCelsius
      ? `${Math.round(h.tempC)}°C`
      : `${Math.round((h.tempC * 9) / 5 + 32)}°F`;

    const card = document.createElement("div");
    card.classList.add("hour-card");
    card.setAttribute(
      "aria-label",
      `At ${new Date(h.time).getHours()}:00, temperature ${tempDisplay}`
    );
    card.innerHTML = `
      <p>${new Date(h.time).getHours()}:00</p>
      <p>${tempDisplay}</p>
    `;
    hourlyForecastEl.appendChild(card);
  });
}

// ===== UNIT TOGGLE =====
unitsBtn.addEventListener("click", () => {
  isCelsius = !isCelsius;
  unitsBtn.textContent = isCelsius ? "Units: °C / km/h" : "Units: °F / mph";
  renderWeather(); // update everything!
});

// ===== SEARCH FUNCTIONALITY =====
searchBtn.addEventListener("click", () => {
  const city = locationInput.value.trim();
  if (city) getWeather(city);
});
