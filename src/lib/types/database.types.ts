// Hand-written to match supabase/migrations/0001_init_schema.sql
// Regenerate with `npm run db:types` once the Supabase CLI is linked to your project,
// then extend this file as later phases add tables (products, orders, chat, AI, etc).

export type UserRole = "customer" | "seller" | "admin" | "super_admin";
export type AccountStatus = "active" | "suspended" | "banned";
export type StoreStatus = "draft" | "pending_review" | "active" | "suspended" | "rejected";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "expired";
export type BillingCycle = "monthly" | "yearly";
export type ProductStatus = "draft" | "active" | "out_of_stock" | "archived";
export type ProductCondition = "new" | "used" | "refurbished";
export type InventoryTxnType = "stock_in" | "stock_out" | "adjustment" | "order_reserved" | "order_released";
export type OrderStatus = "pending" | "paid" | "processing" | "packed" | "shipped" | "delivered" | "cancelled" | "refunded";
export type PaymentStatus = "pending" | "success" | "failed" | "expired" | "refunded";
export type StoryMediaType = "image" | "video" | "text";
export type AiSubscriptionStatus = "active" | "expired" | "cancelled";
export type AiDocumentStatus = "processed" | "unsupported" | "error";
export type AiMessageRole = "user" | "assistant";
export type DiscountType = "percent" | "fixed";
export type BoostTargetType = "post" | "product";
export type BoostStatus = "active" | "expired" | "cancelled" | "pending_payment";
export type SupportTicketStatus = "open" | "in_progress" | "resolved";
export type NotificationType = "order_status" | "review_reply" | "chat_message" | "system";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          username: string | null;
          avatar_url: string | null;
          phone: string | null;
          bio: string | null;
          role: UserRole;
          status: AccountStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          icon: string | null;
          icon_url: string | null;
          parent_id: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["categories"]["Row"]> & {
          name: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Row"]>;
      };
      subscription_plans: {
        Row: {
          id: string;
          name: string;
          slug: string;
          price_monthly: number;
          price_yearly: number;
          product_limit: number | null;
          ai_enabled: boolean;
          ai_message_limit: number;
          analytics_enabled: boolean;
          stories_enabled: boolean;
          boost_enabled: boolean;
          chat_enabled: boolean;
          features: string[];
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["subscription_plans"]["Row"]> & {
          name: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["subscription_plans"]["Row"]>;
      };
      stores: {
        Row: {
          id: string;
          seller_id: string;
          store_name: string;
          slug: string;
          logo_url: string | null;
          cover_image_url: string | null;
          description: string | null;
          category: string | null;
          phone: string | null;
          email: string | null;
          address: string | null;
          city: string | null;
          province: string | null;
          country: string | null;
          latitude: number | null;
          longitude: number | null;
          opening_hours: Record<string, unknown>;
          facebook_url: string | null;
          telegram_url: string | null;
          tiktok_url: string | null;
          instagram_url: string | null;
          website_url: string | null;
          shipping_information: string | null;
          return_policy: string | null;
          payment_information: string | null;
          bakong_account_id: string | null;
          bakong_phone: string | null;
          status: StoreStatus;
          verified: boolean;
          setup_step: number;
          setup_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["stores"]["Row"]> & {
          seller_id: string;
          store_name: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["stores"]["Row"]>;
      };
      store_settings: {
        Row: {
          id: string;
          store_id: string;
          settings: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["store_settings"]["Row"]> & {
          store_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["store_settings"]["Row"]>;
      };
      store_subscriptions: {
        Row: {
          id: string;
          store_id: string;
          plan_id: string;
          status: SubscriptionStatus;
          billing_cycle: BillingCycle;
          current_period_start: string;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["store_subscriptions"]["Row"]> & {
          store_id: string;
          plan_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["store_subscriptions"]["Row"]>;
      };
      products: {
        Row: {
          id: string;
          store_id: string;
          category_id: string | null;
          name: string;
          slug: string;
          description: string | null;
          price: number;
          compare_at_price: number | null;
          sku: string | null;
          brand: string | null;
          stock: number;
          low_stock_threshold: number;
          status: ProductStatus;
          condition: ProductCondition;
          weight: number | null;
          view_count: number;
          avg_rating: number;
          review_count: number;
          low_stock_threshold: number;
          low_stock_alerted: boolean;
          sales_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["products"]["Row"]> & {
          store_id: string;
          name: string;
          slug: string;
          price: number;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Row"]>;
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          url: string;
          sort_order: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["product_images"]["Row"]> & {
          product_id: string;
          url: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_images"]["Row"]>;
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          variant_name: string;
          sku: string | null;
          price: number | null;
          stock: number;
          attributes: Record<string, string>;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["product_variants"]["Row"]> & {
          product_id: string;
          variant_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_variants"]["Row"]>;
      };
      inventory_transactions: {
        Row: {
          id: string;
          store_id: string;
          product_id: string;
          variant_id: string | null;
          type: InventoryTxnType;
          quantity: number;
          reason: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["inventory_transactions"]["Row"]> & {
          store_id: string;
          product_id: string;
          type: InventoryTxnType;
          quantity: number;
        };
        Update: Partial<Database["public"]["Tables"]["inventory_transactions"]["Row"]>;
      };
      addresses: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          phone: string;
          address_line: string;
          city: string | null;
          province: string | null;
          country: string | null;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["addresses"]["Row"]> & {
          user_id: string;
          full_name: string;
          phone: string;
          address_line: string;
        };
        Update: Partial<Database["public"]["Tables"]["addresses"]["Row"]>;
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          customer_id: string;
          store_id: string;
          status: OrderStatus;
          payment_status: PaymentStatus;
          payment_method: string;
          subtotal: number;
          shipping_fee: number;
          total: number;
          shipping_address: Record<string, unknown>;
          customer_note: string | null;
          discount_code: string | null;
          discount_amount: number;
          khqr_string: string | null;
          khqr_md5: string | null;
          bakong_verified_at: string | null;
          bakong_last_checked_at: string | null;
          created_at: string;
          updated_at: string;
          paid_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["orders"]["Row"]> & {
          order_number: string;
          customer_id: string;
          store_id: string;
          shipping_address: Record<string, unknown>;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Row"]>;
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          store_id: string;
          product_id: string;
          variant_id: string | null;
          product_name: string;
          product_image: string | null;
          unit_price: number;
          quantity: number;
          subtotal: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["order_items"]["Row"]> & {
          order_id: string;
          store_id: string;
          product_id: string;
          product_name: string;
          unit_price: number;
          quantity: number;
          subtotal: number;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Row"]>;
      };
      order_status_history: {
        Row: {
          id: string;
          order_id: string;
          status: OrderStatus;
          note: string | null;
          changed_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["order_status_history"]["Row"]> & {
          order_id: string;
          status: OrderStatus;
        };
        Update: Partial<Database["public"]["Tables"]["order_status_history"]["Row"]>;
      };
      saved_products: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["saved_products"]["Row"]> & {
          user_id: string;
          product_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["saved_products"]["Row"]>;
      };
      cart_items: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          variant_id: string | null;
          quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["cart_items"]["Row"]> & {
          user_id: string;
          product_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["cart_items"]["Row"]>;
      };
      posts: {
        Row: {
          id: string;
          store_id: string;
          author_id: string;
          content: string;
          product_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["posts"]["Row"]> & {
          store_id: string;
          author_id: string;
          content: string;
        };
        Update: Partial<Database["public"]["Tables"]["posts"]["Row"]>;
      };
      post_media: {
        Row: {
          id: string;
          post_id: string;
          url: string;
          media_type: "image" | "video";
          sort_order: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["post_media"]["Row"]> & {
          post_id: string;
          url: string;
        };
        Update: Partial<Database["public"]["Tables"]["post_media"]["Row"]>;
      };
      likes: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["likes"]["Row"]> & {
          post_id: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["likes"]["Row"]>;
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          content: string;
          parent_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["comments"]["Row"]> & {
          post_id: string;
          user_id: string;
          content: string;
        };
        Update: Partial<Database["public"]["Tables"]["comments"]["Row"]>;
      };
      conversations: {
        Row: {
          id: string;
          customer_id: string;
          store_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["conversations"]["Row"]> & {
          customer_id: string;
          store_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["conversations"]["Row"]>;
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string | null;
          reply_to_id: string | null;
          attachment_url: string | null;
          location_lat: number | null;
          location_lng: number | null;
          edited_at: string | null;
          created_at: string;
          read_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["messages"]["Row"]> & {
          conversation_id: string;
          sender_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Row"]>;
      };
      stories: {
        Row: {
          id: string;
          store_id: string;
          media_type: StoryMediaType;
          media_url: string | null;
          caption: string | null;
          text_content: string | null;
          product_id: string | null;
          created_at: string;
          expires_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["stories"]["Row"]> & {
          store_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["stories"]["Row"]>;
      };
      ai_plans: {
        Row: {
          id: string;
          name: string;
          duration_months: number;
          price: number;
          message_limit: number;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["ai_plans"]["Row"]> & { name: string; duration_months: number; price: number };
        Update: Partial<Database["public"]["Tables"]["ai_plans"]["Row"]>;
      };
      ai_subscriptions: {
        Row: {
          id: string;
          store_id: string;
          plan_id: string;
          status: AiSubscriptionStatus;
          payment_method: string;
          started_at: string;
          expires_at: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["ai_subscriptions"]["Row"]> & { store_id: string; plan_id: string; expires_at: string };
        Update: Partial<Database["public"]["Tables"]["ai_subscriptions"]["Row"]>;
      };
      ai_usage: {
        Row: {
          id: string;
          store_id: string;
          month: string;
          messages_used: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["ai_usage"]["Row"]> & { store_id: string; month: string };
        Update: Partial<Database["public"]["Tables"]["ai_usage"]["Row"]>;
      };
      ai_documents: {
        Row: {
          id: string;
          store_id: string;
          file_name: string;
          file_type: string;
          storage_url: string;
          status: AiDocumentStatus;
          char_count: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["ai_documents"]["Row"]> & { store_id: string; file_name: string; file_type: string; storage_url: string };
        Update: Partial<Database["public"]["Tables"]["ai_documents"]["Row"]>;
      };
      ai_document_chunks: {
        Row: {
          id: string;
          document_id: string;
          store_id: string;
          content: string;
          chunk_index: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["ai_document_chunks"]["Row"]> & { document_id: string; store_id: string; content: string };
        Update: Partial<Database["public"]["Tables"]["ai_document_chunks"]["Row"]>;
      };
      ai_threads: {
        Row: {
          id: string;
          store_id: string;
          customer_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["ai_threads"]["Row"]> & { store_id: string; customer_id: string };
        Update: Partial<Database["public"]["Tables"]["ai_threads"]["Row"]>;
      };
      ai_messages: {
        Row: {
          id: string;
          thread_id: string;
          role: AiMessageRole;
          content: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["ai_messages"]["Row"]> & { thread_id: string; role: AiMessageRole; content: string };
        Update: Partial<Database["public"]["Tables"]["ai_messages"]["Row"]>;
      };
      discount_codes: {
        Row: {
          id: string;
          store_id: string;
          code: string;
          discount_type: DiscountType;
          value: number;
          min_order_amount: number;
          usage_limit: number | null;
          used_count: number;
          expires_at: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["discount_codes"]["Row"]> & { store_id: string; code: string; value: number };
        Update: Partial<Database["public"]["Tables"]["discount_codes"]["Row"]>;
      };
      boost_plans: {
        Row: {
          id: string;
          duration_days: number;
          price: number;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["boost_plans"]["Row"]> & { duration_days: number; price: number };
        Update: Partial<Database["public"]["Tables"]["boost_plans"]["Row"]>;
      };
      boost_campaigns: {
        Row: {
          id: string;
          store_id: string;
          target_type: BoostTargetType;
          post_id: string | null;
          product_id: string | null;
          plan_id: string;
          status: BoostStatus;
          payment_method: string;
          khqr_string: string | null;
          khqr_md5: string | null;
          bakong_last_checked_at: string | null;
          bakong_verified_at: string | null;
          started_at: string;
          expires_at: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["boost_campaigns"]["Row"]> & {
          store_id: string;
          target_type: BoostTargetType;
          plan_id: string;
          expires_at: string;
        };
        Update: Partial<Database["public"]["Tables"]["boost_campaigns"]["Row"]>;
      };
      platform_settings: {
        Row: {
          id: number;
          platform_name: string;
          platform_city: string;
          bakong_account_id: string | null;
          bakong_phone: string | null;
          telegram_bot_token: string | null;
          telegram_bot_username: string | null;
          telegram_chat_id: string | null;
          bakong_developer_token: string | null;
          bakong_use_sandbox: boolean;
          all_category_icon_url: string | null;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["platform_settings"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["platform_settings"]["Row"]>;
      };
      support_tickets: {
        Row: {
          id: string;
          store_id: string;
          created_by: string;
          subject: string;
          message: string;
          status: SupportTicketStatus;
          admin_reply: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["support_tickets"]["Row"]> & {
          store_id: string;
          created_by: string;
          subject: string;
          message: string;
        };
        Update: Partial<Database["public"]["Tables"]["support_tickets"]["Row"]>;
      };
      reviews: {
        Row: {
          id: string;
          product_id: string;
          order_item_id: string;
          customer_id: string;
          store_id: string;
          rating: number;
          comment: string | null;
          seller_reply: string | null;
          images: string[];
          seller_replied_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["reviews"]["Row"]> & {
          product_id: string;
          order_item_id: string;
          customer_id: string;
          store_id: string;
          rating: number;
        };
        Update: Partial<Database["public"]["Tables"]["reviews"]["Row"]>;
      };
      bakong_api_calls: {
        Row: { id: string; order_id: string | null; boost_campaign_id: string | null; called_at: string };
        Insert: Partial<Database["public"]["Tables"]["bakong_api_calls"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["bakong_api_calls"]["Row"]>;
      };
      store_followers: {
        Row: { id: string; store_id: string; user_id: string; created_at: string };
        Insert: { store_id: string; user_id: string };
        Update: Partial<Database["public"]["Tables"]["store_followers"]["Row"]>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          title: string;
          message: string;
          link: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["notifications"]["Row"]> & { user_id: string; title: string; message: string };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Row"]>;
      };
    };
  };
}
