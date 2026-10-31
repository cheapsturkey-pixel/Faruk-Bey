# Yuva — Gayrimenkul Danışmanlığı

Müşteri ilan vitrini ile danışmanın günlük işlerini yürüttüğü ayrı bir çalışma paneli.

## İki ayrı Vercel sitesi

Proje iki bağımsız yayın klasörüne ayrılmıştır:

- `public/`: müşterilerin kullandığı ilan vitrini
- `admin/`: danışman çalışma paneli

Vercel'de iki ayrı proje oluşturun. Her projede **Root Directory** değerini ilgili klasöre ayarlayın:

1. `public` klasörü için yeni Vercel projesi oluşturun ve Root Directory olarak `public` seçin.
2. `admin` klasörü için ikinci Vercel projesi oluşturun ve Root Directory olarak `admin` seçin.
3. Vercel'de aldığınız müşteriye açık adresi `admin/site-config.js` dosyasındaki `PUBLIC-SITE-DOMAIN.vercel.app` yerine yazın ve yeniden yayınlayın.

İki ayrı alan adı/vercel projesi aynı `localStorage` alanını paylaşmaz. Şu anda müşteri tarafından verilen talep/randevu ve danışman portföyü farklı cihazlarda otomatik olarak eşitlenmez. Gerçek canlı sistem için Vercel sunucu işlevleri ve ortak bir veritabanı gerekir.

## Çalıştırma

Müşteri ilan vitrini için `index.html`, danışman çalışma paneli için `yonetim.html` dosyasını güncel bir tarayıcıda açın. Müşteri sayfası ilan arama, ilanla ilgili bilgi talebi, danışmandan randevu alma ve favori işlevlerine; danışman paneli ise portföy, müşteri takibi, randevu ajandası, çalışma saatleri ve müşteri sayfasında görünen profil bilgilerini düzenlemeye ayrılmıştır.

## İlk sürümde

- İlan keşif sayfası; satılık/kiralık ve mülk türü filtreleri
- Tarayıcıda çalışan doğal dil ilan eşleştirme asistanı
- Ayrı danışman panelinde sade danışman hesabı oluşturma/giriş ve parola erişimini sıfırlama akışı; hesap bu tarayıcıya özeldir
- Tek danışman için portföy yönetimi; ilan ekleme, düzenleme, taslak/yayında tutma ve silme
- Portföy kayıtlarında tapu/takyidat ve imar danışman kontrol notları, yetki belgesi bitiş tarihi, aidat ve son kontrol tarihi; eksik/geçmiş kayıtları görme
- Müşteri taleplerini ilanıyla birlikte kaydetme; yeni talep, iletişim, görüşme, teklif ve sonuç aşamalarını takip etme
- Müşteri formunda isteğe bağlı arayış kriterleri ve kayıtlı tercihlerle ilan eşleştirme önerileri
- Müşteri listesinde ad/telefon/ilan arama ve her kayıt için tarihli geri dönüş planı; bugün ve geciken takipleri panelde sayma
- Müşteri aramalarını kaydetme ve daha sonra müşteri vitrini üzerinde yeniden uygulama
- Danışmanın seçtiği haftalık çalışma günleri, saat aralığı ve randevu süresine göre müşteri tarafında boş saatleri gösterme
- Müşteri randevu talebini danışman ajandasına ve müşteri takip kaydına ekleme; çakışan saatleri engelleme
- Randevu planlama, tamamlandı/iptal durumları ve müşteri/portföy işlem geçmişi
- Danışman/ofis profilini ve randevu çalışma saatlerini düzenleme
- Parola hariç uygulama verilerini JSON dosyasına yedekleme ve geçerli yedekten geri yükleme
- Favoriler, sanal tur bağlantısı desteği ve ana ekrandan açılan etkileşimli 360° demo turu
- Eksik alanları belirten sözleşme/işlem taslağı ve insan incelemesi uyarıları

