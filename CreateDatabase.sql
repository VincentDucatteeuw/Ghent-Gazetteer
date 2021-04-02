
BEGIN;


CREATE TABLE GhentGazetteer.certainty
(
    "certaintyID" integer NOT NULL,
    "certaintyLabel" character varying(20) NOT NULL,
    "certaintyDescription" character varying(255),
    PRIMARY KEY ("certaintyID")
);

COMMENT ON TABLE public.certainty
    IS 'Table stores "certainty" values. Values for the optional certainty of an observation can be "certain", "less-certain" and "uncertain".
    Follows LP-model. Is there a need for a more complex model?';

CREATE TABLE public.description
(
    "descriptionID" integer NOT NULL,
    "placeID" integer NOT NULL,
    description text NOT NULL,
    "descriptionLanguage" character varying(2) NOT NULL,
    "timespanID" integer,
    "periodID" integer,
    "sourceID" integer NOT NULL,
    "certaintyID" integer,
    editorialcomment text,
    PRIMARY KEY ("descriptionID")
);

COMMENT ON TABLE public.description
    IS 'This table stores the historical descriptions found in sources of a place.';

CREATE TABLE public.location
(
    "geometryID" integer NOT NULL,
    "placeID" integer NOT NULL,
    geometry geometry NOT NULL,
    "timespanID" integer,
    "periodID" integer,
    "sourceID" integer NOT NULL,
    "certaintyID" integer,
    editorialcomment text,
    PRIMARY KEY ("geometryID")
);

COMMENT ON TABLE public.location
    IS 'This table holds the observations that refer to the physical location of a place. These observations are GIS-based. Semantic localisation can be done through table relation.';

CREATE TABLE public.name
(
    "nameID" integer NOT NULL,
    "placeID" integer NOT NULL,
    toponym character varying(255) NOT NULL,
    "toponymLanguage" character varying(2) NOT NULL,
    "timespanID" integer,
    "periodID" integer,
    "sourceID" integer NOT NULL,
    "certaintyID" integer,
    "editorialComment" text,
    PRIMARY KEY ("nameID")
);

COMMENT ON TABLE public.name
    IS 'This table holds all observations regarding toponyms of a place.';

CREATE TABLE public.period
(
    "periodID" integer NOT NULL,
    "periodoPermalink" character varying(2048) NOT NULL,
    "originalLabel" character varying(255) NOT NULL,
    start integer NOT NULL,
    stop integer NOT NULL,
    "spatialCoverage" character varying(255),
    language character varying(2),
    "alternateLabels" character varying(255),
    "editorialNotes" text,
    PRIMARY KEY ("periodID")
);

COMMENT ON TABLE public.period
    IS 'This table holds Periodo periods.

-- Is this table necessary? Doesn''t it suffice to put the Periodo Permalink in the table of every observation? Useful to use an additional table for optimalisation?';

CREATE TABLE public.place
(
    "placeID" integer NOT NULL,
    title character varying(255) NOT NULL,
    "editorialComment" text,
    PRIMARY KEY ("placeID")
);

COMMENT ON TABLE public.place
    IS 'This table identifies a place by its ID. The ID is used as a foreign key in other tables to link observations about the same place to each other.';

CREATE TABLE public."placeType"
(
    "PlaceTypeID" integer NOT NULL,
    "PlaceTypeLabel" character varying(255) NOT NULL,
    "PlaceTypeDescription" text,
    PRIMARY KEY ("PlaceTypeID")
);

COMMENT ON TABLE public."placeType"
    IS 'This table holds the (geographic) feature types of places.

-- Is this table necessary?';

CREATE TABLE public.relation
(
    "relationID" integer NOT NULL,
    "relationType" character varying(255) NOT NULL,
    "relationLabel" character varying(255),
    "relationFromPlaceID" integer NOT NULL,
    "relationToPlaceID" integer NOT NULL,
    "timespanID" integer,
    "periodID" integer,
    "sourceID" integer NOT NULL,
    "certaintyID" integer,
    editorialcomment text,
    PRIMARY KEY ("relationID")
);

COMMENT ON TABLE public.relation
    IS 'Table holds the relationship between two different places.';

CREATE TABLE public.source
(
    "sourceID" integer NOT NULL,
    "sourceType" character varying(255) NOT NULL,
    citation text NOT NULL,
    "manifestURI" character varying(2048),
    "canvasURI" character varying(2048),
    description text,
    "editorialComment" text,
    PRIMARY KEY ("sourceID")
);

COMMENT ON TABLE public.source
    IS 'Table holds the source for an observation.';

CREATE TABLE public.spatial_ref_sys
(
    srid integer NOT NULL,
    auth_name character varying(256),
    auth_srid integer,
    srtext character varying(2048),
    proj4text character varying(2048),
    PRIMARY KEY (srid)
);

CREATE TABLE public.timespan
(
    "timespanID" integer NOT NULL,
    "timespanStartMinimum" date NOT NULL,
    "timespanStartMaximum" date,
    "timespanEndMinimum" date,
    "timespanEndMaximum" date,
    "editorialComment" text,
    PRIMARY KEY ("timespanID")
);

