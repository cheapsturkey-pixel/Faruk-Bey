const STORAGE_KEY = "yuva.crm.portfolio.v1";
const LEAD_KEY = "yuva.crm.leads.v1";
const ADVISOR_KEY = "yuva.crm.advisor.profile.v1";
const APPOINTMENT_KEY = "yuva.crm.appointments.v1";
const ACTIVITY_KEY = "yuva.crm.activities.v1";
const FAVORITE_KEY = "yuva.crm.favorites.v1";
const SAVED_SEARCH_KEY = "yuva.crm.saved-searches.v1";
const AUTH_KEY = "yuva.crm.admin.password.v1";
const ACCOUNT_KEY = "yuva.crm.admin.account.v1";
const SESSION_KEY = "yuva.crm.admin.session.v1";
const BACKUP_VERSION = 1;
const BACKUP_KEYS = [STORAGE_KEY,LEAD_KEY,ADVISOR_KEY,APPOINTMENT_KEY,ACTIVITY_KEY,FAVORITE_KEY,SAVED_SEARCH_KEY];

const sampleListings = [
  {id:"yuva-101",title:"Işıkla dolu, şehirli bir yaşam",kind:"Daire",type:"Satılık",city:"İstanbul",district:"Kadıköy",price:8750000,area:128,rooms:"3+1",description:"Geniş pencereleri, ferah salonu ve ulaşım noktalarına yakınlığıyla öne çıkan modern daire.",status:"active",image:"https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=85",tour:"",sampleListing:true},
  {id:"yuva-102",title:"Doğayla iç içe bahçeli villa",kind:"Villa",type:"Satılık",city:"İzmir",district:"Urla",price:16400000,area:215,rooms:"4+1",description:"Geniş özel bahçesi, gün ışığı alan yaşam alanları ve sakin çevresiyle keyifli bir ev.",status:"active",image:"https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1000&q=85",tour:"",sampleListing:true},
  {id:"yuva-103",title:"Geleceğe açılan geniş arsa",kind:"Arsa",type:"Satılık",city:"Muğla",district:"Bodrum",price:6900000,area:620,rooms:"",description:"Konumu ve geniş alanıyla yatırım değerlendirmesine uygun arsa. İmar ve tapu bilgileri ayrıca doğrulanmalıdır.",status:"active",image:"https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=85",tour:"",sampleListing:true},
  {id:"yuva-104",title:"Merkezi konumda sakin daire",kind:"Daire",type:"Kiralık",city:"İstanbul",district:"Beşiktaş",price:42500,area:96,rooms:"2+1",description:"Günlük yaşamın içinde, bakımlı ve kullanıma hazır daire.",status:"active",image:"https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1000&q=85",tour:"",sampleListing:true}
];

function safeRead(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    if (!value) return structuredClone(fallback);
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : structuredClone(fallback);
  } catch (error) {
    console.error(`Yönetim verileri okunamadı (${key}).`, error);
    return structuredClone(fallback);
  }
}

function safeReadObject(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    if (!value) return {...fallback};
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {...fallback};
  } catch (error) {
    console.error(`Danışman profili okunamadı (${key}).`, error);
    return {...fallback};
  }
}

