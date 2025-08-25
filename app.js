const $app = document.getElementById('app');
const $meta = document.getElementById('meta');
const nav = document.querySelector('nav');
let state = { view: 'home', coord: null, points: null, urls: {}, lastUpdated: null };

nav.addEventListener('click', (e) => {
  if (e.target.tagName === 'BUTTON') {
    nav.querySelectorAll('button').forEach(b => b.classList.toggle('active', b === e.target));
    setView(e.target.dataset.view);
  }
});

function setView(v){ state.view = v; render(); }

function proxy(url){
  return window.NWS_PROXY ? `${window.NWS_PROXY}/fetch?url=${encodeURIComponent(url)}` : url;
}

async function getJSON(url){
  const res = await fetch(proxy(url), { headers: { 'Accept': 'application/ld+json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  state.lastUpdated = new Date().toISOString();
  return res.json();
}

async function init(){
  if (!localStorage.getItem('favorites')) localStorage.setItem('favorites', JSON.stringify([]));
  try {
    const coord = await locate();
    state.coord = coord;
    const points = await getJSON(`https://api.weather.gov/points/${coord.lat},${coord.lon}`);
    state.points = points;
    state.urls = {
      forecast: points.properties.forecast,
      hourly: points.properties.forecastHourly,
      alerts: `https://api.weather.gov/alerts/active?point=${coord.lat},${coord.lon}`,
      radar: `https://radar.weather.gov/`
    };
  } catch (e) {
    console.warn(e);
  } finally {
    render();
  }
}

function locate(){
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocation unsupported'));
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: +pos.coords.latitude.toFixed(4), lon: +pos.coords.longitude.toFixed(4) }),
      err => reject(err),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  });
}

async function render(){
  const v = state.view;
  const p = state.points?.properties;
  const meta = [];
  if (p?.gridId) meta.push(`Office: ${p.gridId}`, `Grid: ${p.gridX},${p.gridY}`);
  if (state.lastUpdated) meta.push(`Fetched: ${new Date(state.lastUpdated).toLocaleString()}`);
  meta.push(`Source: National Weather Service (api.weather.gov)`);

  try {
    if (v === 'home') {
      $app.innerHTML = `
        <div class="grid">
          <
