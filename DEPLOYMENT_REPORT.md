# تقرير نشر مشروع Nile Leaders CRM

تم استلام مشروعك `nileleaders-crm-ultra-v3` بنجاح، وتم استكشاف هيكله وإعدادات Firebase الخاصة به. هذا التقرير يوضح الخطوات اللازمة لتشغيل المشروع محليًا ونشره على Firebase Hosting.

## 1. نظرة عامة على المشروع

مشروعك هو تطبيق **Full-Stack** يتكون من واجهة أمامية مبنية بـ React (باستخدام Vite) وواجهة خلفية مبنية بـ Express. يستخدم المشروع قاعدة بيانات MySQL ويتم إدارة التبعيات باستخدام `pnpm`.

## 2. إعداد Firebase

تم دمج إعدادات Firebase التي قدمتها في الواجهة الأمامية للمشروع. تم إنشاء ملف `client/src/lib/firebase.ts` يحتوي على تهيئة Firebase، وتم استيراده في `client/src/main.tsx`.

```typescript
// client/src/lib/firebase.ts
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyAJsRusWLwAXlyeWetOqRO8ddVVJzk_q7E",
  authDomain: "leads-6a67c.firebaseapp.com",
  projectId: "leads-6a67c",
  storageBucket: "leads-6a67c.firebasestorage.app",
  messagingSenderId: "709023848090",
  appId: "1:709023848090:web:6d725244f84e5b2c91f123"
};

export const app = initializeApp(firebaseConfig);
```

## 3. تشغيل المشروع محليًا

لتشغيل المشروع على جهازك المحلي، اتبع الخطوات التالية:

1.  **فك ضغط المشروع:**
    إذا لم تكن قد فعلت ذلك بالفعل، فك ضغط الملف `nileleaders-crm-ultra-v3.zip` في مجلد جديد.

2.  **تثبيت التبعيات:**
    انتقل إلى مجلد المشروع في سطر الأوامر وقم بتثبيت التبعيات باستخدام `pnpm`:
    ```bash
    cd /path/to/nileleaders-crm
    pnpm install
    ```

3.  **إعداد ملف `.env`:**
    مشروعك يتطلب ملف `.env` لإعداد متغيرات البيئة، خاصةً لربط الواجهة الخلفية بقاعدة بيانات MySQL. يمكنك البدء من ملف `.env.example` الموجود في جذر المشروع.
    ```bash
    cp .env.example .env
    ```
    ثم قم بتحرير ملف `.env` واملأ المتغيرات التالية:
    ```env
    # Database (MySQL)
    DATABASE_URL=mysql://user:password@host:3306/nilecrm

    # JWT Secret (generate random string)
    JWT_SECRET=your-super-secret-key-here-change-this

    # Node Environment
    NODE_ENV=development

    # Frontend URL (for CORS) - استخدم عنوان الواجهة الأمامية المحلي
    FRONTEND_URL=http://localhost:5173
    ```
    **ملاحظة هامة:** ستحتاج إلى إعداد قاعدة بيانات MySQL وتشغيلها محليًا أو استخدام خدمة سحابية. تأكد من أن `DATABASE_URL` يشير إلى قاعدة بيانات MySQL الصحيحة.

4.  **تشغيل الواجهة الخلفية (Backend):**
    ```bash
    pnpm dev
    ```
    هذا سيقوم بتشغيل خادم Express في وضع التطوير.

5.  **تشغيل الواجهة الأمامية (Frontend):**
    افتح نافذة طرفية جديدة (Terminal) وانتقل إلى مجلد المشروع، ثم قم بتشغيل الواجهة الأمامية:
    ```bash
    cd /path/to/nileleaders-crm
    pnpm --filter client dev
    ```
    أو إذا كنت في جذر المشروع:
    ```bash
    pnpm dev
    ```
    عادةً ما يتم تشغيل الواجهة الأمامية على `http://localhost:5173`.

## 4. نشر المشروع على Firebase Hosting (الواجهة الأمامية فقط)

وفقًا لملف `FIREBASE_DEPLOYMENT.md`، فإن Firebase Hosting يمكنه استضافة الواجهة الأمامية فقط. ستحتاج إلى نشر الواجهة الخلفية على خدمة أخرى (مثل Railway, Render, Heroku) تتوافق مع Node.js و MySQL.

**خطوات نشر الواجهة الأمامية على Firebase Hosting:**

1.  **تثبيت Firebase CLI:**
    إذا لم تكن قد قمت بتثبيته مسبقًا:
    ```bash
    npm install -g firebase-tools
    ```

2.  **تسجيل الدخول إلى Firebase:**
    ```bash
    firebase login
    ```
    اتبع التعليمات لتسجيل الدخول باستخدام حساب Google الخاص بك.

3.  **بناء الواجهة الأمامية للإنتاج:**
    **ملاحظة هامة:** ستحتاج إلى تحديد `VITE_API_URL` ليكون عنوان URL للواجهة الخلفية المنشورة (على سبيل المثال، إذا قمت بنشر الواجهة الخلفية على Railway، فسيكون `https://your-backend-url.railway.app`).
    ```bash
    VITE_API_URL=https://your-backend-url.railway.app pnpm build
    ```
    هذا سيقوم بإنشاء مجلد `dist/public` الذي يحتوي على ملفات الواجهة الأمامية الجاهزة للنشر.

4.  **نشر الواجهة الأمامية:**
    ```bash
    firebase deploy --only hosting
    ```
    سيقوم هذا الأمر بنشر محتويات مجلد `dist/public` إلى Firebase Hosting.

## 5. نشر الواجهة الخلفية (Backend)

كما ذكرنا، لا يمكن استضافة الواجهة الخلفية على Firebase Hosting. ستحتاج إلى استخدام خدمة استضافة تدعم Node.js و MySQL. يوصي ملف `FIREBASE_DEPLOYMENT.md` بخدمات مثل Railway أو Render أو Heroku.

**الخطوات العامة لنشر الواجهة الخلفية:**

1.  **اختر منصة استضافة:** (Railway, Render, Heroku, DigitalOcean).
2.  **إعداد قاعدة بيانات MySQL:** قم بإنشاء قاعدة بيانات MySQL على المنصة المختارة أو قم بربطها بقاعدة بيانات موجودة.
3.  **تكوين متغيرات البيئة:** قم بتعيين متغيرات البيئة التالية على منصة الاستضافة:
    *   `DATABASE_URL`: سلسلة اتصال قاعدة بيانات MySQL الخاصة بك.
    *   `JWT_SECRET`: مفتاح سري عشوائي لتوقيع رموز JWT.
    *   `NODE_ENV`: يجب أن يكون `production`.
    *   `FRONTEND_URL`: عنوان URL للواجهة الأمامية المنشورة على Firebase Hosting (على سبيل المثال، `https://leads-6a67c.web.app`).
4.  **نشر الكود:** اتبع إرشادات المنصة لنشر كود الواجهة الخلفية (عادةً ما يتضمن ربط مستودع Git الخاص بك).

## 6. الخطوات التالية

بعد نشر الواجهة الأمامية والخلفية، تأكد من اختبار التطبيق بالكامل للتحقق من أن جميع الميزات تعمل بشكل صحيح وأن الواجهة الأمامية تتصل بالواجهة الخلفية بنجاح.

إذا واجهت أي مشاكل، يمكنك الرجوع إلى قسم استكشاف الأخطاء وإصلاحها في ملف `FIREBASE_DEPLOYMENT.md` أو طلب المساعدة.

---