function safeWrite(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Yönetim verileri kaydedilemedi (${key}).`, error);
    notify("Kaydedilemedi. Tarayıcı depolama alanını kontrol edin.");
    return false;
  }
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, character => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[character]));
}

function formatPrice(price, type) {
  const amount = new Intl.NumberFormat("tr-TR").format(Number(price) || 0);
  return type === "Kiralık" ? `${amount} TL / ay` : `${amount} TL`;
}

function normalizeMatchText(value) {
  return String(value || "").toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ı/g,"i").replace(/[^a-z0-9]+/g," ").trim();
}

function getLeadListingMatches(lead) {
  const preferences = lead.preferences || {};
  const notes = normalizeMatchText(lead.notes);
  const requestedLocation = normalizeMatchText(preferences.location || "");
  const knownLocations = ["istanbul","izmir","ankara","mugla","antalya","bursa","adana","mersin","eskisehir","gaziantep","trabzon","kayseri","konya","bodrum","urla","kadikoy","besiktas"];
  const noteLocation = knownLocations.find(location => notes.includes(location)) || "";
  const location = requestedLocation || noteLocation;
  const requestedKind = preferences.kind || (/\b(arsa|arazi)\b/.test(notes) ? "Arsa" : /\b(villa|mustakil)\b/.test(notes) ? "Villa" : /\b(daire|apartman)\b/.test(notes) ? "Daire" : "");
  const requestedType = preferences.type || (/\b(kiralik|kiraya)\b/.test(notes) ? "Kiralık" : /\b(satilik|satin)\b/.test(notes) ? "Satılık" : "");
  const budget = Number(preferences.maxBudget) || 0;
  const minArea = Number(preferences.minArea) || 0;
  const features = [
    ["bahçe",/\b(bahce|bahceli)\b/],
    ["otopark",/\botopark\b/],
    ["deniz",/\b(deniz|sahil)\b/],
    ["metro",/\bmetro\b/],
    ["manzara",/\bmanzara\b/]
  ].filter(([,pattern]) => pattern.test(notes));
  const hasInquiryListing = listings.some(item => item.id === lead.listingId && item.status === "active");
  const hasCriteria = Boolean(location || requestedKind || requestedType || budget || minArea || features.length || hasInquiryListing);
  if (!hasCriteria) return [];
  const weights = {location:25,type:20,kind:20,budget:20,area:15,feature:10,inquiry:10};
  return listings.filter(item => item.status === "active").map(item => {
    let possible = 0;
    let earned = 0;
    const reasons = [];
    const assess = (label,weight,known,matches) => {
      possible += weight;
      if (known && matches) earned += weight;
      reasons.push(`${label}: ${known ? matches ? "uygun" : "uygun değil" : "ilan bilgisi eksik"}`);
    };
    if (location) assess(`Konum ${location}`,weights.location,Boolean(item.city || item.district),normalizeMatchText(`${item.city || ""} ${item.district || ""}`).includes(location));
    if (requestedType) assess(requestedType,weights.type,Boolean(item.type),item.type === requestedType);
    if (requestedKind) assess(requestedKind,weights.kind,Boolean(item.kind),item.kind === requestedKind);
    if (budget) assess(`Bütçe ≤ ${new Intl.NumberFormat("tr-TR").format(budget)} TL`,weights.budget,Number(item.price) > 0,Number(item.price) <= budget);
    if (minArea) assess(`${minArea} m²+`,weights.area,Number(item.area) > 0,Number(item.area) >= minArea);
    const description = normalizeMatchText(`${item.title || ""} ${item.description || ""}`);
    features.forEach(([label,pattern]) => assess(label,weights.feature,true,pattern.test(description)));
    if (lead.listingId) assess("İlgilendiği ilan",weights.inquiry,true,item.id === lead.listingId);
    return {item,score:possible ? Math.round(earned / possible * 100) : 0,reasons};
  }).sort((left,right) => right.score-left.score || Number(right.item.area || 0)-Number(left.item.area || 0)).slice(0,3);
}

function listingCheckSummary(listing) {
  const today = localDateKey();
  const checks = [
    Boolean(listing.deedStatus),
    Boolean(listing.zoningStatus),
    Boolean(listing.authorizationExpiry),
    Boolean(listing.verifiedAt),
    listing.monthlyDues !== undefined && listing.monthlyDues !== ""
  ];
  const expired = Boolean(listing.authorizationExpiry && listing.authorizationExpiry < today);
  const issues = listing.deedStatus === "issue" || listing.zoningStatus === "issue" || expired;
  return {completed:checks.filter(Boolean).length,total:checks.length,expired,issues};
}

function notify(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => toast.classList.remove("visible"), 2600);
}

let listings = safeRead(STORAGE_KEY, sampleListings);
let leads = safeRead(LEAD_KEY, []);
let appointments = safeRead(APPOINTMENT_KEY, []);
let activities = safeRead(ACTIVITY_KEY, []);
let advisorProfile = safeReadObject(ADVISOR_KEY, {});
let authMode = "login";
const leadStatuses = ["Yeni talep", "İletişimde", "İlk görüşme", "Görüntüleme planlandı", "Teklif", "Takipte", "Kazanıldı", "Kaybedildi", "Tamamlandı"];
const terminalLeadStatuses = ["Kazanıldı", "Kaybedildi", "Tamamlandı"];

function normalizeLeadStatus(status) {
  if (status === "Yeni") return "Yeni talep";
  if (status === "İletişime geçildi") return "İletişimde";
  return leadStatuses.includes(status) ? status : "Yeni talep";
}
const appointmentStatuses = ["Planlandı", "Tamamlandı", "İptal"];
const defaultSchedule = {days:[1,2,3,4,5],start:"09:00",end:"17:00",interval:30};

function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}

function getAdvisorSchedule() {
  const schedule = advisorProfile.schedule || {};
  return {
    days:Array.isArray(schedule.days) ? schedule.days.map(Number).filter(day => day >= 0 && day <= 6) : defaultSchedule.days,
    start:/^\d{2}:\d{2}$/.test(schedule.start || "") ? schedule.start : defaultSchedule.start,
    end:/^\d{2}:\d{2}$/.test(schedule.end || "") ? schedule.end : defaultSchedule.end,
    interval:[15,30,60].includes(Number(schedule.interval)) ? Number(schedule.interval) : defaultSchedule.interval
  };
}

function setAuthMode(mode = "") {
  const hasPassword = Boolean(localStorage.getItem(AUTH_KEY));
  const account = safeReadObject(ACCOUNT_KEY,{});
  authMode = mode || (hasPassword ? "login" : "register");
  const isRegister = authMode === "register";
  document.querySelector("#auth-title").textContent = isRegister ? "Danışman hesabı oluştur" : "Danışman girişi";
  document.querySelector("#auth-description").textContent = isRegister
    ? "Tek kişilik CRM hesabınızı oluşturup panele geçin."
    : "Hesabınıza giriş yaparak çalışma alanınızı açın.";
  document.querySelector("#auth-submit").textContent = isRegister ? "Hesap oluştur ve devam et" : "Giriş yap";
  document.querySelector("#password-label").textContent = isRegister ? "Parola oluşturun" : "Parola";
  document.querySelector("#admin-password").autocomplete = isRegister ? "new-password" : "current-password";
  document.querySelector("#auth-account-fields").classList.toggle("hidden",!isRegister);
  document.querySelector("#auth-login-email-field").classList.toggle("hidden",isRegister || !account.email);
  document.querySelector("#admin-name").required = isRegister;
  document.querySelector("#admin-email").required = isRegister;
  document.querySelector("#admin-login-email").required = !isRegister && Boolean(account.email);
  document.querySelector("#admin-login-email").value = "";
  document.querySelector("#password-confirm-label").classList.toggle("hidden",!isRegister);
  document.querySelector("#admin-password-confirm").classList.toggle("hidden",!isRegister);
  document.querySelector("#admin-password-confirm").required = isRegister;
  document.querySelector("#auth-switch").textContent = isRegister ? "Zaten hesabınız var mı? Giriş yapın" : "Hesabınız yok mu? Kayıt oluştur";
  document.querySelector("#auth-reset").classList.toggle("hidden",isRegister || !hasPassword);
  document.querySelector("#auth-mode-note").textContent = isRegister && hasPassword
    ? "Bu cihazdaki hesabın yerini alır; CRM kayıtlarınız korunur."
    : "Hesap ve parola yalnızca bu tarayıcıda saklanır.";
}

async function hashPassword(password) {
  if (!window.crypto?.subtle) throw new Error("Güvenli parola özeti için Web Crypto kullanılamıyor.");
  const digest = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2,"0")).join("");
}

function showAdmin() {
  document.querySelector("#auth-screen").classList.add("hidden");
  document.querySelector("#admin-app").classList.remove("hidden");
  renderAdmin();
}

function lockAdmin() {
  sessionStorage.removeItem(SESSION_KEY);
  document.querySelector("#admin-app").classList.add("hidden");
  document.querySelector("#auth-screen").classList.remove("hidden");
  document.querySelector("#auth-form").reset();
  setAuthMode();
}

document.querySelector("#auth-form").addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const password = form.elements.password.value;
  const error = document.querySelector("#auth-error");
  error.textContent = "";
  try {
    if (authMode === "register") {
      if (password !== form.elements.confirmPassword.value) {
        error.textContent = "Girdiğiniz parolalar aynı değil.";
        return;
      }
      if (localStorage.getItem(AUTH_KEY) && !window.confirm("Bu cihazdaki giriş hesabı değiştirilecek. Portföy, müşteri ve randevu kayıtlarınız korunacak. Devam edilsin mi?")) return;
      localStorage.setItem(AUTH_KEY, await hashPassword(password));
      localStorage.setItem(ACCOUNT_KEY,JSON.stringify({
        name:String(form.elements.accountName.value || "").trim(),
        email:String(form.elements.email.value || "").trim().toLocaleLowerCase("tr-TR")
      }));
    } else {
      const savedHash = localStorage.getItem(AUTH_KEY);
      if (!savedHash || await hashPassword(password) !== savedHash) {
        error.textContent = "Parola doğru değil.";
        return;
      }
      const account = safeReadObject(ACCOUNT_KEY,{});
      const enteredEmail = String(form.elements.loginEmail.value || "").trim().toLocaleLowerCase("tr-TR");
      if (account.email && enteredEmail !== String(account.email).toLocaleLowerCase("tr-TR")) {
        error.textContent = "E-posta adresi kayıtlı hesapla eşleşmiyor.";
        return;
      }
    }
    sessionStorage.setItem(SESSION_KEY, "open");
    showAdmin();
  } catch (authError) {
    console.error("Yönetim oturumu başlatılamadı.", authError);
    error.textContent = "Oturum açılamadı. Tarayıcı desteğini ve yerel depolama ayarlarını kontrol edin.";
  }
});
document.querySelector("#auth-switch").addEventListener("click",() => {
  document.querySelector("#auth-error").textContent = "";
  document.querySelector("#auth-form").reset();
  setAuthMode(authMode === "register" ? "login" : "register");
});
document.querySelector("#auth-reset").addEventListener("click",() => {
  const confirmed = window.confirm("Bu tarayıcıdaki hesap ve parola silinip yeniden kayıt ekranı açılacak. Portföy, müşteri ve randevu kayıtlarınız korunur. Devam edilsin mi?");
  if (!confirmed) return;
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(ACCOUNT_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  document.querySelector("#auth-form").reset();
  document.querySelector("#auth-error").textContent = "";
  setAuthMode("register");
});

function renderAdmin() {
  const filter = document.querySelector("#admin-filter").value;
  const filtered = listings.filter(item => filter === "all" || item.status === filter);
  document.querySelector("#metric-total").textContent = listings.length;
  document.querySelector("#metric-live").textContent = listings.filter(item => item.status === "active").length;
  document.querySelector("#metric-leads").textContent = leads.filter(lead => !terminalLeadStatuses.includes(normalizeLeadStatus(lead.status))).length;
  document.querySelector("#metric-appointments").textContent = appointments.filter(item => item.status === "Planlandı" && new Date(item.startsAt) >= new Date()).length;
  document.querySelector("#metric-follow-ups").textContent = leads.filter(lead => lead.followUpAt && lead.followUpAt <= localDateKey() && !terminalLeadStatuses.includes(normalizeLeadStatus(lead.status))).length;
  const container = document.querySelector("#admin-listings");
  container.innerHTML = filtered.length ? filtered.map(item => `<div class="admin-row">
    <div class="property-image admin-thumb">${item.image ? `<img src="${escapeHtml(item.image)}" alt="" loading="lazy">` : `<div class="image-placeholder">⌂</div>`}</div>
    <div><div class="admin-title">${escapeHtml(item.title)}</div><div class="admin-subtitle">${escapeHtml(item.district ? `${item.district}, ` : "")}${escapeHtml(item.city)} · ${escapeHtml(item.kind)}</div><small class="listing-check-summary ${listingCheckSummary(item).issues ? "has-issue" : ""}">Portföy kontrol bilgisi: ${listingCheckSummary(item).completed}/${listingCheckSummary(item).total}${listingCheckSummary(item).expired ? " · Yetki tarihi geçmiş" : ""}</small></div>
    <div class="admin-cell">${formatPrice(item.price,item.type)}</div>
    <div><span class="status-chip ${item.status === "draft" ? "draft" : ""}">${item.status === "active" ? "Yayında" : "Taslak"}</span></div>
    <div class="admin-cell">${item.area ? `${escapeHtml(item.area)} m²` : "—"}</div>
    <div class="row-actions"><button class="row-action" data-edit="${escapeHtml(item.id)}">Düzenle</button><button class="row-action delete" data-delete="${escapeHtml(item.id)}">Sil</button></div>
  </div>`).join("") : `<div class="empty-inline">Bu durumda ilan bulunmuyor.</div>`;
  renderLeads();
  renderContractOptions();
  renderAdvisorProfile();
  renderAppointmentOptions();
  renderAppointments();
  renderActivities();
}

function renderLeads() {
  const container = document.querySelector("#lead-list");
  const search = document.querySelector("#lead-search");
  const filter = document.querySelector("#lead-follow-up-filter").value;
  const query = search.value.trim().toLocaleLowerCase("tr-TR");
  const keepSearchFocus = document.activeElement === search;
  const cursor = keepSearchFocus ? search.selectionStart : null;
  const restoreSearchFocus = () => {
    if (!keepSearchFocus) return;
    search.focus();
    if (cursor !== null) search.setSelectionRange(cursor, cursor);
  };
  if (!leads.length) {
    container.innerHTML = `<div class="empty-inline">Henüz iletişim talebi yok. Müşteri sitesi üzerinden iletilen talepler burada görünür.</div>`;
    restoreSearchFocus();
    return;
  }
  const today = localDateKey();
  const filteredLeads = [...leads].reverse().filter(lead => {
    const searchable = [lead.name,lead.phone,lead.listingTitle,lead.notes].join(" ").toLocaleLowerCase("tr-TR");
    const matchesSearch = !query || searchable.includes(query);
    const hasFollowUp = Boolean(lead.followUpAt);
    const isDue = hasFollowUp && lead.followUpAt <= today;
    const matchesFilter = filter === "all" || (filter === "due" && isDue) || (filter === "scheduled" && hasFollowUp && lead.followUpAt > today) || (filter === "unscheduled" && !hasFollowUp);
    return matchesSearch && matchesFilter;
  });
  if (!filteredLeads.length) {
    container.innerHTML = `<div class="empty-inline">Bu aramaya veya takip filtresine uygun müşteri bulunamadı.</div>`;
    restoreSearchFocus();
    return;
  }
  container.innerHTML = filteredLeads.map(lead => {
    const status = normalizeLeadStatus(lead.status);
    const phone = String(lead.phone || "");
    const tel = phone.replace(/[^\d+]/g,"");
    const date = new Date(lead.createdAt);
    const createdAt = Number.isNaN(date.getTime()) ? "Tarih bilgisi yok" : date.toLocaleString("tr-TR");
    const followUpDate = String(lead.followUpAt || "");
    const followUpState = !followUpDate ? "Takip tarihi belirlenmedi" : followUpDate <= today ? "Bugün / gecikti" : "Planlandı";
    const preferences = lead.preferences || {};
    const preferenceSummary = [
      preferences.location,
      preferences.type,
      preferences.kind,
      Number(preferences.maxBudget) > 0 ? `≤ ${new Intl.NumberFormat("tr-TR").format(Number(preferences.maxBudget))} TL` : "",
      Number(preferences.minArea) > 0 ? `${escapeHtml(preferences.minArea)} m²+` : ""
    ].filter(Boolean).join(" · ");
    return `<article class="lead-card ${followUpDate && followUpDate <= today ? "lead-follow-up-due" : ""}">
    <div class="lead-avatar">${escapeHtml(String(lead.name || "?").slice(0,1).toLocaleUpperCase("tr-TR"))}</div>
    <div class="lead-details"><strong>${escapeHtml(lead.name)}</strong><p>${escapeHtml(lead.listingTitle || "Genel danışmanlık talebi")}</p>${lead.notes ? `<p class="lead-note">${escapeHtml(lead.notes)}</p>` : ""}<small>${escapeHtml(createdAt)}</small></div>
    <div class="lead-actions"><a class="lead-contact" href="tel:${escapeHtml(tel)}">${escapeHtml(phone || "Telefon yok")}</a><label class="lead-status-label">Takip durumu<select data-lead-status="${escapeHtml(lead.id)}">${leadStatuses.map(option => `<option${option === status ? " selected" : ""}>${option}</option>`).join("")}</select></label></div>
    ${preferenceSummary ? `<p class="lead-preference-summary"><strong>Aradığı:</strong> ${escapeHtml(preferenceSummary)}</p>` : ""}
    <div class="lead-match-tools"><button type="button" class="secondary-button" data-match-lead="${escapeHtml(lead.id)}">Uygun ilanları bul</button><div data-lead-match-results="${escapeHtml(lead.id)}" class="lead-match-results" aria-live="polite"></div></div>
    <form class="lead-follow-up-form" data-lead-follow-up="${escapeHtml(lead.id)}">
      <label>Geri dönüş tarihi<input name="followUpAt" type="date" value="${escapeHtml(followUpDate)}"></label>
      <label>Yapılacak işlem<input name="followUpNote" maxlength="180" value="${escapeHtml(lead.followUpNote || "")}" placeholder="Örn. Müşteriyi ara"></label>
      <span class="lead-follow-up-state">${escapeHtml(followUpState)}</span>
      <button type="submit" class="secondary-button">Takibi kaydet</button>
    </form>
  </article>`;
  }).join("");
  restoreSearchFocus();
}

function addActivity(title, detail, leadId = "", appointmentId = "") {
  const activity = {id:`activity-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,title,detail,leadId,appointmentId,createdAt:new Date().toISOString()};
  activities.unshift(activity);
  if (!safeWrite(ACTIVITY_KEY,activities)) {
    activities.shift();
    console.error("CRM işlemi kaydedildi; aktivite geçmişi güncellenemedi.");
    return false;
  }
  renderActivities();
  return true;
}

