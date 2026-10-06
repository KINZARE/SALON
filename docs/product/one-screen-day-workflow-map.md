# Daily workflow audit

| Task | Before | After target | Server primitive | Interactions before/after |
|---|---|---|---|---|
| View appointment | Today → detail route | Select row → context | Tenant scoped read | 1/1 |
| Check in | Detail → check-in | Select → Inchecken | transition_appointment_status | 2/2 |
| Start | Missing | Select → Start behandeling | additive CAS daily RPC | unavailable/2 |
| Finish | Detail → Afronden | Select → Afronden | transition_appointment_status | 2/2 |
| Payment | Read-only status | Context status (no invented mutation) | existing payment truth | 1/1 |
| Customer/note/intake | Detail/customer/admin routes | Same panel subview | scoped existing reads/note primitive | 2–3/2 |
| Rebook | Customer → calendar/new | Select → Opnieuw boeken | createInternalBooking | 3+/2+ |
| New | Today → calendar/new | Nieuwe afspraak / gap | atomic booking + availability | 1+route/1 |
| Move | Detail → reschedule route | Select → Verplaatsen | moveWorkspaceAppointment | 2+route/2 |
| Cancel/no-show | Detail → More | Select → Meer → confirm | transition RPC | 3/3 |
| Break/block | More → blocks | gap → More → Pauze/block | saveWorkspaceEntity(block) | 3+/2+ |
| Waitlist | Attention → waitlist route | matching gap → candidate | existing match + availability | 2+route/2 |

Current baseline has no persistent treatment-start state, read-only staff behavior and no manual payment recording. PR #17 expansion remains draft and out of scope. Current no-login mode is explicitly synthetic; security review must not mislabel it authenticated production tenancy.
