// Salty Cowboy, extracted from the live app (salty-cowboy 8999cd9) by a script, not retyped.
// Business data only. Loaded before the engine as window.THRESHOLD_CONFIG.
// Plain data: the object assigned at the bottom holds no functions. Local consts below only
// avoid repeating a slot table.

const LOGO = "data:image/png;base64,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";

// Start times. Keyed by duration id, or a flat list where the activity ignores duration.
const RIDE_SLOTS = {
  "1hr": ["8:00am", "5:00pm"],
  "1.5hr": ["8:00am", "4:30pm"],
  "2hr": ["8:00am", "4:00pm"]
};
const RICEFIELD_SLOTS = {
  "1hr": ["8:00am", "5:00pm"],
  "1.5hr": ["8:00am", "4:30pm"],
  "2hr": ["8:00am", "4:00pm"]
};
const SESSION_SLOTS = {
  "1hr": ["8:30am", "10:30am", "2:30pm", "4:30pm"],
  "1.5hr": ["8:30am", "10:00am", "2:30pm", "4:00pm"],
  "2hr": ["8:30am", "9:30am", "2:30pm", "3:30pm"],
  "3hr": ["8:30am", "2:30pm"]
};
const PHOTO_SLOTS = ["8:00am", "9:00am", "10:00am", "11:00am", "12:00pm", "1:00pm", "2:00pm", "3:00pm", "4:00pm"];
const JOINUP_SLOTS = ["8:30am", "9:30am"];
const GROOMING_SLOTS = ["8:30am", "9:30am", "10:30am"];
const GROUPCLINIC_SLOTS = ["8:30am"];
const DRESSAGE_SLOTS = ["8:30am", "9:30am"];