function renderActivities() {
  const container = document.querySelector("#activity-list");
  if (!activities.length) {
    container.innerHTML = `<div class="empty-inline">Henüz aktivite yok. Müşteri talepleri ve randevular oluştukça burada görünür.</div>`;
    return;
  }
  container.innerHTML = activities.slice().sort((left,right) => new Date(right.createdAt) - new Date(left.createdAt)).slice(0,30).map(activity => {
    const date = new Date(activity.createdAt);
    const timestamp = Number.isNaN(date.getTime()) ? "Tarih bilgisi yok" : date.toLocaleString("tr-TR");
    return `<article class="activity-item"><span class="activity-marker"></span><div><strong>${escapeHtml(activity.title || "CRM aktivitesi")}</strong><p>${escapeHtml(activity.detail || "")}</p><small>${escapeHtml(timestamp)}</small></div></article>`;
  }).join("");
}

function renderAppointmentOptions() {
  const leadSelect = document.querySelector("#appointment-lead");
  const propertySelect = document.querySelector("#appointment-property");
  if (!leadSelect || !propertySelect) return;
  const selectedLead = leadSelect.value;
  const selectedProperty = propertySelect.value;
  leadSelect.innerHTML = `<option value="">Müşteri seçmeden planla</option>${leads.map(lead => `<option value="${escapeHtml(lead.id)}">${escapeHtml(lead.name || "İsimsiz müşteri")} · ${escapeHtml(lead.listingTitle || "Genel talep")}</option>`).join("")}`;
  propertySelect.innerHTML = `<option value="">İlan seçmeden planla</option>${listings.map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.title)} · ${escapeHtml(item.city)}</option>`).join("")}`;
  if (leads.some(item => String(item.id) === selectedLead)) leadSelect.value = selectedLead;
  if (listings.some(item => item.id === selectedProperty)) propertySelect.value = selectedProperty;
}

function renderAppointments() {
  const container = document.querySelector("#appointment-list");
  if (!container) return;
  if (!appointments.length) {
    container.innerHTML = `<div class="empty-inline">Henüz randevu planlanmadı.</div>`;
    return;
  }
  const sorted = appointments.slice().sort((left,right) => {
    const leftDate = new Date(left.startsAt).getTime();
    const rightDate = new Date(right.startsAt).getTime();
    const now = Date.now();
    const leftUpcoming = left.status === "Planlandı" && leftDate >= now;
    const rightUpcoming = right.status === "Planlandı" && rightDate >= now;
    if (leftUpcoming !== rightUpcoming) return leftUpcoming ? -1 : 1;
    return leftUpcoming ? leftDate - rightDate : rightDate - leftDate;
  });
  container.innerHTML = sorted.map(appointment => {
    const date = new Date(appointment.startsAt);
    const formattedDate = Number.isNaN(date.getTime()) ? "Geçersiz tarih" : date.toLocaleString("tr-TR",{dateStyle:"medium",timeStyle:"short"});
    const lead = leads.find(item => String(item.id) === String(appointment.leadId));
    const property = listings.find(item => item.id === appointment.propertyId);
    const status = appointmentStatuses.includes(appointment.status) ? appointment.status : "Planlandı";
    return `<article class="appointment-card ${status === "Tamamlandı" ? "is-complete" : status === "İptal" ? "is-cancelled" : ""}">
      <div class="appointment-date"><strong>${escapeHtml(formattedDate)}</strong><span>${escapeHtml(status)}</span></div>
      <div class="appointment-details"><strong>${escapeHtml(lead?.name || "Müşteri görüşmesi")}</strong><p>${escapeHtml(property?.title || lead?.listingTitle || "Genel görüşme")}</p>${appointment.location ? `<small>${escapeHtml(appointment.location)}</small>` : ""}${appointment.notes ? `<small>${escapeHtml(appointment.notes)}</small>` : ""}</div>
      ${status === "Planlandı" ? `<div class="appointment-actions"><button type="button" data-appointment-status="Tamamlandı" data-appointment-id="${escapeHtml(appointment.id)}">Tamamlandı</button><button type="button" data-appointment-status="İptal" data-appointment-id="${escapeHtml(appointment.id)}">İptal et</button></div>` : ""}
    </article>`;
  }).join("");
}

function renderAdvisorProfile() {
  const form = document.querySelector("#advisor-profile-form");
  if (!form) return;
  form.elements.name.value = String(advisorProfile.name || "");
  form.elements.phone.value = String(advisorProfile.phone || "");
  form.elements.intro.value = String(advisorProfile.intro || "");
  const schedule = getAdvisorSchedule();
  form.querySelectorAll("[name='scheduleDay']").forEach(input => { input.checked = schedule.days.includes(Number(input.value)); });
  form.elements.scheduleStart.value = schedule.start;
  form.elements.scheduleEnd.value = schedule.end;
  form.elements.scheduleInterval.value = String(schedule.interval);
}

function renderContractOptions() {
  const select = document.querySelector("#contract-property");
  const current = select.value;
  select.innerHTML = `<option value="">Mülk seçin</option>${listings.map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.title)} — ${escapeHtml(item.city)}</option>`).join("")}`;
  if (listings.some(item => item.id === current)) select.value = current;
  else if (listings.length) select.value = listings[0].id;
}

