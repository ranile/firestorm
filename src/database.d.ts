export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      attachments: {
        Row: {
          hashes: Json
          id: string
          key_ciphertext: string
          message_id: string | null
          name: string
          type: string
        }
        Insert: {
          hashes: Json
          id: string
          key_ciphertext: string
          message_id?: string | null
          name: string
          type: string
        }
        Update: {
          hashes?: Json
          id?: string
          key_ciphertext?: string
          message_id?: string | null
          name?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_id_fkey"
            columns: ["id"]
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_id_fkey"
            columns: ["id"]
            referencedRelation: "attachments_and_objects"
            referencedColumns: ["object_id"]
          },
          {
            foreignKeyName: "attachments_message_id_fkey"
            columns: ["message_id"]
            referencedRelation: "messages"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          author_id: string
          content: string
          created_at: string
          deleted: boolean
          id: string
          reply_to: string | null
          room_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          deleted?: boolean
          id?: string
          reply_to?: string | null
          room_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          deleted?: boolean
          id?: string
          reply_to?: string | null
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_author_id_fkey"
            columns: ["author_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_author_id_fkey"
            columns: ["author_id"]
            referencedRelation: "room_members_with_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_author_id_fkey"
            columns: ["author_id"]
            referencedRelation: "users_with_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_fkey"
            columns: ["reply_to"]
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_room_id_fkey"
            columns: ["room_id"]
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          avatar: string | null
          id: string
          username: string | null
        }
        Insert: {
          avatar?: string | null
          id: string
          username?: string | null
        }
        Update: {
          avatar?: string | null
          id?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "room_members_with_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users_with_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      room_members: {
        Row: {
          join_state: Database["public"]["Enums"]["member_join_state"]
          joined_at: string
          member_id: string
          room_id: string
          session_key: string | null
        }
        Insert: {
          join_state?: Database["public"]["Enums"]["member_join_state"]
          joined_at?: string
          member_id: string
          room_id: string
          session_key?: string | null
        }
        Update: {
          join_state?: Database["public"]["Enums"]["member_join_state"]
          joined_at?: string
          member_id?: string
          room_id?: string
          session_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "room_members_member_id_fkey"
            columns: ["member_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_members_member_id_fkey"
            columns: ["member_id"]
            referencedRelation: "room_members_with_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_members_member_id_fkey"
            columns: ["member_id"]
            referencedRelation: "users_with_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_members_room_id_fkey"
            columns: ["room_id"]
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          }
        ]
      }
      room_session_key_request: {
        Row: {
          requested_by: string
          requested_from: string
          room_id: string
        }
        Insert: {
          requested_by: string
          requested_from: string
          room_id: string
        }
        Update: {
          requested_by?: string
          requested_from?: string
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_session_key_request_requested_by_fkey"
            columns: ["requested_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_session_key_request_requested_by_fkey"
            columns: ["requested_by"]
            referencedRelation: "room_members_with_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_session_key_request_requested_by_fkey"
            columns: ["requested_by"]
            referencedRelation: "users_with_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_session_key_request_requested_from_fkey"
            columns: ["requested_from"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_session_key_request_requested_from_fkey"
            columns: ["requested_from"]
            referencedRelation: "room_members_with_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_session_key_request_requested_from_fkey"
            columns: ["requested_from"]
            referencedRelation: "users_with_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_session_key_request_room_id_fkey"
            columns: ["room_id"]
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          }
        ]
      }
      room_session_keys: {
        Row: {
          key: string | null
          key_for: string
          key_of: string
          room_id: string
        }
        Insert: {
          key?: string | null
          key_for: string
          key_of: string
          room_id: string
        }
        Update: {
          key?: string | null
          key_for?: string
          key_of?: string
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_session_keys_key_for_fkey"
            columns: ["key_for"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_session_keys_key_for_fkey"
            columns: ["key_for"]
            referencedRelation: "room_members_with_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_session_keys_key_for_fkey"
            columns: ["key_for"]
            referencedRelation: "users_with_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_session_keys_key_of_fkey"
            columns: ["key_of"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_session_keys_key_of_fkey"
            columns: ["key_of"]
            referencedRelation: "room_members_with_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_session_keys_key_of_fkey"
            columns: ["key_of"]
            referencedRelation: "users_with_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_session_keys_room_id_fkey"
            columns: ["room_id"]
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          }
        ]
      }
      rooms: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "room_members_with_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users_with_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      user_devices: {
        Row: {
          device_id: string
          id: string
        }
        Insert: {
          device_id: string
          id: string
        }
        Update: {
          device_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_devices_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_devices_id_fkey"
            columns: ["id"]
            referencedRelation: "room_members_with_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_devices_id_fkey"
            columns: ["id"]
            referencedRelation: "users_with_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      user_identity_keys: {
        Row: {
          curve25519: string
          ed25519: string
          id: string
        }
        Insert: {
          curve25519: string
          ed25519: string
          id: string
        }
        Update: {
          curve25519?: string
          ed25519?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_identity_keys_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_identity_keys_id_fkey"
            columns: ["id"]
            referencedRelation: "room_members_with_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_identity_keys_id_fkey"
            columns: ["id"]
            referencedRelation: "users_with_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      user_one_time_keys: {
        Row: {
          curve25519: string
          id: string
        }
        Insert: {
          curve25519: string
          id: string
        }
        Update: {
          curve25519?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_one_time_keys_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_one_time_keys_id_fkey"
            columns: ["id"]
            referencedRelation: "room_members_with_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_one_time_keys_id_fkey"
            columns: ["id"]
            referencedRelation: "users_with_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      web_push_subscriptions: {
        Row: {
          endpoint: string
          id: string
          keys_auth: string | null
          keys_p256dh: string
          user_id: string
        }
        Insert: {
          endpoint: string
          id?: string
          keys_auth?: string | null
          keys_p256dh: string
          user_id: string
        }
        Update: {
          endpoint?: string
          id?: string
          keys_auth?: string | null
          keys_p256dh?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "web_push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "room_members_with_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users_with_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      attachments_and_objects: {
        Row: {
          attachment_id: string | null
          hashes: Json | null
          key_ciphertext: string | null
          message_id: string | null
          name: string | null
          object_id: string | null
          path: string | null
          type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attachments_id_fkey"
            columns: ["attachment_id"]
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_id_fkey"
            columns: ["attachment_id"]
            referencedRelation: "attachments_and_objects"
            referencedColumns: ["object_id"]
          },
          {
            foreignKeyName: "attachments_message_id_fkey"
            columns: ["message_id"]
            referencedRelation: "messages"
            referencedColumns: ["id"]
          }
        ]
      }
      room_members_with_users: {
        Row: {
          avatar: string | null
          email: string | null
          id: string | null
          join_state: Database["public"]["Enums"]["member_join_state"] | null
          joined_at: string | null
          room_id: string | null
          username: string | null
        }
        Relationships: [
          {
            foreignKeyName: "room_members_room_id_fkey"
            columns: ["room_id"]
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          }
        ]
      }
      users_with_profiles: {
        Row: {
          avatar: string | null
          email: string | null
          id: string | null
          username: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_keys_for_members: {
        Args: {
          _room_id: string
          member_ids: string[]
        }
        Returns: {
          member_id: string
          identity_key_curve25519: string
          one_time_key_id: string
          one_time_key_curve25519: string
        }[]
      }
      get_one_time_key: {
        Args: {
          uid: string
        }
        Returns: {
          curve25519: string
          id: string
        }
      }
      http: {
        Args: {
          request: Database["public"]["CompositeTypes"]["http_request"]
        }
        Returns: unknown
      }
      http_delete:
        | {
            Args: {
              uri: string
            }
            Returns: unknown
          }
        | {
            Args: {
              uri: string
              content: string
              content_type: string
            }
            Returns: unknown
          }
      http_get:
        | {
            Args: {
              uri: string
            }
            Returns: unknown
          }
        | {
            Args: {
              uri: string
              data: Json
            }
            Returns: unknown
          }
      http_head: {
        Args: {
          uri: string
        }
        Returns: unknown
      }
      http_header: {
        Args: {
          field: string
          value: string
        }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
      }
      http_list_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: {
          uri: string
          content: string
          content_type: string
        }
        Returns: unknown
      }
      http_post:
        | {
            Args: {
              uri: string
              content: string
              content_type: string
            }
            Returns: unknown
          }
        | {
            Args: {
              uri: string
              data: Json
            }
            Returns: unknown
          }
      http_put: {
        Args: {
          uri: string
          content: string
          content_type: string
        }
        Returns: unknown
      }
      http_reset_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      http_set_curlopt: {
        Args: {
          curlopt: string
          value: string
        }
        Returns: boolean
      }
      insert_message: {
        Args: {
          p_uid: string
          p_files: Json
          p_room_id: string
          p_ciphertext: string
          p_reply_to?: string
        }
        Returns: undefined
      }
      is_member_of: {
        Args: {
          _user_id: string
          _room_id: string
        }
        Returns: boolean
      }
      urlencode:
        | {
            Args: {
              string: string
            }
            Returns: string
          }
        | {
            Args: {
              string: string
            }
            Returns: string
          }
        | {
            Args: {
              data: Json
            }
            Returns: string
          }
    }
    Enums: {
      member_join_state: "invited" | "joined"
    }
    CompositeTypes: {
      http_header: {
        field: string
        value: string
      }
      http_request: {
        method: unknown
        uri: string
        headers: unknown
        content_type: string
        content: string
      }
      http_response: {
        status: number
        content_type: string
        headers: unknown
        content: string
      }
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          public: boolean | null
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "buckets_owner_fkey"
            columns: ["owner"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buckets_owner_fkey"
            columns: ["owner"]
            referencedRelation: "room_members_with_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buckets_owner_fkey"
            columns: ["owner"]
            referencedRelation: "users_with_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          path_tokens: string[] | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_insert_object: {
        Args: {
          bucketid: string
          name: string
          owner: string
          metadata: Json
        }
        Returns: undefined
      }
      extension: {
        Args: {
          name: string
        }
        Returns: string
      }
      filename: {
        Args: {
          name: string
        }
        Returns: string
      }
      foldername: {
        Args: {
          name: string
        }
        Returns: unknown
      }
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>
        Returns: {
          size: number
          bucket_id: string
        }[]
      }
      search: {
        Args: {
          prefix: string
          bucketname: string
          limits?: number
          levels?: number
          offsets?: number
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          name: string
          id: string
          updated_at: string
          created_at: string
          last_accessed_at: string
          metadata: Json
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

