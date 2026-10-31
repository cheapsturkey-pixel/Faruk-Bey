const STORAGE_KEY = "yuva.crm.portfolio.v1";
const LEAD_KEY = "yuva.crm.leads.v1";
const ADVISOR_KEY = "yuva.crm.advisor.profile.v1";
const FAVORITE_KEY = "yuva.crm.favorites.v1";
const SAVED_SEARCH_KEY = "yuva.crm.saved-searches.v1";
const ACTIVITY_KEY = "yuva.crm.activities.v1";
const APPOINTMENT_KEY = "yuva.crm.appointments.v1";
const DEFAULT_SCHEDULE = {days:[1,2,3,4,5],start:"09:00",end:"17:00",interval:30};

const initialListings = [
  {id:"yuva-101",title:"Işıkla dolu, şehirli bir yaşam",kind:"Daire",type:"Satılık",city:"İstanbul",district:"Kadıköy",price:8750000,area:128,rooms:"3+1",description:"Geniş pencereleri, ferah salonu ve ulaşım noktalarına yakınlığıyla öne çıkan modern daire.",status:"active",image:"https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=85",tour:"",sampleListing:true},
  {id:"yuva-102",title:"Doğayla iç içe bahçeli villa",kind:"Villa",type:"Satılık",city:"İzmir",district:"Urla",price:16400000,area:215,rooms:"4+1",description:"Geniş özel bahçesi, gün ışığı alan yaşam alanları ve sakin çevresiyle keyifli bir ev.",status:"active",image:"https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1000&q=85",tour:"",sampleListing:true},
  {id:"yuva-103",title:"Geleceğe açılan geniş arsa",kind:"Arsa",type:"Satılık",city:"Muğla",district:"Bodrum",price:6900000,area:620,rooms:"",description:"Konumu ve geniş alanıyla yatırım değerlendirmesine uygun arsa. İmar ve tapu bilgileri ayrıca doğrulanmalıdır.",status:"active",image:"https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=85",tour:"",sampleListing:true},
  {id:"yuva-104",title:"Merkezi konumda sakin daire",kind:"Daire",type:"Kiralık",city:"İstanbul",district:"Beşiktaş",price:42500,area:96,rooms:"2+1",description:"Günlük yaşamın içinde, bakımlı ve kullanıma hazır daire.",status:"active",image:"https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1000&q=85",tour:"",sampleListing:true}
];

let listings = loadArray(STORAGE_KEY, initialListings);
let leads = loadArray(LEAD_KEY, []);
let favorites = loadArray(FAVORITE_KEY, []);
let savedSearches = loadArray(SAVED_SEARCH_KEY, []);
let activities = loadArray(ACTIVITY_KEY, []);
let demoPanoramaViewer = null;
let toastTimer;
const advisorProfile = loadObject(ADVISOR_KEY, {});
const demoRooms = {
  bedroom: {
    title: "Örnek yatak odası",
    panorama: "https://upload.wikimedia.org/wikipedia/commons/d/d4/Cerro_Tololo_Hotel_Interior_360_Panorama_%282022_04_08_Pano360_Tololo_Hotel_Room-CC%29.jpg",
    credit: "NOIRLab / Wikimedia Commons · CC BY 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Cerro_Tololo_Hotel_Interior_360_Panorama_(2022_04_08_Pano360_Tololo_Hotel_Room-CC).jpg",
    next: "living"
  },
  living: {
    title: "Örnek oturma odası",
    panorama: "https://upload.wikimedia.org/wikipedia/commons/3/33/Panorama_of_suite_living_room.jpg",
    credit: "Sonny doe / Wikimedia Commons · CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Panorama_of_suite_living_room.jpg",
    next: "bedroom"
  }
};

function loadArray(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    if (!value) return structuredClone(fallback);
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : structuredClone(fallback);
  } catch (error) {
    console.error(`Yuva verileri okunamadı (${key}).`, error);
    return structuredClone(fallback);
  }
}

function loadObject(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    if (!value) return {...fallback};
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {...fallback};
  } catch (error) {
    console.error(`Yuva danışman profili okunamadı (${key}).`, error);
    return {...fallback};
  }
}

