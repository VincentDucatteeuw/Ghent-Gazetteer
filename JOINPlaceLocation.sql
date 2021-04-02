SELECT place.placeid, place.title, location.geometry
FROM public.place
INNER JOIN public.location ON place.placeid=location.placeid;