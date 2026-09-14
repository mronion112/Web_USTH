```
                              LUNARA WEB APP

                                  /
                                  │
                     ┌────────────┴────────────┐
                     │                         │
                Landing Page              Booking button
                                               │
                                               ▼
                                             /auth
                                               │
                                          Google Auth
                                               │
                                               ▼
                                            /booking
                                               │
                                        Xác nhận đặt
                                               │
                                               ▼
                                           /checkout
                                               │
                                      Xác nhận thanh toán
                                               │
                                               ▼
                                           /ticket/{id}
                                               │
                                               ▼
                                      Xem thông tin vé


BOOKING THÀNH CÔNG
        │
        └──────────────► EMAIL
                            │
                            ├── Xem vé của bạn
                            │
                            └── Thêm vào Calendar


ADMIN
   │
   ▼
/admin/login
   │
   ▼
/admin/
   │
   ├── OVERVIEW
   │    ├── Dashboard
   │    └── Live
   │
   ├── OPERATIONS
   │    ├── Booking
   │    ├── Calendar
   │    └── Customers
   │
   ├── MANAGEMENT
   │    ├── Staff
   │    ├── Services
   │    ├── Payments
   │    └── User & Role
   │
   └── ANALYTICS
        └── Reports
```

---