function persist(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Yuva verileri kaydedilemedi (${key}).`, error);
    showToast("Kaydedilemedi. Tarayıcı depolama alanını kontrol edin.");
    return false;
  }
}

function renderAdvisorProfile() {
  const name = String(advisorProfile.name || "").trim() || "Yuva Gayrimenkul Danışmanlığı";
  const intro = String(advisorProfile.intro || "").trim() || "Satılık ve kiralık portföyü inceleyin. İhtiyacınızı danışmanınıza iletin, size uygun seçenekleri birlikte değerlendirin.";
  document.querySelector("#advisor-intro-public").textContent = intro;
  document.querySelector("#advisor-name-public").textContent = name;
  document.querySelectorAll(".public-advisor-name").forEach(element => { element.textContent = name; });
  const sampleIds = new Set(["yuva-101","yuva-102","yuva-103","yuva-104"]);
  const hasSampleListings = listings.some(item => item.status === "active" && (item.sampleListing === true || (item.sampleListing !== false && sampleIds.has(item.id))));
  document.querySelector("#sample-listings-note").classList.toggle("hidden", !hasSampleListings);
}

function getAdvisorSchedule() {
  const schedule = advisorProfile.schedule || {};
  const days = Array.isArray(schedule.days) ? schedule.days.map(Number).filter(day => day >= 0 && day <= 6) : DEFAULT_SCHEDULE.days;
  return {
    days,
    start: /^\d{2}:\d{2}$/.test(schedule.start || "") ? schedule.start : DEFAULT_SCHEDULE.start,
    end: /^\d{2}:\d{2}$/.test(schedule.end || "") ? schedule.end : DEFAULT_SCHEDULE.end,
    interval: [15,30,60].includes(Number(schedule.interval)) ? Number(schedule.interval) : DEFAULT_SCHEDULE.interval
  };
}

function localDateValue(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}

function renderPublicAppointmentOptions() {
  const dateInput = document.querySelector("#public-appointment-date");
  const timeSelect = document.querySelector("#public-appointment-time");
  const listingSelect = document.querySelector("#appointment-listing");
  if (!dateInput || !timeSelect || !listingSelect) return;
  dateInput.min = localDateValue(new Date());
  const selectedListing = listingSelect.value;
  listingSelect.innerHTML = `<option value="">Genel görüşme</option>${listings.filter(item => item.status === "active").map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.title)} · ${escapeHtml(item.city)}</option>`).join("")}`;
  if (listings.some(item => item.id === selectedListing && item.status === "active")) listingSelect.value = selectedListing;
  const selectedDate = dateInput.value;
  const schedule = getAdvisorSchedule();
  const day = selectedDate ? new Date(`${selectedDate}T12:00:00`).getDay() : -1;
  const start = Number(schedule.start.slice(0,2))*60 + Number(schedule.start.slice(3));
  const end = Number(schedule.end.slice(0,2))*60 + Number(schedule.end.slice(3));
  const busy = loadArray(APPOINTMENT_KEY, []).filter(item => item.status === "Planlandı");
  const slots = [];
  if (schedule.days.includes(day) && end > start) {
    for (let minute = start; minute + schedule.interval <= end; minute += schedule.interval) {
      const time = `${String(Math.floor(minute/60)).padStart(2,"0")}:${String(minute%60).padStart(2,"0")}`;
      const startsAt = new Date(`${selectedDate}T${time}`);
      const endsAt = startsAt.getTime() + schedule.interval*60000;
      const overlaps = busy.some(item => {
        const bookedStart = new Date(item.startsAt).getTime();
        const bookedEnd = bookedStart + (Number(item.durationMinutes) || schedule.interval)*60000;
        return startsAt.getTime() < bookedEnd && endsAt > bookedStart;
      });
      if (startsAt.getTime() > Date.now() && !overlaps) slots.push(time);
    }
  }
  timeSelect.innerHTML = slots.length
    ? `<option value="">Saat seçin</option>${slots.map(time => `<option value="${time}">${time}</option>`).join("")}`
    : `<option value="">${selectedDate ? "Bu gün için uygun saat yok" : "Önce gün seçin"}</option>`;
  timeSelect.disabled = !slots.length;
}

function openAppointmentDialog() {
  const form = document.querySelector("#public-appointment-form");
  form.reset();
  document.querySelector("#public-appointment-time").disabled = true;
  document.querySelector("#public-appointment-time").innerHTML = `<option value="">Önce gün seçin</option>`;
  renderPublicAppointmentOptions();
  document.querySelector("#appointment-dialog").showModal();
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, character => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[character]));
}

function formatPrice(price, type) {
  const formatted = new Intl.NumberFormat("tr-TR").format(Number(price) || 0);
  return type === "Kiralık" ? `${formatted} TL / ay` : `${formatted} TL`;
}

function imageMarkup(listing, className = "") {
  if (listing.image) {
    return `<img class="${className}" src="${escapeHtml(listing.image)}" alt="${escapeHtml(listing.title)}" loading="lazy" onerror="this.remove();this.parentElement.classList.add('image-failed')">`;
  }
  return `<div class="image-placeholder" aria-hidden="true">${listing.kind === "Arsa" ? "⌁" : "⌂"}</div>`;
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 2600);
}