window.THRESHOLD_CONFIG = {
  schemaVersion: 2,

  business: {
    id: "salty-cowboy",
    name: "Salty Cowboy",
    legalName: "Salty Cowboy Bali",
    owner: "Simone",
    refPrefix: "SC",
    timezone: "Asia/Makassar",
    demo: false,
    seo: { title: "Salty Cowboy · Book your experience", description: "Book a horse riding experience at Salty Cowboy, a Bali horse rescue sanctuary & riding centre." },
    languages: { default: "en", available: ["en", "id", "ru"], operatorMessage: "en" },
    links: [
      { url: "https://www.instagram.com/salty.cowboy/?hl=en", label: "Instagram" },
      {
        url: "https://www.airbnb.com/users/profile/1470526584044287896?previous_page_name=PdpHomeMarketplace",
        label: { en: "Airbnb Listings", id: "Daftar Airbnb", ru: "Объявления на Airbnb" }
      }
    ],
    contact: {
      whatsapp: { number: "6281237312248", display: "+62 812-3731-2248" },
      operatorEmail: null
    }
  },

  theme: {
      colours: {
        ink: "#141414",
        ink2: "#383838",
        inkSoft: "#4a4a4a",
        muted: "#6e6e6e",
        paper: "#ffffff",
        paperAlt: "#f7f7f7",
        sunken: "#f0f0f0",
        line: "#e3e3e3",
        lineStrong: "#d9d9d9",
        accent: "#1a1a1a",
        accentOnDark: "#ededed",
        leaf: "#2b2b2b",
        dark: "#0a0a0a",
        onDark: "#ffffff",
        shade: "#000000",
        ok: "#3f5c37",
        okSurface: "#e6ece4",
        warn: "#7b5a4f",
        warnSurface: "#efe7e4",
        chrome: "#141414",
        loadingBg: "#0e0b08",
        loadingText: "#f5ede0",
        loadingRing: "rgba(255,255,255,0.18)",
        fine: {
          "c-5c5c5c": "#5c5c5c",
          "c-444444": "#444444",
          "c-565656": "#565656",
          "c-1f1f1f": "#1f1f1f",
          "c-111111": "#111111",
          "c-dcdcdc": "#dcdcdc",
          "c-c2c2c2": "#c2c2c2",
          "c-fafafa": "#fafafa",
          "c-f5f4f1": "#f5f4f1",
          "c-f1f1f1": "#f1f1f1",
          "c-f2f2f2": "#f2f2f2",
          "c-eeeeee": "#eeeeee",
          "c-b4b4b4": "#b4b4b4",
          "c-999999": "#999999",
          "c-6b6257": "#6b6257",
          "o-w06": "rgba(255,255,255,0.06)",
          "o-w08": "rgba(255,255,255,0.08)",
          "o-w10": "rgba(255,255,255,0.1)",
          "o-w1c": "#ffffff1c",
          "o-w14": "rgba(255,255,255,0.14)",
          "o-w20": "rgba(255,255,255,0.2)",
          "o-w22": "rgba(255,255,255,0.22)",
          "o-w28": "rgba(255,255,255,0.28)",
          "o-w30": "rgba(255,255,255,0.3)",
          "o-w35": "rgba(255,255,255,0.35)",
          "o-w40": "rgba(255,255,255,0.4)",
          "o-w45": "rgba(255,255,255,0.45)",
          "o-w50": "rgba(255,255,255,0.5)",
          "o-w55": "rgba(255,255,255,0.55)",
          "o-k05": "rgba(0,0,0,0.05)",
          "o-k10": "rgba(0,0,0,0.1)",
          "o-k12": "rgba(0,0,0,0.12)",
          "o-k50": "rgba(0,0,0,0.5)",
          "o-i60": "rgba(20,20,20,0.6)"
        }
      },
      fonts: {
        display: "'Futura', 'Century Gothic', 'Outfit', sans-serif",
        body: "'Century Gothic', 'Outfit', sans-serif",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=Outfit:wght@300;400;500;600&display=swap"
      },
      type: { bodyTransform: "none" },
      radius: {
        card: 14,
        control: 10,
        pill: 999,
        fine: { "3": 3, "6": 6, "8": 8, "12": 12, "16": 16, "20": 20, "24": 24, "26": 26, "300": 300 }
      },
      logo: LOGO
    },

  categories: [
      {
        id: "rides",
        name: { en: "Rides", id: "Berkuda", ru: "Прогулки" },
        intro: {
          en: "Ride out through the rice fields, village roads and down to the beach. Our grooms come with you the whole way. Morning and golden hour rides are the best time to go. Price is per person.",
          id: "Susuri sawah, jalan desa, hingga ke pantai. Pemandu kami mendampingi Anda sepanjang perjalanan. Waktu terbaik untuk berkuda adalah pagi hari atau golden hour. Harga per orang.",
          ru: "Прогулка через рисовые поля, деревенские дороги и к пляжу. Наши грумы сопровождают вас на всём пути. Прогулки лучше всего идут утром или в золотой час. Цена за человека."
        },
        participantNoun: { en: "Rider", id: "Penunggang", ru: "Наездник" },
        bookOnBehalf: true
      },
      {
        id: "photoshoots",
        name: { en: "Photoshoots", id: "Sesi foto", ru: "Фотосессии" },
        intro: {
          en: "Photos with our rescue horses at our best spots around the property. Sessions are static, so riding isn't included, though for the Beach shoot you'll sit on your horse for the walk down to the sand. Bring your own photographer, or add a Salty Cowboy photographer with your booking.",
          id: "Foto bersama kuda rescue kami di spot-spot terbaik di sekitar area kami. Sesi bersifat statis, jadi berkuda tidak termasuk, meski untuk sesi Pantai Anda akan menunggangi kuda saat berjalan menuju pasir. Bawa fotografer Anda sendiri, atau tambahkan fotografer Salty Cowboy pada pemesanan.",
          ru: "Фотографии с нашими спасёнными лошадьми в лучших уголках нашей территории. Съёмки статичные, поэтому верховая езда не входит, хотя для съёмки на пляже вы проедете верхом на лошади по пути к воде. Приходите со своим фотографом или добавьте фотографа Salty Cowboy к брони."
        },
        participantNoun: { en: "Person", id: "Orang", ru: "Человек" },
        bookOnBehalf: false
      },
      {
        id: "lessons",
        name: { en: "Lessons", id: "Pelajaran", ru: "Уроки" },
        intro: {
          en: "Every session except the Dressage Masterclass is off-saddle. You'll be working hand in hand with our rescue horses to build trust and learn to read them.",
          id: "Setiap sesi kecuali Dressage Masterclass dilakukan tanpa berkuda. Anda akan bekerja berdampingan dengan kuda rescue kami untuk membangun kepercayaan dan belajar memahami mereka.",
          ru: "Все занятия, кроме мастер-класса по выездке, проходят без седла. Вы будете работать рука об руку с нашими спасёнными лошадьми, выстраивая доверие и учась их понимать."
        },
        participantNoun: { en: "Person", id: "Orang", ru: "Человек" },
        bookOnBehalf: true
      }
    ],

  activities: [
      {
        id: "beach",
        category: "rides",
        confirmationType: "ride",
        name: {
          en: "Beach & Rice Field Ride",
          id: "Berkuda Pantai & Sawah",
          ru: "Прогулка к пляжу и рисовым полям"
        },
        desc: {
          en: "A guided ride out through the rice fields to the beach.",
          id: "Berkuda dengan pemandu melewati sawah menuju pantai.",
          ru: "Прогулка с сопровождающим через рисовые поля к пляжу."
        },
        includes: {
          en: "Helmets and boots, staff guiding on foot the whole way, and photos taken on your phone by our team. Price includes service tax.",
          id: "Helm dan sepatu bot, staf mendampingi dengan berjalan kaki sepanjang perjalanan, dan foto diambil dengan ponsel Anda oleh tim kami. Harga sudah termasuk pajak layanan.",
          ru: "Шлемы и сапоги, сопровождение персонала пешком на протяжении всей прогулки и фотографии на ваш телефон, которые сделает наша команда. Цена включает сервисный сбор."
        },
        groupNote: {
          en: "Max 5 riders, privately guided. Max 75kg per rider. Max 2 riders over 70kg.",
          id: "Maks 5 penunggang, dipandu secara privat. Maks 75 kg per penunggang. Maks 2 penunggang di atas 70 kg.",
          ru: "Максимум 5 наездников, частное сопровождение. Максимум 75 кг на наездника. Максимум 2 наездника тяжелее 70 кг."
        },
        image: "images/beach-ride.jpg",
        imagePosition: "center 28%",
        people: { min: 1, max: 5 },
        pricing: { per: "person" },
        durations: [
          {
            id: "1hr",
            label: { en: "1 hr", id: "1 jam", ru: "1 ч" },
            hours: 1,
            price: 1600000
          },
          {
            id: "1.5hr",
            label: { en: "1.5 hr", id: "1,5 jam", ru: "1,5 ч" },
            hours: 1.5,
            price: 2200000
          }
        ]
      },
      {
        id: "insta",
        category: "rides",
        confirmationType: "ride",
        name: { en: "Insta Ride", id: "Insta Ride", ru: "Инста-прогулка" },
        desc: {
          en: "Our longest ride at 2 hours, with more stops for photos through the village, beach and rice fields. Grooms take you to the best spots: golden hour is ideal.",
          id: "Ride terpanjang kami, 2 jam, dengan lebih banyak titik henti untuk foto melewati desa, pantai, dan sawah. Pemandu membawa Anda ke spot-spot terbaik: golden hour adalah waktu yang paling pas.",
          ru: "Наша самая длинная прогулка, 2 часа, с большим количеством остановок для фото через деревню, пляж и рисовые поля. Грумы приводят вас в лучшие места, особенно хорошо в золотой час."
        },
        includes: {
          en: "Helmets and boots, staff guiding on foot the whole way, and photos taken on your phone by our team. Price includes service tax.",
          id: "Helm dan sepatu bot, staf mendampingi dengan berjalan kaki sepanjang perjalanan, dan foto diambil dengan ponsel Anda oleh tim kami. Harga sudah termasuk pajak layanan.",
          ru: "Шлемы и сапоги, сопровождение персонала пешком на протяжении всей прогулки и фотографии на ваш телефон, которые сделает наша команда. Цена включает сервисный сбор."
        },
        groupNote: {
          en: "Max 5 riders, privately guided. Max 75kg per rider. Max 2 riders over 70kg.",
          id: "Maks 5 penunggang, dipandu secara privat. Maks 75 kg per penunggang. Maks 2 penunggang di atas 70 kg.",
          ru: "Максимум 5 наездников, частное сопровождение. Максимум 75 кг на наездника. Максимум 2 наездника тяжелее 70 кг."
        },
        image: "images/insta-ride.avif",
        imagePosition: "center 80%",
        people: { min: 1, max: 5 },
        pricing: { per: "person" },
        durations: [
          {
            id: "2hr",
            label: { en: "2 hr", id: "2 jam", ru: "2 ч" },
            hours: 2,
            price: 2700000
          }
        ]
      },
      {
        id: "photo_beach",
        category: "photoshoots",
        confirmationType: "photoshoot",
        name: { en: "Beach Photoshoot", id: "Sesi Foto di Pantai", ru: "Фотосессия на пляже" },
        desc: {
          en: "Static shoot for fashion, pre-wedding or private sessions, along a 900m route through the rice fields. Time starts when you leave the stables. Out of respect for local culture, please no swimwear shoots.",
          id: "Sesi foto statis untuk fashion, prewedding, atau pribadi, menyusuri rute 900m melewati sawah. Waktu dihitung sejak meninggalkan kandang. Demi menghormati budaya setempat, mohon tidak ada pemotretan berpakaian renang.",
          ru: "Статичная съёмка для fashion, love story или личных сессий, маршрут 900 м через рисовые поля. Время отсчитывается с момента выхода из конюшни. Из уважения к местной культуре просим не снимать в купальниках."
        },
        includes: {
          en: "One groomed horse, staff with you, 900m route through the rice fields",
          id: "Satu kuda yang sudah dirawat, staf mendampingi, rute 900m melewati sawah",
          ru: "Одна ухоженная лошадь, сопровождение персонала, маршрут 900 м через рисовые поля"
        },
        groupNote: {
          en: "Max 3 people total: up to 2 on horses (one horse each), plus 1 person standing beside a horse. Max 75kg per mounted rider. Price is per horse.",
          id: "Maks 3 orang total: hingga 2 orang menunggang kuda (satu kuda per orang), plus 1 orang berdiri di samping kuda. Maks 75 kg per penunggang. Harga per kuda.",
          ru: "Максимум 3 человека: до 2 верхом (по одной лошади на каждого) плюс 1 человек рядом с лошадью. Максимум 75 кг на верхового. Цена за лошадь."
        },
        image: "images/photo-beach.avif",
        gallery: [
          "images/gallery-beach-1.jpg",
          "images/gallery-beach-2.jpg",
          "images/gallery-beach-3.jpg",
          "images/gallery-beach-4.jpg"
        ],
        people: { min: 1, max: 3 },
        pricing: {
          per: "unit",
          unit: { en: "horse", id: "kuda", ru: "лошадь" },
          unitPlural: { en: "horses", id: "kuda", ru: "лошади" },
          maxUnits: 2
        },
        durations: [
          {
            id: "1hr",
            label: { en: "1 hr", id: "1 jam", ru: "1 ч" },
            hours: 1,
            price: 1750000
          },
          {
            id: "1.5hr",
            label: { en: "1.5 hr", id: "1,5 jam", ru: "1,5 ч" },
            hours: 1.5,
            price: 2250000
          }
        ]
      },
      {
        id: "photo_stable",
        category: "photoshoots",
        confirmationType: "photoshoot",
        name: { en: "Stable Photoshoot", id: "Sesi Foto di Kandang", ru: "Фотосессия в конюшне" },
        desc: {
          en: "Rustic Western-style stable backdrop for fashion, pre-wedding or personal shoots. Team assistance included.",
          id: "Latar kandang bergaya Western yang rustic untuk fashion, prewedding, atau sesi pribadi. Termasuk bantuan tim.",
          ru: "Рустикальный фон конюшни в western-стиле для fashion, love story или личных съёмок. Включает помощь команды."
        },
        includes: {
          en: "Western-style stable backdrop, team assistance",
          id: "Latar kandang bergaya Western, bantuan tim",
          ru: "Конюшня в западном стиле как фон, помощь команды"
        },
        groupNote: {
          en: "Max 5 people total, including all crew and models.",
          id: "Maks 5 orang total, termasuk seluruh kru dan model.",
          ru: "Максимум 5 человек, включая всю съёмочную группу и моделей."
        },
        image: "images/photo-stable.avif",
        gallery: [
          "images/gallery-stable-1.jpg",
          "images/gallery-stable-2.jpg",
          "images/gallery-stable-3.jpg",
          "images/gallery-stable-4.jpg"
        ],
        people: { min: 1, max: 5 },
        pricing: { per: "booking" },
        durations: [
          {
            id: "1hr",
            label: { en: "1 hr", id: "1 jam", ru: "1 ч" },
            hours: 1,
            price: 1750000
          },
          {
            id: "1.5hr",
            label: { en: "1.5 hr", id: "1,5 jam", ru: "1,5 ч" },
            hours: 1.5,
            price: 2250000
          },
          {
            id: "2hr",
            label: { en: "2 hr", id: "2 jam", ru: "2 ч" },
            hours: 2,
            price: 2750000
          },
          {
            id: "3hr",
            label: { en: "3 hr", id: "3 jam", ru: "3 ч" },
            hours: 3,
            price: 3750000
          }
        ]
      },
      {
        id: "photo_ricefield",
        category: "photoshoots",
        confirmationType: "photoshoot",
        name: { en: "Rice Field Photoshoot", id: "Sesi Foto di Sawah", ru: "Фотосессия в рисовых полях" },
        desc: {
          en: "A private session with your horse framed by Bali's open rice terraces. Same format as our stable shoot, set out in the green instead of the yards. Golden hour recommended for the best light.",
          id: "Sesi privat bersama kuda Anda dengan latar terasering sawah Bali yang terbuka. Format sama seperti sesi foto Kandang kami, hanya berlokasi di area hijau, bukan di pekarangan kandang. Golden hour direkomendasikan untuk pencahayaan terbaik.",
          ru: "Приватная съёмка с лошадью на фоне открытых рисовых террас Бали. Тот же формат, что и наша съёмка в конюшне, только на фоне зелени вместо двора конюшни. Для лучшего света рекомендуем золотой час."
        },
        includes: {
          en: "One horse, team assistance, rice terrace location",
          id: "Satu kuda, bantuan tim, lokasi terasering sawah",
          ru: "Одна лошадь, помощь команды, локация на рисовых террасах"
        },
        groupNote: {
          en: "Max 5 people total, including all crew and models.",
          id: "Maks 5 orang total, termasuk seluruh kru dan model.",
          ru: "Максимум 5 человек, включая всю съёмочную группу и моделей."
        },
        image: "images/gallery-ricefield-1.jpg",
        gallery: [
          "images/gallery-ricefield-1.jpg",
          "images/gallery-ricefield-2.jpg",
          "images/gallery-ricefield-3.jpg",
          "images/gallery-ricefield-4.jpg"
        ],
        people: { min: 1, max: 5 },
        pricing: { per: "booking" },
        durations: [
          {
            id: "1hr",
            label: { en: "1 hr", id: "1 jam", ru: "1 ч" },
            hours: 1,
            price: 1750000
          },
          {
            id: "1.5hr",
            label: { en: "1.5 hr", id: "1,5 jam", ru: "1,5 ч" },
            hours: 1.5,
            price: 2250000
          },
          {
            id: "2hr",
            label: { en: "2 hr", id: "2 jam", ru: "2 ч" },
            hours: 2,
            price: 2750000
          }
        ]
      },
      {
        id: "photo_paddock",
        category: "photoshoots",
        confirmationType: "photoshoot",
        name: { en: "Paddock Photoshoot", id: "Sesi Foto di Padang", ru: "Фотосессия в загоне" },
        desc: {
          en: "Open paddock backdrop with grazing horses, shot from outside the fence. Entering the paddocks and touching the horses is not permitted.",
          id: "Latar padang terbuka dengan kuda yang merumput, difoto dari luar pagar. Dilarang memasuki padang dan menyentuh kuda.",
          ru: "Открытый загон с пасущимися лошадьми, съёмка из-за ограды. Заходить в загоны и трогать лошадей нельзя."
        },
        includes: {
          en: "Paddock location, grazing horses in view",
          id: "Lokasi padang, kuda-kuda merumput terlihat",
          ru: "Локация у загона, пасущиеся лошади в кадре"
        },
        groupNote: {
          en: "Max 5 people total, including all crew and models.",
          id: "Maks 5 orang total, termasuk seluruh kru dan model.",
          ru: "Максимум 5 человек, включая всю съёмочную группу и моделей."
        },
        image: "images/photo-paddock-card.jpg",
        gallery: [
          "images/gallery-paddock-1.jpg",
          "images/gallery-paddock-2.jpg",
          "images/gallery-paddock-3.jpg",
          "images/gallery-paddock-4.jpg"
        ],
        people: { min: 1, max: 5 },
        pricing: { per: "booking" },
        durations: [
          {
            id: "1hr",
            label: { en: "1 hr", id: "1 jam", ru: "1 ч" },
            hours: 1,
            price: 1750000
          },
          {
            id: "1.5hr",
            label: { en: "1.5 hr", id: "1,5 jam", ru: "1,5 ч" },
            hours: 1.5,
            price: 2250000
          },
          {
            id: "2hr",
            label: { en: "2 hr", id: "2 jam", ru: "2 ч" },
            hours: 2,
            price: 2750000
          },
          {
            id: "3hr",
            label: { en: "3 hr", id: "3 jam", ru: "3 ч" },
            hours: 3,
            price: 3750000
          }
        ]
      },
      {
        id: "photo_cottages",
        category: "photoshoots",
        confirmationType: "photoshoot",
        name: { en: "Cottages Photoshoot", id: "Sesi Foto di Cottages", ru: "Фотосессия у коттеджей" },
        desc: {
          en: "Rustic wooden cottage interior for fashion, pre-wedding or personal shoots. Priced by session (linked to Airbnb blocking). Location only, no horses included. Photos are taken inside the cottage. Entering the paddocks and touching the horses is not permitted.",
          id: "Interior cottage kayu rustic untuk pemotretan fashion, prewedding, atau pribadi. Harga per sesi (terkait blocking Airbnb). Hanya lokasi, tanpa kuda. Foto diambil di dalam cottage. Dilarang memasuki padang dan menyentuh kuda.",
          ru: "Интерьер рустикального деревянного коттеджа для fashion, love story или личных съёмок. Цена за сессию (связано с блокировкой Airbnb). Только локация, без лошадей. Съёмка проходит внутри коттеджа. Заходить в загоны и трогать лошадей нельзя."
        },
        includes: {
          en: "Cottage interior, whole session (Airbnb blocked for you)",
          id: "Interior pondok, satu sesi penuh (Airbnb dikosongkan untuk Anda)",
          ru: "Интерьер коттеджа, вся сессия (Airbnb освобождён для вас)"
        },
        groupNote: {
          en: "Max 6 people per cottage. Choice of cottage upon availability.",
          id: "Maks 6 orang per cottage. Pilihan cottage sesuai ketersediaan.",
          ru: "Максимум 6 человек на коттедж. Выбор коттеджа по наличию."
        },
        image: "images/photo-cottages.avif",
        gallery: [
          "images/gallery-cottages-1.jpg",
          "images/gallery-cottages-2.jpg",
          "images/gallery-cottages-3.jpg",
          "images/gallery-cottages-4.jpg"
        ],
        people: { min: 1, max: 6 },
        pricing: { per: "booking" },
        durations: [
          {
            id: "3hr",
            label: { en: "session", id: "sesi", ru: "сессия" },
            hours: 3,
            price: 4500000
          }
        ]
      },
      {
        id: "joinup",
        category: "lessons",
        confirmationType: "lesson",
        name: { en: "Join Up Lesson", id: "Pelajaran Join Up", ru: "Урок Join Up" },
        desc: {
          en: "An introduction to natural horsemanship. Learn to 'join up' a horse so it chooses to stay with you. Hands-on, no riding.",
          id: "Pengantar natural horsemanship. Belajar 'join up' agar kuda memilih untuk tetap bersama Anda. Praktik langsung, tanpa berkuda.",
          ru: "Введение в natural horsemanship. Научитесь делать join up, чтобы лошадь сама выбирала оставаться с вами. Практика, без верховой езды."
        },
        groupNote: {
          en: "Max 2 people. Price is per person.",
          id: "Maks 2 orang. Harga per orang.",
          ru: "Максимум 2 человека. Цена за человека."
        },
        image: "images/join-up.avif",
        people: { min: 1, max: 2 },
        pricing: { per: "person" },
        durations: [
          {
            id: "1hr",
            label: { en: "1 hr", id: "1 jam", ru: "1 ч" },
            hours: 1,
            price: 2500000
          },
          {
            id: "1.5hr",
            label: { en: "1.5 hr", id: "1,5 jam", ru: "1,5 ч" },
            hours: 1.5,
            price: 3150000
          }
        ]
      },
      {
        id: "whisper",
        category: "lessons",
        confirmationType: "lesson",
        name: {
          en: "Horse Whisperer Intensive Course",
          id: "Kursus Intensif Horse Whisperer",
          ru: "Интенсивный курс «шепчущего с лошадьми»"
        },
        desc: {
          en: "A 3-day, 10-hour course spread over Monday, Tuesday and Thursday. Two 3.5-hour sessions to build the basics, then a 3-hour session to bring it together. Includes 2 hours of grooming or choice of another related activity, starting 8:30am on Monday and Tuesday and 9:00am on Thursday, finishing at midday. Open to all levels, no experience needed. This course is for two people, so bring your friend!",
          id: "Kursus 3 hari, 10 jam, berlangsung pada Senin, Selasa, dan Kamis. Dua sesi 3,5 jam untuk membangun dasar-dasarnya, lalu satu sesi 3 jam untuk menyatukan semuanya. Termasuk 2 jam grooming atau pilihan aktivitas terkait lainnya, dimulai pukul 08.30 pada Senin dan Selasa, dan 09.00 pada Kamis, selesai pukul 12.00. Terbuka untuk semua level, tidak perlu pengalaman. Kursus ini untuk dua orang, jadi ajak teman Anda!",
          ru: "Трёхдневный курс на 10 часов, проходит в понедельник, вторник и четверг. Два занятия по 3,5 часа для освоения основ, затем занятие на 3 часа, чтобы собрать всё воедино. Включает 2 часа грумминга или другой связанной активности на выбор, начало в 8:30 в понедельник и вторник и в 9:00 в четверг, окончание в 12:00. Подходит для любого уровня, опыт не требуется. Курс рассчитан на двоих, так что берите с собой друга!"
        },
        badge: { en: "Bring a friend for free", id: "Ajak teman gratis", ru: "Приведите друга бесплатно" },
        includes: {
          en: "10 hours over 3 days, 2 hours of grooming or another related activity, all levels welcome",
          id: "10 jam selama 3 hari, 2 jam perawatan kuda atau kegiatan terkait lainnya, terbuka untuk semua level",
          ru: "10 часов за 3 дня, 2 часа груминга или другого связанного занятия, для любого уровня"
        },
        notIncluded: {
          en: "Riding. This course is groundwork, not ridden work",
          id: "Menunggang kuda. Kursus ini kerja dari darat, bukan menunggang",
          ru: "Верховая езда. Этот курс \u2014 работа с земли, а не в седле"
        },
        groupNote: { en: "Max 2 people.", id: "Maks 2 orang.", ru: "Максимум 2 человека." },
        image: "images/horse-whisperer.jpg",
        people: { min: 1, max: 2 },
        pricing: { per: "booking" },
        durations: [
          {
            id: "3hr",
            label: { en: "total", id: "total", ru: "всего" },
            hours: 3,
            price: 22500000
          }
        ],
        multiDay: {
          days: 3,
          weekdays: [1, 2, 4],
          withinOneWeek: true,
          bookAsWeek: true,
          slotLabel: "Mon & Tue 8:30am, Thu 9:00am",
          fixedTimes: [
            {
              day: { en: "Monday", id: "Senin", ru: "Понедельник" },
              time: { en: "8:30am - 12:00pm", id: "08.30 - 12.00", ru: "8:30 - 12:00" }
            },
            {
              day: { en: "Tuesday", id: "Selasa", ru: "Вторник" },
              time: { en: "8:30am - 12:00pm", id: "08.30 - 12.00", ru: "8:30 - 12:00" }
            },
            {
              day: { en: "Thursday", id: "Kamis", ru: "Четверг" },
              time: { en: "9:00am - 12:00pm", id: "09.00 - 12.00", ru: "9:00 - 12:00" }
            }
          ],
          operatorLine: "Course runs Mon 8:30am-12:00pm, Tue 8:30am-12:00pm, Thu 9:00am-12:00pm, all within one week",
          copy: {
            hintPre: {
              en: "The horse whisperer course goes over 3 days. ",
              id: "Kursus horse whisperer berlangsung selama 3 hari. ",
              ru: "Курс «шепчущего с лошадьми» длится 3 дня. "
            },
            hintLink: { en: "Click here", id: "Klik di sini", ru: "Нажмите здесь" },
            hintPost: {
              en: " to view more about this program.",
              id: " untuk melihat lebih lanjut tentang program ini.",
              ru: ", чтобы узнать больше об этой программе."
            },
            pick: {
              en: "Tap any available day to book that whole week",
              id: "Ketuk hari yang tersedia untuk memesan minggu itu",
              ru: "Нажмите любой доступный день, чтобы забронировать всю неделю"
            },
            daysSelected: { en: "of 3 days selected", id: "dari 3 hari dipilih", ru: "из 3 дней выбрано" },
            daysTitle: { en: "Your course days", id: "Hari kursus Anda", ru: "Дни вашего курса" },
            weekNote: {
              en: "The course runs Monday, Tuesday and Thursday, all within a single week.",
              id: "Kursus berlangsung Senin, Selasa, dan Kamis, semuanya dalam satu minggu yang sama.",
              ru: "Курс проходит по понедельникам, вторникам и четвергам, всё в течение одной недели."
            },
            sessionNote: {
              en: "The course runs a total of 10 hours across 3 days: two 3.5-hour sessions and one closing 3-hour session, including 2 hours choice of grooming or another related activity. Only one course booking is taken per week.",
              id: "Kursus ini berdurasi total 10 jam selama 3 hari: dua sesi 3,5 jam dan satu sesi penutup 3 jam, termasuk 2 jam pilihan grooming atau kegiatan terkait lainnya. Hanya satu pemesanan kursus yang diterima per minggu.",
              ru: "Курс длится в общей сложности 10 часов за 3 дня: два занятия по 3,5 часа и одно заключительное занятие на 3 часа, включая 2 часа на выбор груминга или другой связанной активности. В неделю принимается только одна бронь на курс."
            },
            customTimes: {
              en: "These are our usual course times. Need something different? Message Simone and she will do her best to fit you in.",
              id: "Ini jadwal kursus kami yang biasa. Butuh waktu lain? Kirim pesan ke Simone dan dia akan berusaha menyesuaikan.",
              ru: "Это наше обычное расписание курса. Нужно другое время? Напишите Симоне, и она постарается подстроиться."
            }
          }
        },
        messageDuration: "3 to 3.5 hr/day"
      },
      {
        id: "masterclass",
        category: "lessons",
        confirmationType: "lesson",
        name: {
          en: "Horse grooming (wet or dry)",
          id: "Grooming kuda (basah atau kering)",
          ru: "Груминг лошади (влажный или сухой)"
        },
        desc: {
          en: "Learn the finer art of grooming, with tips for Bali's damp, hot climate, from the stable manager, plus Q&A.",
          id: "Pelajari seni grooming yang lebih halus, dengan tips untuk iklim Bali yang lembap dan panas, dari manajer kandang, plus tanya jawab.",
          ru: "Освойте тонкое искусство груминга с советами для влажного и жаркого климата Бали, от менеджера конюшни, плюс вопросы и ответы."
        },
        groupNote: { en: "Max 2 people.", id: "Maks 2 orang.", ru: "Максимум 2 человека." },
        image: "images/grooming.avif",
        people: { min: 1, max: 2 },
        pricing: { per: "booking" },
        durations: [
          {
            id: "1hr",
            label: { en: "1 hr", id: "1 jam", ru: "1 ч" },
            hours: 1,
            price: 1250000
          },
          {
            id: "1.5hr",
            label: { en: "1.5 hr", id: "1,5 jam", ru: "1,5 ч" },
            hours: 1.5,
            price: 1875000
          }
        ],
        options: [
          {
            id: "grooming",
            label: { en: "Grooming", id: "Perawatan", ru: "Груминг" },
            logAs: "grooming_type",
            operatorLabel: "Grooming",
            choices: [
              {
                value: "wet",
                label: {
                  en: "Wet grooming (with shampoo)",
                  id: "Perawatan basah (dengan sampo)",
                  ru: "Влажный груминг (с шампунем)"
                },
                operatorText: "Wet"
              },
              {
                value: "dry",
                label: { en: "Dry grooming", id: "Perawatan kering", ru: "Сухой груминг" },
                operatorText: "Dry"
              }
            ]
          }
        ]
      },
      {
        id: "groupclinic",
        category: "lessons",
        confirmationType: "lesson",
        name: {
          en: "Group Clinic (Leadership/horsemanship class)",
          id: "Klinik Kelompok (Leadership/horsemanship class)",
          ru: "Групповая клиника (Leadership/horsemanship class)"
        },
        desc: {
          en: "A hands-on session in leadership, communication and trust, taught through the horse. Working at liberty in the round pen, your group learns to read body language, hold presence and earn cooperation without force, the same skills you'd use in any team setting. Popular with women's groups, business teams, and friend groups that ride. No riding experience needed. Up to 6 people, 1.5 hours, IDR 6,000,000 per session as a flat group rate.",
          id: "Sesi praktik tentang kepemimpinan, komunikasi, dan kepercayaan, diajarkan melalui kuda. Bekerja secara liberty di round pen, kelompok Anda belajar membaca bahasa tubuh, menjaga kehadiran diri, dan mendapatkan kerja sama tanpa paksaan, keterampilan yang sama yang Anda gunakan dalam situasi tim apa pun. Populer di kalangan kelompok wanita, tim bisnis, dan kelompok pertemanan yang gemar berkuda. Tidak perlu pengalaman berkuda. Hingga 6 orang, 1,5 jam, IDR 6.000.000 per sesi sebagai tarif kelompok tetap.",
          ru: "Практическое занятие по лидерству, коммуникации и доверию через работу с лошадью. Работая на свободе в круглом манеже, ваша группа учится читать язык тела, удерживать присутствие и добиваться сотрудничества без принуждения, те же навыки, что пригодятся в любой командной обстановке. Популярно среди женских групп, бизнес-команд и компаний друзей, которые катаются верхом. Опыт верховой езды не требуется. До 6 человек, 1,5 часа, IDR 6 000 000 за сессию как фиксированная групповая цена."
        },
        groupNote: {
          en: "Up to 6 people. Flat price per session, not per person.",
          id: "Hingga 6 orang. Harga tetap per sesi, bukan per orang.",
          ru: "До 6 человек. Фиксированная цена за сессию, не за человека."
        },
        image: "images/group-clinic.avif",
        people: { min: 3, max: 6 },
        pricing: { per: "booking" },
        durations: [
          {
            id: "1.5hr",
            label: { en: "1.5 hr", id: "1,5 jam", ru: "1,5 ч" },
            hours: 1.5,
            price: 6000000
          }
        ]
      },
      {
        id: "dressage",
        category: "lessons",
        confirmationType: "lesson",
        name: {
          en: "Dressage Masterclass (Private lesson)",
          id: "Masterclass Dressage (Les privat)",
          ru: "Мастер-класс по выездке (частный урок)"
        },
        desc: {
          en: "Private lessons for all levels. Learn dressage or polish up your skills.",
          id: "Pelajaran privat untuk semua tingkat. Belajar dressage atau mengasah kemampuan Anda.",
          ru: "Индивидуальные занятия для любого уровня. Освойте выездку или отточите навыки."
        },
        groupNote: {
          en: "Private booking, 1 rider. Max 75kg per rider.",
          id: "Pemesanan privat, 1 penunggang. Maks 75 kg per penunggang.",
          ru: "Частное бронирование, 1 наездник. Максимум 75 кг на наездника."
        },
        image: "images/dressage.avif",
        people: { min: 1, max: 1 },
        pricing: { per: "person" },
        durations: [
          {
            id: "50min",
            label: { en: "50 min", id: "50 mnt", ru: "50 мин" },
            price: 2900000
          }
        ]
      }
    ],

  screening: {
      questions: [
        {
          id: "age",
          type: "number",
          label: { en: "Age", id: "Usia", ru: "Возраст" },
          placeholder: { en: "Years", id: "Tahun", ru: "Лет" },
          unit: "years",
          placement: "beside-name",
          appliesTo: {
            except: {
              categories: ["photoshoots"]
            }
          },
          required: true,
          valid: { min: 1, max: 119 },
          messageOrder: 0,
          operatorTemplate: "age {v}",
          consentOperatorText: "(parent/guardian permission confirmed)",
          overrides: {
            whisper: {
              rule: { min: 8 },
              fail: {
                icon: "⚠️",
                title: { en: "Minimum age is 8", id: "Usia minimum 8 tahun", ru: "Минимальный возраст: 8 лет" },
                body: {
                  en: "The Horse Whisperer Intensive Course is for participants aged 8 and over. Please check the age entered, or message us on WhatsApp about other options.",
                  id: "Kursus Intensif Horse Whisperer diperuntukkan bagi peserta berusia 8 tahun ke atas. Silakan periksa kembali usia yang dimasukkan, atau hubungi kami di WhatsApp untuk pilihan lain.",
                  ru: "Интенсивный курс «шепчущего с лошадьми» рассчитан на участников от 8 лет. Проверьте указанный возраст или напишите нам в WhatsApp о других вариантах."
                }
              }
            }
          },
          consentBelow: 18,
          consentLabel: {
            en: "I confirm a parent or guardian has given permission for this rider (under 18) to take part.",
            id: "Saya menyatakan orang tua atau wali telah memberi izin bagi penunggang ini (di bawah 18 tahun) untuk ikut serta.",
            ru: "Я подтверждаю, что родитель или опекун дал разрешение этому наезднику (младше 18 лет) на участие."
          },
          logAs: "ages"
        },
        {
          id: "weight",
          type: "choice",
          label: { en: "Weight range", id: "Rentang berat", ru: "Весовая категория" },
          appliesTo: {
            activities: ["beach", "insta", "photo_beach", "dressage"]
          },
          required: true,
          onBehalfInfo: true,
          logAs: "weights",
          messageOrder: 2,
          logCountsAs: { w1: "w1", w2: "w2", w3: "w3", w4: "w4" },
          options: [
            {
              value: "w1",
              label: { en: "Under 50 kg", id: "Di bawah 50 kg", ru: "До 50 кг" },
              outcome: "pass"
            },
            {
              value: "w2",
              label: { en: "50–70 kg", id: "50–70 kg", ru: "50–70 кг" },
              outcome: "pass"
            },
            {
              value: "w3",
              label: { en: "70–75 kg", id: "70–75 kg", ru: "70–75 кг" },
              outcome: "warn",
              maxPerBooking: 2,
              message: {
                icon: "🐴",
                title: {
                  en: "Protecting our horses' backs",
                  id: "Melindungi punggung kuda kami",
                  ru: "Бережём спины наших лошадей"
                },
                body: {
                  en: "Only 2 of our horses can carry riders over 70kg, so we can take at most 2 riders over 70kg per booking, up to 75kg each. Please make 100% sure nobody is over 75kg with clothes on. We weigh riders at the stables, riders over 75kg cannot ride, and bookings over 75kg are not refunded. If that's not right for your group, we have plenty of off-saddle activities under 'Lessons'.",
                  id: "Hanya 2 kuda kami yang mampu membawa penunggang di atas 70kg, jadi maksimal 2 penunggang di atas 70kg per pemesanan, hingga 75kg per orang. Mohon pastikan 100% tidak ada yang melebihi 75kg dengan pakaian. Kami menimbang penunggang di kandang, penunggang di atas 75kg tidak dapat berkuda, dan pemesanan di atas 75kg tidak dapat dikembalikan. Jika kurang cocok untuk grup Anda, kami punya banyak aktivitas tanpa berkuda di menu 'Pelajaran'.",
                  ru: "Только 2 наши лошади могут нести наездников тяжелее 70 кг, поэтому в одной броне не более 2 наездников тяжелее 70 кг, до 75 кг каждый. Если это не подходит вашей группе, у нас много занятий без седла в разделе «Уроки». Пожалуйста, убедитесь на 100%, что никто не весит более 75 кг в одежде. Мы взвешиваем наездников в конюшне, наездники свыше 75 кг не допускаются к прогулке, а бронирования свыше 75 кг не возвращаются."
                }
              },
              operatorNote: "{n} rider(s) over 70kg, needs a heavier-weight horse"
            },
            {
              value: "w4",
              label: { en: "Over 75 kg", id: "Di atas 75 kg", ru: "Более 75 кг" },
              outcome: "fail",
              message: {
                icon: "🐴",
                title: {
                  en: "Sorry, we can't accommodate this weight",
                  id: "Mohon maaf, kami tidak dapat menerima berat ini",
                  ru: "Извините, мы не можем принять этот вес"
                },
                body: {
                  en: "It's nothing personal. We're committed to protecting our horses' backs from strain, so we're unable to safely match a horse for this weight. Riders over 75kg with clothes on cannot ride. We weigh riders at the stables, and bookings over 75kg are not refunded. You're welcome to try our off-saddle activities under 'Lessons' instead.",
                  id: "Ini bukan hal pribadi. Kami berkomitmen melindungi punggung kuda kami dari ketegangan, sehingga kami tidak dapat mencocokkan kuda dengan aman untuk berat ini. Penunggang di atas 75kg dengan pakaian tidak dapat berkuda. Kami menimbang penunggang di kandang, dan pemesanan di atas 75kg tidak dapat dikembalikan. Anda sangat kami persilakan mencoba aktivitas tanpa berkuda di menu 'Pelajaran'.",
                  ru: "Ничего личного. Мы бережём спины наших лошадей от перегрузки, поэтому не можем безопасно подобрать лошадь для этого веса. Наездники свыше 75 кг в одежде не допускаются к прогулке. Мы взвешиваем наездников в конюшне, а бронирования свыше 75 кг не возвращаются. Будем рады видеть вас на занятиях без седла в разделе «Уроки»."
                }
              }
            }
          ],
          linkToken: {
            text: { en: "'Lessons'", id: "'Pelajaran'", ru: "«Уроки»" },
            toCategory: "lessons"
          }
        },
        {
          id: "experience",
          type: "choice",
          label: { en: "Riding experience", id: "Pengalaman berkuda", ru: "Опыт верховой езды" },
          appliesTo: {
            except: {
              categories: ["photoshoots"]
            }
          },
          required: true,
          logAs: "experience",
          messageOrder: 1,
          options: [
            {
              value: "e1",
              label: { en: "Never ridden", id: "Belum pernah", ru: "Никогда не ездил(а)" },
              outcome: "pass"
            },
            {
              value: "e2",
              label: { en: "Beginner", id: "Pemula", ru: "Начинающий" },
              outcome: "pass"
            },
            {
              value: "e3",
              label: { en: "Intermediate", id: "Menengah", ru: "Средний" },
              outcome: "pass"
            },
            {
              value: "e4",
              label: { en: "Advanced", id: "Mahir", ru: "Продвинутый" },
              outcome: "pass"
            }
          ],
          notes: [
            {
              onOptions: ["e1", "e2"],
              onlyActivities: ["beach", "insta"],
              text: {
                en: "Your horse will be led on a lead rope by our staff for the whole ride, so no experience is needed.",
                id: "Kuda Anda akan dituntun dengan tali oleh staf kami sepanjang perjalanan, jadi tidak perlu pengalaman.",
                ru: "Вашу лошадь будет вести в поводу наш сотрудник на протяжении всей прогулки, поэтому опыт не требуется."
              }
            },
            {
              onOptions: ["e3", "e4"],
              onlyActivities: ["beach", "insta"],
              text: {
                en: "You can trot and canter in moderation. We don't allow galloping, and your guide will assess you when you reach the beach.",
                id: "Anda dapat melakukan trot dan canter secukupnya. Kami tidak mengizinkan gallop, dan pemandu Anda akan menilai kemampuan Anda setibanya di pantai.",
                ru: "Вы сможете ехать рысью и лёгким галопом в умеренном темпе. Быстрый галоп мы не разрешаем, и ваш гид оценит вашу подготовку по прибытии на пляж."
              }
            }
          ]
        }
      ]
    },

  addons: [
      {
        id: "photographer",
        appliesTo: {
          categories: ["photoshoots"]
        },
        label: {
          en: "Add a Salty Cowboy photographer:",
          id: "Tambahkan fotografer Salty Cowboy:",
          ru: "Добавить фотографа Salty Cowboy:"
        },
        shortLabel: { en: "Photographer", id: "Fotografer", ru: "Фотограф" },
        summaryLabel: { en: "Add-on", id: "Tambahan", ru: "Доп. услуга" },
        note: {
          en: "Bring your own photographer or add a Salty Cowboy photographer",
          id: "Bawa fotografer sendiri atau tambahkan fotografer Salty Cowboy",
          ru: "Приходите со своим фотографом или добавьте фотографа Salty Cowboy"
        },
        rate: { perHour: 2000000 },
        perk: {
          perHour: 20,
          word: { en: "photos", id: "foto", ru: "фото" }
        },
        logAs: "photographer_addon",
        messageTemplate: "Add-on: {business} photographer ({hours} hr · {currency} {price} · {perk} edited images)"
      }
    ],

  availability: {
    mode: "manual",
    defaults: { openWeekdays: [1, 2, 3, 4, 5, 6], morningOnlyWeekdays: [6], morningBefore: 12, allowPast: false },
    activities: {
      beach: { slots: { "1hr": RIDE_SLOTS["1hr"], "1.5hr": RIDE_SLOTS["1.5hr"] } },
      insta: { slots: { "2hr": RIDE_SLOTS["2hr"] } },
      photo_beach: { slots: PHOTO_SLOTS },
      photo_stable: { slots: SESSION_SLOTS },
      photo_ricefield: { slots: RICEFIELD_SLOTS },
      photo_paddock: { slots: SESSION_SLOTS },
      photo_cottages: { slots: { "3hr": SESSION_SLOTS["3hr"] } },
      joinup: { slots: JOINUP_SLOTS },
      whisper: { openWeekdays: [1, 2, 4], slots: ["Mon & Tue 8:30am, Thu 9:00am"] },
      masterclass: { slots: GROOMING_SLOTS },
      groupclinic: { slots: GROUPCLINIC_SLOTS },
      dressage: { slots: DRESSAGE_SLOTS }
    }
  },

  booking: { contact: { email: "off", phone: "off" }, prefill: null },

  payment: { provider: "none", mode: "on_booking", currency: "IDR" },

  confirmation: {
    types: {
      ride: { title: "TODO", address: "TODO", mapsLink: "TODO", bring: "TODO", arrival: "TODO" },
      lesson: { title: "TODO", address: "TODO", mapsLink: "TODO", bring: "TODO", arrival: "TODO" },
      photoshoot: { title: "TODO", address: "TODO", mapsLink: "TODO", bring: "TODO", arrival: "TODO" }
    },
    email: {
      subject: "Booking confirmed: {activity}, {date}",
      body: "Hi,\n\nYour booking with {business} is confirmed.\n\n{summary}\n\n{typeBlock}\n\nSee you soon,\n{business}"
    },
    operatorNotice: "New booking {ref}: {activity}, {date} {time}, {party} people, {amount}. {flags}"
  },

  copy: {
      hero: {
        title: { en: "Book your experience", id: "Pesan pengalaman Anda", ru: "Забронируйте впечатление" },
        sub: {
          en: "Horse rescue sanctuary & riding centre",
          id: "Tempat penyelamatan kuda & pusat berkuda",
          ru: "Приют для лошадей и центр верховой езды"
        }
      },
      mission: {
        title: {
          en: "What your booking cost funds",
          id: "Untuk apa biaya pemesanan Anda digunakan",
          ru: "На что идёт стоимость вашего бронирования"
        },
        body: {
          en: "Every booking goes straight back into the paddock; vet care, feed, farrier visits, and the horses themselves. Some come in underweight or scared of people. We give them time until they're ready. Some go back to gentle riding to make money for their friends, others can go to a family that is curated by us, that will adopt them and take care of them properly.",
          id: "Setiap pemesanan kembali langsung untuk kebutuhan paddock; perawatan dokter hewan, pakan, pemasangan sepatu kuda, dan kuda-kudanya sendiri. Beberapa datang dalam kondisi kurus atau takut pada manusia. Kami memberi mereka waktu hingga siap. Sebagian kembali menjalani ride dengan lembut untuk mencari dana bagi teman-teman mereka, sebagian lagi bisa pindah ke keluarga pilihan kami, yang akan mengadopsi dan merawat mereka dengan baik.",
          ru: "Каждое бронирование идёт напрямую на нужды пастбища; ветеринарный уход, корм, ковку и самих лошадей. Некоторые прибывают истощёнными или напуганными людьми. Мы даём им время, пока они не будут готовы. Некоторые возвращаются к спокойным прогулкам, чтобы зарабатывать на своих друзей, другие могут перейти в семью, тщательно отобранную нами, которая удочерит их и позаботится о них как следует."
        }
      },
      notice: {
        en: "⏳ Your selected date and time will be confirmed by Salty Cowboy through WhatsApp.",
        id: "⏳ Tanggal dan waktu yang Anda pilih akan dikonfirmasi oleh Salty Cowboy melalui WhatsApp.",
        ru: "⏳ Выбранные вами дата и время будут подтверждены Salty Cowboy через WhatsApp."
      },
      sentSub: {
        en: "Simone, our director, reviews and approves every request on WhatsApp.",
        id: "Simone, direktur kami, meninjau dan menyetujui setiap permintaan melalui WhatsApp.",
        ru: "Simone, наш директор, проверяет и одобряет каждый запрос в WhatsApp."
      },
      copyFallback: {
        en: "Can't see the new WhatsApp window? Copy the message below and send it to Simone on WhatsApp at",
        id: "Tidak melihat jendela WhatsApp baru? Salin pesan di bawah dan kirim ke Simone di WhatsApp di",
        ru: "Не видите новое окно WhatsApp? Скопируйте сообщение ниже и отправьте его Simone в WhatsApp по номеру"
      },
      notesPlaceholder: {
        en: "Write a message for Salty Cowboy",
        id: "Tulis pesan untuk Salty Cowboy",
        ru: "Напишите сообщение для Salty Cowboy"
      },
      notesHint: {
        en: "We want you to have a memorable experience. If the times are not suitable, or you have an additional request, please let us know here.",
        id: "Kami ingin Anda mendapatkan pengalaman yang berkesan. Jika waktu yang tersedia tidak sesuai, atau Anda memiliki permintaan tambahan, silakan beri tahu kami di sini.",
        ru: "Мы хотим, чтобы у вас остались незабываемые впечатления. Если время не подходит или у вас есть дополнительный запрос, пожалуйста, напишите нам об этом здесь."
      },
      matchHint: {
        en: "We'll match each rider to their ideal horse.",
        id: "Kami akan mencocokkan setiap penunggang dengan kuda yang ideal.",
        ru: "Мы подберём каждому наезднику подходящую лошадь."
      },
      matchedHorses: { en: "Your matched horses", id: "Kuda yang cocok untuk Anda", ru: "Подобранные лошади" },
      morningOnlyNote: {
        en: "We close on Saturday afternoons, so only morning times are shown.",
        id: "Kami tutup pada Sabtu sore, jadi hanya waktu pagi yang ditampilkan.",
        ru: "По субботам во второй половине дня мы закрыты, поэтому показано только утреннее время."
      },
      bookOnBehalf: {
        label: {
          en: "I'm booking for someone else, or I'm an agent booking for a customer",
          id: "Saya memesan untuk orang lain, atau saya agen yang memesan untuk pelanggan",
          ru: "Я бронирую для другого человека или я агент, бронирующий для клиента"
        },
        note: {
          en: "Please make 100% sure the person you're booking for is not over 75kg with clothes on. We know it's an awkward thing to ask, but it's what keeps every horse healthy and comfortable, so we can keep offering these rides for years to come. We weigh riders at the stables. Riders over 75kg cannot ride, and bookings over 75kg are not refunded.",
          id: "Mohon pastikan 100% bahwa orang yang Anda pesankan tidak melebihi 75kg dengan pakaian. Kami tahu ini canggung untuk ditanyakan, namun inilah yang menjaga setiap kuda tetap sehat dan nyaman, sehingga kami dapat terus menawarkan wahana berkuda ini selama bertahun-tahun ke depan. Kami menimbang penunggang di kandang. Penunggang di atas 75kg tidak dapat berkuda, dan pemesanan di atas 75kg tidak dapat dikembalikan.",
          ru: "Пожалуйста, убедитесь на 100%, что человек, для которого вы бронируете, весит не более 75 кг в одежде. Мы понимаем, что об этом неловко спрашивать, но именно это позволяет каждой лошади оставаться здоровой и чувствовать себя комфортно, чтобы мы могли предлагать эти прогулки долгие годы. Мы взвешиваем наездников в конюшне. Наездники свыше 75 кг не допускаются к прогулке, а бронирования свыше 75 кг не возвращаются."
        },
        popupTitle: {
          en: "Info for the person you're booking for",
          id: "Info untuk orang yang Anda pesankan",
          ru: "Информация для человека, для которого вы бронируете"
        },
        popupSub: {
          en: "Copy the message below and send it to them, so they know what to expect before they arrive.",
          id: "Salin pesan di bawah ini dan kirimkan kepada mereka, agar mereka tahu apa yang perlu dipersiapkan sebelum datang.",
          ru: "Скопируйте сообщение ниже и отправьте его этому человеку, чтобы он знал, чего ожидать перед приездом."
        },
        arrivalTitle: { en: "Arrival time", id: "Waktu kedatangan", ru: "Время прибытия" },
        arrivalBody: {
          en: "Please arrive 15 minutes before the start time, so there's time to get settled and briefed before heading out.",
          id: "Mohon datang 15 menit sebelum waktu mulai, agar ada waktu untuk bersiap dan mendapat pengarahan sebelum berangkat.",
          ru: "Пожалуйста, приезжайте за 15 минут до начала, чтобы успеть устроиться и пройти инструктаж перед выездом."
        },
        weightTitle: { en: "Weight guideline", id: "Panduan berat badan", ru: "Ограничение по весу" },
        weightBody: {
          en: "For the wellbeing of our horses we hold a strict rider weight limit of 75kg with clothes on. It's what keeps every horse healthy and comfortable, so we can keep offering these rides for years to come. You will be weighed at the stables. Riders over 75kg cannot ride, and bookings over 75kg are not refunded.",
          id: "Demi kesejahteraan kuda-kuda kami, kami menerapkan batas berat penunggang maksimal 75kg dengan pakaian. Ini yang menjaga setiap kuda tetap sehat dan nyaman, sehingga kami dapat terus menawarkan wahana berkuda ini selama bertahun-tahun ke depan. Anda akan ditimbang di kandang. Penunggang di atas 75kg tidak dapat berkuda, dan pemesanan di atas 75kg tidak dapat dikembalikan.",
          ru: "Для благополучия наших лошадей мы придерживаемся строгого ограничения по весу наездника: не более 75 кг в одежде. Именно это позволяет каждой лошади оставаться здоровой и чувствовать себя комфортно, чтобы мы могли предлагать эти прогулки долгие годы. Вас взвесят в конюшне. Наездники свыше 75 кг не допускаются к прогулке, а бронирования свыше 75 кг не возвращаются."
        },
        msgHeading: { en: "Message to copy", id: "Pesan untuk disalin", ru: "Сообщение для копирования" },
        msgIntro: {
          en: "Hi! You're booked in with Salty Cowboy 🐴",
          id: "Hai! Kamu sudah dipesankan bersama Salty Cowboy 🐴",
          ru: "Привет! Вас записали в Salty Cowboy 🐴"
        },
        msgClosing: { en: "See you soon!", id: "Sampai jumpa!", ru: "До скорой встречи!" },
        reopenNote: {
          en: "We've prepared everything they need to know. Tap here to view the message and copy it again.",
          id: "Kami telah menyiapkan semua yang perlu mereka ketahui. Ketuk di sini untuk melihat pesan dan menyalinnya lagi.",
          ru: "Мы подготовили всё, что им нужно знать. Нажмите здесь, чтобы посмотреть сообщение и снова его скопировать."
        }
      },
      operatorMessage: {
        title: "🐴 *New {business} booking request*",
        footer: "_Sent from the online booking page · pending {owner}'s approval_",
        onBehalfWeight: "Booking on behalf of another rider. 75kg weight guideline shown to the person booking.",
        onBehalfPlain: "Booking on behalf of someone else. Arrival and cost info shown to the person booking."
      }
    },

  endpoints: {
    log: { url: "https://script.google.com/macros/s/AKfycby8gaUoE7nfhFFj6KfGKS7tjUEeuxGRj9IRdoGrWS4ynqgrUTVvCkXLL_ByYyNH9MeNWQ/exec", schemaVersion: 2, blankColumns: ["outcome", "horse"] },
    calendar: null,
    source: "web"
  }
};
