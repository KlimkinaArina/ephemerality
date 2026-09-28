export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Timestamps = {
  id: string;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      users: {
        Row: Timestamps & {
          email: string | null;
          telegram_id: string | null;
          oauth_provider: string | null;
          name: string | null;
          avatar_url: string | null;
          role: string;
          platform_origin: string | null;
          last_platform: string | null;
          preferences: Json;
          onboarding_completed: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          email?: string | null;
          telegram_id?: string | null;
          oauth_provider?: string | null;
          name?: string | null;
          avatar_url?: string | null;
          role?: string;
          platform_origin?: string | null;
          last_platform?: string | null;
          preferences?: Json;
          onboarding_completed?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "users_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      authors: {
        Row: Timestamps & {
          user_id: string | null;
          name: string;
          slug: string;
          bio: string | null;
          avatar_url: string | null;
          website_url: string | null;
          is_verified: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id?: string | null;
          name: string;
          slug: string;
          bio?: string | null;
          avatar_url?: string | null;
          website_url?: string | null;
          is_verified?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["authors"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "authors_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      films: {
        Row: Timestamps & {
          author_id: string;
          user_id: string | null;
          title: string;
          slug: string;
          description: string | null;
          duration_seconds: number;
          genre: string[];
          themes: string[];
          moods: string[];
          video_url: string | null;
          thumbnail_url: string | null;
          trailer_url: string | null;
          share_image_url: string | null;
          status: string;
          visibility: string;
          release_date: string | null;
          views_count: number;
          rating_avg: number;
          rating_count: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          author_id: string;
          user_id?: string | null;
          title: string;
          slug: string;
          description?: string | null;
          duration_seconds: number;
          genre?: string[];
          themes?: string[];
          moods?: string[];
          video_url?: string | null;
          thumbnail_url?: string | null;
          trailer_url?: string | null;
          share_image_url?: string | null;
          status?: string;
          visibility?: string;
          release_date?: string | null;
          views_count?: number;
          rating_avg?: number;
          rating_count?: number;
        };
        Update: Partial<Database["public"]["Tables"]["films"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "films_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "authors";
            referencedColumns: ["id"];
          },
        ];
      };
      collections: {
        Row: Timestamps & {
          title: string;
          slug: string;
          description: string | null;
          curator_user_id: string | null;
          curator_name: string | null;
          cover_url: string | null;
          status: string;
          visibility: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          title: string;
          slug: string;
          description?: string | null;
          curator_user_id?: string | null;
          curator_name?: string | null;
          cover_url?: string | null;
          status?: string;
          visibility?: string;
        };
        Update: Partial<Database["public"]["Tables"]["collections"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "collections_curator_user_id_fkey";
            columns: ["curator_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      collection_films: {
        Row: Timestamps & {
          collection_id: string;
          film_id: string;
          position: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          collection_id: string;
          film_id: string;
          position?: number;
        };
        Update: Partial<Database["public"]["Tables"]["collection_films"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "collection_films_collection_id_fkey";
            columns: ["collection_id"];
            isOneToOne: false;
            referencedRelation: "collections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "collection_films_film_id_fkey";
            columns: ["film_id"];
            isOneToOne: false;
            referencedRelation: "films";
            referencedColumns: ["id"];
          },
        ];
      };
      film_views: {
        Row: Timestamps & {
          user_id: string | null;
          film_id: string;
          session_id: string | null;
          platform: string | null;
          started_at: string;
          last_position_seconds: number;
          watched_seconds: number;
          completed: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id?: string | null;
          film_id: string;
          session_id?: string | null;
          platform?: string | null;
          started_at?: string;
          last_position_seconds?: number;
          watched_seconds?: number;
          completed?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["film_views"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "film_views_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "film_views_film_id_fkey";
            columns: ["film_id"];
            isOneToOne: false;
            referencedRelation: "films";
            referencedColumns: ["id"];
          },
        ];
      };
      ratings: {
        Row: Timestamps & {
          user_id: string;
          film_id: string;
          value: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id: string;
          film_id: string;
          value: number;
        };
        Update: Partial<Database["public"]["Tables"]["ratings"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "ratings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ratings_film_id_fkey";
            columns: ["film_id"];
            isOneToOne: false;
            referencedRelation: "films";
            referencedColumns: ["id"];
          },
        ];
      };
      favorites: {
        Row: Timestamps & {
          user_id: string;
          film_id: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id: string;
          film_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["favorites"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "favorites_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "favorites_film_id_fkey";
            columns: ["film_id"];
            isOneToOne: false;
            referencedRelation: "films";
            referencedColumns: ["id"];
          },
        ];
      };
      author_follows: {
        Row: Timestamps & {
          user_id: string;
          author_id: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id: string;
          author_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["author_follows"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "author_follows_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "author_follows_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "authors";
            referencedColumns: ["id"];
          },
        ];
      };
      recommendations: {
        Row: Timestamps & {
          user_id: string;
          film_id: string;
          source: string;
          score: number;
          reason: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id: string;
          film_id: string;
          source?: string;
          score?: number;
          reason?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["recommendations"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "recommendations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recommendations_film_id_fkey";
            columns: ["film_id"];
            isOneToOne: false;
            referencedRelation: "films";
            referencedColumns: ["id"];
          },
        ];
      };
      subscriptions: {
        Row: Timestamps & {
          user_id: string;
          plan: string;
          status: string;
          provider: string | null;
          provider_subscription_id: string | null;
          current_period_end: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id: string;
          plan?: string;
          status?: string;
          provider?: string | null;
          provider_subscription_id?: string | null;
          current_period_end?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: Timestamps & {
          user_id: string;
          film_id: string | null;
          type: string;
          title: string;
          body: string | null;
          read_at: string | null;
          data: Json;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id: string;
          film_id?: string | null;
          type: string;
          title: string;
          body?: string | null;
          read_at?: string | null;
          data?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_film_id_fkey";
            columns: ["film_id"];
            isOneToOne: false;
            referencedRelation: "films";
            referencedColumns: ["id"];
          },
        ];
      };
      shares: {
        Row: Timestamps & {
          user_id: string | null;
          film_id: string;
          target: string;
          platform: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id?: string | null;
          film_id: string;
          target: string;
          platform?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["shares"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "shares_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shares_film_id_fkey";
            columns: ["film_id"];
            isOneToOne: false;
            referencedRelation: "films";
            referencedColumns: ["id"];
          },
        ];
      };
      analytics_events: {
        Row: Timestamps & {
          user_id: string | null;
          session_id: string | null;
          name: string;
          platform: string | null;
          properties: Json;
          occurred_at: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id?: string | null;
          session_id?: string | null;
          name: string;
          platform?: string | null;
          properties?: Json;
          occurred_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["analytics_events"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "analytics_events_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_requests: {
        Row: Timestamps & {
          user_id: string | null;
          model: string | null;
          prompt_tokens: number;
          completion_tokens: number;
          cost_cents: number;
          status: string;
          metadata: Json;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id?: string | null;
          model?: string | null;
          prompt_tokens?: number;
          completion_tokens?: number;
          cost_cents?: number;
          status?: string;
          metadata?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["ai_requests"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "ai_requests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