function openListingForm(listing = null) {
  const form = document.querySelector("#listing-form");
  form.reset();
  form.elements.id.value = listing?.id || "";
  if (listing) Object.entries(listing).forEach(([key,value]) => { if (form.elements[key]) form.elements[key].value = value ?? ""; });
  document.querySelector("#listing-dialog-title").textContent = listing ? "İlanı düzenle" : "Yeni ilan";
  document.querySelector("#listing-dialog").showModal();
}

function saveListing(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const id = data.id || `yuva-${Date.now()}`;
  const index = listings.findIndex(item => item.id === id);
  const listing = {
    ...data,id,
    price:Number(String(data.price).replace(/[^\d]/g,""))||0,
    area:Number(String(data.area).replace(/[^\d]/g,""))||0,
    monthlyDues:data.monthlyDues === "" ? "" : Math.max(0,Number(String(data.monthlyDues || "").replace(/[^\d]/g,""))||0),
    sampleListing:false
  };
  if (index >= 0) listings[index] = {...listings[index],...listing};
  else listings.unshift(listing);
  if (!safeWrite(STORAGE_KEY,listings)) return;
  document.querySelector("#listing-dialog").close();
  renderAdmin();
  addActivity(index >= 0 ? "Portföy ilanı güncellendi" : "Portföye yeni ilan eklendi",listing.title);
  notify(index >= 0 ? "İlan güncellendi." : "İlan portföye eklendi.");
}

