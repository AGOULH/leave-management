/*
 * إعدادات موقع المجموعة السعودية لعلم الدم المناعي (SIG)
 * ------------------------------------------------------
 * 1) اترك firebase فارغاً ليعمل الموقع بالوضع التجريبي (البيانات في المتصفح فقط).
 * 2) بعد إنشاء مشروع Firebase الصق إعدادات تطبيق الويب هنا (راجع README.md).
 */
window.SIG_CONFIG = {
  firebase: {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
  },

  // الفعالية القادمة — القيم الافتراضية. بعد ربط Firebase تُعدَّل من لوحة التحكم.
  event: {
    titleAr: "الملتقى السنوي القادم للمجموعة السعودية لعلم الدم المناعي",
    titleEn: "The upcoming Saudi Immunohaematology Group Annual Meeting",
    date: "2027-02-20T08:00",
    durationHours: 8,
    venueAr: "[المكان يُعلن لاحقاً]",
    venueEn: "[Venue to be announced]",
    cmeHours: "[—]",
    registrationOpen: true
  },

  contactEmail: "",          // البريد الرسمي للمجموعة
  social: { instagram: "", x: "", youtube: "", facebook: "" },

  // روابط المواد العلمية لكل فعالية (مثلاً مجلد Google Drive). المفتاح من قائمة الأرشيف في common.js
  materials: {
    // "am4-2020": "https://drive.google.com/..."
  },

  // صور كل فعالية: مصفوفة روابط صور (يمكن رفعها في مجلد assets/img/gallery/)
  gallery: {
    // "am4-2020": ["assets/img/gallery/am4-1.jpg", "assets/img/gallery/am4-2.jpg"]
  }
};