function renderPublicListings(searchResults = null, matchScores = null) {
  const type = document.querySelector("#type-filter").value;
  const kind = document.querySelector("#kind-filter").value;
  let shown = listings.filter(item => item.status === "active");
  if (type !== "all") shown = shown.filter(item => item.type === type);
  if (kind !== "all") shown = shown.filter(item => item.kind === kind);
  if (searchResults) {
    const ranking = new Map(searchResults.map((id,index) => [id,index]));
    shown = shown.filter(item => ranking.has(item.id)).sort((left,right) => ranking.get(left.id)-ranking.get(right.id));
  }
  document.querySelector("#hero-listing-count").textContent = listings.filter(item => item.status === "active").length;
  const grid = document.querySelector("#public-listings");
  grid.innerHTML = shown.map(item => {
    const isFavorite = favorites.includes(item.id);
    return `<article class="property-card">
      <div class="property-image ${item.kind === "Arsa" ? "terrain" : item.kind === "Villa" ? "villa" : ""}">
        ${imageMarkup(item)}
        <span class="property-tag">${escapeHtml(item.type)} · ${escapeHtml(item.kind)}</span>
        <button class="favorite-button ${isFavorite ? "favorited" : ""}" data-favorite="${escapeHtml(item.id)}" aria-label="${isFavorite ? "Favorilerden çıkar" : "Favorilere ekle"}">${isFavorite ? "♥" : "♡"}</button>
      </div>
      <div class="property-info"><div class="property-meta"><span>${escapeHtml(item.rooms || item.kind)}</span><span>${item.area ? `${escapeHtml(item.area)} m²` : "Alan belirtilmedi"}</span></div>
        <h3>${escapeHtml(item.title)}</h3><p class="property-location">⌖ ${escapeHtml(item.district ? `${item.district}, ` : "")}${escapeHtml(item.city)}</p>${matchScores && matchScores[item.id] !== undefined ? `<span class="match-score">Eşleşme %${escapeHtml(matchScores[item.id])}</span>` : ""}
        <div class="property-footer"><strong class="property-price">${formatPrice(item.price,item.type)}</strong><div class="property-actions">
          <button class="small-action tour" data-tour="${escapeHtml(item.id)}">${item.tour ? "360° gez" : "Fotoğrafları gör"}</button>
          <button class="small-action" data-contact="${escapeHtml(item.id)}">Danışmana sor</button>
        </div></div>
      </div>
    </article>`;
  }).join("");
  document.querySelector("#empty-listings").classList.toggle("hidden", shown.length > 0);
}

function describeSearch(search) {
  const criteria = [search.type !== "all" && search.type, search.kind !== "all" && search.kind, search.query?.trim()].filter(Boolean);
  return criteria.length ? criteria.join(" · ") : "Tüm ilanlar";
}

function renderSavedSearches() {
  const container = document.querySelector("#saved-searches");
  container.innerHTML = savedSearches.map(search => `<div class="saved-search-chip">
    <button type="button" data-apply-search="${escapeHtml(search.id)}" title="Bu aramayı uygula">${escapeHtml(search.label || describeSearch(search))}</button>
    <button type="button" data-delete-search="${escapeHtml(search.id)}" aria-label="Kaydedilen aramayı sil">×</button>
  </div>`).join("");
  container.classList.toggle("hidden", savedSearches.length === 0);
}

function saveCurrentSearch() {
  const query = document.querySelector("#ai-query").value.trim();
  const search = {
    id:`search-${Date.now()}`,
    query,
    type:document.querySelector("#type-filter").value,
    kind:document.querySelector("#kind-filter").value,
    label:"",
    createdAt:new Date().toISOString()
  };
  search.label = describeSearch(search);
  savedSearches.unshift(search);
  if (!persist(SAVED_SEARCH_KEY,savedSearches)) {
    savedSearches.shift();
    return;
  }
  renderSavedSearches();
  const feedback = document.querySelector("#saved-search-feedback");
  feedback.textContent = "Arama bu cihazda kaydedildi.";
}

function applySavedSearch(id) {
  const search = savedSearches.find(item => item.id === id);
  if (!search) return;
  document.querySelector("#ai-query").value = search.query || "";
  document.querySelector("#type-filter").value = search.type || "all";
  document.querySelector("#kind-filter").value = search.kind || "all";
  if (search.query?.trim()) runAiSearch(search.query);
  else {
    document.querySelector("#ai-response").classList.remove("show");
    renderPublicListings();
  }
  document.querySelector("#kesfet")?.scrollIntoView({behavior:"smooth"});
}

function deleteSavedSearch(id) {
  const previous = savedSearches;
  savedSearches = savedSearches.filter(item => item.id !== id);
  if (!persist(SAVED_SEARCH_KEY,savedSearches)) {
    savedSearches = previous;
    return;
  }
  renderSavedSearches();
}

function normalizeSearchText(value) {
  return String(value || "").toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ı/g,"i");
}