function saveAppointment(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const startsAt = new Date(`${data.date}T${data.time}`);
  if (Number.isNaN(startsAt.getTime())) {
    notify("Geçerli bir randevu tarihi ve saati seçin.");
    return;
  }
  if (startsAt.getTime() <= Date.now()) {
    notify("Randevu tarihi ileri bir zaman olmalı.");
    return;
  }
  const schedule = getAdvisorSchedule();
  const minute = startsAt.getHours()*60 + startsAt.getMinutes();
  const opening = Number(schedule.start.slice(0,2))*60 + Number(schedule.start.slice(3));
  const closing = Number(schedule.end.slice(0,2))*60 + Number(schedule.end.slice(3));
  const slotEnd = startsAt.getTime() + schedule.interval*60000;
  const occupied = appointments.some(item => {
    if (item.status !== "Planlandı") return false;
    const bookedStart = new Date(item.startsAt).getTime();
    const bookedEnd = bookedStart + (Number(item.durationMinutes) || schedule.interval)*60000;
    return startsAt.getTime() < bookedEnd && slotEnd > bookedStart;
  });
  if (!schedule.days.includes(startsAt.getDay()) || minute < opening || minute + schedule.interval > closing || minute % schedule.interval !== opening % schedule.interval) {
    notify("Seçilen saat çalışma takviminizin dışında.");
    return;
  }
  if (occupied) {
    notify("Bu saat için planlanmış başka bir randevu var.");
    return;
  }
  const lead = leads.find(item => String(item.id) === data.leadId);
  const property = listings.find(item => item.id === data.propertyId);
  const appointment = {
    id:`appointment-${Date.now()}`,
    leadId:lead?.id || "",
    propertyId:property?.id || "",
    startsAt:startsAt.toISOString(),
    durationMinutes:schedule.interval,
    status:"Planlandı",
    location:data.location.trim(),
    notes:data.notes.trim(),
    createdAt:new Date().toISOString()
  };
  appointments.unshift(appointment);
  if (!safeWrite(APPOINTMENT_KEY,appointments)) {
    appointments.shift();
    return;
  }
  form.reset();
  renderAdmin();
  addActivity("Yeni randevu planlandı",`${lead?.name || "Müşteri görüşmesi"} · ${property?.title || "Genel görüşme"} · ${startsAt.toLocaleString("tr-TR")}`,lead?.id || "",appointment.id);
  notify("Randevu ajandaya eklendi.");
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
  if (listing && !listing.deedStatus) missing.push("Tapu / takyidat kontrol durumu portföy kaydında belirtilmemiş.");
  if (listing && !listing.zoningStatus) missing.push("İmar durumu portföy kaydında belirtilmemiş.");
  if (listing && !listing.authorizationExpiry) missing.push("Yetki belgesi bitiş tarihi portföy kaydında belirtilmemiş.");
  const warnings = [
    "Tarafların kimlik ve temsil yetkisi resmî kaynaktan doğrulanmadı.",
    listing?.deedStatus === "issue" ? "Portföy kaydında tapu / takyidat için inceleme gerektiği işaretli." : "Tapu ve takyidat bilgileri resmî kaynaktan doğrulanmadı.",
    listing?.zoningStatus === "issue" ? "Portföy kaydında imar durumu için inceleme gerektiği işaretli." : "İmar bilgileri resmî kaynaktan doğrulanmadı.",
    listing?.authorizationExpiry && listing.authorizationExpiry < localDateKey() ? "Portföy kaydındaki yetki belgesi bitiş tarihi geçmiş." : "Yetki belgesi ve temsil kapsamı ayrıca kontrol edilmelidir.",
    "Ödeme, teslim ve özel koşullar taraflarca ayrıca değerlendirilmelidir."
  ];
  const checks = [...missing.map(text=>`<div class="check-item warn"><i>!</i><span>${escapeHtml(text)}</span></div>`),...(missing.length?[]:[`<div class="check-item ok"><i>✓</i><span>Temel alanlar dolduruldu; bilgilerin doğruluğu doğrulanmış değildir.</span></div>`]),...warnings.map(text=>`<div class="check-item warn"><i>!</i><span>${escapeHtml(text)}</span></div>`)];
  const property = listing ? `${listing.title}, ${listing.district ? `${listing.district}, ` : ""}${listing.city}; ${listing.area ? `${listing.area} m²` : "alan bilgisi belirtilmemiş"}` : "[TAŞINMAZ BİLGİSİ GİRİLMELİ]";
  const draft = `ÖN TASLAK — HUKUKİ BELGE DEĞİLDİR\n\nİşlem türü: ${escapeHtml(data.transaction)}\nTaşınmaz: ${escapeHtml(property)}\nMal sahibi / kiraya veren: ${escapeHtml(data.owner || "[BİLGİ GİRİLMELİ]")}\nAlıcı / kiracı: ${escapeHtml(data.client || "[BİLGİ GİRİLMELİ]")}\nİşlem bedeli: ${escapeHtml(data.price || "[İŞLEM BEDELİ GİRİLMELİ]")} TL\nTarih: ${escapeHtml(data.date || "[TARİH GİRİLMELİ]")}\n\nÖzel notlar: ${escapeHtml(data.notes || "[Özel koşullar eklenmeli.]")}\n\nBu metin kullanıcı bilgilerini özetler; sözleşme hükmü, hukuki yeterlilik veya resmî doğrulama değildir.`;
  document.querySelector("#contract-result").innerHTML = `<div class="result-heading"><div><span class="section-kicker">ASİSTAN ÇIKTISI</span><h2>Ön kontrol ve taslak</h2></div><span class="draft-badge">İnsan incelemesi gerekli</span></div><div class="check-list">${checks.join("")}</div><div class="generated-draft">${draft}</div><button type="button" id="copy-draft" class="secondary-button result-copy">Taslağı kopyala</button>`;
}