COMMENT ON TABLE public.timespan
    IS 'Table holds a timespan for an observation.';

CREATE TABLE public.type
(
    "typeID" integer NOT NULL,
    "placeID" integer NOT NULL,
    "placeTypeID" integer NOT NULL,
    "sourceLabel" character varying(255),
    timespanid integer,
    "periodID" integer,
    "sourceID" integer NOT NULL,
    "annotationID" integer,
    "certaintyID" integer,
    editorialcomment text,
    PRIMARY KEY ("typeID")
);

COMMENT ON TABLE public.type
    IS 'Table that holds place types observations, where "placeTypeID" refers to a concept in a published vocabulary available in table placeType.';

ALTER TABLE public.description
    ADD FOREIGN KEY ("certaintyID")
    REFERENCES public.certainty ("certaintyID")
    NOT VALID;


ALTER TABLE public.description
    ADD FOREIGN KEY ("periodID")
    REFERENCES public.period ("periodID")
    NOT VALID;


ALTER TABLE public.description
    ADD FOREIGN KEY ("placeID")
    REFERENCES public.place ("placeID")
    NOT VALID;


ALTER TABLE public.description
    ADD FOREIGN KEY ("sourceID")
    REFERENCES public.source ("sourceID")
    NOT VALID;


ALTER TABLE public.description
    ADD FOREIGN KEY ("timespanID")
    REFERENCES public.timespan ("timespanID")
    NOT VALID;


ALTER TABLE public.location
    ADD FOREIGN KEY ("certaintyID")
    REFERENCES public.certainty ("certaintyID")
    NOT VALID;


ALTER TABLE public.location
    ADD FOREIGN KEY ("periodID")
    REFERENCES public.period ("periodID")
    NOT VALID;


ALTER TABLE public.location
    ADD FOREIGN KEY ("placeID")
    REFERENCES public.place ("placeID")
    NOT VALID;


ALTER TABLE public.location
    ADD FOREIGN KEY ("sourceID")
    REFERENCES public.source ("sourceID")
    NOT VALID;


ALTER TABLE public.location
    ADD FOREIGN KEY ("timespanID")
    REFERENCES public.timespan ("timespanID")
    NOT VALID;


ALTER TABLE public.name
    ADD FOREIGN KEY ("certaintyID")
    REFERENCES public.certainty ("certaintyID")
    NOT VALID;


ALTER TABLE public.name
    ADD FOREIGN KEY ("periodID")
    REFERENCES public.period ("periodID")
    NOT VALID;


ALTER TABLE public.name
    ADD FOREIGN KEY ("placeID")
    REFERENCES public.place ("placeID")
    NOT VALID;


ALTER TABLE public.name
    ADD FOREIGN KEY ("sourceID")
    REFERENCES public.source ("sourceID")
    NOT VALID;


ALTER TABLE public.name
    ADD FOREIGN KEY ("timespanID")
    REFERENCES public.timespan ("timespanID")
    NOT VALID;


ALTER TABLE public.relation
    ADD FOREIGN KEY ("certaintyID")
    REFERENCES public.certainty ("certaintyID")
    NOT VALID;


ALTER TABLE public.relation
    ADD FOREIGN KEY ("periodID")
    REFERENCES public.period ("periodID")
    NOT VALID;


ALTER TABLE public.relation
    ADD FOREIGN KEY ("relationFromPlaceID")
    REFERENCES public.place ("placeID")
    NOT VALID;


ALTER TABLE public.relation
    ADD FOREIGN KEY ("relationToPlaceID")
    REFERENCES public.place ("placeID")
    NOT VALID;


ALTER TABLE public.relation
    ADD FOREIGN KEY ("sourceID")
    REFERENCES public.source ("sourceID")
    NOT VALID;


ALTER TABLE public.relation
    ADD FOREIGN KEY ("timespanID")
    REFERENCES public.timespan ("timespanID")
    NOT VALID;


ALTER TABLE public.type
    ADD FOREIGN KEY ("certaintyID")
    REFERENCES public.certainty ("certaintyID")
    NOT VALID;


ALTER TABLE public.type
    ADD FOREIGN KEY ("periodID")
    REFERENCES public.period ("periodID")
    NOT VALID;


ALTER TABLE public.type
    ADD FOREIGN KEY ("placeID")
    REFERENCES public.place ("placeID")
    NOT VALID;


ALTER TABLE public.type
    ADD FOREIGN KEY ("placeTypeID")
    REFERENCES public."placeType" ("PlaceTypeID")
    NOT VALID;


ALTER TABLE public.type
    ADD FOREIGN KEY ("sourceID")
    REFERENCES public.source ("sourceID")
    NOT VALID;


ALTER TABLE public.type
    ADD FOREIGN KEY (timespanid)
    REFERENCES public.timespan ("timespanID")
    NOT VALID;

END;