function parseBudget(text) {
  const amountMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(milyon|mn|m|bin|k)\b/);
  if (amountMatch) {
    const multiplier = ["milyon","mn","m"].includes(amountMatch[2]) ? 1_000_000 : 1_000;
    return Math.round(Number(amountMatch[1].replace(",", "."))*multiplier);
  }
  const digitsMatch = text.match(/(?:butce(?:m)?\s*(?:en fazla|maksimum|max)?|en fazla|maksimum|max)\s*(\d[\d.,]*)/);
  const explicitTlMatch = text.match(/\b(\d[\d.,]{3,})\s*(?:tl|lira)\b/);
  const amountText = digitsMatch?.[1] || explicitTlMatch?.[1];
  if (!amountText) return 0;
  const amount = Number(amountText.replace(/[.,]/g,""));
  return amount >= 1_000 ? amount : 0;
}

function parseQuery(query) {
  const text = normalizeSearchText(query);
  const words = text.split(/[^a-z0-9+]+/).filter(Boolean);
  const cities = ["istanbul","izmir","ankara","mugla","antalya","bursa","adana","mersin","eskisehir","gaziantep","trabzon","kayseri","konya","bodrum","urla","kadikoy","besiktas"];
  const city = cities.find(value => words.includes(value)) || "";
  const kind = words.some(word => ["arsa","arazi"].includes(word)) ? "Arsa" : words.some(word => ["villa","mustakil","bahceli"].includes(word)) ? "Villa" : words.some(word => ["daire","apartman"].includes(word)) ? "Daire" : words.some(word => ["ticari","dukkan","ofis"].includes(word)) ? "Ticari" : "";
  const type = words.some(word => ["kiralik","kiraya","kirala"].includes(word)) ? "Kiralık" : words.some(word => ["satilik","satin","almak"].includes(word)) ? "Satılık" : "";
  const areaMatch = text.match(/(\d{2,5})\s*(?:m2|metrekare)/);
  const roomMatch = text.match(/(\d+\s*\+\s*\d+|\d+\s*oda)/);
  const requestedFeatures = [
    ["bahçe","bahce|bahceli"],["otopark","otopark"],["asansör","asansor"],
    ["deniz","deniz|sahil"],["metro","metro"],["manzara","manzara"],
    ["site","site icinde"],["müstakil","mustakil"]
  ].filter(([,pattern]) => new RegExp(`\\b(?:${pattern})\\b`).test(text)).map(([label]) => label);
  const rooms = roomMatch ? roomMatch[1].replace(/\s+/g,"").replace(/oda$/,"") : "";
  return {
    city,kind,type,
    minArea:areaMatch ? Number(areaMatch[1]) : 0,
    rooms,
    maxPrice:parseBudget(text),
    requestedFeatures
  };
}

function scoreListing(listing, criteria) {
  const checks = [];
  const add = (label, requested, actual, matches) => {
    if (requested) checks.push({label,known:Boolean(actual),matches:Boolean(actual) && matches});
  };
  const location = normalizeSearchText(`${listing.city || ""} ${listing.district || ""}`);
  add(criteria.city,criteria.city,location,location.includes(criteria.city));
  add(criteria.kind,criteria.kind,listing.kind,listing.kind === criteria.kind);
  add(criteria.type,criteria.type,listing.type,listing.type === criteria.type);
  add(criteria.minArea && `${criteria.minArea} m²+`,criteria.minArea,listing.area,Number(listing.area) >= criteria.minArea);
  add(criteria.rooms && `${criteria.rooms} oda`,criteria.rooms,listing.rooms,normalizeSearchText(listing.rooms).startsWith(normalizeSearchText(criteria.rooms)));
  add(criteria.maxPrice && `En fazla ${new Intl.NumberFormat("tr-TR").format(criteria.maxPrice)} TL`,criteria.maxPrice,listing.price,Number(listing.price) <= criteria.maxPrice);
  const listingText = normalizeSearchText(`${listing.title || ""} ${listing.description || ""}`);
  for (const feature of criteria.requestedFeatures) {
    const aliases = {
      "bahçe":["bahce","bahceli","bahceye"],
      "otopark":["otopark","park yeri"],
      "asansör":["asansor"],
      "deniz":["deniz","sahil"],
      "metro":["metro"],
      "manzara":["manzara"],
      "site":["site icinde","site"],
      "müstakil":["mustakil"]
    }[feature] || [normalizeSearchText(feature)];
    const featureFound = aliases.some(alias => listingText.includes(alias));
    checks.push({label:feature,known:featureFound,matches:featureFound});
  }
  const requestedChecks = checks.length;
  const score = requestedChecks ? Math.round(checks.filter(check => check.matches).length / requestedChecks * 100) : 100;
  return {score,checks,criteriaCount:requestedChecks};
}