document.querySelectorAll(".admin-tab").forEach(button => button.addEventListener("click", () => {
  document.querySelectorAll(".admin-tab").forEach(tab => tab.classList.toggle("active", tab === button));
  document.querySelectorAll(".admin-panel").forEach(panel => panel.classList.toggle("active", panel.id === `${button.dataset.adminView}-panel`));
  if (button.dataset.adminView === "leads") renderLeads();
  if (button.dataset.adminView === "leads") renderActivities();
  if (button.dataset.adminView === "appointments") {renderAppointmentOptions();renderAppointments();}
  if (button.dataset.adminView === "documents") renderContractOptions();
  if (button.dataset.adminView === "advisor") renderAdvisorProfile();
  if (button.dataset.adminView === "backup") document.querySelector("#backup-file").value = "";
}));
document.querySelector("#logout-button").addEventListener("click", lockAdmin);
document.querySelector("#admin-filter").addEventListener("change", renderAdmin);
document.querySelector("#lead-search").addEventListener("input", renderLeads);
document.querySelector("#lead-follow-up-filter").addEventListener("change", renderLeads);
document.querySelector("#add-listing-button").addEventListener("click", () => openListingForm());
document.querySelector("#listing-form").addEventListener("submit", event => {event.preventDefault();if(event.currentTarget.reportValidity())saveListing(event.currentTarget);});
document.querySelector("#contract-form").addEventListener("submit", event => {event.preventDefault();if(event.currentTarget.reportValidity())generateContract(event.currentTarget);});
document.querySelector("#appointment-form").addEventListener("submit", event => {
  event.preventDefault();
  if (event.currentTarget.reportValidity()) saveAppointment(event.currentTarget);
});
document.querySelector("#export-backup").addEventListener("click", exportBackup);
document.querySelector("#select-backup").addEventListener("click", () => document.querySelector("#backup-file").click());
document.querySelector("#backup-file").addEventListener("change", event => {
  const file = event.currentTarget.files?.[0];
  if (file) importBackup(file);
});
document.querySelector("#advisor-profile-form").addEventListener("submit", event => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const formData = new FormData(form);
  const schedule = {
    days:formData.getAll("scheduleDay").map(Number),
    start:String(formData.get("scheduleStart") || ""),
    end:String(formData.get("scheduleEnd") || ""),
    interval:Number(formData.get("scheduleInterval"))
  };
  const startMinutes = Number(schedule.start.slice(0,2))*60 + Number(schedule.start.slice(3));
  const endMinutes = Number(schedule.end.slice(0,2))*60 + Number(schedule.end.slice(3));
  if (!schedule.days.length) {
    notify("En az bir çalışma günü seçin.");
    return;
  }
  if (endMinutes <= startMinutes) {
    notify("Bitiş saati başlangıç saatinden sonra olmalı.");
    return;
  }
  const nextProfile = {
    name:String(formData.get("name") || "").trim(),
    phone:String(formData.get("phone") || "").trim(),
    intro:String(formData.get("intro") || "").trim(),
    schedule
  };
  if (!safeWrite(ADVISOR_KEY,nextProfile)) return;
  advisorProfile = nextProfile;
  addActivity("Danışman profili güncellendi",String(nextProfile.name || "Danışman bilgileri"));
  notify("Danışman profili kaydedildi.");
});
document.addEventListener("change", event => {
  const select = event.target.closest("[data-lead-status]");
  if (!select) return;
  const lead = leads.find(item => item.id === select.dataset.leadStatus);
  if (!lead || !leadStatuses.includes(select.value)) return;
  const previousStatus = normalizeLeadStatus(lead.status);
  lead.status = select.value;
  if (safeWrite(LEAD_KEY,leads)) {
    addActivity("Müşteri talebi güncellendi",`${lead.name || "Müşteri"} · ${previousStatus || "Yeni"} → ${lead.status}`,lead.id);
    renderAdmin();
    notify("Müşteri talebinin durumu güncellendi.");
  } else {
    lead.status = previousStatus;
    select.value = normalizeLeadStatus(previousStatus);
  }
});
document.addEventListener("submit", event => {
  const form = event.target.closest("[data-lead-follow-up]");
  if (!form) return;
  event.preventDefault();
  const lead = leads.find(item => String(item.id) === form.dataset.leadFollowUp);
  if (!lead) {
    notify("Müşteri kaydı bulunamadı. Sayfayı yenileyip tekrar deneyin.");
    return;
  }
  const formData = new FormData(form);
  const previousDate = lead.followUpAt || "";
  const previousNote = lead.followUpNote || "";
  lead.followUpAt = String(formData.get("followUpAt") || "");
  lead.followUpNote = String(formData.get("followUpNote") || "").trim();
  if (lead.followUpNote && !lead.followUpAt) {
    lead.followUpAt = previousDate;
    lead.followUpNote = previousNote;
    notify("Yapılacak işlemi kaydetmek için geri dönüş tarihi seçin.");
    return;
  }
  if (safeWrite(LEAD_KEY,leads)) {
    addActivity(lead.followUpAt ? "Müşteri geri dönüşü planlandı" : "Müşteri geri dönüşü kaldırıldı",`${lead.name || "Müşteri"}${lead.followUpAt ? ` · ${lead.followUpAt}${lead.followUpNote ? ` · ${lead.followUpNote}` : ""}` : ""}`,lead.id);
    renderAdmin();
    notify(lead.followUpAt ? "Müşteri takibi kaydedildi." : "Geri dönüş planı kaldırıldı.");
  } else {
    lead.followUpAt = previousDate;
    lead.followUpNote = previousNote;
  }
});
document.addEventListener("click", event => {
  const matchButton = event.target.closest("[data-match-lead]");
  if (matchButton) {
    const lead = leads.find(item => String(item.id) === matchButton.dataset.matchLead);
    const card = matchButton.closest(".lead-card");
    const result = card?.querySelector("[data-lead-match-results]");
    if (!lead || !result) {
      notify("Müşteri kaydı bulunamadı. Sayfayı yenileyip tekrar deneyin.");
      return;
    }
    const matches = getLeadListingMatches(lead);
    result.innerHTML = matches.length
      ? `<p class="lead-match-disclaimer">Kayıtlı müşteri tercihleri ve ilan bilgilerine göre — danışman teyidi gerekir.</p>${matches.map(({item,score,reasons}) => `<article class="lead-match-card"><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.city)} · ${escapeHtml(item.kind)} · ${formatPrice(item.price,item.type)}</small></div><b>%${score}</b><p>${escapeHtml(reasons.join(" · "))}</p></article>`).join("")}`
      : `<p class="lead-match-empty">Eşleştirme için müşterinin aradığı bölge, bütçe veya mülk özellikleri eksik. Müşteri formundaki arayış ayrıntılarını alın.</p>`;
    result.classList.add("is-open");
    matchButton.textContent = "Eşleşmeleri yenile";
    return;
  }
  const appointmentAction = event.target.closest("[data-appointment-status]");
  if (appointmentAction) {
    const appointment = appointments.find(item => String(item.id) === appointmentAction.dataset.appointmentId);
    const nextStatus = appointmentAction.dataset.appointmentStatus;
    if (!appointment || !appointmentStatuses.includes(nextStatus) || nextStatus === "Planlandı") return;
    const previousStatus = appointment.status;
    appointment.status = nextStatus;
    if (safeWrite(APPOINTMENT_KEY,appointments)) {
      const lead = leads.find(item => String(item.id) === String(appointment.leadId));
      addActivity(`Randevu ${nextStatus.toLocaleLowerCase("tr-TR")}`,`${lead?.name || "Müşteri görüşmesi"} · ${new Date(appointment.startsAt).toLocaleString("tr-TR")}`,lead?.id || "",appointment.id);
      renderAdmin();
      notify(`Randevu ${nextStatus.toLocaleLowerCase("tr-TR")}.`);
    } else {
      appointment.status = previousStatus;
    }
    return;
  }
  const edit = event.target.closest("[data-edit]");
  if (edit) {openListingForm(listings.find(item => item.id === edit.dataset.edit));return;}
  const remove = event.target.closest("[data-delete]");
  if (remove) {
    const listing = listings.find(item => item.id === remove.dataset.delete);
    if (!listing || !window.confirm(`"${listing.title}" ilanı portföyden silinsin mi?`)) return;
    listings = listings.filter(item => item.id !== listing.id);
    if (safeWrite(STORAGE_KEY,listings)) {
      renderAdmin();
      addActivity("Portföy ilanı silindi",listing.title);
      notify("İlan portföyden silindi.");
    }
    return;
  }
  if (event.target.closest("[data-close-dialog]")) event.target.closest("dialog")?.close();
  if (event.target.closest("#copy-draft")) {
    navigator.clipboard.writeText(document.querySelector(".generated-draft").textContent)
      .then(() => notify("Taslak panoya kopyalandı."))
      .catch(error => {console.error("Taslak panoya kopyalanamadı.",error);notify("Kopyalama başarısız. Metni seçip kopyalayın.");});
  }
});

