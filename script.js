// --- Config ---
const apiKey = "f6174dcae89dc2f4041ab7d9cc79ed0f"; // Keep your OpenWeatherMap key
let useCelsius = true;

// --- Elements ---
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const unitToggle = document.getElementById("unitToggle");

const hero = document.getElementById("hero");
const heroCity = document.getElementById("heroCity");
const heroTemp = document.getElementById("heroTemp");
const heroUnit = document.getElementById("heroUnit");
const heroCond = document.getElementById("heroCond");
const weatherIcon = document.getElementById("weatherIcon");

const statFeels = document.getElementById("statFeels");
const statHumidity = document.getElementById("statHumidity");
const statWind = document.getElementById("statWind");
const statSunrise = document.getElementById("statSunrise");
const statSunset = document.getElementById("statSunset");

const loader = document.getElementById("loader");
const errorBar = document.getElementById("errorBar");
const errorMessage = document.getElementById("errorMessage");
const dismissError = document.getElementById("dismissError");

// --- Event Listeners ---
searchBtn.addEventListener("click", handleSearch);
cityInput.addEventListener("keydown", (e) => { if (e.key === "Enter") handleSearch(); });
unitToggle.addEventListener("click", () => {
  useCelsius = !useCelsius;
  unitToggle.textContent = useCelsius ? "°C" : "°F";
  heroUnit.textContent = useCelsius ? "°C" : "°F";
  // Re-render values in current unit if data already on screen
  const last = window.__lastData;
  if(last) updateUI(last);
});
dismissError.addEventListener("click", () => errorBar.hidden = true);

// --- Helpers ---
function showLoader(show){ loader.style.display = show ? "flex" : "none"; }
function showError(msg){
  errorMessage.textContent = msg;
  errorBar.hidden = false;
}
function clearError(){ errorBar.hidden = true; }

function kToC(k){ return k - 273.15; }
function cToF(c){ return (c * 9/5) + 32; }
function msToKmh(ms){ return (ms * 3.6); }

function formatTemp(valC){
  return useCelsius ? Math.round(valC) : Math.round(cToF(valC));
}
function setBackgroundByCondition(cond){
  const c = (cond || '').toLowerCase();
  let grad;
  if(c.includes('rain')) grad = 'linear-gradient(135deg,#00c6ff,#005bea)';
  else if(c.includes('cloud')) grad = 'linear-gradient(135deg,#a1c4fd,#c2e9fb)';
  else if(c.includes('snow')) grad = 'linear-gradient(135deg,#e6dada,#274046)';
  else if(c.includes('thunder')) grad = 'linear-gradient(135deg,#7f53ac,#647dee)';
  else grad = 'linear-gradient(135deg,#fceabb,#f8b500)';
  document.querySelector('.bg-anim').style.background =
    'radial-gradient(600px 400px at 80% 20%, rgba(96,165,250,.15), transparent 60%),' +
    'radial-gradient(600px 400px at 20% 80%, rgba(52,211,153,.12), transparent 60%)';
  document.body.style.background = grad;
}

// --- Core ---
async function handleSearch(){
  const city = cityInput.value.trim();
  if(!city){ showError('Please enter a city name.'); return; }

  clearError();
  showLoader(true);
  hero.classList.add('skeleton');

  try{
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
    const res = await fetch(url);
    if(!res.ok){
      const err = await res.json().catch(()=>({message:'Unknown error'}));
      throw new Error(err.message || 'Failed to fetch weather');
    }
    const data = await res.json();
    window.__lastData = data;
    updateUI(data);
    localStorage.setItem('lastCity', city);
  }catch(e){
    showError(e.message.includes('Invalid API key') ? 'API key invalid or not yet active.' : e.message);
  }finally{
    showLoader(false);
    hero.classList.remove('skeleton');
  }
}

function updateUI(data){
  const name = data.name;
  const country = data.sys?.country || '';
  const cond = data.weather?.[0]?.main || '—';
  const icon = data.weather?.[0]?.icon || '01d';

  const tempC = data.main?.temp ?? 0;
  const feelsC = data.main?.feels_like ?? 0;
  const hum = data.main?.humidity ?? 0;
  const windMs = data.wind?.speed ?? 0;
  const sunrise = data.sys?.sunrise ? new Date(data.sys.sunrise * 1000) : null;
  const sunset  = data.sys?.sunset  ? new Date(data.sys.sunset  * 1000) : null;

  heroCity.textContent = `${name || '—'}${country ? ', ' + country : ''}`;
  heroTemp.textContent = formatTemp(tempC);
  heroUnit.textContent = useCelsius ? '°C' : '°F';
  heroCond.textContent = cond;

  weatherIcon.innerHTML = `<img src="https://openweathermap.org/img/wn/${icon}@4x.png" alt="${cond} icon" />`;

  statFeels.textContent = formatTemp(feelsC) + (useCelsius ? '°C' : '°F');
  statHumidity.textContent = hum + '%';
  statWind.textContent = Math.round(msToKmh(windMs)) + ' km/h';
  statSunrise.textContent = sunrise ? sunrise.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : '—';
  statSunset.textContent  = sunset  ? sunset.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})  : '—';

  setBackgroundByCondition(cond);
}

// Load last searched city
window.addEventListener('load', () => {
  const last = localStorage.getItem('lastCity');
  if(last){
    cityInput.value = last;
    handleSearch();
  }
});