function runAiSearch(query) {
  const criteria = parseQuery(query);
  const ranked = listings.filter(item => item.status === "active").map(item => ({
    item,
    ...scoreListing(item,criteria)
  })).sort((left,right) => right.score-left.score || Number(right.item.area || 0)-Number(left.item.area || 0));
  const response = document.querySelector("#ai-response");
  if (!query.trim()) {
    response.innerHTML = "Aradığınız yeri kısaca tarif edin; portföydeki ilanlarda konum ve özellik eşleştirmesi yapayım.";
    response.classList.add("show");
    return;
  }
  const criteriaParts = [
    criteria.city && criteria.city[0].toLocaleUpperCase("tr-TR")+criteria.city.slice(1),
    criteria.kind,criteria.type,criteria.minArea && `${criteria.minArea} m²+`,
    criteria.rooms && `${criteria.rooms} oda+`,
    criteria.maxPrice && `En fazla ${new Intl.NumberFormat("tr-TR").format(criteria.maxPrice)} TL`,
    ...criteria.requestedFeatures
  ].filter(Boolean);
  if (!criteriaParts.length) {
    response.innerHTML = "Bu tariften konum, bütçe veya mülk özelliği çıkaramadım. Birkaç ölçüt ekleyin; eşleşme puanı yalnızca ilanlarda kayıtlı bilgiler üzerinden hesaplanır.";
    renderPublicListings();
    response.classList.add("show");
    return;
  }
  const matches = ranked.filter(result => result.criteriaCount === 0 || result.score > 0);
  if (matches.length && ranked[0]?.score > 0) {
    const top = ranked[0];
    const missing = top.checks.filter(check => !check.known).map(check => check.label);
    response.innerHTML = `<strong>${matches.length} ilanı uygunluk puanına göre sıraladım.</strong> ${criteriaParts.length ? `Aradığınız: ${escapeHtml(criteriaParts.join(" · "))}.` : "Portföydeki ilanları listeliyorum."} En yakın sonuç <strong>%${top.score}</strong> eşleşiyor${missing.length ? `; ilanda ${escapeHtml(missing.join(", "))} bilgisi eksik.` : "."} Öneriler kayıtlı ilan bilgilerine dayanır; otomatik sıralama doğruluk garantisi değildir.`;
    renderPublicListings(matches.map(result => result.item.id),Object.fromEntries(matches.map(result => [result.item.id,result.score])));
  } else {
    response.innerHTML = `Bu tarifteki ölçütlerle eşleşen ilan bulamadım. <strong>Bu, mülkün hiç olmadığı anlamına değil, kayıtlı portföy bilgilerinin eşleşmediği anlamına gelir.</strong> Bütçe, bölge veya özellikleri değiştirip deneyin.`;
    renderPublicListings([]);
  }
  response.classList.add("show");
}

function openLeadDialog(id = "") {
  const listing = listings.find(item => item.id === id);
  const form = document.querySelector("#lead-form");
  form.reset();
  form.elements.listingId.value = listing?.id || "";
  document.querySelector("#lead-dialog-title").textContent = listing ? "İlan hakkında bilgi alın" : "Danışmanlık talebi oluşturun";
  document.querySelector("#lead-dialog-intro").textContent = listing
    ? `"${listing.title}" ilanı için iletişim bilgilerinizi bırakın; danışmanımız sizinle iletişime geçsin.`
    : "İletişim bilgilerinizi bırakın; danışmanlık talebinizi size dönüş yapmak üzere kaydedelim.";
  document.querySelector("#lead-dialog").showModal();
}

document.querySelector("#lead-form").addEventListener("submit", event => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const data = Object.fromEntries(new FormData(form).entries());
  const listing = listings.find(item => item.id === data.listingId);
  const lead = {
    id:`lead-${Date.now()}`,
    name:data.name.trim(),
    phone:data.phone.trim(),
    notes:data.notes.trim(),
    preferences:{
      location:data.desiredLocation.trim(),
      type:data.desiredType,
      kind:data.desiredKind,
      maxBudget:Number(String(data.maxBudget || "").replace(/[^\d]/g,"")) || 0,
      minArea:Number(String(data.minArea || "").replace(/[^\d]/g,"")) || 0
    },
    consent:data.consent === "on",
    status:"Yeni talep",
    listingId:listing?.id || "",
    listingTitle:listing?.title || "Genel danışmanlık talebi",
    createdAt:new Date().toISOString()
  };
  leads.push(lead);
  if (!persist(LEAD_KEY,leads)) {
    leads.pop();
    return;
  }
  const activity = {id:`activity-${Date.now()}`,kind:"lead",title:"Yeni müşteri talebi",detail:`${lead.name} · ${lead.listingTitle}`,createdAt:lead.createdAt};
  activities.unshift(activity);
  if (!persist(ACTIVITY_KEY,activities)) {
    activities.shift();
    console.error("Müşteri talebi kaydedildi; aktivite geçmişine eklenemedi.");
  }
  document.querySelector("#lead-dialog").close();
  form.reset();
  showToast("Talebiniz bu cihazda kaydedildi.");
});

