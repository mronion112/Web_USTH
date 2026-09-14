# FRAME 12 — `/admin/booking`



```
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│ Bookings                                                           [+ New Booking]       │
│                                                                                           │
│ ┌─────────────────────────────────────────────────────────────────────────────────────┐  │
│ │ 🔍 Search booking/customer... │ Today ▼ │ Status ▼ │ Service ▼ │ Staff ▼ │ Filters │  │
│ └─────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                           │
│ □ │ BOOKING     │ CUSTOMER       │ DATE & TIME       │ SERVICE       │ STAFF │ STATUS     │
│ ──┼─────────────┼────────────────┼───────────────────┼───────────────┼───────┼────────────│
│ □ │ #LNR-001    │ Nguyen Van A   │ Sep 14 · 14:00   │ Massage 60m   │ Linh  │ ● Confirm │
│ □ │ #LNR-002    │ Tran Thi B     │ Sep 14 · 14:30   │ Facial 45m    │ Mai   │ ● Check-in│
│ □ │ #LNR-003    │ Le Van C       │ Sep 14 · 15:00   │ Body 90m      │ —     │ ○ Pending │
│ □ │ #LNR-004    │ Pham D         │ Sep 14 · 16:00   │ Massage 60m   │ Hoa   │ ✓ Complete│
│                                                                                           │
│ Showing 1–20 of 142                                      < 1  2  3  4 ... 8 >            │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

### Booking detail



```
                                              ┌─────────────────────────────────────┐
                                              │ Booking #LNR-001                ✕  │
                                              │ ● CONFIRMED                        │
                                              │                                     │
                                              │ CUSTOMER                            │
                                              │ Nguyen Van A                        │
                                              │ 0912 345 678                        │
                                              │ nguyen@email.com                    │
                                              │                                     │
                                              │ APPOINTMENT                         │
                                              │ Relaxing Massage                    │
                                              │ Sep 14 · 14:00 → 15:00              │
                                              │ Therapist: Linh                     │
                                              │                                     │
                                              │ PAYMENT                             │
                                              │ 450,000đ                 ✓ PAID     │
                                              │                                     │
                                              │ NOTES                               │
                                              │ Prefer female therapist             │
                                              │                                     │
                                              │ ┌─────────────────────────────────┐ │
                                              │ │       CHECK IN CUSTOMER         │ │
                                              │ └─────────────────────────────────┘ │
                                              │                                     │
                                              │ [Reschedule] [•••]                  │
                                              │                                     │
                                              │ Activity                            │
                                              │ ● 13:42 Confirmation email sent     │
                                              │ ● 13:41 Payment received            │
                                              │ ● 13:40 Booking created             │
                                              └─────────────────────────────────────
```