function validateBackup(payload) {
  if (!payload || payload.app !== "yuva-crm" || payload.version !== BACKUP_VERSION || !payload.data || typeof payload.data !== "object" || Array.isArray(payload.data)) {
    throw new Error("Yedek dosyasının biçimi veya sürümü desteklenmiyor.");
  }
  for (const key of [STORAGE_KEY,LEAD_KEY,APPOINTMENT_KEY,ACTIVITY_KEY,FAVORITE_KEY,SAVED_SEARCH_KEY]) {
    if (!Array.isArray(payload.data[key]) || payload.data[key].some(item => !item || typeof item !== "object" || Array.isArray(item))) {
      throw new Error("Yedek dosyasında geçersiz liste verisi var.");
    }
  }
  if (!payload.data[ADVISOR_KEY] || typeof payload.data[ADVISOR_KEY] !== "object" || Array.isArray(payload.data[ADVISOR_KEY])) {
    throw new Error("Yedek dosyasındaki danışman profili geçersiz.");
  }
  if (payload.data[STORAGE_KEY].some(item => typeof item.id !== "string" || typeof item.title !== "string")) {
    throw new Error("Yedek dosyasında geçersiz ilan kaydı var.");
  }
  if (payload.data[LEAD_KEY].some(item => typeof item.id !== "string" || typeof item.name !== "string")) {
    throw new Error("Yedek dosyasında geçersiz müşteri kaydı var.");
  }
  return payload.data;
}

