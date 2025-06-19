--
-- PostgreSQL database dump
--

-- Dumped from database version 14.18 (Ubuntu 14.18-0ubuntu0.22.04.1)
-- Dumped by pg_dump version 14.18 (Ubuntu 14.18-0ubuntu0.22.04.1)

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
-- Name: RoleInProject; Type: TYPE; Schema: public; Owner: prestijuser
--

CREATE TYPE public."RoleInProject" AS ENUM (
    'VOICE_ACTOR',
    'MIX_MASTER',
    'MODDER',
    'TRANSLATOR',
    'SCRIPT_WRITER',
    'DIRECTOR'
);


ALTER TYPE public."RoleInProject" OWNER TO prestijuser;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: prestijuser
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO prestijuser;

--
-- Name: accounts; Type: TABLE; Schema: public; Owner: prestijuser
--

CREATE TABLE public.accounts (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    type text NOT NULL,
    provider text NOT NULL,
    "providerAccountId" text NOT NULL,
    refresh_token text,
    access_token text,
    expires_at integer,
    token_type text,
    scope text,
    id_token text,
    session_state text
);


ALTER TABLE public.accounts OWNER TO prestijuser;

--
-- Name: accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: prestijuser
--

CREATE SEQUENCE public.accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.accounts_id_seq OWNER TO prestijuser;

--
-- Name: accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: prestijuser
--

ALTER SEQUENCE public.accounts_id_seq OWNED BY public.accounts.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: prestijuser
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.categories OWNER TO prestijuser;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: prestijuser
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.categories_id_seq OWNER TO prestijuser;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: prestijuser
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: comments; Type: TABLE; Schema: public; Owner: prestijuser
--

CREATE TABLE public.comments (
    id integer NOT NULL,
    content text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "userId" integer NOT NULL,
    "projectId" integer NOT NULL
);


ALTER TABLE public.comments OWNER TO prestijuser;

--
-- Name: comments_id_seq; Type: SEQUENCE; Schema: public; Owner: prestijuser
--

CREATE SEQUENCE public.comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.comments_id_seq OWNER TO prestijuser;

--
-- Name: comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: prestijuser
--

ALTER SEQUENCE public.comments_id_seq OWNED BY public.comments.id;


--
-- Name: dubbing_artist_favorites; Type: TABLE; Schema: public; Owner: prestijuser
--

