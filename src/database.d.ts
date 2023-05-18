export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json }
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
    };
    public: {
        Tables: {
            messages: {
                Row: {
                    author_id: string
                    content: string
                    created_at: string
                    id: string
                    room_id: string
                }
                Insert: {
                    author_id: string
                    content: string
                    created_at?: string
                    id?: string
                    room_id: string
                }
                Update: {
                    author_id?: string
                    content?: string
                    created_at?: string
                    id?: string
                    room_id?: string
                }
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
            }
            room_members: {
                Row: {
                    join_state: Database['public']['Enums']['member_join_state']
                    joined_at: string
                    member_id: string
                    room_id: string
                    session_key: string | null
                }
                Insert: {
                    join_state?: Database['public']['Enums']['member_join_state']
                    joined_at?: string
                    member_id: string
                    room_id: string
                    session_key?: string | null
                }
                Update: {
                    join_state?: Database['public']['Enums']['member_join_state']
                    joined_at?: string
                    member_id?: string
                    room_id?: string
                    session_key?: string | null
                }
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
            }
            user_identity_keys: {
                Row: {
                    id: string
                    identity_key: string
                }
                Insert: {
                    id: string
                    identity_key: string
                }
                Update: {
                    id?: string
                    identity_key?: string
                }
            }
            user_one_time_keys: {
                Row: {
                    id: string
                    one_time_key: string
                }
                Insert: {
                    id: string
                    one_time_key: string
                }
                Update: {
                    id?: string
                    one_time_key?: string
                }
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
            }
        }
        Views: {
            room_members_with_users: {
                Row: {
                    avatar: string | null
                    email: string | null
                    id: string | null
                    join_state: Database['public']['Enums']['member_join_state'] | null
                    joined_at: string | null
                    room_id: string | null
                    username: string | null
                }
            }
            users_with_profiles: {
                Row: {
                    avatar: string | null
                    email: string | null
                    id: string | null
                    username: string | null
                }
            }
        }
        Functions: {
            http: {
                Args: {
                    request: Database['public']['CompositeTypes']['http_request']
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
                    data: Json
                }
                Returns: unknown
            }
                | {
                Args: {
                    uri: string
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
                Returns: Database['public']['CompositeTypes']['http_header']
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
                    data: Json
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
            member_join_state: 'invited' | 'joined'
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
    };
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
                Returns: string[]
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
    };
}

