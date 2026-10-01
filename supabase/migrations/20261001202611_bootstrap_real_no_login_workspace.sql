insert into public.salons (slug,name,timezone,currency)
values ('salon','SALON','Europe/Amsterdam','EUR')
on conflict (slug) do nothing;

insert into public.booking_settings (salon_id)
select id from public.salons where slug='salon'
on conflict (salon_id) do nothing;

insert into public.opening_hours (salon_id,weekday,is_open,start_time,end_time)
select s.id,v.weekday,v.is_open,v.start_time,v.end_time
from public.salons s
cross join (values
  (0,false,null::time,null::time),
  (1,true,time '09:00',time '18:00'),
  (2,true,time '09:00',time '18:00'),
  (3,true,time '09:00',time '18:00'),
  (4,true,time '09:00',time '18:00'),
  (5,true,time '09:00',time '18:00'),
  (6,false,null::time,null::time)
) as v(weekday,is_open,start_time,end_time)
where s.slug='salon'
on conflict (salon_id,weekday) do nothing;