function exportBackup() {
  try {
    const data = {
      [STORAGE_KEY]:listings,
      [LEAD_KEY]:leads,
      [ADVISOR_KEY]:advisorProfile,
      [APPOINTMENT_KEY]:appointments,
      [ACTIVITY_KEY]:activities,
      [FAVORITE_KEY]:safeRead(FAVORITE_KEY,[]),
      [SAVED_SEARCH_KEY]:safeRead(SAVED_SEARCH_KEY,[])
    };
    const payload = {app:"yuva-crm",version:BACKUP_VERSION,createdAt:new Date().toISOString(),data};
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}));
    const link = document.createElement("a");
    link.href = url;
    link.download = `yuva-yedek-${localDateKey()}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url),1000);
    notify("Yedek dosyası indirildi.");
  } catch (error) {
    console.error("Yuva yedeği oluşturulamadı.",error);
    notify("Yedek oluşturulamadı. Tarayıcı indirme izinlerini kontrol edin.");
  }
}

async function importBackup(file) {
  if (file.size > 10*1024*1024) {
    notify("Yedek dosyası çok büyük. En fazla 10 MB yükleyin.");
    return;
  }
  try {
    const payload = JSON.parse(await file.text());
    const data = validateBackup(payload);
    if (!window.confirm("Bu yedek mevcut portföy, müşteri ve randevu kayıtlarının üzerine yazacak. Devam edilsin mi?")) return;
    const previous = Object.fromEntries(BACKUP_KEYS.map(key => [key,localStorage.getItem(key)]));
    try {
      for (const key of BACKUP_KEYS) localStorage.setItem(key,JSON.stringify(data[key]));
    } catch (error) {
      let rollbackFailed = false;
      for (const key of BACKUP_KEYS) {
        try {
          if (previous[key] === null) localStorage.removeItem(key);
          else localStorage.setItem(key,previous[key]);
        } catch (restoreError) {
          rollbackFailed = true;
          console.error(`Yedek geri yükleme hatası sonrası veri geri alınamadı (${key}).`,restoreError);
        }
      }
      throw rollbackFailed
        ? new Error("Depolama hatası oluştu ve eski kayıtların tamamı geri alınamadı. Verilerinizi kontrol edin.")
        : new Error("Depolama alanı yetersiz; geri yükleme iptal edildi ve eski kayıtlar korundu.");
    }
    listings = data[STORAGE_KEY];
    leads = data[LEAD_KEY];
    advisorProfile = data[ADVISOR_KEY];
    appointments = data[APPOINTMENT_KEY];
    activities = data[ACTIVITY_KEY];
    renderAdmin();
    notify("Yedek başarıyla geri yüklendi.");
  } catch (error) {
    console.error("Yuva yedeği geri yüklenemedi.",error);
    notify(error instanceof SyntaxError ? "Dosya geçerli bir JSON yedeği değil." : error.message || "Yedek geri yüklenemedi.");
  } finally {
    document.querySelector("#backup-file").value = "";
  }
}

setAuthMode();
if (sessionStorage.getItem(SESSION_KEY) === "open" && localStorage.getItem(AUTH_KEY)) showAdmin();
