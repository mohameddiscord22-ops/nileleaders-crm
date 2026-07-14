# 🚀 دليل الميزات المتقدمة - Nile Leaders CRM

## 📋 نظرة عامة

تم تطوير المشروع ليصبح **Enterprise CRM متكامل** مع ميزات احترافية لإدارة العملاء والمبيعات.

---

## ✨ الميزات الجديدة

### 1. 📊 نظام سجل النشاط (Activity Log)

**الوصف**: تتبع شامل لكل حركة بتحصل في النظام

**الفوائد**:
- تتبع من غير من في النظام
- معرفة متى تم تعديل بيانات العميل
- تقارير شاملة عن النشاطات

**API Endpoints**:
```
GET /api/trpc/activity.getLog
  - userId?: number
  - entityType?: string
  - limit?: number (default: 50)
  - offset?: number (default: 0)
```

---

### 2. 🔔 نظام الإشعارات الداخلي (Notifications)

**الوصف**: إشعارات فورية للموظفين عند حدوث أحداث مهمة

**الأحداث المدعومة**:
- تعيين عميل جديد
- موعد متابعة قريب
- تحديثات من الأدمن
- تنبيهات مخصصة

**API Endpoints**:
```
GET /api/trpc/notifications.getMyNotifications
  - unreadOnly?: boolean

GET /api/trpc/notifications.getUnreadCount

POST /api/trpc/notifications.markAsRead
  - notificationId: number

POST /api/trpc/notifications.markAllAsRead

POST /api/trpc/notifications.create (Admin only)
  - userId: number
  - type: string
  - title: string
  - message?: string
```

---

### 3. ✅ نظام المهام والمتابعات (Scheduled Tasks)

**الوصف**: إدارة المهام والمتابعات المجدولة

**الميزات**:
- تحديد أولويات للمهام (منخفضة، متوسطة، عالية)
- تنبيهات للمهام المتأخرة
- تتبع حالة المهام

**API Endpoints**:
```
GET /api/trpc/tasks.getMyTasks
  - status?: "pending" | "completed" | "cancelled"
  - priority?: "low" | "medium" | "high"

GET /api/trpc/tasks.getOverdueTasks

POST /api/trpc/tasks.create
  - leadId: number
  - taskType: string
  - dueDate: number (timestamp)
  - title: string
  - description?: string
  - priority?: "low" | "medium" | "high"

POST /api/trpc/tasks.complete
  - taskId: number

POST /api/trpc/tasks.update
  - taskId: number
  - status?: "pending" | "completed" | "cancelled"
  - priority?: "low" | "medium" | "high"
  - dueDate?: number
```

---

### 4. 💬 تكامل WhatsApp (WhatsApp Integration)

**الوصف**: إرسال رسائل WhatsApp مباشرة من النظام

**الميزات**:
- إنشاء رابط WhatsApp سريع
- تسجيل المحادثات
- تتبع حالة الرسائل

**API Endpoints**:
```
GET /api/trpc/whatsapp.getConversation
  - leadId: number

POST /api/trpc/whatsapp.sendMessage
  - leadId: number
  - phoneNumber: string
  - message: string

GET /api/trpc/whatsapp.getWhatsappLink
  - phoneNumber: string
  - message?: string
```

---

### 5. 🎯 العمليات الجماعية (Bulk Actions)

**الوصف**: تنفيذ عمليات على مجموعة عملاء دفعة واحدة

**العمليات المدعومة**:
- تحديث مجموعة عملاء
- تعيين عملاء لموظف واحد
- تصنيف عملاء متعددين
- حذف مجموعة عملاء (للأدمن)
- تصدير العملاء

**API Endpoints**:
```
POST /api/trpc/bulk.updateLeads
  - leadIds: number[]
  - updates: {
      assignedTo?: number
      autoCategory?: string
      customFields?: object
    }

POST /api/trpc/bulk.assignLeads
  - leadIds: number[]
  - assignTo: number

POST /api/trpc/bulk.categorizeLeads
  - leadIds: number[]
  - category: string

POST /api/trpc/bulk.deleteLeads (Admin only)
  - leadIds: number[]

GET /api/trpc/bulk.exportLeads
  - filters?: {
      assignedTo?: number
      autoCategory?: string
      search?: string
    }
```

---

### 6. 📈 نظام التحليلات المتقدم (Advanced Analytics)

**الوصف**: رسوم بيانية وتحليلات شاملة للأداء

**التقارير المتاحة**:
- إحصائيات لوحة التحكم
- أداء الموظفين
- تحليل مصادر العملاء
- فعالية المتابعات
- سلاسل زمنية للبيانات
- قمع التحويل