document.querySelector("#public-appointment-form").addEventListener("submit", event => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const data = Object.fromEntries(new FormData(form).entries());
  const startsAt = new Date(`${data.date}T${data.time}`);
  const schedule = getAdvisorSchedule();
  const day = startsAt.getDay();
  const listing = listings.find(item => item.id === data.listingId && item.status === "active");
  const currentAppointments = loadArray(APPOINTMENT_KEY, []);
  const slotEnd = startsAt.getTime() + schedule.interval*60000;
  const isBusy = currentAppointments.some(item => {
    if (item.status !== "Planlandı") return false;
    const bookedStart = new Date(item.startsAt).getTime();
    const bookedEnd = bookedStart + (Number(item.durationMinutes) || schedule.interval)*60000;
    return startsAt.getTime() < bookedEnd && slotEnd > bookedStart;
  });
  const sameDay = localDateValue(startsAt) === data.date;
  const minute = startsAt.getHours()*60 + startsAt.getMinutes();
  const opening = Number(schedule.start.slice(0,2))*60 + Number(schedule.start.slice(3));
  const closing = Number(schedule.end.slice(0,2))*60 + Number(schedule.end.slice(3));
  if (!sameDay || startsAt.getTime() <= Date.now() || !schedule.days.includes(day) || minute < opening || minute + schedule.interval > closing || minute % schedule.interval !== opening % schedule.interval || isBusy) {
    renderPublicAppointmentOptions();
    showToast("Bu saat artık uygun değil. Lütfen başka bir saat seçin.");
    return;
  }
  const createdAt = new Date().toISOString();
  const lead = {
    id:`lead-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
    name:data.name.trim(),
    phone:data.phone.trim(),
    notes:data.notes.trim(),
    consent:data.consent === "on",
    status:"Yeni talep",
    listingId:listing?.id || "",
    listingTitle:listing?.title || "Randevu talebi",
    createdAt
  };
  const appointment = {
    id:`appointment-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
    leadId:lead.id,
    propertyId:listing?.id || "",
    startsAt:startsAt.toISOString(),
    durationMinutes:schedule.interval,
    status:"Planlandı",
    location:"Müşteri tarafından talep edildi",
    notes:data.notes.trim(),
    createdAt
  };
  const previousLeads = leads;
  leads = [...leads, lead];
  if (!persist(LEAD_KEY, leads)) {
    leads = previousLeads;
    return;
  }
  const nextAppointments = [appointment, ...currentAppointments];
  if (!persist(APPOINTMENT_KEY, nextAppointments)) {
    leads = previousLeads;
    persist(LEAD_KEY, leads);
    return;
  }
  const activity = {id:`activity-${Date.now()}`,kind:"appointment",title:"Müşteri randevu talebi",detail:`${lead.name} · ${startsAt.toLocaleString("tr-TR")}`,leadId:lead.id,appointmentId:appointment.id,createdAt};
  activities.unshift(activity);
  if (!persist(ACTIVITY_KEY, activities)) {
    activities.shift();
    console.error("Randevu oluşturuldu; aktivite geçmişine eklenemedi.");
  }
  document.querySelector("#appointment-dialog").close();
  form.reset();
  showToast("Randevu talebiniz ajandaya eklendi.");
});

function openTour(id) {
  const listing = listings.find(item => item.id === id);
  if (!listing) return;
  const hasTour = Boolean(listing.tour);
  document.querySelector("#tour-dialog .section-kicker").textContent = hasTour ? "SANAL GEZİNTİ" : "İLAN GÖRSELLERİ";
  document.querySelector("#tour-title").textContent = hasTour ? listing.title : `Fotoğraflar — ${listing.title}`;
  const content = document.querySelector("#tour-content");
  const image = listing.image ? `<img src="${escapeHtml(listing.image)}" alt="${escapeHtml(listing.title)}">` : "";
  const tourAction = hasTour
    ? `<button class="tour-open" data-open-tour="${escapeHtml(listing.tour)}">360° / 3D turu aç ↗</button>`
    : `<span class="tour-notice">Bu ilanda 360° sanal tur bulunmuyor. Şu anda ilan fotoğrafını görüyorsunuz. Gerçek bir tur için mülkün 360° çekiminin yapılıp bağlantısının portföy paneline eklenmesi gerekir.</span>`;
  content.classList.toggle("photo-preview", !hasTour);
  content.innerHTML = `${image}<div class="tour-overlay"><span>${escapeHtml(listing.district ? `${listing.district}, ` : "")}${escapeHtml(listing.city)} · ${escapeHtml(listing.kind)} · ${listing.area ? `${escapeHtml(listing.area)} m²` : ""}</span>${tourAction}</div>`;
  document.querySelector("#tour-dialog").showModal();
}

