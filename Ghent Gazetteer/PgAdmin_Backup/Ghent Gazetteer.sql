--
-- PostgreSQL database dump
--

-- Dumped from database version 13.2
-- Dumped by pg_dump version 13.2

-- Started on 2021-04-01 09:17:47

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2979 (class 1262 OID 17556)
-- Name: Ghent Gazetteer; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE "Ghent Gazetteer" WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE = 'English_United States.1252';


ALTER DATABASE "Ghent Gazetteer" OWNER TO postgres;

\connect -reuse-previous=on "dbname='Ghent Gazetteer'"

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2980 (class 0 OID 0)
-- Dependencies: 2979
-- Name: DATABASE "Ghent Gazetteer"; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON DATABASE "Ghent Gazetteer" IS 'RDB for Ghent Gazetteer';


-- Completed on 2021-04-01 09:17:47

--
-- PostgreSQL database dump complete
--