**API Endpoints**:
```
GET /api/trpc/analytics.getDashboardStats
  - userId?: number
  - dateFrom?: number
  - dateTo?: number

GET /api/trpc/analytics.getUserPerformance (Admin only)
  - dateFrom?: number
  - dateTo?: number

GET /api/trpc/analytics.getLeadSourceAnalysis
  - userId?: number
  - dateFrom?: number
  - dateTo?: number

GET /api/trpc/analytics.getFollowUpEffectiveness
  - userId?: number
  - dateFrom?: number
  - dateTo?: number

GET /api/trpc/analytics.getLeadsTimeSeries
  - userId?: number
  - dateFrom?: number
  - dateTo?: number
  - interval?: "day" | "week" | "month"

GET /api/trpc/analytics.getConversionFunnel
  - userId?: number
```

---

## 🎨 UI Components الجديدة

### NotificationsPanel
لوحة الإشعارات مع عداد غير مقروء وإمكانية وسم الكل كمقروء.

```tsx
import { NotificationsPanel } from "@/components/NotificationsPanel";

<NotificationsPanel />
```

### TasksPanel
لوحة المهام والمتابعات مع تنبيهات المهام المتأخرة.

```tsx
import { TasksPanel } from "@/components/TasksPanel";

<TasksPanel />
```

### AnalyticsPage
صفحة تحليلات شاملة مع رسوم بيانية احترافية.

```tsx
import { AnalyticsPage } from "@/pages/AnalyticsPage";

<AnalyticsPage />
```

---

## 📊 قاعدة البيانات - الجداول الجديدة

### activity_log
```sql
- id: int (PK)
- userId: int
- action: varchar(64)
- entityType: varchar(64)
- entityId: int
- changes: json
- description: text
- ipAddress: varchar(45)
- createdAt: timestamp
```

### notifications
```sql
- id: int (PK)
- userId: int
- type: varchar(64)
- title: varchar(255)
- message: text
- relatedEntityType: varchar(64)
- relatedEntityId: int
- isRead: boolean
- actionUrl: varchar(512)
- createdAt: timestamp
- readAt: timestamp
```

### scheduled_tasks
```sql
- id: int (PK)
- leadId: int
- userId: int
- taskType: varchar(64)
- dueDate: bigint
- title: varchar(255)
- description: text
- status: enum('pending', 'completed', 'cancelled')
- priority: enum('low', 'medium', 'high')
- createdAt: timestamp
- completedAt: timestamp
```

### whatsapp_messages
```sql
- id: int (PK)
- leadId: int
- userId: int
- phoneNumber: varchar(32)
- message: text
- direction: enum('inbound', 'outbound')
- status: enum('sent', 'delivered', 'read', 'failed')
- externalId: varchar(255)
- createdAt: timestamp
```

---

## 🔐 الصلاحيات

| الميزة | Public | User | Admin |
|--------|--------|------|-------|
| عرض الإشعارات | ❌ | ✅ | ✅ |
| إنشاء مهام | ❌ | ✅ | ✅ |
| عرض التحليلات | ❌ | ✅ | ✅ |
| عرض أداء الموظفين | ❌ | ❌ | ✅ |
| حذف عملاء (Bulk) | ❌ | ❌ | ✅ |
| إنشاء إشعارات | ❌ | ❌ | ✅ |

---

## 🚀 كيفية الاستخدام

### مثال 1: إنشاء مهمة متابعة
```typescript
const taskId = await trpc.tasks.create.mutate({
  leadId: 123,
  taskType: "follow_up",
  dueDate: Date.now() + 7 * 24 * 60 * 60 * 1000, // بعد 7 أيام
  title: "متابعة العميل",
  description: "التحقق من اهتمام العميل",
  priority: "high",
});
```

### مثال 2: تعيين مجموعة عملاء
```typescript
const result = await trpc.bulk.assignLeads.mutate({
  leadIds: [1, 2, 3, 4, 5],
  assignTo: 10, // معرف الموظف
});
```

### مثال 3: الحصول على إحصائيات اليوم
```typescript
const stats = await trpc.analytics.getDashboardStats.query({
  dateFrom: Date.now() - 24 * 60 * 60 * 1000,
  dateTo: Date.now(),
});
```

### مثال 4: إرسال رسالة WhatsApp
```typescript
const link = await trpc.whatsapp.getWhatsappLink.query({
  phoneNumber: "201234567890",
  message: "مرحباً! هذه رسالة من فريق المبيعات",
});

// فتح الرابط في نافذة جديدة
window.open(link.url, "_blank");
```

---

## 📝 ملاحظات مهمة

1. **Migration**: تأكد من تشغيل `pnpm db:push` بعد النشر لإنشاء الجداول الجديدة
2. **Performance**: الجداول الجديدة لديها indexes محسنة للأداء
3. **Security**: كل العمليات محمية بنظام الصلاحيات
4. **Logging**: كل العمليات يتم تسجيلها في activity_log

---

## 🎯 الخطوات التالية

1. ✅ تطبيق الميزات الجديدة
2. ✅ اختبار جميع العمليات
3. ✅ تحديث الواجهة لعرض الميزات الجديدة
4. ✅ تدريب الموظفين على الميزات الجديدة
5. ✅ مراقبة الأداء والاستقرار

---

**آخر تحديث**: 15 يوليو 2026  
**الإصدار**: 3.0.0 (Enterprise Edition)
