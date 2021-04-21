SELECT place.placeid, place.title, toponym.toponym, toponym.toponymlanguage
FROM place
INNER JOIN public.toponym ON place.placeid=toponym.placeid;