function openDemoTour() {
  demoPanoramaViewer?.destroy();
  document.querySelector("#tour-dialog .section-kicker").textContent = "360° TUR DEMOSU · ÖRNEK MEKÂN";
  document.querySelector("#tour-title").textContent = "Örnek mekânlarda gezinin";
  const content = document.querySelector("#tour-content");
  content.classList.remove("photo-preview");
  content.classList.add("panorama-demo");
  content.innerHTML = `<div id="panorama-viewer" role="application" aria-label="Fareyle veya dokunarak sürükleyip 360 derece gezin"></div>
    <nav class="demo-room-controls" aria-label="Demo odaları">
      <span class="demo-room-label">DEMO ODALARI</span>
      <button type="button" class="demo-room-button active" data-demo-scene="bedroom">01 · Yatak odası</button>
      <button type="button" class="demo-room-button" data-demo-scene="living">02 · Oturma odası</button>
      <button type="button" class="demo-next-button" data-demo-next>Diğer odaya geç <span>→</span></button>
    </nav>
    <div class="demo-credit"><span><strong>360° gezinti:</strong> Görüntüyü fareyle sürükleyin veya dokunmatik ekranda kaydırın. Oda değiştirmek için üstteki oda düğmelerine basın ya da görüntü içindeki geçiş noktasını seçin.</span>
    <small id="demo-credit-line">Örnek mekân · Gerçek bir emlak ilanı değildir.</small></div>`;
  document.querySelector("#tour-dialog").showModal();
  if (typeof window.pannellum?.viewer !== "function") {
    content.querySelector(".demo-credit").insertAdjacentHTML("afterbegin", `<span class="panorama-error">360° görüntüleyici yüklenemedi. İnternet bağlantınızı kontrol edin.</span>`);
    return;
  }
  try {
    demoPanoramaViewer = window.pannellum.viewer("panorama-viewer", {
      default: {
        firstScene: "bedroom",
        autoLoad: true,
        autoRotate: -1,
        autoRotateInactivityDelay: 3000,
        showControls: true,
        mouseZoom: true,
        draggable: true,
        hfov: 100,
        minHfov: 45,
        maxHfov: 120,
        sceneFadeDuration: 700
      },
      scenes: {
        bedroom: {
          title: demoRooms.bedroom.title,
          type: "equirectangular",
          panorama: demoRooms.bedroom.panorama,
          hotSpots: [{
            pitch: -6,
            yaw: 0,
            type: "scene",
            text: "Örnek oturma odasına geç",
            sceneId: "living",
            targetYaw: 0,
            targetPitch: 0
          }]
        },
        living: {
          title: demoRooms.living.title,
          type: "equirectangular",
          panorama: demoRooms.living.panorama,
          hotSpots: [{
            pitch: -6,
            yaw: 180,
            type: "scene",
            text: "Örnek yatak odasına dön",
            sceneId: "bedroom",
            targetYaw: 180,
            targetPitch: 0
          }]
        }
      }
    });
    demoPanoramaViewer.on("scenechange", updateDemoRoom);
    updateDemoRoom("bedroom");
  } catch (error) {
    console.error("360° demo görüntüleyicisi başlatılamadı.",error);
    content.querySelector(".demo-credit").insertAdjacentHTML("afterbegin", `<span class="panorama-error">360° görüntüleyici başlatılamadı. İnternet bağlantınızı kontrol edin.</span>`);
  }
}