İlanlar, favoriler, kayıtlı aramalar, iletişim talepleri, randevular, aktivite geçmişi, danışman profili/çalışma saatleri, yerel hesap bilgisi ve parola özeti kullanılan tarayıcının `localStorage` alanında saklanır. Yönetim giriş durumu `sessionStorage` ile sekme oturumu boyunca tutulur. Bu istemci taraflı demo giriş gerçek erişim güvenliği sağlamaz ve farklı cihazlarla eşitlenmez; tarayıcı verileri silinirse kayıtlar kaybolabilir. Erişim sıfırlama yalnızca bu tarayıcıdaki yerel hesabı yeniler, CRM kayıtlarını silmez. Müşteri/danışman ayrımı şu anda ayrı sayfa ve kullanıcı arayüzü düzeyindedir; üretim için sunucu taraflı kimlik doğrulama, API yetkilendirmesi, veritabanı ve erişim denetimi şarttır.

## Yapay zekâ ve doğrulama sınırları

Müşteri emlak asistanı; doğal dilde yazılan bölge, ilan türü, mülk türü, bütçe, alan, oda ve özellikleri tarayıcıda yorumlayıp ilanları eşleşme puanına göre sıralar. Müşteri taleplerinde kaydedilen tercihler de portföyle karşılaştırılır. Bu, açıklanabilir alan eşleştirmesi yapan bir prototiptir; harici üretken yapay zekâ veya öğrenen model değildir. Sonuçlar yalnızca kaydedilmiş ilan bilgilerine dayanır; eksik bilgi yanlış/eksik sıralamaya neden olabilir ve danışman teyidi gerekir. Belge asistanı yalnızca danışman panelinde yer alır ve girilen bilgileri taslak olarak düzenler; hukuki metin üretimi, resmî sicil kontrolü, kimlik/imza doğrulaması veya hukuki danışmanlık sağlamaz. Gerçek yapay zekâ entegrasyonu sunucu tarafında anahtar yönetimi, uygun kişisel veri tasarımı ve uzman onaylı şablonlar gerektirir.

JSON yedekleri müşteri kişisel verileri içerir; güvenli yerde saklayın ve yalnızca güvenilir yedekleri geri yükleyin. Yedekleme cihazlar arasında otomatik eşitleme değildir. Gerçek çevrimiçi kullanım için ayrıca sunucu, veritabanı, güvenli kimlik doğrulama, erişim denetimi ve yedekleme altyapısı kurulmalıdır.

Başlangıçtaki ilanlar ve görseller örnek veridir; müşteri sayfasında örnek ilan uyarısı gösterilir. Danışman ilanı düzenlediğinde o ilan örnek olmaktan çıkar ve uyarı diğer örnek ilan kalmayınca gizlenir. Görseller internet üzerinden yüklenir; bağlantı olmadığında görünmeyebilir. Müşteri talepleri ve sözleşme bilgileri bu sürümde yerel tarayıcıda tutulur, güvenli bir operasyon için kullanılmamalıdır.

Ana ekrandaki **360° tur örneğini incele** düğmesi Pannellum görüntüleyicisinde yayımlanan örnek otel yatak odası ile oturma odası panoramaları arasında geçiş sağlar. Görüntüyü fareyle sürükleyin veya dokunmatik ekranda kaydırın; yakınlaştırma için fare tekerleğini ya da görüntüleyicinin kontrollerini kullanın. Başka odaya geçmek için **“Oturma odası”** düğmesine veya **“Diğer odaya geç”** düğmesine, geri dönmek için **“Yatak odası”** düğmesine basın. Görüntü içindeki Pannellum sahne bağlantısı noktaları da geçiş yapar. Bu iki örnek panorama farklı örnek mekânlardandır; gerçek bir evin kat planı veya birbirine bağlı odaları değildir. Gezinti için internet bağlantısı gerekir. Yatak odası görseli NOIRLab tarafından CC BY 4.0, oturma odası görseli Sonny doe tarafından CC BY-SA 4.0 lisansıyla yayımlanmıştır; kaynak bağlantıları demo ekranında görünür.