CREATE TABLE public.dubbing_artist_favorites (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "artistId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.dubbing_artist_favorites OWNER TO prestijuser;

--
-- Name: dubbing_artist_favorites_id_seq; Type: SEQUENCE; Schema: public; Owner: prestijuser
--

CREATE SEQUENCE public.dubbing_artist_favorites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.dubbing_artist_favorites_id_seq OWNER TO prestijuser;

--
-- Name: dubbing_artist_favorites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: prestijuser
--

ALTER SEQUENCE public.dubbing_artist_favorites_id_seq OWNED BY public.dubbing_artist_favorites.id;


--
-- Name: dubbing_artist_likes; Type: TABLE; Schema: public; Owner: prestijuser
--

CREATE TABLE public.dubbing_artist_likes (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "artistId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.dubbing_artist_likes OWNER TO prestijuser;

--
-- Name: dubbing_artist_likes_id_seq; Type: SEQUENCE; Schema: public; Owner: prestijuser
--

CREATE SEQUENCE public.dubbing_artist_likes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.dubbing_artist_likes_id_seq OWNER TO prestijuser;

--
-- Name: dubbing_artist_likes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: prestijuser
--

ALTER SEQUENCE public.dubbing_artist_likes_id_seq OWNED BY public.dubbing_artist_likes.id;


--
-- Name: dubbing_artists; Type: TABLE; Schema: public; Owner: prestijuser
--

CREATE TABLE public.dubbing_artists (
    id integer NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    slug text,
    bio text,
    "imagePublicId" text,
    "siteRole" text,
    "websiteUrl" text,
    "twitterUrl" text,
    "instagramUrl" text,
    "youtubeUrl" text,
    "linkedinUrl" text,
    "githubUrl" text,
    "donationLink" text,
    "isTeamMember" boolean DEFAULT false NOT NULL,
    "teamOrder" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "likeCount" integer DEFAULT 0 NOT NULL,
    "favoriteCount" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.dubbing_artists OWNER TO prestijuser;

--
-- Name: dubbing_artists_id_seq; Type: SEQUENCE; Schema: public; Owner: prestijuser
--

CREATE SEQUENCE public.dubbing_artists_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.dubbing_artists_id_seq OWNER TO prestijuser;

--
-- Name: dubbing_artists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: prestijuser
--

ALTER SEQUENCE public.dubbing_artists_id_seq OWNED BY public.dubbing_artists.id;


--
-- Name: email_change_requests; Type: TABLE; Schema: public; Owner: prestijuser
--

CREATE TABLE public.email_change_requests (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "newEmail" text NOT NULL,
    token text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.email_change_requests OWNER TO prestijuser;

--
-- Name: email_change_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: prestijuser
--

CREATE SEQUENCE public.email_change_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.email_change_requests_id_seq OWNER TO prestijuser;

--
-- Name: email_change_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: prestijuser
--

ALTER SEQUENCE public.email_change_requests_id_seq OWNED BY public.email_change_requests.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: prestijuser
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    content text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "senderId" integer NOT NULL,
    "receiverId" integer NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL
);


ALTER TABLE public.messages OWNER TO prestijuser;

--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: prestijuser
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.messages_id_seq OWNER TO prestijuser;

--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: prestijuser
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: prestijuser
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    message text NOT NULL,
    link text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.notifications OWNER TO prestijuser;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: prestijuser
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.notifications_id_seq OWNER TO prestijuser;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: prestijuser
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: project_assignments; Type: TABLE; Schema: public; Owner: prestijuser
--

CREATE TABLE public.project_assignments (
    id integer NOT NULL,
    "assignedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    role public."RoleInProject" NOT NULL,
    "projectId" integer NOT NULL,
    "artistId" integer NOT NULL
);


ALTER TABLE public.project_assignments OWNER TO prestijuser;

--
-- Name: project_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: prestijuser
--

CREATE SEQUENCE public.project_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.project_assignments_id_seq OWNER TO prestijuser;

--
-- Name: project_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: prestijuser
--

ALTER SEQUENCE public.project_assignments_id_seq OWNED BY public.project_assignments.id;


--
-- Name: project_categories; Type: TABLE; Schema: public; Owner: prestijuser
--

CREATE TABLE public.project_categories (
    "projectId" integer NOT NULL,
    "categoryId" integer NOT NULL,
    "assignedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "assignedBy" text
);


ALTER TABLE public.project_categories OWNER TO prestijuser;

--
-- Name: project_characters; Type: TABLE; Schema: public; Owner: prestijuser
--

CREATE TABLE public.project_characters (
    id integer NOT NULL,
    "projectId" integer NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.project_characters OWNER TO prestijuser;

--
-- Name: project_characters_id_seq; Type: SEQUENCE; Schema: public; Owner: prestijuser
--

CREATE SEQUENCE public.project_characters_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.project_characters_id_seq OWNER TO prestijuser;

--
-- Name: project_characters_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: prestijuser
--

ALTER SEQUENCE public.project_characters_id_seq OWNED BY public.project_characters.id;


--
-- Name: project_dislikes; Type: TABLE; Schema: public; Owner: prestijuser
--

CREATE TABLE public.project_dislikes (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "projectId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.project_dislikes OWNER TO prestijuser;

--
-- Name: project_dislikes_id_seq; Type: SEQUENCE; Schema: public; Owner: prestijuser
--

CREATE SEQUENCE public.project_dislikes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.project_dislikes_id_seq OWNER TO prestijuser;

--
-- Name: project_dislikes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: prestijuser
--

ALTER SEQUENCE public.project_dislikes_id_seq OWNED BY public.project_dislikes.id;


--
-- Name: project_favorites; Type: TABLE; Schema: public; Owner: prestijuser
--

CREATE TABLE public.project_favorites (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "projectId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.project_favorites OWNER TO prestijuser;

--
-- Name: project_favorites_id_seq; Type: SEQUENCE; Schema: public; Owner: prestijuser
--

CREATE SEQUENCE public.project_favorites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.project_favorites_id_seq OWNER TO prestijuser;

--
-- Name: project_favorites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: prestijuser
--

ALTER SEQUENCE public.project_favorites_id_seq OWNED BY public.project_favorites.id;


--
-- Name: project_images; Type: TABLE; Schema: public; Owner: prestijuser
--

CREATE TABLE public.project_images (
    id integer NOT NULL,
    "projectId" integer NOT NULL,
    "publicId" text NOT NULL,
    caption text,
    "order" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.project_images OWNER TO prestijuser;

--
-- Name: project_images_id_seq; Type: SEQUENCE; Schema: public; Owner: prestijuser
--

CREATE SEQUENCE public.project_images_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.project_images_id_seq OWNER TO prestijuser;

--
-- Name: project_images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: prestijuser
--

ALTER SEQUENCE public.project_images_id_seq OWNED BY public.project_images.id;


--
-- Name: project_likes; Type: TABLE; Schema: public; Owner: prestijuser
--

CREATE TABLE public.project_likes (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "projectId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.project_likes OWNER TO prestijuser;

--
-- Name: project_likes_id_seq; Type: SEQUENCE; Schema: public; Owner: prestijuser
--

CREATE SEQUENCE public.project_likes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.project_likes_id_seq OWNER TO prestijuser;

--
-- Name: project_likes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: prestijuser
--

ALTER SEQUENCE public.project_likes_id_seq OWNED BY public.project_likes.id;


--
-- Name: project_ratings; Type: TABLE; Schema: public; Owner: prestijuser
--

CREATE TABLE public.project_ratings (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "projectId" integer NOT NULL,
    value integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.project_ratings OWNER TO prestijuser;

--
-- Name: project_ratings_id_seq; Type: SEQUENCE; Schema: public; Owner: prestijuser
--

CREATE SEQUENCE public.project_ratings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.project_ratings_id_seq OWNER TO prestijuser;

--
-- Name: project_ratings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: prestijuser
--

ALTER SEQUENCE public.project_ratings_id_seq OWNED BY public.project_ratings.id;


--
-- Name: projects; Type: TABLE; Schema: public; Owner: prestijuser
--

CREATE TABLE public.projects (
    id integer NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    type text NOT NULL,
    description text,
    "coverImagePublicId" text,
    "bannerImagePublicId" text,
    "externalWatchUrl" text,
    "releaseDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP,
    "isPublished" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "viewCount" integer DEFAULT 0 NOT NULL,
    "likeCount" integer DEFAULT 0 NOT NULL,
    "dislikeCount" integer DEFAULT 0 NOT NULL,
    "favoriteCount" integer DEFAULT 0 NOT NULL,
    "averageRating" double precision DEFAULT 0 NOT NULL,
    "ratingCount" integer DEFAULT 0 NOT NULL,
    price double precision,
    currency text DEFAULT 'TRY'::text,
    "trailerUrl" text
);


ALTER TABLE public.projects OWNER TO prestijuser;

--
-- Name: projects_id_seq; Type: SEQUENCE; Schema: public; Owner: prestijuser
--

CREATE SEQUENCE public.projects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.projects_id_seq OWNER TO prestijuser;

--
-- Name: projects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: prestijuser
--

ALTER SEQUENCE public.projects_id_seq OWNED BY public.projects.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: prestijuser
--

CREATE TABLE public.sessions (
    id integer NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" integer NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO prestijuser;

--
-- Name: sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: prestijuser
--

CREATE SEQUENCE public.sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.sessions_id_seq OWNER TO prestijuser;

--
-- Name: sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: prestijuser
--

ALTER SEQUENCE public.sessions_id_seq OWNED BY public.sessions.id;


--
-- Name: support_requests; Type: TABLE; Schema: public; Owner: prestijuser
--

CREATE TABLE public.support_requests (
    id integer NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    amount double precision,
    status text DEFAULT 'pending'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "userId" integer NOT NULL
);


ALTER TABLE public.support_requests OWNER TO prestijuser;

--
-- Name: support_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: prestijuser
--

CREATE SEQUENCE public.support_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.support_requests_id_seq OWNER TO prestijuser;

--
-- Name: support_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: prestijuser
--

ALTER SEQUENCE public.support_requests_id_seq OWNED BY public.support_requests.id;


--
-- Name: user_blocks; Type: TABLE; Schema: public; Owner: prestijuser
--

CREATE TABLE public.user_blocks (
    "blockerId" integer NOT NULL,
    "blockingId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.user_blocks OWNER TO prestijuser;

--
-- Name: user_notifications; Type: TABLE; Schema: public; Owner: prestijuser
--

CREATE TABLE public.user_notifications (
    id integer NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    "userId" integer NOT NULL,
    "notificationId" integer NOT NULL
);


ALTER TABLE public.user_notifications OWNER TO prestijuser;

--
-- Name: user_notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: prestijuser
--

CREATE SEQUENCE public.user_notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_notifications_id_seq OWNER TO prestijuser;

--
-- Name: user_notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: prestijuser
--

ALTER SEQUENCE public.user_notifications_id_seq OWNED BY public.user_notifications.id;


--
-- Name: user_owned_games; Type: TABLE; Schema: public; Owner: prestijuser
--

CREATE TABLE public.user_owned_games (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "projectId" integer NOT NULL,
    "purchasedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "purchasePrice" double precision
);


ALTER TABLE public.user_owned_games OWNER TO prestijuser;

--
-- Name: user_owned_games_id_seq; Type: SEQUENCE; Schema: public; Owner: prestijuser
--

CREATE SEQUENCE public.user_owned_games_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_owned_games_id_seq OWNER TO prestijuser;

--
-- Name: user_owned_games_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: prestijuser
--

ALTER SEQUENCE public.user_owned_games_id_seq OWNED BY public.user_owned_games.id;


--
-- Name: user_reports; Type: TABLE; Schema: public; Owner: prestijuser
--

CREATE TABLE public.user_reports (
    id integer NOT NULL,
    reason text NOT NULL,
    description text,
    "reporterId" integer NOT NULL,
    "reportedId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL
);


ALTER TABLE public.user_reports OWNER TO prestijuser;

--
-- Name: user_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: prestijuser
--

CREATE SEQUENCE public.user_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_reports_id_seq OWNER TO prestijuser;

--
-- Name: user_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: prestijuser
--

ALTER SEQUENCE public.user_reports_id_seq OWNED BY public.user_reports.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: prestijuser
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email text NOT NULL,
    username text NOT NULL,
    password text,
    role text DEFAULT 'user'::text NOT NULL,
    "profileImagePublicId" text,
    "bannerImagePublicId" text,
    bio text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "banExpiresAt" timestamp(3) without time zone,
    "banReason" text,
    "isBanned" boolean DEFAULT false NOT NULL
);


ALTER TABLE public.users OWNER TO prestijuser;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: prestijuser
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO prestijuser;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: prestijuser
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: verification_tokens; Type: TABLE; Schema: public; Owner: prestijuser
--

CREATE TABLE public.verification_tokens (
    identifier text NOT NULL,
    token text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.verification_tokens OWNER TO prestijuser;

--
-- Name: voice_assignments; Type: TABLE; Schema: public; Owner: prestijuser
--

CREATE TABLE public.voice_assignments (
    id integer NOT NULL,
    "projectAssignmentId" integer NOT NULL,
    "projectCharacterId" integer NOT NULL
);


ALTER TABLE public.voice_assignments OWNER TO prestijuser;

--
-- Name: voice_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: prestijuser
--

CREATE SEQUENCE public.voice_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.voice_assignments_id_seq OWNER TO prestijuser;

--
-- Name: voice_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: prestijuser
--

ALTER SEQUENCE public.voice_assignments_id_seq OWNED BY public.voice_assignments.id;


--
-- Name: accounts id; Type: DEFAULT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.accounts ALTER COLUMN id SET DEFAULT nextval('public.accounts_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: comments id; Type: DEFAULT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.comments ALTER COLUMN id SET DEFAULT nextval('public.comments_id_seq'::regclass);


--
-- Name: dubbing_artist_favorites id; Type: DEFAULT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.dubbing_artist_favorites ALTER COLUMN id SET DEFAULT nextval('public.dubbing_artist_favorites_id_seq'::regclass);


--
-- Name: dubbing_artist_likes id; Type: DEFAULT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.dubbing_artist_likes ALTER COLUMN id SET DEFAULT nextval('public.dubbing_artist_likes_id_seq'::regclass);


--
-- Name: dubbing_artists id; Type: DEFAULT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.dubbing_artists ALTER COLUMN id SET DEFAULT nextval('public.dubbing_artists_id_seq'::regclass);


--
-- Name: email_change_requests id; Type: DEFAULT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.email_change_requests ALTER COLUMN id SET DEFAULT nextval('public.email_change_requests_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: project_assignments id; Type: DEFAULT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.project_assignments ALTER COLUMN id SET DEFAULT nextval('public.project_assignments_id_seq'::regclass);


--
-- Name: project_characters id; Type: DEFAULT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.project_characters ALTER COLUMN id SET DEFAULT nextval('public.project_characters_id_seq'::regclass);


--
-- Name: project_dislikes id; Type: DEFAULT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.project_dislikes ALTER COLUMN id SET DEFAULT nextval('public.project_dislikes_id_seq'::regclass);


--
-- Name: project_favorites id; Type: DEFAULT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.project_favorites ALTER COLUMN id SET DEFAULT nextval('public.project_favorites_id_seq'::regclass);


--
-- Name: project_images id; Type: DEFAULT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.project_images ALTER COLUMN id SET DEFAULT nextval('public.project_images_id_seq'::regclass);


--
-- Name: project_likes id; Type: DEFAULT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.project_likes ALTER COLUMN id SET DEFAULT nextval('public.project_likes_id_seq'::regclass);


--
-- Name: project_ratings id; Type: DEFAULT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.project_ratings ALTER COLUMN id SET DEFAULT nextval('public.project_ratings_id_seq'::regclass);


--
-- Name: projects id; Type: DEFAULT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.projects ALTER COLUMN id SET DEFAULT nextval('public.projects_id_seq'::regclass);


--
-- Name: sessions id; Type: DEFAULT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.sessions ALTER COLUMN id SET DEFAULT nextval('public.sessions_id_seq'::regclass);


--
-- Name: support_requests id; Type: DEFAULT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.support_requests ALTER COLUMN id SET DEFAULT nextval('public.support_requests_id_seq'::regclass);


--
-- Name: user_notifications id; Type: DEFAULT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.user_notifications ALTER COLUMN id SET DEFAULT nextval('public.user_notifications_id_seq'::regclass);


--
-- Name: user_owned_games id; Type: DEFAULT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.user_owned_games ALTER COLUMN id SET DEFAULT nextval('public.user_owned_games_id_seq'::regclass);


--
-- Name: user_reports id; Type: DEFAULT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.user_reports ALTER COLUMN id SET DEFAULT nextval('public.user_reports_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: voice_assignments id; Type: DEFAULT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.voice_assignments ALTER COLUMN id SET DEFAULT nextval('public.voice_assignments_id_seq'::regclass);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: prestijuser
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
cecd4d40-8f6a-42ef-8ed8-b8bd33daa29d	81c7758497af85cab7fa0386c10611ba49f3a57169a33f95135d8d2d38be18a6	2025-06-19 06:37:46.11938+00	20240101000000_init		\N	2025-06-19 06:37:46.11938+00	0
21830abd-803d-4ac5-a97b-51351d6cb6a6	c5b6ec8296b3b94ce5b372b2f282af31bcc326e585aa8b28a658d223934e34af	2025-06-19 06:45:14.626743+00	20250619064514_add_ban_and_auth_features	\N	\N	2025-06-19 06:45:14.504466+00	1
\.


--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: prestijuser
--

COPY public.accounts (id, "userId", type, provider, "providerAccountId", refresh_token, access_token, expires_at, token_type, scope, id_token, session_state) FROM stdin;
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: prestijuser
--

COPY public.categories (id, name, slug, "createdAt", "updatedAt") FROM stdin;
1	Aksiyon	aksiyon	2025-06-17 23:28:21.315	2025-06-17 23:28:21.315
2	Korku	korku	2025-06-17 23:28:30.257	2025-06-17 23:28:30.257
3	Komedi	komedi	2025-06-17 23:28:32.929	2025-06-17 23:28:32.929
4	Macera	macera	2025-06-17 23:29:29.387	2025-06-17 23:29:29.387
6	Simülasyon	simulasyon	2025-06-17 23:29:57.851	2025-06-17 23:29:57.851
7	Oynaması Ücretsiz	oynamasi-ucretsiz	2025-06-17 23:30:17.322	2025-06-17 23:30:19.913
8	Sevimli	sevimli	2025-06-17 23:30:31.959	2025-06-17 23:30:31.959
9	Pixel	pixel	2025-06-17 23:30:55.564	2025-06-17 23:30:55.564
10	Bilim Kurgu	bilim-kurgu	2025-06-17 23:31:21.264	2025-06-17 23:31:21.264
11	Yarış	yaris	2025-06-17 23:31:31.047	2025-06-17 23:31:31.047
12	Gizem	gizem	2025-06-17 23:31:44.71	2025-06-17 23:31:44.71
13	Polisiye	polisiye	2025-06-17 23:31:49.242	2025-06-17 23:31:49.242
14	Görsel Roman	gorsel-roman	2025-06-17 23:32:06.361	2025-06-17 23:32:06.361
15	Bulmaca	bulmaca	2025-06-17 23:33:22.415	2025-06-17 23:33:22.415
16	Birinci Şahıs	birinci-sahis	2025-06-17 23:33:46.728	2025-06-17 23:33:46.728
\.


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: prestijuser
--

COPY public.comments (id, content, "createdAt", "updatedAt", "userId", "projectId") FROM stdin;
2	Harika!	2025-06-02 19:23:53.687	2025-06-02 19:23:53.687	3	11
3	Çok güzel	2025-06-12 07:45:33.319	2025-06-12 07:45:33.319	3	9
4	Ellerinize sağluk	2025-06-17 12:49:05.505	2025-06-17 12:49:05.505	16	8
5	50 fazla 49.90 yapın\n	2025-06-17 12:58:01.034	2025-06-17 12:58:01.034	16	13
6	MrGodzillaya 200 lira yapın	2025-06-18 10:39:21.836	2025-06-18 10:39:21.836	8	13
7	oha çok güzell\n	2025-06-18 10:43:49.809	2025-06-18 10:43:49.809	2	12
8	harika!	2025-06-19 06:49:31.599	2025-06-19 06:49:31.599	3	13
\.


--
-- Data for Name: dubbing_artist_favorites; Type: TABLE DATA; Schema: public; Owner: prestijuser
--

COPY public.dubbing_artist_favorites (id, "userId", "artistId", "createdAt") FROM stdin;
8	7	14	2025-06-02 20:12:56.938
9	7	9	2025-06-02 20:13:01.606
10	8	9	2025-06-08 22:28:36.572
11	10	25	2025-06-08 22:31:49.059
12	10	9	2025-06-08 22:31:53.935
13	8	25	2025-06-08 22:31:55.767
14	8	56	2025-06-08 22:32:02.044
15	10	56	2025-06-08 22:32:02.902
16	11	11	2025-06-09 00:29:56.476
17	8	14	2025-06-09 15:20:05.085
18	8	8	2025-06-09 16:52:03.618
22	14	8	2025-06-12 13:02:56.112
23	3	14	2025-06-16 18:51:40.107
24	16	14	2025-06-17 12:49:41.166
\.


--
-- Data for Name: dubbing_artist_likes; Type: TABLE DATA; Schema: public; Owner: prestijuser
--

COPY public.dubbing_artist_likes (id, "userId", "artistId", "createdAt") FROM stdin;
4	3	9	2025-06-02 16:38:23.02
6	7	14	2025-06-02 20:12:55.899
7	7	9	2025-06-02 20:13:01.042
9	8	9	2025-06-08 22:28:35.778
10	10	25	2025-06-08 22:31:47.906
11	10	9	2025-06-08 22:31:53.45
12	8	25	2025-06-08 22:31:55.202
13	10	56	2025-06-08 22:32:02.353
14	8	56	2025-06-08 22:32:03.132
15	11	11	2025-06-09 00:00:39.266
16	8	14	2025-06-09 15:20:04.691
17	8	8	2025-06-09 16:52:03.289
19	3	14	2025-06-09 19:53:24.87
21	13	21	2025-06-12 09:44:33.596
22	14	8	2025-06-12 13:02:57.439
23	15	9	2025-06-15 10:46:22.006
24	15	13	2025-06-15 10:46:38.279
25	16	14	2025-06-17 12:49:39.647
\.


--
-- Data for Name: dubbing_artists; Type: TABLE DATA; Schema: public; Owner: prestijuser
--

COPY public.dubbing_artists (id, "firstName", "lastName", slug, bio, "imagePublicId", "siteRole", "websiteUrl", "twitterUrl", "instagramUrl", "youtubeUrl", "linkedinUrl", "githubUrl", "donationLink", "isTeamMember", "teamOrder", "createdAt", "updatedAt", "likeCount", "favoriteCount") FROM stdin;
19	Elif Azra	Erdoğan	\N	\N	artist_profiles/artistprofile_19_whatsapp_image_2025_06_01_at_18_22_24_1748879398512	Seslendirme Sanatçısı	\N	\N	https://www.instagram.com/erifudublaj/	\N	\N	\N	\N	t	\N	2025-06-02 15:49:34.77	2025-06-17 13:09:38.193	0	0
13	Ömer Yiğit	Arslan	\N	\N	artist_profiles/artistprofile_13__mer_yi_it_arslan_1748878879465	Seslendirme Sanatçısı	\N	\N	https://www.instagram.com/aizendub/	\N	\N	\N	\N	t	\N	2025-06-02 15:40:57.254	2025-06-15 10:46:38.288	1	0
20	Oruç	Çolak	\N	\N	artist_profiles/artistprofile_20_c25c9efbef44df9a2f530e2a489191e3_1748879529552	Seslendirme Sanatçısı	\N	\N	https://www.instagram.com/oruc.colak/	\N	\N	\N	\N	t	\N	2025-06-02 15:50:39.936	2025-06-02 15:53:32.169	0	0
36	Erdem	Gören	\N	\N	artist_profiles/artistprofile_36_unnamed_1__1748892744313	\N	\N	\N	\N	https://www.youtube.com/@birlevelatladi	\N	\N	\N	f	\N	2025-06-02 17:14:48.445	2025-06-02 19:32:26.382	0	0
37	İzzet	(THEASOSYAL)	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	2025-06-02 17:15:59.733	2025-06-02 17:15:59.733	0	0
11	Şevval	Oğuz	\N	\N	artist_profiles/artistprofile_11__evval_o_uz_1748878672655	Seslendirme Sanatçısı	\N	\N	https://www.instagram.com/saqoare/	\N	\N	\N	\N	t	\N	2025-06-02 15:37:14.64	2025-06-09 00:29:56.482	1	1
29	Tunahan	Taşlı	\N	\N	artist_profiles/artistprofile_29_file_1__1748880606920	Seslendirme Sanatçısı	\N	\N	\N	\N	\N	\N	\N	t	\N	2025-06-02 16:09:58.055	2025-06-02 16:10:08.821	0	0
22	Akın	Alp	\N	\N	artist_profiles/artistprofile_22_37bc044c_831e_4db4_ad12_a7c5ff579882_1748879646128	Seslendirme Sanatçısı	\N	\N	https://www.instagram.com/mrak_exe/	\N	\N	\N	\N	t	\N	2025-06-02 15:53:32.172	2025-06-02 15:54:11.173	0	0
18	Muhammet Enes	Durmuş	\N	\N	artist_profiles/artistprofile_18_muhammet_enes_durmu__1748879335816	Seslendirme Sanatçısı	\N	\N	https://www.instagram.com/ekstra.dublaj	\N	\N	\N	\N	t	\N	2025-06-02 15:47:57.325	2025-06-02 15:56:09.143	0	0
23	Hülya	Türker	\N	\N	artist_profiles/artistprofile_23___1748879871870	Seslendirme Sanatçısı	\N	\N	https://www.instagram.com/musicandub/	\N	\N	\N	\N	t	\N	2025-06-02 15:55:21.528	2025-06-02 15:57:54.188	0	0
12	Efe	Coşkun	\N	\N	artist_profiles/artistprofile_12_whatsapp_image_2025_06_02_at_18_37_30_1748878753169	Kurucu, Seslendirme Sanatçısı	\N	\N	https://www.instagram.com/kanges.dub/	\N	\N	\N	\N	t	0	2025-06-02 15:38:14.241	2025-06-02 15:40:24.266	0	0
30	Beşir	Tuna	\N	\N	artist_profiles/artistprofile_30_images_1__1748880771193	VFX	\N	\N	\N	\N	\N	\N	\N	t	\N	2025-06-02 16:11:32.373	2025-06-02 16:12:52.96	0	0
15	İkra	İlker	\N	\N	artist_profiles/artistprofile_15_i_kra_i_lker_1748879048899	Seslendirme Sanatçısı	\N	\N	https://www.instagram.com/sparkle_dubb/	\N	\N	\N	\N	t	\N	2025-06-02 15:43:45.808	2025-06-02 15:44:10.946	0	0
16	İrem Nur	Çorakay	\N	\N	artist_profiles/artistprofile_16_i_remnur_orakay_1748879158674	Seslendirme Sanatçısı	\N	\N	https://www.instagram.com/irmnr.crky	\N	\N	\N	\N	t	\N	2025-06-02 15:44:29.046	2025-06-02 15:46:01.567	0	0
17	İrem	Çötür	\N	\N	artist_profiles/artistprofile_17_i_rem_t_r_1748879254026	Seslendirme Sanatçısı	\N	\N	https://www.instagram.com/iremmm_ctr/	\N	\N	\N	\N	t	\N	2025-06-02 15:46:29.95	2025-06-02 15:47:36.43	0	0
31	Hira	ÇAkar	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	2025-06-02 16:18:59.38	2025-06-02 16:18:59.38	0	0
25	Eren	Gözel	\N	\N	artist_profiles/artistprofile_25_490581347_3327253297416620_6173054235891_1748880041852	Seslendirme Sanatçısı	\N	\N	https://www.instagram.com/meliodas_dub/	\N	\N	\N	\N	t	\N	2025-06-02 16:00:17.499	2025-06-08 22:31:55.771	2	2
26	Ekin	Akdemir	\N	\N	artist_profiles/artistprofile_26_profile___olaf_1748880129374	Seslendirme Sanatçısı	\N	\N	https://www.instagram.com/ekinakdemirr/	\N	\N	\N	\N	t	\N	2025-06-02 16:01:38.22	2025-06-02 16:02:12.097	0	0
32	Hira	Çakar	\N	\N	artist_profiles/artistprofile_32_c7d72621_f29e_46ef_8ad0_db77118de1a4_1748881256422	Seslendirme Sanatçısı	\N	\N	https://www.instagram.com/reichan_5081	\N	\N	\N	\N	t	\N	2025-06-02 16:19:11.571	2025-06-02 16:20:59.086	0	0
24	Eren Can	Demirel	\N	\N	artist_profiles/artistprofile_24_whatsapp_image_2025_06_02_at_18_57_02_1748879970169	Seslendirme Sanatçısı	\N	\N	https://www.instagram.com/ekinakdemirr/	\N	\N	\N	\N	t	\N	2025-06-02 15:58:15.985	2025-06-02 16:02:40.587	0	0
47	Nutch	( Hangar Team )	\N	\N	artist_profiles/artistprofile_47_8aebfb003c8d0448854b7ca370d28a62_1748893238462	\N	https://www.hangarceviri.com/	\N	\N	\N	\N	\N	\N	f	\N	2025-06-02 18:04:51.459	2025-06-02 19:40:57.571	0	0
27	Kadir	Şenöz	\N	\N	artist_profiles/artistprofile_27_491873897_3064883303661646_2937830518197_1748880340329	Seslendirme Sanatçısı	\N	\N	https://www.instagram.com/justkagiro/	\N	\N	\N	\N	t	\N	2025-06-02 16:05:03.455	2025-06-02 16:05:42.341	0	0
28	Hümeyra	Koç	\N	\N	artist_profiles/artistprofile_28_hd_wallpaper_chainsaw_man_chainsawman_an_1748880505425	Seslendirme Sanatçısı	\N	\N	https://www.instagram.com/mitsuki_koge?igsh=MWVzenc3azA1eWYzMw%3D%3D	\N	\N	\N	\N	t	\N	2025-06-02 16:06:52.813	2025-06-02 16:08:27.919	0	0
40	Arda Ediz	Güzey	\N	\N	artist_profiles/artistprofile_40_ekran_g_r_nt_s_2025_06_02_223041_1748892666629	\N	\N	\N	https://www.instagram.com/egutr19/	https://www.youtube.com/@TheAsosyalStudios	\N	\N	\N	f	\N	2025-06-02 17:29:46.56	2025-06-02 20:42:01.8	0	0
34	Nicat	Mehdiyev	\N	\N	artist_profiles/artistprofile_34_img_20250528_164204_1748881757446	Seslendirme Sanatçısı	\N	\N	https://www.instagram.com/zayn.dub	\N	\N	\N	\N	t	\N	2025-06-02 16:26:59.076	2025-06-02 16:29:20.856	0	0
38	Ece	Coşkun	\N	\N	\N	\N	\N	\N	https://www.instagram.com/diannymooniel/	\N	\N	\N	\N	f	\N	2025-06-02 17:28:35.549	2025-06-02 17:28:57.742	0	0
35	Adem Diyas	Ulubek	\N	\N	artist_profiles/artistprofile_35_e370sx_voambqvu_1748882079912	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	2025-06-02 16:31:44.779	2025-06-02 16:34:46.55	0	0
21	Seda	Dilki	\N	\N	artist_profiles/artistprofile_21_3bc73288_5902_4a27_b386_270469cd1d8f_1748879585892	Seslendirme Sanatçısı	\N	\N	https://www.instagram.com/seda.dilki/	\N	\N	\N	\N	t	\N	2025-06-02 15:52:28.114	2025-06-12 09:44:33.603	1	0
39	Toprakhan	Çakır	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	2025-06-02 17:29:14.755	2025-06-02 17:29:14.755	0	0
52	Bay Kürek	(THEASOSYAL)	\N	\N	artist_profiles/artistprofile_52_channels4_profile_1748892919371	\N	\N	\N	\N	https://www.youtube.com/@BayKurekValorant	\N	\N	\N	f	\N	2025-06-02 18:21:38.542	2025-06-02 19:35:20.891	0	0
8	Deren	Bektaş	\N	\N	artist_profiles/artistprofile_8_deren_bekta__1748878277797	Seslendirme Sanatçısı	\N	\N	https://www.instagram.com/k1lluss/	\N	\N	\N	\N	t	\N	2025-06-02 15:28:16.984	2025-06-12 13:02:57.445	2	2
41	Zeren	(THEASOSYAL)	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	2025-06-02 17:32:26.953	2025-06-02 17:32:26.953	0	0
42	Blaze	(THEASOSYAL)	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	2025-06-02 17:37:59.269	2025-06-02 17:37:59.269	0	0
43	Begüm	Can	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	2025-06-02 18:01:06.009	2025-06-02 18:01:06.009	0	0
44	Mustafa Enes	Özkan	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	2025-06-02 18:01:22.032	2025-06-02 18:01:22.032	0	0
45	Beril	Önal	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	2025-06-02 18:01:40.695	2025-06-02 18:01:40.695	0	0
46	Cengiz	Bilgen	\N	\N	artist_profiles/artistprofile_46_ekran_g_r_nt_s_2025_06_02_210342_1748887460063	\N	\N	\N	https://www.instagram.com/cengiz.bilgen/	\N	\N	\N	\N	t	\N	2025-06-02 18:03:54.006	2025-06-02 18:04:22.434	0	0
50	Rümeysa	(THEASOSYAL)	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	2025-06-02 18:13:39.525	2025-06-02 18:13:39.525	0	0
51	Deniz Ay	Mika	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	2025-06-02 18:15:02.273	2025-06-02 18:15:02.273	0	0
33	Zaur	Əbdürrəhimov	\N	\N	artist_profiles/artistprofile_33_1748895016575_1748895067394	\N	\N	\N	\N	https://www.youtube.com/channel/UCXDsMHZarlDLtCCQCavankA	\N	\N	\N	f	\N	2025-06-02 16:25:33.382	2025-06-02 20:11:09.023	0	0
49	Meltem Saatçı	( Hangar Team )	\N	\N	\N	\N	https://www.hangarceviri.com/	\N	\N	\N	\N	\N	\N	f	\N	2025-06-02 18:05:30.078	2025-06-02 19:41:10.981	0	0
48	Ayşenur Özdemir	( Hangar Team )	\N	\N	artist_profiles/artistprofile_48_ekran_g_r_nt_s_2025_06_02_223901_1748893169847	\N	https://www.hangarceviri.com/	\N	\N	\N	\N	\N	\N	f	\N	2025-06-02 18:05:09.855	2025-06-02 19:41:19.841	0	0
56	Mehmet Eren	Kıvrak	\N	\N	artist_profiles/artistprofile_56_mehmet_eren_k_vrak_1749421573804	Çevirmen , Mod Geliştiricisi	\N	\N	https://www.instagram.com/mehmeteren_0/	\N	\N	\N	\N	t	\N	2025-06-08 22:19:20.636	2025-06-08 22:32:03.136	2	2
53	Eren	Turkiş	\N	\N	artist_profiles/artistprofile_53_png_clipart_ichigo_kurosaki_zangetsu_bya_1748894652817	Seslendirme Sanatçısı	\N	\N	https://www.instagram.com/depresif888	\N	\N	\N	\N	t	\N	2025-06-02 20:00:22.962	2025-06-02 20:04:15.489	0	0
14	Emre	Bulut	\N	\N	artist_profiles/artistprofile_14_emre_bulut_1748878978038	Yazılımcı, Seslendirme Sanatçısı, Mod Geliştiricisi,  SFX/VFX	https://guns.lol/chimiya	\N	https://www.instagram.com/005emreebulutt005/	https://www.youtube.com/@chimi_ya	\N	\N	\N	t	0	2025-06-02 15:41:55.605	2025-06-18 19:33:47.675	4	4
58	Arda	‎	\N	\N	artist_profiles/artistprofile_58_686cdb8f_6cb8_47b7_b719_af9762a5db18_1749497575803	Çevirmen	\N	\N	\N	https://www.youtube.com/@Thrian	\N	\N	\N	t	\N	2025-06-09 19:28:03.076	2025-06-09 19:33:45.364	0	0
54	Hilal	Karayiğit	\N	\N	artist_profiles/artistprofile_54_whatsapp_g_rsel_2025_06_08_saat_21_37_38_1749408309973	Seslendirme Sanatçısı	\N	\N	https://www.instagram.com/tsukishuii/	\N	\N	\N	\N	t	\N	2025-06-08 18:09:07.41	2025-06-08 22:21:50.29	0	0
55	Gizem	Demir	\N	\N	artist_profiles/artistprofile_55_gizem_demir_1749409337326	Seslendirme Sanatçısı	\N	\N	https://www.instagram.com/Gizem.dublaj/	\N	\N	\N	\N	t	\N	2025-06-08 18:59:17.774	2025-06-08 22:22:02.456	0	0
9	Rüzgar Orhan	Yozğat	\N	\N	artist_profiles/artistprofile_9_whatsapp_image_2025_05_27_at_13_16_31_1748878508768	Kurucu, Seslendirme Sanatçısı, Mod Geliştiricisi,  SFX/VFX	\N	\N	https://www.instagram.com/cantstophims/	https://www.youtube.com/@Prestij_Studio	\N	\N	\N	t	-1	2025-06-02 15:31:41.265	2025-06-15 10:46:22.016	5	3
\.


--
-- Data for Name: email_change_requests; Type: TABLE DATA; Schema: public; Owner: prestijuser
--

COPY public.email_change_requests (id, "userId", "newEmail", token, "expiresAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: prestijuser
--

COPY public.messages (id, content, "createdAt", "senderId", "receiverId", "isRead") FROM stdin;
5	profil resminle bannerını yanlışlıkla sildim geri yüklersin bromm	2025-06-02 16:17:05.918	3	5	f
6	Slm	2025-06-02 19:54:12.27	3	6	f
7	Selam naber	2025-06-12 07:54:32.264	3	6	f
8	selam huuhuu	2025-06-17 12:58:35.06	3	16	f
12	eyvallah yigenh	2025-06-17 13:00:08.593	3	16	f
9	aleyküm selam	2025-06-17 12:59:53.787	16	3	t
10	site müp müp	2025-06-17 12:59:58.172	16	3	t
11	kaç kofrete verirsin	2025-06-17 13:00:05.761	16	3	t
13	bişi değil	2025-06-17 13:00:14.204	16	3	t
14	selam nabersin bea?	2025-06-19 06:50:07.372	12	3	t
15	iyidir aga senden naber	2025-06-19 06:50:16.903	3	12	t
16	adsadasgdsfgbs	2025-06-19 07:32:24.783	3	12	t
17	gsdgdsg	2025-06-19 07:32:27.142	3	12	t
18	asdad	2025-06-19 07:32:45.617	3	12	t
19	asdsadsa	2025-06-19 07:32:58.694	12	3	t
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: prestijuser
--

COPY public.notifications (id, message, link, "createdAt") FROM stdin;
1	Yeni bir proje yayınlandı: test	/projeler/test	2025-06-19 06:50:45.278
\.


--
-- Data for Name: project_assignments; Type: TABLE DATA; Schema: public; Owner: prestijuser
--

COPY public.project_assignments (id, "assignedAt", role, "projectId", "artistId") FROM stdin;
302	2025-06-17 12:47:16.046	VOICE_ACTOR	12	19
303	2025-06-17 12:47:16.072	VOICE_ACTOR	12	9
304	2025-06-17 12:47:16.092	VOICE_ACTOR	12	13
305	2025-06-17 12:47:16.104	VOICE_ACTOR	12	17
306	2025-06-17 12:47:16.123	VOICE_ACTOR	12	26
307	2025-06-17 12:47:16.138	VOICE_ACTOR	12	12
308	2025-06-17 12:47:16.152	VOICE_ACTOR	12	14
309	2025-06-17 12:47:16.165	VOICE_ACTOR	12	11
310	2025-06-17 12:47:16.172	MIX_MASTER	12	14
311	2025-06-17 12:47:16.175	MODDER	12	14
312	2025-06-17 12:47:16.177	TRANSLATOR	12	14
234	2025-06-17 12:45:25.54	VOICE_ACTOR	9	8
235	2025-06-17 12:45:25.555	VOICE_ACTOR	9	38
236	2025-06-17 12:45:25.569	VOICE_ACTOR	9	40
237	2025-06-17 12:45:25.581	VOICE_ACTOR	9	12
238	2025-06-17 12:45:25.597	VOICE_ACTOR	9	36
239	2025-06-17 12:45:25.607	VOICE_ACTOR	9	42
240	2025-06-17 12:45:25.619	VOICE_ACTOR	9	16
241	2025-06-17 12:45:25.63	VOICE_ACTOR	9	20
242	2025-06-17 12:45:25.641	VOICE_ACTOR	9	13
243	2025-06-17 12:45:25.663	VOICE_ACTOR	9	9
244	2025-06-17 12:45:25.676	VOICE_ACTOR	9	39
245	2025-06-17 12:45:25.69	VOICE_ACTOR	9	41
246	2025-06-17 12:45:25.707	VOICE_ACTOR	9	14
247	2025-06-17 12:45:25.726	MIX_MASTER	9	14
248	2025-06-17 12:45:25.732	MODDER	9	14
249	2025-06-17 12:45:25.736	TRANSLATOR	9	14
250	2025-06-17 12:45:43.491	VOICE_ACTOR	10	22
251	2025-06-17 12:45:43.507	VOICE_ACTOR	10	46
252	2025-06-17 12:45:43.521	VOICE_ACTOR	10	50
253	2025-06-17 12:45:43.533	VOICE_ACTOR	10	51
254	2025-06-17 12:45:43.545	VOICE_ACTOR	10	14
313	2025-06-17 23:35:34.793	VOICE_ACTOR	8	37
314	2025-06-17 23:35:34.813	VOICE_ACTOR	8	14
315	2025-06-17 23:35:34.824	VOICE_ACTOR	8	29
316	2025-06-17 23:35:34.836	VOICE_ACTOR	8	15
317	2025-06-17 23:35:34.847	VOICE_ACTOR	8	36
318	2025-06-17 23:35:34.859	VOICE_ACTOR	8	8
319	2025-06-17 23:35:34.873	VOICE_ACTOR	8	13
320	2025-06-17 23:35:34.885	VOICE_ACTOR	8	27
321	2025-06-17 23:35:34.898	MIX_MASTER	8	14
322	2025-06-17 23:35:34.902	MODDER	8	14
323	2025-06-17 23:35:34.906	TRANSLATOR	8	14
255	2025-06-17 12:45:43.555	VOICE_ACTOR	10	16
256	2025-06-17 12:45:43.569	VOICE_ACTOR	10	9
257	2025-06-17 12:45:43.582	VOICE_ACTOR	10	27
258	2025-06-17 12:45:43.594	VOICE_ACTOR	10	15
259	2025-06-17 12:45:43.605	VOICE_ACTOR	10	45
260	2025-06-17 12:45:43.614	VOICE_ACTOR	10	42
261	2025-06-17 12:45:43.625	VOICE_ACTOR	10	39
262	2025-06-17 12:45:43.634	VOICE_ACTOR	10	13
263	2025-06-17 12:45:43.643	VOICE_ACTOR	10	52
264	2025-06-17 12:45:43.658	VOICE_ACTOR	10	40
265	2025-06-17 12:45:43.669	VOICE_ACTOR	10	21
266	2025-06-17 12:45:43.68	VOICE_ACTOR	10	43
267	2025-06-17 12:45:43.696	VOICE_ACTOR	10	12
268	2025-06-17 12:45:43.717	VOICE_ACTOR	10	36
269	2025-06-17 12:45:43.726	VOICE_ACTOR	10	38
270	2025-06-17 12:45:43.736	VOICE_ACTOR	10	8
271	2025-06-17 12:45:43.748	TRANSLATOR	10	47
272	2025-06-17 12:45:43.751	TRANSLATOR	10	48
273	2025-06-17 12:45:43.758	TRANSLATOR	10	49
274	2025-06-17 12:45:43.762	MODDER	10	14
275	2025-06-17 12:45:43.766	MIX_MASTER	10	14
276	2025-06-17 12:45:43.769	VOICE_ACTOR	10	33
277	2025-06-17 12:46:35.396	VOICE_ACTOR	11	44
278	2025-06-17 12:46:35.412	VOICE_ACTOR	11	14
279	2025-06-17 12:46:35.425	VOICE_ACTOR	11	43
280	2025-06-17 12:46:35.435	VOICE_ACTOR	11	42
281	2025-06-17 12:46:35.447	VOICE_ACTOR	11	9
282	2025-06-17 12:46:35.463	VOICE_ACTOR	11	45
283	2025-06-17 12:46:35.476	VOICE_ACTOR	11	13
284	2025-06-17 12:46:35.487	VOICE_ACTOR	11	40
285	2025-06-17 12:46:35.499	VOICE_ACTOR	11	39
286	2025-06-17 12:46:35.508	VOICE_ACTOR	11	12
287	2025-06-17 12:46:35.525	VOICE_ACTOR	11	29
288	2025-06-17 12:46:35.538	VOICE_ACTOR	11	20
289	2025-06-17 12:46:35.551	VOICE_ACTOR	11	46
290	2025-06-17 12:46:35.571	VOICE_ACTOR	11	21
291	2025-06-17 12:46:35.585	VOICE_ACTOR	11	25
292	2025-06-17 12:46:35.6	VOICE_ACTOR	11	36
293	2025-06-17 12:46:35.614	VOICE_ACTOR	11	38
294	2025-06-17 12:46:35.631	VOICE_ACTOR	11	8
295	2025-06-17 12:46:35.644	VOICE_ACTOR	11	16
296	2025-06-17 12:46:35.656	VOICE_ACTOR	11	22
297	2025-06-17 12:46:35.67	TRANSLATOR	11	47
298	2025-06-17 12:46:35.674	TRANSLATOR	11	49
299	2025-06-17 12:46:35.679	TRANSLATOR	11	48
300	2025-06-17 12:46:35.682	MIX_MASTER	11	14
301	2025-06-17 12:46:35.685	MODDER	11	14
\.


--
-- Data for Name: project_categories; Type: TABLE DATA; Schema: public; Owner: prestijuser
--

COPY public.project_categories ("projectId", "categoryId", "assignedAt", "assignedBy") FROM stdin;
8	1	2025-06-17 23:35:34.767	\N
8	7	2025-06-17 23:35:34.767	\N
8	15	2025-06-17 23:35:34.767	\N
8	16	2025-06-17 23:35:34.767	\N
8	2	2025-06-17 23:35:34.767	\N
\.


--
-- Data for Name: project_characters; Type: TABLE DATA; Schema: public; Owner: prestijuser
--

COPY public.project_characters (id, "projectId", name, "createdAt", "updatedAt") FROM stdin;
2	8	Leith Pierre	2025-06-02 17:09:41.33	2025-06-02 17:09:41.33
3	8	Poppy	2025-06-02 17:10:57.868	2025-06-02 17:10:57.868
4	8	Avery	2025-06-02 17:11:13.472	2025-06-02 17:11:13.472
5	8	Rich	2025-06-02 17:11:23.051	2025-06-02 17:11:23.051
7	8	Bilim Adamı	2025-06-02 17:12:45.952	2025-06-02 17:12:45.952
8	8	Sözcü	2025-06-02 17:13:25.503	2025-06-02 17:13:25.503
9	8	Görüşmeci	2025-06-02 17:13:38.085	2025-06-02 17:13:38.085
10	8	Kadın Anlatıcı	2025-06-02 17:13:56.643	2025-06-02 17:13:56.643
11	8	Stella Greyber	2025-06-02 17:14:31.816	2025-06-02 17:14:31.816
13	9	Hep Birlikte ( Reklam Şarkısı )	2025-06-02 17:25:09.674	2025-06-02 17:25:24.113
14	9	Anlatıcı	2025-06-02 17:26:01.781	2025-06-02 17:26:01.781
15	9	Marcas Brickley	2025-06-02 17:26:14.415	2025-06-02 17:26:14.415
16	9	Röportajcı	2025-06-02 17:26:22.981	2025-06-02 17:26:22.981
17	9	Jimmy Roth	2025-06-02 17:26:30.707	2025-06-02 17:26:41.594
18	9	Oyunların Anlatıcısı	2025-06-02 17:26:58.4	2025-06-02 17:26:58.4
19	9	PJ	2025-06-02 17:27:06.561	2025-06-02 17:27:06.561
20	9	Kissy	2025-06-02 17:27:14.166	2025-06-02 17:27:14.166
21	9	Daisy	2025-06-02 17:27:22.93	2025-06-02 17:27:22.93
22	9	Cat Bee	2025-06-02 17:27:29.033	2025-06-02 17:27:37.724
23	9	Candy Cat	2025-06-02 17:27:43.62	2025-06-02 17:27:43.62
24	9	Bunzo Bunny	2025-06-02 17:27:51.304	2025-06-02 17:27:51.304
25	9	Bron	2025-06-02 17:27:56.246	2025-06-02 17:27:56.246
26	9	BoogieBot	2025-06-02 17:28:06.976	2025-06-02 17:28:06.976
27	9	Uzun Bacaklı Annecik	2025-06-02 17:28:18.047	2025-06-02 17:28:18.047
28	9	Poppy	2025-06-02 17:33:58.974	2025-06-02 17:33:58.974
29	9	Stella Greyber	2025-06-02 17:35:09.936	2025-06-02 17:35:09.936
30	9	Spiker	2025-06-02 17:36:49.872	2025-06-02 17:36:49.872
31	9	Rich	2025-06-02 17:37:10.632	2025-06-02 17:37:10.632
32	9	Bilinmeyen Anlatıcı	2025-06-02 17:41:03.881	2025-06-02 17:41:03.881
33	9	Leith Pierre	2025-06-02 17:41:54.365	2025-06-02 17:41:54.365
34	9	Huggy Wuggy	2025-06-02 17:42:43.419	2025-06-02 17:42:43.419
35	10	Bay Hartmann	2025-06-02 18:05:50.184	2025-06-02 18:05:50.184
36	10	Bayan Brooks	2025-06-02 18:06:13.649	2025-06-02 18:06:13.649
37	10	Bayan Hartmann	2025-06-02 18:06:19.709	2025-06-02 18:06:19.709
38	10	Bilim Adamı	2025-06-02 18:06:24.415	2025-06-02 18:06:24.415
39	10	Bobby Bearhug	2025-06-02 18:06:44.185	2025-06-02 18:06:44.185
40	10	Bubba Bubbaphant	2025-06-02 18:07:12.122	2025-06-02 18:07:12.122
41	10	Catnap	2025-06-02 18:07:18.871	2025-06-02 18:07:18.871
42	10	Claire Harper	2025-06-02 18:07:25.634	2025-06-02 18:07:40.058
43	10	CraftyCorn	2025-06-02 18:07:47.198	2025-06-02 18:07:47.198
44	10	Çocuk 1	2025-06-02 18:07:59.562	2025-06-02 18:07:59.562
45	10	Çocuk 2	2025-06-02 18:08:03.657	2025-06-02 18:08:03.657
46	10	Danışman	2025-06-02 18:08:08.686	2025-06-02 18:08:08.686
47	10	DogDay	2025-06-02 18:08:15.321	2025-06-02 18:08:15.321
48	10	Dr. White	2025-06-02 18:08:26.145	2025-06-02 18:08:26.145
49	10	Elliot Ludwig	2025-06-02 18:08:34.338	2025-06-02 18:08:42.508
50	10	Haber Spikeri	2025-06-02 18:08:54.445	2025-06-02 18:08:54.445
51	10	Harley Sawyer	2025-06-02 18:09:05.536	2025-06-02 18:09:05.536
52	10	Hoppy Hoppyscotch	2025-06-02 18:09:35.724	2025-06-02 18:09:35.724
53	10	Huggy Wuggy	2025-06-02 18:09:42.385	2025-06-02 18:09:42.385
54	10	Joseph	2025-06-02 18:09:50.652	2025-06-02 18:09:50.652
55	10	Prototip	2025-06-02 18:09:56.651	2025-06-02 18:09:56.651
56	10	Radyodaki Adam	2025-06-02 18:10:03.383	2025-06-02 18:10:03.383
57	10	Rich	2025-06-02 18:10:06.709	2025-06-02 18:10:06.709
58	10	Spiker	2025-06-02 18:10:11.254	2025-06-02 18:10:11.254
59	10	Stella Greyber	2025-06-02 18:10:22.271	2025-06-02 18:10:22.271
60	10	Stuart	2025-06-02 18:10:32.757	2025-06-02 18:10:32.757
61	10	Unknown Kadın	2025-06-02 18:10:44.146	2025-06-02 18:10:44.146
62	10	Kadın Bilim İnsanı	2025-06-02 18:14:18.429	2025-06-02 18:14:18.429
63	10	Miss Delight	2025-06-02 18:15:42.677	2025-06-02 18:15:42.677
64	10	Picky Piggy	2025-06-02 18:17:20.194	2025-06-02 18:17:20.194
65	10	Sözcü	2025-06-02 18:18:26.35	2025-06-02 18:18:26.35
66	10	Kadın Anlatıcı	2025-06-02 18:19:11.188	2025-06-02 18:19:11.188
67	10	DogDay ( KARTON )	2025-06-02 18:20:28.646	2025-06-02 18:20:28.646
68	10	Kicken Chicken	2025-06-02 18:23:48.884	2025-06-02 18:23:48.884
69	10	Leith Pierre	2025-06-02 18:24:13.079	2025-06-02 18:24:23.813
70	10	Ollie	2025-06-02 18:25:05.305	2025-06-02 18:25:05.305
71	10	Poppy	2025-06-02 18:25:36.015	2025-06-02 18:25:36.015
72	11	Uzman 1	2025-06-02 18:30:28.018	2025-06-02 18:30:28.018
73	11	Uzman 2	2025-06-02 18:30:33.485	2025-06-02 18:30:33.485
75	11	Uzman 4	2025-06-02 18:30:44.351	2025-06-02 18:30:44.351
76	11	Uzman 5	2025-06-02 18:30:48.573	2025-06-02 18:30:48.573
77	11	CraftyCorn	2025-06-02 18:31:03.879	2025-06-02 18:31:03.879
78	11	Tur Rehberi	2025-06-02 18:31:09.507	2025-06-02 18:31:09.507
79	11	Medic	2025-06-02 18:31:15.625	2025-06-02 18:31:15.625
81	11	Bilim İnsanı 4	2025-06-02 18:31:29.796	2025-06-02 18:31:29.796
80	11	Bilim Insanı 3	2025-06-02 18:31:22.195	2025-06-02 18:31:37.689
74	11	Uzman 3	2025-06-02 18:30:40.662	2025-06-02 18:31:41.139
82	11	Huggy Wuggy	2025-06-02 18:31:48.878	2025-06-02 18:31:48.878
83	11	Doey	2025-06-02 18:31:52.664	2025-06-02 18:31:52.664
84	11	Bubba Bubbaphant	2025-06-02 18:32:14.088	2025-06-02 18:32:14.088
85	11	Warrenbach	2025-06-02 18:32:24.814	2025-06-02 18:32:35.847
86	11	Rich	2025-06-02 18:32:42.408	2025-06-02 18:32:42.408
87	11	DogDay	2025-06-02 18:32:48.916	2025-06-02 18:32:48.916
88	11	Doktor	2025-06-02 18:32:58.352	2025-06-02 18:32:58.352
89	11	Dr. White	2025-06-02 18:33:03.18	2025-06-02 18:33:03.18
90	11	Prototip	2025-06-02 18:33:10.282	2025-06-02 18:33:10.282
91	11	Kicken Chicken	2025-06-02 18:33:20.895	2025-06-02 18:33:20.895
92	11	Eddie Ritterman	2025-06-02 18:33:32.674	2025-06-02 18:33:32.674
93	11	Gardiyan 1	2025-06-02 18:33:38.56	2025-06-02 18:33:38.56
94	11	Gardiyan 2	2025-06-02 18:33:42.323	2025-06-02 18:33:42.323
95	11	Pianosaurus	2025-06-02 18:33:51.597	2025-06-02 18:33:51.597
96	11	Baba	2025-06-02 18:33:55.03	2025-06-02 18:33:55.03
97	11	Hoppy	2025-06-02 18:34:06.991	2025-06-02 18:34:06.991
98	11	Anne	2025-06-02 18:34:12.053	2025-06-02 18:34:12.053
99	11	Jack	2025-06-02 18:34:15.725	2025-06-02 18:34:15.725
100	11	Leith Pierre	2025-06-02 18:34:21.199	2025-06-02 18:34:33.294
101	11	Ollie	2025-06-02 18:34:39.414	2025-06-02 18:34:39.414
102	11	Stella Greyber	2025-06-02 18:34:47.545	2025-06-02 18:34:47.545
103	11	Poppy	2025-06-02 18:34:50.766	2025-06-02 18:34:50.766
104	11	Scout	2025-06-02 18:34:56.957	2025-06-02 18:34:56.957
105	11	Yarnaby	2025-06-02 18:35:02.363	2025-06-02 18:35:02.363
106	11	Warden	2025-06-02 18:35:08.272	2025-06-02 18:35:08.272
107	12	Spooky	2025-06-02 18:44:32.17	2025-06-02 18:44:36.08
108	12	Statik Ses	2025-06-02 18:44:49.554	2025-06-02 18:44:49.554
109	12	DL	2025-06-02 18:44:55.881	2025-06-02 18:44:55.881
110	12	Tilki	2025-06-02 18:45:04.546	2025-06-02 18:45:04.546
111	12	Ring	2025-06-02 18:45:08.804	2025-06-02 18:45:08.804
112	12	Canavar	2025-06-02 18:45:18.521	2025-06-02 18:45:18.521
114	12	Telefon Sesi	2025-06-02 18:45:37.051	2025-06-02 18:45:37.051
115	12	Kedi	2025-06-02 18:46:08.043	2025-06-02 18:46:08.043
\.


--
-- Data for Name: project_dislikes; Type: TABLE DATA; Schema: public; Owner: prestijuser
--

COPY public.project_dislikes (id, "userId", "projectId", "createdAt") FROM stdin;
5	3	11	2025-06-18 00:00:26.194
\.


--
-- Data for Name: project_favorites; Type: TABLE DATA; Schema: public; Owner: prestijuser
--

COPY public.project_favorites (id, "userId", "projectId", "createdAt") FROM stdin;
6	3	12	2025-06-02 19:23:27.392
7	3	9	2025-06-02 19:52:57.01
8	3	10	2025-06-02 19:53:12.035
9	3	8	2025-06-02 19:53:16.28
10	3	11	2025-06-02 19:53:19.483
11	16	13	2025-06-17 12:58:35.401
12	2	13	2025-06-18 10:44:54.515
14	3	13	2025-06-18 10:45:41.191
\.


--
-- Data for Name: project_images; Type: TABLE DATA; Schema: public; Owner: prestijuser
--

COPY public.project_images (id, "projectId", "publicId", caption, "order", "createdAt") FROM stdin;
\.


--
-- Data for Name: project_likes; Type: TABLE DATA; Schema: public; Owner: prestijuser
--

COPY public.project_likes (id, "userId", "projectId", "createdAt") FROM stdin;
6	3	9	2025-06-02 19:52:56.55
7	3	10	2025-06-02 19:53:11.8
8	3	8	2025-06-02 19:53:15.742
11	3	12	2025-06-16 18:49:42.005
12	16	8	2025-06-17 12:47:47.716
13	16	10	2025-06-17 12:47:51.598
14	16	12	2025-06-17 12:47:54.637
15	16	11	2025-06-17 12:47:57.748
16	16	9	2025-06-17 12:48:01.151
17	2	11	2025-06-17 12:48:20.927
18	16	13	2025-06-17 12:57:34.336
20	8	13	2025-06-18 10:38:59.275
21	2	13	2025-06-18 10:44:53.559
23	3	13	2025-06-18 10:45:40.994
\.


--
-- Data for Name: project_ratings; Type: TABLE DATA; Schema: public; Owner: prestijuser
--

COPY public.project_ratings (id, "userId", "projectId", value, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: prestijuser
--

COPY public.projects (id, title, slug, type, description, "coverImagePublicId", "bannerImagePublicId", "externalWatchUrl", "releaseDate", "isPublished", "createdAt", "updatedAt", "viewCount", "likeCount", "dislikeCount", "favoriteCount", "averageRating", "ratingCount", price, currency, "trailerUrl") FROM stdin;
12	Spookys Jump Scare Mansion HD Renovation Türkçe Dublaj	spookytrdub	oyun	\N	project_covers/spookytrdub_953cb35f546e5e0b2f8ba16b417890c8_1748889859965	project_banners/spookytrdub_1_1745876563_1069603819_1748889815959	https://supporter-files.nexus-cdn.com/7650/1/Prestij%20Spooky%20Dublaj-1-1-0-1745877372.zip?md5=QSg306gpEZrPyxxTMJddcQ&expires=1750178664&user_id=227069565	2025-06-02 00:00:00	t	2025-06-02 18:43:36.82	2025-06-17 12:47:54.641	0	2	0	1	0	0	\N	\N	https://www.youtube.com/watch?v=mn-0Bh0IKoY&ab_channel=PrestijStudio
10	Poppy Playtime Bölüm 3 Türkçe Dublaj	ppc3trdub	oyun	Playtime Co.’nun sisler içindeki geçmişi ve yeniden canlanan kâbusları bu kez çok daha karanlık!\nChapter 3 ile birlikte korkunun nefesi ensende, üstelik Türkçe dublaj ile gerilimi zirvede hissedeceksin!\nGaz maskeni tak ve derin bir nefes al, çünkü Bekçi artık burada.\nOyuncak fabrikasının unutulmuş koridorlarında boğucu atmosfer, soğuk fısıltılar ve bitmeyen kaçış mücadelesi seni bekliyor.\nHer diyalog, her çığlık ve her tehdit Türkçe dublajlı olarak kulağında yankılanacak.\nSaklanacak bir yerin yok… Nefesin yetmeyecek… Ama duyacaksın!\nTürkçe dublajlı Poppy Playtime Chapter 3 yamasını şimdi indir ve korkunun kalbine dal!	project_covers/ppc3trdub_w500_1748888878582	project_banners/ppc3trdub_kz8ghs79koe_hd_1748888880266	https://supporter-files.nexus-cdn.com/4121/35/CHAPTER%201%202%20VE%203-35-1-0-1747164094.zip?md5=ucj6vPBqafxahRJmnbQsxQ&expires=1750178591&user_id=227069565	2025-06-02 00:00:00	t	2025-06-02 17:50:11.715	2025-06-17 12:47:51.605	0	2	0	1	0	0	\N	\N	https://www.youtube.com/watch?v=5QW_Ec_0Whc&ab_channel=PrestijStudio
9	Poppy Playtime Bölüm 2 Türkçe Dublaj	ppc2trdub	oyun	Poppy Playtime’ın ikinci bölümü ile kabus yeni boyutlar kazanıyor! Mommy Long Legs’in ürkütücü dokunuşları, Playtime Co.’nun unutulmuş sırları ve oyunun en ürkütücü anları artık tamamen Türkçe dublaj ile sizlerle!\nLabirent gibi fabrikanın karanlık köşelerinde kaybolurken, karakterlerin sesi size fısıldayan bir korku olacak. Mommy Long Legs’in rahatsız edici şefkati, Huggy Wuggy’nin gölgelerden yükselen tehdidi ve gizemli oyuncakların ürpertici diyalogları Türkçe seslendirme ile daha da derinleşiyor!\nSaklanmaya hazır mısın? Kaçarken fısıltıları duyabilecek misin?\nTürkçe dublajlı Poppy Playtime Chapter 2 yamasını şimdi indir ve korkunun içine dal!	project_covers/ppc2trdub_apps_46767_14477333831357149_2fcd917a_62bb_4d3e_add6_da6c655c8aca_1748886357962	project_banners/ppc2trdub_qgsavdp78xk_hd_1748886359307	https://supporter-files.nexus-cdn.com/4121/35/CHAPTER%201%202%20VE%203-35-1-0-1747164094.zip?md5=ucj6vPBqafxahRJmnbQsxQ&expires=1750178591&user_id=227069565	2025-06-02 00:00:00	t	2025-06-02 17:21:38.193	2025-06-17 12:48:01.159	0	2	0	1	0	0	\N	\N	https://www.youtube.com/watch?v=5QW_Ec_0Whc&ab_channel=PrestijStudio
8	Poppy Playtime Bölüm 1 Türkçe Dublaj	ppc1trdub	oyun	Terkedilmiş bir oyuncak fabrikasında geçen, gerilim dolu bir maceraya hazır mısınız?\n\nPoppy Playtime: Chapter 1 2 ve 3 , sizi gizemli bir geçmişe sahip Playtime Co.'nun içine sürüklüyor. Kaybolan çalışanların sırrını çözmek, dev oyuncaklardan kaçmak ve Poppy’nin gerçeğini ortaya çıkarmak sizin elinizde.\n\nVe şimdi bu ürkütücü deneyimi ilk kez tamamen Türkçe dublajlı olarak yaşayın!\n\nKarakterlerin konuşmaları, gerilimi ikiye katlayan seslendirmeler ve yerelleştirilmiş atmosfer sayesinde, oyunun karanlık hikayesi artık size çok daha yakın...	project_covers/ppc1trdub_poppy_playtime_yaypc_1748884127090	project_banners/ppc1trdub_maxresdefault_1748884129465	https://supporter-files.nexus-cdn.com/4121/35/CHAPTER%201%202%20VE%203-35-1-0-1747164094.zip?md5=ucj6vPBqafxahRJmnbQsxQ&expires=1750178591&user_id=227069565	2025-06-02 00:00:00	t	2025-06-02 17:08:50.504	2025-06-17 23:35:34.755	0	2	0	1	0	0	\N	\N	https://www.youtube.com/watch?v=5QW_Ec_0Whc&ab_channel=PrestijStudio
11	Poppy Playtime Bölüm 4 Türkçe Dublaj	ppc4trdub	oyun	Geçmiş Gömülemez… ve Kabuslar Asla Bitmez!\nPlaytime Co.’nun en derin sırları nihayet gün yüzüne çıkıyor! Ama kaçış yok, çünkü karanlık geçmiş seni geri çağırıyor…\nBu kez çok daha tehlikeli ve çok daha acımasız bir oyun seni bekliyor.\nChapter 4 ile korkunun en boğucu atmosferini yaşarken, Türkçe dublaj ile her korkuyu, her fısıltıyı, her tehdidi en derininde hissedeceksin!\nYeni kabuslar, yeni düşmanlar ve unutulmuş sırlar seni bekliyor…\nÇıkış yolu çok daha karmaşık, düşmanların çok daha akıllı, ve zaman hızla tükeniyor!\nPoppy Playtime Chapter 4 Türkçe dublaj yaması ile korkuyu iliklerine kadar hissedeceksin…\nŞimdi indir ve karanlığın seni çağırmasına izin ver!	project_covers/ppc4trdub_poppy_playtime_1m36x_1748889586675	project_banners/ppc4trdub_a95wlm_8lbo_hd_1748889588638	https://supporter-files.nexus-cdn.com/4121/26/Poppy%20Playtime%20Chapter%204%20TR%20DUB-26-1-0-1741193598.zip?md5=knlOEw4_xx_hhh3Gvjmh1A&expires=1750178628&user_id=227069565	2025-06-02 00:00:00	t	2025-06-02 18:30:19.927	2025-06-18 00:00:26.205	0	2	1	1	0	0	\N	\N	https://www.youtube.com/watch?v=3ezW0jLS_zA
13	Resident Evil 8 Türkçe Dublaj	re8trdub	oyun	\N	project_covers/re8trdub_re_village_button_fin_1611277715193_1750164951771	project_banners/re8trdub_thumbnail_min_1750164954282	\N	2025-06-30 00:00:00	t	2025-06-17 12:54:32.608	2025-06-18 10:45:41.196	0	4	0	3	0	0	50	TRY	https://www.youtube.com/watch?v=0Gd1gcFaBWU
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: prestijuser
--

COPY public.sessions (id, "sessionToken", "userId", expires) FROM stdin;
\.


--
-- Data for Name: support_requests; Type: TABLE DATA; Schema: public; Owner: prestijuser
--

COPY public.support_requests (id, title, message, amount, status, "createdAt", "updatedAt", "userId") FROM stdin;
\.


--
-- Data for Name: user_blocks; Type: TABLE DATA; Schema: public; Owner: prestijuser
--

COPY public.user_blocks ("blockerId", "blockingId", "createdAt") FROM stdin;
\.


--
-- Data for Name: user_notifications; Type: TABLE DATA; Schema: public; Owner: prestijuser
--

COPY public.user_notifications (id, "isRead", "userId", "notificationId") FROM stdin;
1	f	19	1
2	f	4	1
3	f	13	1
4	f	14	1
5	f	7	1
6	f	5	1
7	f	6	1
8	f	15	1
9	f	8	1
10	f	9	1
11	f	10	1
12	f	11	1
14	f	17	1
15	f	16	1
16	f	18	1
13	t	12	1
\.


--
-- Data for Name: user_owned_games; Type: TABLE DATA; Schema: public; Owner: prestijuser
--

COPY public.user_owned_games (id, "userId", "projectId", "purchasedAt", "purchasePrice") FROM stdin;
\.


--
-- Data for Name: user_reports; Type: TABLE DATA; Schema: public; Owner: prestijuser
--

COPY public.user_reports (id, reason, description, "reporterId", "reportedId", "createdAt", status) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: prestijuser
--

COPY public.users (id, email, username, password, role, "profileImagePublicId", "bannerImagePublicId", bio, "createdAt", "updatedAt", "banExpiresAt", "banReason", "isBanned") FROM stdin;
19	ndsjdjds@gmail.com	leshapbenimbabam	$2b$10$Ks3U56qRLaZLf3IbEkL7MuXjpTDRZ9aLuerzgiAJdPZnYj/EscY3q	user	\N	\N	\N	2025-06-18 11:24:14.223	2025-06-18 11:24:14.223	\N	\N	f
2	byorhanyzgt@gmail.com	Rizz	$2b$10$1WkJUvNusDYbn3ZdqYVSu.wnt4mc.QBGQFFzOAQFNlrbDvhAI80LS	admin	\N	\N	\N	2025-06-02 09:45:25.482	2025-06-02 09:46:31.808	\N	\N	f
4	kawisrr@gmail.com	Adonegi	$2b$10$WQDr1jqa81krK7FmVU0a9ebu5f6PP8qSc4ints0qZChcLLy6BY3Gq	user	\N	\N	\N	2025-06-02 11:35:33.97	2025-06-02 11:35:33.97	\N	\N	f
13	handebuyukceylan@gmail.com	kutsi23	$2b$10$DP.LUV8Puui6hi4SIYt0aeQfIKGDhYsOjGRjOV.1sEYlCy6KV/Cbe	user	user_profiles/13/userprofile_13_gezf_bbwqaapjt__1749720568246	user_banners/13/userbanner_13_wallpaperflare_com_wallpaper_1749720768810	Saxafon🎷	2025-06-12 09:18:45.815	2025-06-12 09:33:53.402	\N	\N	f
14	azginboga@mail.com	azgın boğa	$2b$10$aGGiv6GEeyWO1Jm4lF09Zur1H/wEYbSENRA58.4jRPJzZ50z9n0bW	user	\N	\N	\N	2025-06-12 13:02:16.841	2025-06-12 13:02:16.841	\N	\N	f
7	bartutuna00@gmail.com	Myki222222	$2b$10$LXvYIcfHxWgNWxBhSSVHluGVkMp5ws5C.302nKpU6RCTzqIpHVw/e	user	user_profiles/7/userprofile_7_channels4_profile_2__1749820593960	user_banners/7/userbanner_7_resim_2025_06_13_161653958_1749820583821	\N	2025-06-02 20:11:33.16	2025-06-13 13:16:36.081	\N	\N	f
5	saqorae@gmail.com	arima	$2b$10$jdlpOM74xC7uHRJYcAEkVutbb1aH.0FYxxLrkhof4gTsbDk5X4Cei	user	user_profiles/5/userprofile_5_10e9f9f2c56aee6e73af85cb8780e0e9_1748865099909	user_banners/5/userbanner_5_e7ae5af59e3afa19cd023f16a7432c45_1748865078820	selams	2025-06-02 11:49:16.914	2025-06-02 11:52:20.185	\N	\N	f
6	hiracakar@gmail.com	reichan_5081	$2b$10$NWUjxZRcmIUu78TLw77RFO0JGKGwtHp6F3WESdwMlgZzzJmvToOx.	user	\N	\N	\N	2025-06-02 15:59:48.094	2025-06-02 15:59:48.094	\N	\N	f
15	samilyuksel24@gmail.com	Şamil Yüksel	$2b$10$t6mNAFEnWjvPwvs/h9tMruA4RoF1YN0BOqNeleqvSkyW9Q1cDwCFe	user	\N	\N	\N	2025-06-15 10:43:58.038	2025-06-15 10:43:58.038	\N	\N	f
8	mehmeteren2006@gmail.com	Kou	$2b$10$t6zQiEQBWwi7qQte0WDsM.dzmsBad6oZSuJy28cgrVY4SBOkGYqTa	user	\N	\N	\N	2025-06-07 16:08:52.81	2025-06-07 16:08:52.81	\N	\N	f
9	4d4w0ng86@gmail.com	tsukii	$2b$10$2Z9J1epYqY61RkAeyaDrxeWcotYshd0RHJx8CqWsYG5297ZnZGFWS	user	\N	\N	\N	2025-06-08 18:49:52.483	2025-06-08 18:49:52.483	\N	\N	f
10	gozele899@gmail.com	eren	$2b$10$IsD6RdVFTamT1gLjcGWvAe3xqHO/hGX3crJMbnKQ3b2UGbu5gIBDK	user	\N	\N	\N	2025-06-08 22:29:01.302	2025-06-08 22:29:01.302	\N	\N	f
11	aebucendel05@gmail.com	Ebu	$2b$10$Mc7/sYFXtMCDrkLdHj79deo41goFEjWJGTLIxaPAaGJBr.n/mRu7e	user	\N	\N	\N	2025-06-09 00:00:18.944	2025-06-09 00:00:18.944	\N	\N	f
17	ezginursonmez70@gmail.com	ezg1ss	$2b$10$45YinrWtlpqzFsDr/lNbhOfuUJa8tUeDl/5ZbHFh2cH6z..dVAkaW	user	user_profiles/17/userprofile_17_img_1005_1750152368361	user_banners/17/userbanner_17_img_0964_1750152361315	\N	2025-06-17 09:24:47.711	2025-06-17 09:26:10.944	\N	\N	f
12	test@gmail.com	test	$2b$10$kj7L2ftajICZDVEx4H3Jlu765N/xbt4y7lV3pVCADfctKjzkvITLi	user	\N	\N	\N	2025-06-12 07:46:03.688	2025-06-19 07:35:36.615	\N	\N	f
3	005emreebulutt005@gmail.com	Chimiya	$2b$10$TNl3lq.LDYDZVJtW7qiUDOgELrmYvQ03gj19YqW0sE3fjAe6NUEG2	admin	user_profiles/3/userprofile_3_9f8078e7b069e8e9ab914a3445ae8650_1750166291299	user_banners/3/userbanner_3_ekran_g_r_nt_s_2025_03_20_132519_1748893951022	Selam Ben Adal	2025-06-02 11:24:16.349	2025-06-17 13:18:13.197	\N	\N	f
16	oyunustasigodzilla@gmail.com	MrGodzilla	$2b$10$Hmxa0ODMB7kmWQAwaew7jOM8TL8mdXBpfTzWQYxehY8wsMG1pD2l6	user	user_profiles/16/userprofile_16_6d86d41e_2dd4_42ef_a4ca_14b7bf4b38839_1750166119874	user_banners/16/userbanner_16_userbanner_16_karanlik_1750166970358_1750167132060	Akıllı delilerdendir	2025-06-17 08:31:38.744	2025-06-17 13:32:32.17	\N	\N	f
18	arceusmythical@gmail.com	Omerygtrsln	$2b$10$wSPVOyzMWhDTUqNeo6diyOUvYgfU6LE2rz7BQsB9O0U7G2ulsS90K	user	\N	\N	\N	2025-06-17 18:26:47.985	2025-06-17 18:26:47.985	\N	\N	f
\.


--
-- Data for Name: verification_tokens; Type: TABLE DATA; Schema: public; Owner: prestijuser
--

COPY public.verification_tokens (identifier, token, expires) FROM stdin;
\.


--
-- Data for Name: voice_assignments; Type: TABLE DATA; Schema: public; Owner: prestijuser
--

COPY public.voice_assignments (id, "projectAssignmentId", "projectCharacterId") FROM stdin;
436	302	107
437	303	108
438	304	109
439	305	110
440	306	111
441	307	112
442	308	114
443	309	115
339	234	13
340	234	21
341	234	28
342	234	29
343	235	13
344	235	23
345	236	18
346	236	32
347	237	17
348	238	33
349	239	34
350	240	22
351	241	19
352	242	24
353	242	31
354	243	25
355	243	30
356	244	15
357	245	20
358	245	27
359	246	14
360	246	16
361	246	26
362	250	44
363	250	45
364	251	35
365	252	36
366	252	61
367	252	62
368	253	37
369	253	63
370	254	38
371	255	39
372	255	64
373	256	40
374	256	50
375	256	56
376	256	58
377	257	65
378	258	42
379	258	66
380	259	43
381	260	46
382	260	53
383	261	47
384	261	48
385	262	47
386	262	57
387	263	49
388	264	51
389	265	52
390	266	54
391	267	55
392	267	60
393	267	68
394	268	69
395	269	55
396	269	70
397	270	59
398	270	71
399	276	41
400	277	72
401	278	73
402	278	78
403	278	79
404	278	81
405	278	80
406	279	74
407	280	75
408	280	82
409	281	76
410	281	83
411	281	84
412	282	77
413	283	85
414	283	86
415	283	87
416	284	88
417	285	89
418	286	90
419	286	91
420	286	92
421	287	93
422	288	94
423	288	95
424	289	96
425	290	97
426	290	98
427	291	99
428	292	100
429	293	90
430	293	101
431	294	102
432	294	103
433	295	104
434	296	105
435	296	106
444	313	4
445	314	7
446	315	9
447	316	10
448	317	2
449	318	3
450	318	11
451	319	5
452	320	8
\.


--
-- Name: accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: prestijuser
--

SELECT pg_catalog.setval('public.accounts_id_seq', 1, false);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: prestijuser
--

SELECT pg_catalog.setval('public.categories_id_seq', 16, true);


--
-- Name: comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: prestijuser
--

SELECT pg_catalog.setval('public.comments_id_seq', 8, true);


--
-- Name: dubbing_artist_favorites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: prestijuser
--

SELECT pg_catalog.setval('public.dubbing_artist_favorites_id_seq', 25, true);


--
-- Name: dubbing_artist_likes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: prestijuser
--

SELECT pg_catalog.setval('public.dubbing_artist_likes_id_seq', 26, true);


--
-- Name: dubbing_artists_id_seq; Type: SEQUENCE SET; Schema: public; Owner: prestijuser
--

SELECT pg_catalog.setval('public.dubbing_artists_id_seq', 58, true);


--
-- Name: email_change_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: prestijuser
--

SELECT pg_catalog.setval('public.email_change_requests_id_seq', 1, false);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: prestijuser
--

SELECT pg_catalog.setval('public.messages_id_seq', 19, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: prestijuser
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, true);


--
-- Name: project_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: prestijuser
--

SELECT pg_catalog.setval('public.project_assignments_id_seq', 323, true);


--
-- Name: project_characters_id_seq; Type: SEQUENCE SET; Schema: public; Owner: prestijuser
--

SELECT pg_catalog.setval('public.project_characters_id_seq', 115, true);


--
-- Name: project_dislikes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: prestijuser
--

SELECT pg_catalog.setval('public.project_dislikes_id_seq', 5, true);


--
-- Name: project_favorites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: prestijuser
--

SELECT pg_catalog.setval('public.project_favorites_id_seq', 14, true);


--
-- Name: project_images_id_seq; Type: SEQUENCE SET; Schema: public; Owner: prestijuser
--

SELECT pg_catalog.setval('public.project_images_id_seq', 1, false);


--
-- Name: project_likes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: prestijuser
--

SELECT pg_catalog.setval('public.project_likes_id_seq', 23, true);


--
-- Name: project_ratings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: prestijuser
--

SELECT pg_catalog.setval('public.project_ratings_id_seq', 1, false);


--
-- Name: projects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: prestijuser
--

SELECT pg_catalog.setval('public.projects_id_seq', 21, true);


--
-- Name: sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: prestijuser
--

SELECT pg_catalog.setval('public.sessions_id_seq', 1, false);


--
-- Name: support_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: prestijuser
--

SELECT pg_catalog.setval('public.support_requests_id_seq', 1, false);


--
-- Name: user_notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: prestijuser
--

SELECT pg_catalog.setval('public.user_notifications_id_seq', 16, true);


--
-- Name: user_owned_games_id_seq; Type: SEQUENCE SET; Schema: public; Owner: prestijuser
--

SELECT pg_catalog.setval('public.user_owned_games_id_seq', 1, false);


--
-- Name: user_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: prestijuser
--

SELECT pg_catalog.setval('public.user_reports_id_seq', 2, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: prestijuser
--

SELECT pg_catalog.setval('public.users_id_seq', 19, true);


--
-- Name: voice_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: prestijuser
--

SELECT pg_catalog.setval('public.voice_assignments_id_seq', 452, true);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: dubbing_artist_favorites dubbing_artist_favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.dubbing_artist_favorites
    ADD CONSTRAINT dubbing_artist_favorites_pkey PRIMARY KEY (id);


--
-- Name: dubbing_artist_likes dubbing_artist_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.dubbing_artist_likes
    ADD CONSTRAINT dubbing_artist_likes_pkey PRIMARY KEY (id);


--
-- Name: dubbing_artists dubbing_artists_pkey; Type: CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.dubbing_artists
    ADD CONSTRAINT dubbing_artists_pkey PRIMARY KEY (id);


--
-- Name: email_change_requests email_change_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.email_change_requests
    ADD CONSTRAINT email_change_requests_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: project_assignments project_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.project_assignments
    ADD CONSTRAINT project_assignments_pkey PRIMARY KEY (id);


--
-- Name: project_categories project_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.project_categories
    ADD CONSTRAINT project_categories_pkey PRIMARY KEY ("projectId", "categoryId");


--
-- Name: project_characters project_characters_pkey; Type: CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.project_characters
    ADD CONSTRAINT project_characters_pkey PRIMARY KEY (id);


--
-- Name: project_dislikes project_dislikes_pkey; Type: CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.project_dislikes
    ADD CONSTRAINT project_dislikes_pkey PRIMARY KEY (id);


--
-- Name: project_favorites project_favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.project_favorites
    ADD CONSTRAINT project_favorites_pkey PRIMARY KEY (id);


--
-- Name: project_images project_images_pkey; Type: CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.project_images
    ADD CONSTRAINT project_images_pkey PRIMARY KEY (id);


--
-- Name: project_likes project_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.project_likes
    ADD CONSTRAINT project_likes_pkey PRIMARY KEY (id);


--
-- Name: project_ratings project_ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.project_ratings
    ADD CONSTRAINT project_ratings_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: support_requests support_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.support_requests
    ADD CONSTRAINT support_requests_pkey PRIMARY KEY (id);


--
-- Name: user_blocks user_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.user_blocks
    ADD CONSTRAINT user_blocks_pkey PRIMARY KEY ("blockerId", "blockingId");


--
-- Name: user_notifications user_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.user_notifications
    ADD CONSTRAINT user_notifications_pkey PRIMARY KEY (id);


--
-- Name: user_owned_games user_owned_games_pkey; Type: CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.user_owned_games
    ADD CONSTRAINT user_owned_games_pkey PRIMARY KEY (id);


--
-- Name: user_reports user_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.user_reports
    ADD CONSTRAINT user_reports_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: voice_assignments voice_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.voice_assignments
    ADD CONSTRAINT voice_assignments_pkey PRIMARY KEY (id);


--
-- Name: accounts_provider_providerAccountId_key; Type: INDEX; Schema: public; Owner: prestijuser
--

CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON public.accounts USING btree (provider, "providerAccountId");


--
-- Name: categories_name_key; Type: INDEX; Schema: public; Owner: prestijuser
--

CREATE UNIQUE INDEX categories_name_key ON public.categories USING btree (name);


--
-- Name: categories_slug_key; Type: INDEX; Schema: public; Owner: prestijuser
--

CREATE UNIQUE INDEX categories_slug_key ON public.categories USING btree (slug);


--
-- Name: comments_projectId_idx; Type: INDEX; Schema: public; Owner: prestijuser
--

CREATE INDEX "comments_projectId_idx" ON public.comments USING btree ("projectId");


--
-- Name: comments_userId_idx; Type: INDEX; Schema: public; Owner: prestijuser
--

CREATE INDEX "comments_userId_idx" ON public.comments USING btree ("userId");


--
-- Name: dubbing_artist_favorites_userId_artistId_key; Type: INDEX; Schema: public; Owner: prestijuser
--

CREATE UNIQUE INDEX "dubbing_artist_favorites_userId_artistId_key" ON public.dubbing_artist_favorites USING btree ("userId", "artistId");


--
-- Name: dubbing_artist_likes_userId_artistId_key; Type: INDEX; Schema: public; Owner: prestijuser
--

CREATE UNIQUE INDEX "dubbing_artist_likes_userId_artistId_key" ON public.dubbing_artist_likes USING btree ("userId", "artistId");


--
-- Name: email_change_requests_token_key; Type: INDEX; Schema: public; Owner: prestijuser
--

CREATE UNIQUE INDEX email_change_requests_token_key ON public.email_change_requests USING btree (token);


--
-- Name: email_change_requests_userId_idx; Type: INDEX; Schema: public; Owner: prestijuser
--

CREATE INDEX "email_change_requests_userId_idx" ON public.email_change_requests USING btree ("userId");


--
-- Name: messages_receiverId_isRead_idx; Type: INDEX; Schema: public; Owner: prestijuser
--

CREATE INDEX "messages_receiverId_isRead_idx" ON public.messages USING btree ("receiverId", "isRead");


--
-- Name: project_assignments_artistId_idx; Type: INDEX; Schema: public; Owner: prestijuser
--

CREATE INDEX "project_assignments_artistId_idx" ON public.project_assignments USING btree ("artistId");


--
-- Name: project_assignments_projectId_artistId_role_key; Type: INDEX; Schema: public; Owner: prestijuser
--

CREATE UNIQUE INDEX "project_assignments_projectId_artistId_role_key" ON public.project_assignments USING btree ("projectId", "artistId", role);


--
-- Name: project_assignments_projectId_idx; Type: INDEX; Schema: public; Owner: prestijuser
--

CREATE INDEX "project_assignments_projectId_idx" ON public.project_assignments USING btree ("projectId");


--
-- Name: project_characters_projectId_idx; Type: INDEX; Schema: public; Owner: prestijuser
--

CREATE INDEX "project_characters_projectId_idx" ON public.project_characters USING btree ("projectId");


--
-- Name: project_characters_projectId_name_key; Type: INDEX; Schema: public; Owner: prestijuser
--

CREATE UNIQUE INDEX "project_characters_projectId_name_key" ON public.project_characters USING btree ("projectId", name);


--
-- Name: project_dislikes_userId_projectId_key; Type: INDEX; Schema: public; Owner: prestijuser
--

CREATE UNIQUE INDEX "project_dislikes_userId_projectId_key" ON public.project_dislikes USING btree ("userId", "projectId");


--
-- Name: project_favorites_userId_projectId_key; Type: INDEX; Schema: public; Owner: prestijuser
--

CREATE UNIQUE INDEX "project_favorites_userId_projectId_key" ON public.project_favorites USING btree ("userId", "projectId");


--
-- Name: project_images_projectId_idx; Type: INDEX; Schema: public; Owner: prestijuser
--

CREATE INDEX "project_images_projectId_idx" ON public.project_images USING btree ("projectId");


--
-- Name: project_likes_userId_projectId_key; Type: INDEX; Schema: public; Owner: prestijuser
--

CREATE UNIQUE INDEX "project_likes_userId_projectId_key" ON public.project_likes USING btree ("userId", "projectId");


--
-- Name: project_ratings_userId_projectId_key; Type: INDEX; Schema: public; Owner: prestijuser
--

CREATE UNIQUE INDEX "project_ratings_userId_projectId_key" ON public.project_ratings USING btree ("userId", "projectId");


--
-- Name: projects_slug_key; Type: INDEX; Schema: public; Owner: prestijuser
--

CREATE UNIQUE INDEX projects_slug_key ON public.projects USING btree (slug);


--
-- Name: sessions_sessionToken_key; Type: INDEX; Schema: public; Owner: prestijuser
--

CREATE UNIQUE INDEX "sessions_sessionToken_key" ON public.sessions USING btree ("sessionToken");


--
-- Name: user_notifications_userId_notificationId_key; Type: INDEX; Schema: public; Owner: prestijuser
--

CREATE UNIQUE INDEX "user_notifications_userId_notificationId_key" ON public.user_notifications USING btree ("userId", "notificationId");


--
-- Name: user_owned_games_userId_projectId_key; Type: INDEX; Schema: public; Owner: prestijuser
--

CREATE UNIQUE INDEX "user_owned_games_userId_projectId_key" ON public.user_owned_games USING btree ("userId", "projectId");


--
-- Name: user_reports_reporterId_reportedId_key; Type: INDEX; Schema: public; Owner: prestijuser
--

CREATE UNIQUE INDEX "user_reports_reporterId_reportedId_key" ON public.user_reports USING btree ("reporterId", "reportedId");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: prestijuser
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_username_key; Type: INDEX; Schema: public; Owner: prestijuser
--

CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);


--
-- Name: verification_tokens_identifier_token_key; Type: INDEX; Schema: public; Owner: prestijuser
--

CREATE UNIQUE INDEX verification_tokens_identifier_token_key ON public.verification_tokens USING btree (identifier, token);


--
-- Name: verification_tokens_token_key; Type: INDEX; Schema: public; Owner: prestijuser
--

CREATE UNIQUE INDEX verification_tokens_token_key ON public.verification_tokens USING btree (token);


--
-- Name: voice_assignments_projectAssignmentId_idx; Type: INDEX; Schema: public; Owner: prestijuser
--

CREATE INDEX "voice_assignments_projectAssignmentId_idx" ON public.voice_assignments USING btree ("projectAssignmentId");


--
-- Name: voice_assignments_projectAssignmentId_projectCharacterId_key; Type: INDEX; Schema: public; Owner: prestijuser
--

CREATE UNIQUE INDEX "voice_assignments_projectAssignmentId_projectCharacterId_key" ON public.voice_assignments USING btree ("projectAssignmentId", "projectCharacterId");


--
-- Name: voice_assignments_projectCharacterId_idx; Type: INDEX; Schema: public; Owner: prestijuser
--

CREATE INDEX "voice_assignments_projectCharacterId_idx" ON public.voice_assignments USING btree ("projectCharacterId");


--
-- Name: accounts accounts_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: comments comments_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT "comments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: comments comments_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT "comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: dubbing_artist_favorites dubbing_artist_favorites_artistId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.dubbing_artist_favorites
    ADD CONSTRAINT "dubbing_artist_favorites_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES public.dubbing_artists(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: dubbing_artist_favorites dubbing_artist_favorites_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.dubbing_artist_favorites
    ADD CONSTRAINT "dubbing_artist_favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: dubbing_artist_likes dubbing_artist_likes_artistId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.dubbing_artist_likes
    ADD CONSTRAINT "dubbing_artist_likes_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES public.dubbing_artists(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: dubbing_artist_likes dubbing_artist_likes_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.dubbing_artist_likes
    ADD CONSTRAINT "dubbing_artist_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: email_change_requests email_change_requests_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.email_change_requests
    ADD CONSTRAINT "email_change_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: messages messages_receiverId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT "messages_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: messages messages_senderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: project_assignments project_assignments_artistId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.project_assignments
    ADD CONSTRAINT "project_assignments_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES public.dubbing_artists(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: project_assignments project_assignments_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.project_assignments
    ADD CONSTRAINT "project_assignments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: project_categories project_categories_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.project_categories
    ADD CONSTRAINT "project_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: project_categories project_categories_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.project_categories
    ADD CONSTRAINT "project_categories_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: project_characters project_characters_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.project_characters
    ADD CONSTRAINT "project_characters_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: project_dislikes project_dislikes_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.project_dislikes
    ADD CONSTRAINT "project_dislikes_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: project_dislikes project_dislikes_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.project_dislikes
    ADD CONSTRAINT "project_dislikes_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: project_favorites project_favorites_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.project_favorites
    ADD CONSTRAINT "project_favorites_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: project_favorites project_favorites_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.project_favorites
    ADD CONSTRAINT "project_favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: project_images project_images_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.project_images
    ADD CONSTRAINT "project_images_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: project_likes project_likes_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.project_likes
    ADD CONSTRAINT "project_likes_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: project_likes project_likes_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.project_likes
    ADD CONSTRAINT "project_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: project_ratings project_ratings_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.project_ratings
    ADD CONSTRAINT "project_ratings_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: project_ratings project_ratings_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.project_ratings
    ADD CONSTRAINT "project_ratings_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sessions sessions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: support_requests support_requests_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.support_requests
    ADD CONSTRAINT "support_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_blocks user_blocks_blockerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.user_blocks
    ADD CONSTRAINT "user_blocks_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_blocks user_blocks_blockingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.user_blocks
    ADD CONSTRAINT "user_blocks_blockingId_fkey" FOREIGN KEY ("blockingId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_notifications user_notifications_notificationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.user_notifications
    ADD CONSTRAINT "user_notifications_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES public.notifications(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_notifications user_notifications_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.user_notifications
    ADD CONSTRAINT "user_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_owned_games user_owned_games_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.user_owned_games
    ADD CONSTRAINT "user_owned_games_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_owned_games user_owned_games_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.user_owned_games
    ADD CONSTRAINT "user_owned_games_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_reports user_reports_reportedId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.user_reports
    ADD CONSTRAINT "user_reports_reportedId_fkey" FOREIGN KEY ("reportedId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_reports user_reports_reporterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.user_reports
    ADD CONSTRAINT "user_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: voice_assignments voice_assignments_projectAssignmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.voice_assignments
    ADD CONSTRAINT "voice_assignments_projectAssignmentId_fkey" FOREIGN KEY ("projectAssignmentId") REFERENCES public.project_assignments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: voice_assignments voice_assignments_projectCharacterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prestijuser
--

ALTER TABLE ONLY public.voice_assignments
    ADD CONSTRAINT "voice_assignments_projectCharacterId_fkey" FOREIGN KEY ("projectCharacterId") REFERENCES public.project_characters(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