function updateDemoRoom(sceneId) {
  const currentScene = demoRooms[sceneId];
  if (!currentScene) return;
  document.querySelector("#tour-title").textContent = currentScene.title;
  document.querySelectorAll("[data-demo-scene]").forEach(button => {
    const selected = button.dataset.demoScene === sceneId;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  const nextScene = demoRooms[currentScene.next];
  document.querySelector("[data-demo-next]").innerHTML = `${nextScene.title} <span>→</span>`;
  document.querySelector("#demo-credit-line").innerHTML = `Demo panoraması · Gerçek ilan değildir · <a href="${currentScene.source}" target="_blank" rel="noopener noreferrer">${currentScene.credit}</a>`;
}

function changeDemoRoom(sceneId) {
  if (!demoPanoramaViewer || !demoRooms[sceneId]) return;
  demoPanoramaViewer.loadScene(sceneId, 0, 0, 100);
}

function generateContract(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const listing = listings.find(item => item.id === data.property);
  const missing = [];
  if (!data.owner.trim()) missing.push("Mal sahibi / kiraya veren adı girilmemiş.");
  if (!data.client.trim()) missing.push("Alıcı / kiracı adı girilmemiş.");
  if (!data.price.trim()) missing.push("İşlem bedeli belirtilmemiş.");
  if (!data.date) missing.push("İşlem tarihi belirtilmemiş.");
  if (!listing) missing.push("Portföyden taşınmaz seçilmemiş.");
  const warnings = ["Tarafların kimlik ve temsil yetkisi resmî kaynaktan doğrulanmadı.","Tapu, takyidat, imar ve taşınmazın hukuki durumu doğrulanmadı.","Ödeme, teslim, temerrüt ve özel şartlar taraflarca ayrıca değerlendirilmelidir."];
  const checks = [
    ...missing.map(item => `<div class="check-item warn"><i>!</i><span>${escapeHtml(item)}</span></div>`),
    ...(missing.length ? [] : [`<div class="check-item ok"><i>✓</i><span>Girilen temel bilgiler tamamlandı; bu, bilgilerin doğruluğunun doğrulandığı anlamına gelmez.</span></div>`]),
    ...warnings.map(item => `<div class="check-item warn"><i>!</i><span>${escapeHtml(item)}</span></div>`)
  ];
  const price = data.price ? `${escapeHtml(data.price)} TL` : "[İŞLEM BEDELİ GİRİLMELİ]";
  const property = listing ? `${listing.title}, ${listing.district ? `${listing.district}, ` : ""}${listing.city}; ${listing.area ? `${listing.area} m²` : "alan bilgisi belirtilmemiş"}` : "[TAŞINMAZ BİLGİSİ GİRİLMELİ]";
  const draft = `ÖN TASLAK — HUKUKİ BELGE DEĞİLDİR\n\nİşlem türü: ${escapeHtml(data.transaction)}\nTaşınmaz: ${escapeHtml(property)}\nMal sahibi / kiraya veren: ${escapeHtml(data.owner || "[BİLGİ GİRİLMELİ]")}\nAlıcı / kiracı: ${escapeHtml(data.client || "[BİLGİ GİRİLMELİ]")}\nİşlem bedeli: ${price}\nTarih: ${escapeHtml(data.date || "[TARİH GİRİLMELİ]")}\n\nÖzel notlar: ${escapeHtml(data.notes || "[Taraflarca değerlendirilecek özel koşullar eklenmeli.]")}\n\nBu taslak, kullanıcı tarafından girilen alanların düzenli bir özetidir. Sözleşme hükmü veya hukuki yeterlilik değerlendirmesi değildir.`;
  document.querySelector("#contract-result").innerHTML = `<div class="result-heading"><div><span class="section-kicker">ASİSTAN ÇIKTISI</span><h2>Ön kontrol ve taslak</h2></div><span class="draft-badge">İnsan incelemesi gerekli</span></div><div class="check-list">${checks.join("")}</div><div class="generated-draft">${draft}</div><button type="button" id="copy-draft" class="secondary-button result-copy">Taslağı kopyala</button>`;
}

document.querySelector("#ai-search-form").addEventListener("submit",event => {event.preventDefault();runAiSearch(document.querySelector("#ai-query").value);});
document.querySelectorAll("[data-query]").forEach(button => button.addEventListener("click",() => {document.querySelector("#ai-query").value=button.dataset.query;runAiSearch(button.dataset.query);}));
document.querySelector("#type-filter").addEventListener("change",() => renderPublicListings());
document.querySelector("#kind-filter").addEventListener("change",() => renderPublicListings());
document.querySelector("#demo-tour-button").addEventListener("click",openDemoTour);
document.querySelector("#save-search-button").addEventListener("click",saveCurrentSearch);
document.querySelectorAll("[data-book-appointment]").forEach(button => button.addEventListener("click",openAppointmentDialog));
document.querySelector("#public-appointment-date").addEventListener("change",renderPublicAppointmentOptions);
document.addEventListener("click",event => {
  const applySearch = event.target.closest("[data-apply-search]");
  if (applySearch) {applySavedSearch(applySearch.dataset.applySearch);return;}
  const deleteSearch = event.target.closest("[data-delete-search]");
  if (deleteSearch) {deleteSavedSearch(deleteSearch.dataset.deleteSearch);return;}
  const favorite = event.target.closest("[data-favorite]");
  if (favorite) {
    const id = favorite.dataset.favorite;
    favorites = favorites.includes(id) ? favorites.filter(value => value !== id) : [...favorites,id];
    if (persist(FAVORITE_KEY,favorites)) renderPublicListings();
    return;
  }
  const tour = event.target.closest("[data-tour]");
  if (tour) {openTour(tour.dataset.tour);return;}
  const contact = event.target.closest("[data-contact]");
  if (contact) {openLeadDialog(contact.dataset.contact);return;}
  const openTourButton = event.target.closest("[data-open-tour]");
  if (openTourButton) {window.open(openTourButton.dataset.openTour,"_blank","noopener,noreferrer");return;}
  const demoScene = event.target.closest("[data-demo-scene]");
  if (demoScene) {changeDemoRoom(demoScene.dataset.demoScene);return;}
  if (event.target.closest("[data-demo-next]")) {
    const current = demoPanoramaViewer?.getScene();
    if (current && demoRooms[current]) changeDemoRoom(demoRooms[current].next);
    return;
  }
  if (event.target.closest("[data-close-dialog]")) event.target.closest("dialog")?.close();
});

renderAdvisorProfile();
renderPublicListings();
renderSavedSearches();
