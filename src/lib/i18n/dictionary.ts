export type Lang = "en" | "km";

export const dictionary = {
  // Sidebar nav
  nav_dashboard: { en: "Dashboard", km: "ផ្ទាំងគ្រប់គ្រង" },
  nav_my_store: { en: "My Store", km: "ហាងរបស់ខ្ញុំ" },
  nav_products: { en: "Products", km: "ទំនិញ" },
  nav_inventory: { en: "Inventory", km: "ស្តុកទំនិញ" },
  nav_orders: { en: "Orders", km: "ការបញ្ជាទិញ" },
  nav_posts: { en: "Posts", km: "ប្រកាស" },
  nav_stories: { en: "Stories", km: "ស្តូរី" },
  nav_customers: { en: "Customers", km: "អតិថិជន" },
  nav_reviews: { en: "Reviews", km: "ការវាយតម្លៃ" },
  nav_messages: { en: "Messages", km: "សារ" },
  nav_ai_assistant: { en: "AI Assistant", km: "ជំនួយការ AI" },
  nav_analytics: { en: "Analytics", km: "វិភាគទិន្នន័យ" },
  nav_marketing: { en: "Marketing", km: "ទីផ្សារ" },
  nav_boost: { en: "Boost", km: "ការផ្សព្វផ្សាយ" },
  nav_payments: { en: "Payments", km: "ការទូទាត់" },
  nav_subscription: { en: "Subscription", km: "គម្រោងសមាជិក" },
  nav_settings: { en: "Settings", km: "ការកំណត់" },
  nav_help_center: { en: "Help Center", km: "មជ្ឈមណ្ឌលជំនួយ" },
  nav_logout: { en: "Logout", km: "ចាកចេញ" },
  soon: { en: "Soon", km: "ឆាប់ៗនេះ" },
  seller: { en: "Seller", km: "អ្នកលក់" },

  // Dashboard page
  seller_dashboard: { en: "Seller Dashboard", km: "ផ្ទាំងគ្រប់គ្រងអ្នកលក់" },
  your_store: { en: "Your store", km: "ហាងរបស់អ្នក" },
  products: { en: "Products", km: "ទំនិញ" },
  low_stock: { en: "Low stock", km: "ស្តុកតិច" },
  out_of_stock: { en: "Out of stock", km: "អស់ស្តុក" },
  manage_products: { en: "Manage products", km: "គ្រប់គ្រងទំនិញ" },
  manage_inventory: { en: "Manage inventory", km: "គ្រប់គ្រងស្តុក" },
  edit_store_info: { en: "Edit store info", km: "កែព័ត៌មានហាង" },
  continue_setup: { en: "Continue store setup", km: "បន្តការរៀបចំហាង" },
  stock_overview: { en: "Stock overview", km: "ទិដ្ឋភាពស្តុកទំនិញ" },
  top_products: { en: "Top products", km: "ទំនិញលក់ដាច់បំផុត" },
  recent_activity: { en: "Recent activity", km: "សកម្មភាពថ្មីៗ" },
  no_products_yet: { en: "No products yet.", km: "មិនទាន់មានទំនិញនៅឡើយទេ។" },
  coming_later_note: {
    en: "Orders, posts, stories, messaging, AI assistant, and analytics panels are built in later phases.",
    km: "ការបញ្ជាទិញ, ប្រកាស, ស្តូរី, ការជជែក, ជំនួយការ AI និងវិភាគទិន្នន័យ នឹងត្រូវបានសាងសង់នៅដំណាក់កាលបន្ទាប់។",
  },

  // Admin sidebar
  admin_dashboard: { en: "Dashboard", km: "ផ្ទាំងគ្រប់គ្រង" },
  admin_stores: { en: "Stores", km: "ហាងទាំងអស់" },
  admin_users: { en: "Users", km: "អ្នកប្រើប្រាស់" },
  admin_subscriptions: { en: "Subscriptions", km: "គម្រោងសមាជិក" },
  admin_support: { en: "Seller Support", km: "ជំនួយអ្នកលក់" },
  admin_insights: { en: "AI Insights", km: "ការវិភាគ AI" },
  admin_errors: { en: "Error Logs", km: "កំណត់ត្រាកំហុស" },
  admin_audit: { en: "Audit Log", km: "កំណត់ត្រាសកម្មភាព" },
  admin_settings: { en: "Platform Settings", km: "ការកំណត់ Platform" },
  admin_plans: { en: "Plans", km: "គម្រោងតម្លៃ" },
  admin_categories: { en: "Categories", km: "ប្រភេទទំនិញ" },
  super_admin: { en: "Super Admin", km: "អ្នកគ្រប់គ្រងកំពូល" },
  platform_control: { en: "Platform control", km: "គ្រប់គ្រង Platform" },
} as const;

export type DictKey = keyof typeof dictionary;
