export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      bookmarks: {
        Row: {
          id: string;
          user_id: string;
          url: string;
          title: string | null;
          description: string | null;
          favicon_url: string | null;
          preview_image_url: string | null;
          site_name: string | null;
          group_id: string | null;
          tags: string[];
          sort_order: number;
          source: "manual" | "text_extract" | "screenshot" | "import" | "extension";
          source_metadata: Json;
          is_archived: boolean;
          is_favorite: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          url: string;
          title?: string | null;
          description?: string | null;
          favicon_url?: string | null;
          preview_image_url?: string | null;
          site_name?: string | null;
          group_id?: string | null;
          tags?: string[];
          sort_order?: number;
          source?: "manual" | "text_extract" | "screenshot" | "import" | "extension";
          source_metadata?: Json;
          is_archived?: boolean;
          is_favorite?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          url?: string;
          title?: string | null;
          description?: string | null;
          favicon_url?: string | null;
          preview_image_url?: string | null;
          site_name?: string | null;
          group_id?: string | null;
          tags?: string[];
          sort_order?: number;
          source?: "manual" | "text_extract" | "screenshot" | "import" | "extension";
          source_metadata?: Json;
          is_archived?: boolean;
          is_favorite?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      groups: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          color?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      bookmark_content: {
        Row: {
          id: string;
          bookmark_id: string;
          content: string | null;
          content_hash: string | null;
          crawled_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          bookmark_id: string;
          content?: string | null;
          content_hash?: string | null;
          crawled_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          bookmark_id?: string;
          content?: string | null;
          content_hash?: string | null;
          crawled_at?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Convenience types
export type Bookmark = Database["public"]["Tables"]["bookmarks"]["Row"];
export type BookmarkInsert = Database["public"]["Tables"]["bookmarks"]["Insert"];
export type BookmarkUpdate = Database["public"]["Tables"]["bookmarks"]["Update"];

export type Group = Database["public"]["Tables"]["groups"]["Row"];
export type GroupInsert = Database["public"]["Tables"]["groups"]["Insert"];
export type GroupUpdate = Database["public"]["Tables"]["groups"]["Update"];

export type BookmarkWithGroup = Bookmark & {
  group: Group | null;
};
