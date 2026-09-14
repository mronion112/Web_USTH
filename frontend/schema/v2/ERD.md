# ERD — Database Schema v2

ERD này đồng bộ với `Schema.md` và `schema.dbml`.

```mermaid
erDiagram
    roles {
        tinyint id PK
        varchar(30) code UK
        varchar(100) name
        varchar(255) description
    }
    permissions {
        smallint id PK
        varchar(100) code UK
        varchar(50) module
        varchar(255) description
    }
    role_permissions {
        tinyint role_id PK,FK
        smallint permission_id PK,FK
    }
    accounts {
        bigint id PK
        tinyint role_id FK
        varchar(255) google_subject UK
        varchar(255) email UK
        varchar(150) display_name
        varchar(500) avatar_url
        boolean is_active
        bigint provisioned_by_account_id FK
        datetime last_login_at
        timestamp created_at
        timestamp updated_at
    }
    customer_profiles {
        bigint account_id PK,FK
        varchar(30) phone
        text preferences
        text internal_notes
        timestamp created_at
        timestamp updated_at
    }
    staff_profiles {
        bigint account_id PK,FK
        varchar(50) employee_code UK
        varchar(100) job_title
        boolean is_bookable
        timestamp created_at
        timestamp updated_at
    }
    services {
        bigint id PK
        varchar(150) name UK
        varchar(100) category
        text description
        varchar(500) image_url
        decimal(12,2) base_price
        int minimum_duration_minutes
        boolean is_duration_adjustable
        int duration_step_minutes
        decimal(12,2) price_per_duration_step
        int preparation_buffer_minutes
        int cleanup_buffer_minutes
        int display_order
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    staff_services {
        bigint staff_account_id PK,FK
        bigint service_id PK,FK
    }
    staff_working_hours {
        bigint id PK
        bigint staff_account_id FK
        tinyint day_of_week
        time start_time
        time end_time
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    staff_time_off {
        bigint id PK
        bigint staff_account_id FK
        datetime start_at
        datetime end_at
        varchar(500) reason
        timestamp created_at
    }
    bookings {
        bigint id PK
        varchar(32) booking_code UK
        bigint customer_account_id FK
        bigint staff_account_id FK
        booking_status status
        assignment_source assignment_source
        varchar(150) customer_name_snapshot
        varchar(255) customer_email_snapshot
        varchar(30) customer_phone_snapshot
        datetime booking_start
        datetime booking_end
        text customer_note
        int total_duration_minutes
        decimal(12,2) total_amount
        datetime checked_in_at
        datetime service_started_at
        datetime completed_at
        bigint created_by_account_id FK
        timestamp created_at
        timestamp updated_at
    }
    booking_items {
        bigint id PK
        bigint booking_id FK
        bigint service_id FK
        varchar(150) service_name_snapshot
        int duration_minutes
        decimal(12,2) base_price_snapshot
        int additional_duration_steps
        decimal(12,2) price_per_step_snapshot
        decimal(12,2) line_amount
        timestamp created_at
    }
    booking_events {
        bigint id PK
        bigint booking_id FK
        varchar(50) event_type
        bigint actor_account_id FK
        varchar(500) message
        timestamp occurred_at
    }
    payments {
        bigint id PK
        varchar(32) transaction_code UK
        bigint booking_id FK,UK
        payment_status status
        payment_method method
        decimal(12,2) amount
        text qr_payload
        datetime paid_at
        datetime refunded_at
        timestamp created_at
        timestamp updated_at
    }
    feedback {
        bigint id PK
        bigint booking_id FK,UK
        tinyint rating
        text comment
        timestamp created_at
        timestamp updated_at
    }
    roles ||--o{ role_permissions : "role_permissions_role"
    permissions ||--o{ role_permissions : "role_permissions_permission"
    roles ||--o{ accounts : "accounts_role"
    accounts o|--o{ accounts : "accounts_provisioned_by"
    accounts ||--o| customer_profiles : "customer_profiles_account"
    accounts ||--o| staff_profiles : "staff_profiles_account"
    staff_profiles ||--o{ staff_services : "staff_services_staff"
    services ||--o{ staff_services : "staff_services_service"
    staff_profiles ||--o{ staff_working_hours : "working_hours_staff"
    staff_profiles ||--o{ staff_time_off : "time_off_staff"
    customer_profiles ||--o{ bookings : "bookings_customer"
    staff_profiles o|--o{ bookings : "bookings_staff"
    accounts ||--o{ bookings : "bookings_created_by"
    bookings ||--o{ booking_items : "booking_items_booking"
    services ||--o{ booking_items : "booking_items_service"
    bookings ||--o{ booking_events : "booking_events_booking"
    accounts o|--o{ booking_events : "booking_events_actor"
    bookings ||--o| payments : "payments_booking"
    bookings ||--o| feedback : "feedback_booking"
```
