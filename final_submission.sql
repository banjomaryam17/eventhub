--
-- PostgreSQL database dump
--

\restrict oKoOEAipaTRvFedGIEa2KygmaWh5gmNpMdR2xN0Ua8PIA2R0NKiFm62ueNnRg3k

-- Dumped from database version 17.7
-- Dumped by pg_dump version 17.9 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: order_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.order_status_enum AS ENUM (
    'pending',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded'
);


ALTER TYPE public.order_status_enum OWNER TO postgres;

--
-- Name: update_listing_rating(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_listing_rating() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
UPDATE listings
SET 
    average_rating = COALESCE((
        SELECT ROUND(AVG(rating), 2)
        FROM reviews
        WHERE listing_id = COALESCE(NEW.listing_id, OLD.listing_id)
    ),0),
    review_count = (
        SELECT COUNT(*)
        FROM reviews
        WHERE listing_id = COALESCE(NEW.listing_id, OLD.listing_id)
    )
WHERE id = COALESCE(NEW.listing_id, OLD.listing_id);
RETURN NULL;
END;
$$;


ALTER FUNCTION public.update_listing_rating() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: blocked_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.blocked_users (
    blocker_id bigint NOT NULL,
    blocked_id bigint NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT blocked_users_check CHECK ((blocker_id <> blocked_id))
);


ALTER TABLE public.blocked_users OWNER TO postgres;

--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cart_items (
    cart_id bigint NOT NULL,
    listing_id bigint NOT NULL,
    quantity integer NOT NULL,
    added_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT cart_items_quantity_check CHECK ((quantity > 0))
);


ALTER TABLE public.cart_items OWNER TO postgres;

--
-- Name: carts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.carts (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.carts OWNER TO postgres;

--
-- Name: carts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.carts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.carts_id_seq OWNER TO postgres;

--
-- Name: carts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.carts_id_seq OWNED BY public.carts.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id bigint NOT NULL,
    name text NOT NULL,
    parent_id bigint,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    slug text
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comments (
    id bigint NOT NULL,
    post_id bigint NOT NULL,
    user_id bigint NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.comments OWNER TO postgres;

--
-- Name: comments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.comments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comments_id_seq OWNER TO postgres;

--
-- Name: comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.comments_id_seq OWNED BY public.comments.id;


--
-- Name: followers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.followers (
    follower_id bigint NOT NULL,
    following_id bigint NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT followers_check CHECK ((follower_id <> following_id))
);


ALTER TABLE public.followers OWNER TO postgres;

--
-- Name: listing_images; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.listing_images (
    id bigint NOT NULL,
    listing_id bigint NOT NULL,
    image_url text NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    sort_order integer DEFAULT 0
);


ALTER TABLE public.listing_images OWNER TO postgres;

--
-- Name: listing_images_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.listing_images_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.listing_images_id_seq OWNER TO postgres;

--
-- Name: listing_images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.listing_images_id_seq OWNED BY public.listing_images.id;


--
-- Name: listings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.listings (
    id bigint NOT NULL,
    seller_id bigint NOT NULL,
    category_id bigint NOT NULL,
    title text NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    quantity integer NOT NULL,
    condition text DEFAULT 'used'::text NOT NULL,
    is_anonymous boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    average_rating numeric(3,2) DEFAULT 0 NOT NULL,
    review_count integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT listings_condition_check CHECK ((condition = ANY (ARRAY['new'::text, 'used'::text, 'refurbished'::text]))),
    CONSTRAINT listings_price_check CHECK ((price >= (0)::numeric)),
    CONSTRAINT listings_quantity_check CHECK ((quantity >= 0))
);


ALTER TABLE public.listings OWNER TO postgres;

--
-- Name: listings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.listings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.listings_id_seq OWNER TO postgres;

--
-- Name: listings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.listings_id_seq OWNED BY public.listings.id;


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    id bigint NOT NULL,
    order_id bigint NOT NULL,
    listing_id bigint NOT NULL,
    seller_id bigint,
    title_snapshot text NOT NULL,
    price_snapshot numeric(10,2) NOT NULL,
    quantity integer NOT NULL,
    subtotal numeric(10,2),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT order_items_price_snapshot_check CHECK ((price_snapshot >= (0)::numeric)),
    CONSTRAINT order_items_quantity_check CHECK ((quantity > 0)),
    CONSTRAINT order_items_subtotal_check CHECK ((subtotal >= (0)::numeric))
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- Name: order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_items_id_seq OWNER TO postgres;

--
-- Name: order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id bigint NOT NULL,
    buyer_id bigint NOT NULL,
    shipping_address_id bigint,
    item_cost numeric(10,2),
    shipping_cost numeric(10,2),
    discount_applied boolean DEFAULT false NOT NULL,
    discount_amount numeric(10,2) DEFAULT 0,
    total_price numeric(10,2) NOT NULL,
    stripe_payment_intent_id text,
    stripe_charge_id text,
    status public.order_status_enum DEFAULT 'pending'::public.order_status_enum NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT orders_discount_amount_check CHECK ((discount_amount >= (0)::numeric)),
    CONSTRAINT orders_item_cost_check CHECK ((item_cost >= (0)::numeric)),
    CONSTRAINT orders_shipping_cost_check CHECK ((shipping_cost >= (0)::numeric)),
    CONSTRAINT orders_total_cost_check CHECK ((total_price >= (0)::numeric))
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orders_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_id_seq OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: post_likes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.post_likes (
    post_id bigint NOT NULL,
    user_id bigint NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.post_likes OWNER TO postgres;

--
-- Name: posts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.posts (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    content text,
    image_url text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.posts OWNER TO postgres;

--
-- Name: posts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.posts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.posts_id_seq OWNER TO postgres;

--
-- Name: posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.posts_id_seq OWNED BY public.posts.id;


--
-- Name: reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reports (
    report_id bigint NOT NULL,
    listing_id bigint NOT NULL,
    user_id bigint NOT NULL,
    resolved boolean DEFAULT false NOT NULL
);


ALTER TABLE public.reports OWNER TO postgres;

--
-- Name: reports_report_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reports_report_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reports_report_id_seq OWNER TO postgres;

--
-- Name: reports_report_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reports_report_id_seq OWNED BY public.reports.report_id;


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reviews (
    id bigint NOT NULL,
    listing_id bigint NOT NULL,
    user_id bigint NOT NULL,
    rating numeric(2,1) NOT NULL,
    content text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT reviews_rating_check CHECK (((rating >= (0)::numeric) AND (rating <= (5)::numeric) AND ((rating * (2)::numeric) = floor((rating * (2)::numeric)))))
);


ALTER TABLE public.reviews OWNER TO postgres;

--
-- Name: reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reviews_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reviews_id_seq OWNER TO postgres;

--
-- Name: reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reviews_id_seq OWNED BY public.reviews.id;


--
-- Name: shipping_addresses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shipping_addresses (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    full_name text NOT NULL,
    address_line1 text NOT NULL,
    address_line2 text,
    city text NOT NULL,
    state text NOT NULL,
    postal_code text NOT NULL,
    country text NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.shipping_addresses OWNER TO postgres;

--
-- Name: shipping_addresses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.shipping_addresses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.shipping_addresses_id_seq OWNER TO postgres;

--
-- Name: shipping_addresses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.shipping_addresses_id_seq OWNED BY public.shipping_addresses.id;


--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_profiles (
    user_id bigint NOT NULL,
    profile_picture text,
    bio text,
    website_url text,
    location text,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_profiles OWNER TO postgres;

--
-- Name: user_reputation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_reputation (
    user_id bigint NOT NULL,
    reputation_score integer DEFAULT 0 NOT NULL,
    total_sales integer DEFAULT 0 NOT NULL,
    is_verified_seller boolean DEFAULT false NOT NULL,
    verification_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT user_reputation_reputation_score_check CHECK ((reputation_score >= 0)),
    CONSTRAINT user_reputation_total_sales_check CHECK ((total_sales >= 0))
);


ALTER TABLE public.user_reputation OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    role text DEFAULT 'user'::text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    username text NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    is_banned boolean DEFAULT false NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: wishlist; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wishlist (
    user_id bigint NOT NULL,
    listing_id bigint NOT NULL,
    added_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.wishlist OWNER TO postgres;

--
-- Name: carts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carts ALTER COLUMN id SET DEFAULT nextval('public.carts_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: comments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments ALTER COLUMN id SET DEFAULT nextval('public.comments_id_seq'::regclass);


--
-- Name: listing_images id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.listing_images ALTER COLUMN id SET DEFAULT nextval('public.listing_images_id_seq'::regclass);


--
-- Name: listings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.listings ALTER COLUMN id SET DEFAULT nextval('public.listings_id_seq'::regclass);


--
-- Name: order_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: posts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts ALTER COLUMN id SET DEFAULT nextval('public.posts_id_seq'::regclass);


--
-- Name: reports report_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports ALTER COLUMN report_id SET DEFAULT nextval('public.reports_report_id_seq'::regclass);


--
-- Name: reviews id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews ALTER COLUMN id SET DEFAULT nextval('public.reviews_id_seq'::regclass);


--
-- Name: shipping_addresses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipping_addresses ALTER COLUMN id SET DEFAULT nextval('public.shipping_addresses_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: blocked_users; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.cart_items (cart_id, listing_id, quantity, added_at) VALUES (13, 11, 3, '2026-03-23 15:58:08.202314');
INSERT INTO public.cart_items (cart_id, listing_id, quantity, added_at) VALUES (28, 40, 1, '2026-03-30 16:03:07.491549');
INSERT INTO public.cart_items (cart_id, listing_id, quantity, added_at) VALUES (28, 46, 1, '2026-03-30 16:03:18.423959');
INSERT INTO public.cart_items (cart_id, listing_id, quantity, added_at) VALUES (28, 47, 1, '2026-03-30 16:03:43.292579');
INSERT INTO public.cart_items (cart_id, listing_id, quantity, added_at) VALUES (28, 27, 1, '2026-03-30 16:03:32.54412');


--
-- Data for Name: carts; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.carts (id, user_id, created_at, updated_at) VALUES (1, 29, '2026-03-18 17:08:19.004585', '2026-03-18 17:08:19.004585');
INSERT INTO public.carts (id, user_id, created_at, updated_at) VALUES (6, 25, '2026-03-19 13:31:52.579156', '2026-03-19 13:31:52.579156');
INSERT INTO public.carts (id, user_id, created_at, updated_at) VALUES (8, 31, '2026-03-21 11:08:41.648767', '2026-03-21 11:08:41.648767');
INSERT INTO public.carts (id, user_id, created_at, updated_at) VALUES (10, 32, '2026-03-22 22:39:32.059089', '2026-03-22 22:39:32.059089');
INSERT INTO public.carts (id, user_id, created_at, updated_at) VALUES (13, 37, '2026-03-23 15:50:27.036294', '2026-03-23 15:50:27.036294');
INSERT INTO public.carts (id, user_id, created_at, updated_at) VALUES (16, 38, '2026-03-23 18:19:13.160988', '2026-03-23 18:19:13.160988');
INSERT INTO public.carts (id, user_id, created_at, updated_at) VALUES (18, 39, '2026-03-23 18:40:04.228267', '2026-03-23 18:40:04.228267');
INSERT INTO public.carts (id, user_id, created_at, updated_at) VALUES (28, 40, '2026-03-30 16:03:07.488354', '2026-03-30 16:03:07.488354');
INSERT INTO public.carts (id, user_id, created_at, updated_at) VALUES (33, 41, '2026-04-02 14:21:45.025869', '2026-04-02 14:21:45.025869');
INSERT INTO public.carts (id, user_id, created_at, updated_at) VALUES (48, 42, '2026-04-21 14:19:32.272056', '2026-04-21 14:19:32.272056');


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.categories (id, name, parent_id, created_at, slug) VALUES (1, 'Electronics', NULL, '2026-03-17 22:07:15.811137', 'electronics');
INSERT INTO public.categories (id, name, parent_id, created_at, slug) VALUES (2, 'Clothing', NULL, '2026-03-17 22:07:15.811137', 'clothing');
INSERT INTO public.categories (id, name, parent_id, created_at, slug) VALUES (3, 'Books', NULL, '2026-03-17 22:07:15.811137', 'books');
INSERT INTO public.categories (id, name, parent_id, created_at, slug) VALUES (4, 'Home & Garden', NULL, '2026-03-17 22:07:15.811137', 'home-garden');
INSERT INTO public.categories (id, name, parent_id, created_at, slug) VALUES (5, 'Sports', NULL, '2026-03-17 22:07:15.811137', 'sports');
INSERT INTO public.categories (id, name, parent_id, created_at, slug) VALUES (6, 'Toys & Games', NULL, '2026-03-17 22:07:15.811137', 'toys-games');
INSERT INTO public.categories (id, name, parent_id, created_at, slug) VALUES (7, 'Vehicles', NULL, '2026-03-17 22:07:15.811137', 'vehicles');
INSERT INTO public.categories (id, name, parent_id, created_at, slug) VALUES (8, 'Other', NULL, '2026-03-17 22:07:15.811137', 'other');


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: followers; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: listing_images; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.listing_images (id, listing_id, image_url, is_primary, created_at, sort_order) VALUES (1, 11, 'https://res.cloudinary.com/dwu2fumoa/image/upload/v1773927435/dsp0vl7tkxobmnnuamrf.jpg', true, '2026-03-19 13:37:19.778055', 0);
INSERT INTO public.listing_images (id, listing_id, image_url, is_primary, created_at, sort_order) VALUES (2, 12, 'https://res.cloudinary.com/dwu2fumoa/image/upload/v1773927631/qqnlkz7tvjg28rwkhwd7.jpg', true, '2026-03-19 13:40:34.962332', 0);
INSERT INTO public.listing_images (id, listing_id, image_url, is_primary, created_at, sort_order) VALUES (3, 18, 'https://res.cloudinary.com/dwu2fumoa/image/upload/v1774293308/ir9qmvbcj8vkq9xqktsj.jpg', true, '2026-03-23 19:15:14.266197', 0);
INSERT INTO public.listing_images (id, listing_id, image_url, is_primary, created_at, sort_order) VALUES (4, 19, 'https://res.cloudinary.com/dwu2fumoa/image/upload/v1774293743/pcsjtjitwdh424m5dcqk.jpg', true, '2026-03-23 19:22:27.793351', 0);
INSERT INTO public.listing_images (id, listing_id, image_url, is_primary, created_at, sort_order) VALUES (5, 20, 'https://res.cloudinary.com/dwu2fumoa/image/upload/v1774293808/vxouqkimbyklmnmsrran.jpg', true, '2026-03-23 19:23:35.399258', 0);
INSERT INTO public.listing_images (id, listing_id, image_url, is_primary, created_at, sort_order) VALUES (6, 21, 'https://res.cloudinary.com/dwu2fumoa/image/upload/v1774293926/riytbpcdtdjrld34n4jd.jpg', true, '2026-03-23 19:25:34.604921', 0);
INSERT INTO public.listing_images (id, listing_id, image_url, is_primary, created_at, sort_order) VALUES (7, 22, 'https://res.cloudinary.com/dwu2fumoa/image/upload/v1774294018/fsiyleciblxbdago6kbx.jpg', true, '2026-03-23 19:27:00.432776', 0);
INSERT INTO public.listing_images (id, listing_id, image_url, is_primary, created_at, sort_order) VALUES (8, 23, 'https://res.cloudinary.com/dwu2fumoa/image/upload/v1774294096/wh64ixdfvjkwjlahlmif.jpg', true, '2026-03-23 19:29:00.896222', 0);
INSERT INTO public.listing_images (id, listing_id, image_url, is_primary, created_at, sort_order) VALUES (9, 24, 'https://res.cloudinary.com/dwu2fumoa/image/upload/v1774294214/bygmkox1zzqjfx4gtp6f.jpg', true, '2026-03-23 19:30:19.869029', 0);
INSERT INTO public.listing_images (id, listing_id, image_url, is_primary, created_at, sort_order) VALUES (10, 25, 'https://res.cloudinary.com/dwu2fumoa/image/upload/v1774294326/qfychhzidgj2o45rlkwa.jpg', true, '2026-03-23 19:32:10.299229', 0);
INSERT INTO public.listing_images (id, listing_id, image_url, is_primary, created_at, sort_order) VALUES (11, 26, 'https://res.cloudinary.com/dwu2fumoa/image/upload/v1774294413/npyepsuywgl0ly997ce8.jpg', true, '2026-03-23 19:33:35.608442', 0);
INSERT INTO public.listing_images (id, listing_id, image_url, is_primary, created_at, sort_order) VALUES (12, 27, 'https://res.cloudinary.com/dwu2fumoa/image/upload/v1774295434/t9xcfiefz7tte7sn2grc.jpg', true, '2026-03-23 19:50:39.202476', 0);
INSERT INTO public.listing_images (id, listing_id, image_url, is_primary, created_at, sort_order) VALUES (13, 28, 'https://res.cloudinary.com/dwu2fumoa/image/upload/v1774295509/faqriylbfuld8kqli5mx.jpg', true, '2026-03-23 19:53:57.41538', 0);
INSERT INTO public.listing_images (id, listing_id, image_url, is_primary, created_at, sort_order) VALUES (14, 29, 'https://res.cloudinary.com/dwu2fumoa/image/upload/v1774295723/oo54qkp05tyb62th2dcl.jpg', true, '2026-03-23 19:55:27.232804', 0);
INSERT INTO public.listing_images (id, listing_id, image_url, is_primary, created_at, sort_order) VALUES (15, 30, 'https://res.cloudinary.com/dwu2fumoa/image/upload/v1774296450/v3qlkahvymzntcqzxzqm.jpg', true, '2026-03-23 20:07:34.167875', 0);
INSERT INTO public.listing_images (id, listing_id, image_url, is_primary, created_at, sort_order) VALUES (16, 31, 'https://res.cloudinary.com/dwu2fumoa/image/upload/v1774296504/ipdgj2s2larqadkwyakn.jpg', true, '2026-03-23 20:08:31.626036', 0);
INSERT INTO public.listing_images (id, listing_id, image_url, is_primary, created_at, sort_order) VALUES (17, 32, 'https://res.cloudinary.com/dwu2fumoa/image/upload/v1774296593/zqzcb28d3bqb3atnhnbp.jpg', true, '2026-03-23 20:09:55.651194', 0);
INSERT INTO public.listing_images (id, listing_id, image_url, is_primary, created_at, sort_order) VALUES (18, 33, 'https://res.cloudinary.com/dwu2fumoa/image/upload/v1774296734/ws4zblhjruvp9catq6au.jpg', true, '2026-03-23 20:12:17.083214', 0);
INSERT INTO public.listing_images (id, listing_id, image_url, is_primary, created_at, sort_order) VALUES (19, 34, 'https://res.cloudinary.com/dwu2fumoa/image/upload/v1774296811/ncnoaoyjubqbzcdyxorr.jpg', true, '2026-03-23 20:13:33.162726', 0);
INSERT INTO public.listing_images (id, listing_id, image_url, is_primary, created_at, sort_order) VALUES (20, 35, 'https://res.cloudinary.com/dwu2fumoa/image/upload/v1774296943/cgjzo7dbeokp9imrg7jr.jpg', true, '2026-03-23 20:17:22.885676', 0);
INSERT INTO public.listing_images (id, listing_id, image_url, is_primary, created_at, sort_order) VALUES (21, 36, 'https://res.cloudinary.com/dwu2fumoa/image/upload/v1774297143/tocnbpkzfdgigmo9tz8n.jpg', true, '2026-03-23 20:19:07.027537', 0);
INSERT INTO public.listing_images (id, listing_id, image_url, is_primary, created_at, sort_order) VALUES (22, 37, 'https://res.cloudinary.com/dwu2fumoa/image/upload/v1774297273/hum39mmtyoftimlf6vri.jpg', true, '2026-03-23 20:21:17.17004', 0);
INSERT INTO public.listing_images (id, listing_id, image_url, is_primary, created_at, sort_order) VALUES (23, 38, 'https://res.cloudinary.com/dwu2fumoa/image/upload/v1774297446/d23emak4iqye8ad564yy.jpg', true, '2026-03-23 20:24:08.611955', 0);
INSERT INTO public.listing_images (id, listing_id, image_url, is_primary, created_at, sort_order) VALUES (24, 39, 'https://res.cloudinary.com/dwu2fumoa/image/upload/v1774297600/l3ybkmuqwpvxsjmjj5el.jpg', true, '2026-03-23 20:26:47.54964', 0);
INSERT INTO public.listing_images (id, listing_id, image_url, is_primary, created_at, sort_order) VALUES (25, 40, 'https://res.cloudinary.com/dwu2fumoa/image/upload/v1774298221/upridyojnlwahzlastdm.jpg', true, '2026-03-23 20:37:05.267036', 0);
INSERT INTO public.listing_images (id, listing_id, image_url, is_primary, created_at, sort_order) VALUES (26, 41, 'https://res.cloudinary.com/dwu2fumoa/image/upload/v1774298692/rmkfmtekamrgao5kjbbf.jpg', true, '2026-03-23 20:48:09.722427', 0);
INSERT INTO public.listing_images (id, listing_id, image_url, is_primary, created_at, sort_order) VALUES (27, 42, 'https://res.cloudinary.com/dwu2fumoa/image/upload/v1774299180/v9o9cjy2rbjgxk3iv4ga.jpg', true, '2026-03-23 20:54:34.721169', 0);
INSERT INTO public.listing_images (id, listing_id, image_url, is_primary, created_at, sort_order) VALUES (28, 43, 'https://res.cloudinary.com/dwu2fumoa/image/upload/v1774299346/tespybbphjfslrt7pk0q.jpg', true, '2026-03-23 20:57:33.361946', 0);
INSERT INTO public.listing_images (id, listing_id, image_url, is_primary, created_at, sort_order) VALUES (29, 44, 'https://res.cloudinary.com/dwu2fumoa/image/upload/v1774299485/wlmwbnxuaqbqucixzzxe.jpg', true, '2026-03-23 21:01:48.776522', 0);
INSERT INTO public.listing_images (id, listing_id, image_url, is_primary, created_at, sort_order) VALUES (30, 45, 'https://res.cloudinary.com/dwu2fumoa/image/upload/v1774341614/xaxym62v9kdk25yf1muy.jpg', true, '2026-03-24 08:40:17.15641', 0);
INSERT INTO public.listing_images (id, listing_id, image_url, is_primary, created_at, sort_order) VALUES (31, 46, 'https://res.cloudinary.com/dwu2fumoa/image/upload/v1774341650/ekgyphdsg9bq4vs9povb.jpg', true, '2026-03-24 08:41:34.707594', 0);
INSERT INTO public.listing_images (id, listing_id, image_url, is_primary, created_at, sort_order) VALUES (32, 47, 'https://res.cloudinary.com/dwu2fumoa/image/upload/v1774342092/zeyolle0uojqczbersen.jpg', true, '2026-03-24 08:49:12.584296', 0);
INSERT INTO public.listing_images (id, listing_id, image_url, is_primary, created_at, sort_order) VALUES (33, 48, 'https://res.cloudinary.com/dwu2fumoa/image/upload/v1774342236/w81dwxek7dzmo1yiszsh.jpg', true, '2026-03-24 08:51:28.531926', 0);
INSERT INTO public.listing_images (id, listing_id, image_url, is_primary, created_at, sort_order) VALUES (34, 49, 'https://res.cloudinary.com/dwu2fumoa/image/upload/v1774342503/qjs1kevdfeqapy7h6ogg.jpg', true, '2026-03-24 08:55:05.538018', 0);
INSERT INTO public.listing_images (id, listing_id, image_url, is_primary, created_at, sort_order) VALUES (35, 50, 'https://res.cloudinary.com/dwu2fumoa/image/upload/v1774354228/i8euarsua2tdd8qs8tkm.jpg', true, '2026-03-24 12:10:31.051742', 0);
INSERT INTO public.listing_images (id, listing_id, image_url, is_primary, created_at, sort_order) VALUES (36, 51, 'https://res.cloudinary.com/dwu2fumoa/image/upload/v1775136046/ahm1f0byu228ihd3tqfq.jpg', true, '2026-04-02 14:21:03.163334', 0);
INSERT INTO public.listing_images (id, listing_id, image_url, is_primary, created_at, sort_order) VALUES (37, 52, 'https://res.cloudinary.com/dwu2fumoa/image/upload/v1776847757/aaow6yet8sgfhkhplgpi.jpg', true, '2026-04-22 09:50:33.413195', 0);


--
-- Data for Name: listings; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (21, 39, 2, 'Velvet Kiss Wrap Evening Dress', 'Soft velvet fabric meets a flattering wrap design in this elegant piece. Perfect for cooler evenings, it combines comfort with a luxurious feel.', 18.00, 2, 'used', false, true, 0.00, 0, '2026-03-23 19:25:34.601759', '2026-03-23 19:25:34.601759');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (22, 39, 2, 'Dreamy Nights Lace Trim Dress', 'Delicate lace details add a soft, feminine touch to this elegant dress. Perfect for romantic dinners and special occasions.', 40.00, 2, 'used', false, true, 0.00, 0, '2026-03-23 19:27:00.430269', '2026-03-23 19:27:00.430269');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (23, 39, 2, 'Moonlight Elegance Long Sleeve Dress', 'With its sleek long sleeves and elegant silhouette, this dress is perfect for evening sophistication. Ideal for cooler nights and formal dinners.', 14.00, 10, 'new', false, true, 0.00, 0, '2026-03-23 19:29:00.892517', '2026-03-23 19:29:00.892517');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (6, 1, 1, 'iPad Pro 11" 2022 256GB', 'Refurbished, works perfectly', 620.00, 0, 'refurbished', false, false, 0.00, 0, '2026-03-17 22:07:28.297299', '2026-03-17 22:07:28.297299');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (24, 39, 2, 'Allure Curve Ruched Mini Dress', 'Designed to hug your curves, this ruched mini dress creates a flattering and confident look. Perfect for bold dinner styles and nights out.', 21.00, 30, 'new', false, true, 0.00, 0, '2026-03-23 19:30:19.866796', '2026-03-23 19:30:19.866796');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (8, 25, 3, 'Sealed nectar', 'it is a religious book', 20.00, 0, 'new', false, false, 0.00, 0, '2026-03-17 22:10:40.245083', '2026-03-17 22:10:40.245083');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (25, 39, 2, 'Elegant Night Satin Slip Dress', 'Turn heads in this silky satin slip dress, designed with a smooth finish and a flattering silhouette. Perfect for dinner dates or evening events, it brings effortless elegance to your look.', 20.00, 5, 'new', false, true, 0.00, 0, '2026-03-23 19:32:10.296928', '2026-03-23 19:32:10.296928');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (10, 25, 8, 'Marc Jacobs Tote Bag', '', 150.00, 0, 'new', false, false, 0.00, 0, '2026-03-18 16:57:45.270017', '2026-03-18 16:57:45.270017');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (9, 25, 5, 'Bicycle', '', 345.00, 0, 'new', true, false, 0.00, 0, '2026-03-18 14:45:10.155999', '2026-03-18 14:45:10.155999');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (2, 1, 1, 'Samsung 4K Monitor 27"', 'Barely used, perfect screen', 280.00, 2, 'used', false, false, 0.00, 0, '2026-03-17 22:07:28.297299', '2026-03-23 19:34:29.226302');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (1, 1, 1, 'iPhone 13 128GB', 'Great condition, minor scratches', 450.00, 0, 'used', false, false, 0.00, 0, '2026-03-17 22:07:28.297299', '2026-03-17 22:07:28.297299');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (15, 29, 1, 'Laptop', 'used', 200.00, 1, 'used', false, false, 0.00, 0, '2026-03-23 15:12:02.231914', '2026-03-23 19:34:36.829876');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (5, 1, 4, 'IKEA KALLAX Shelf', 'White, good condition', 60.00, 0, 'used', false, false, 0.00, 0, '2026-03-17 22:07:28.297299', '2026-03-17 22:07:28.297299');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (16, 38, 1, 'iphone 13', 'white, 128gb, mininum scratches', 600.00, 1, 'used', true, false, 0.00, 0, '2026-03-23 18:26:34.1451', '2026-03-23 19:34:39.68271');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (17, 39, 1, 'Iphone 15 pro ma', 'screen a little bit cracked. Battery in perfect condition', 700.00, 1, 'used', false, false, 0.00, 0, '2026-03-23 18:41:39.877023', '2026-03-23 19:34:43.029204');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (13, 32, 1, 'Test MacBook Pro', 'Updated description', 750.00, 1, 'used', false, false, 0.00, 0, '2026-03-22 22:31:36.262664', '2026-03-22 22:38:16.473213');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (3, 1, 2, 'Nike Air Max 90 Size 10', 'Worn twice, like new', 95.00, 0, 'used', false, false, 0.00, 0, '2026-03-17 22:07:28.297299', '2026-03-22 23:14:29.374288');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (28, 39, 1, 'MacBook Pro 14-inch (M3 Pro)', 'Designed for professionals, the MacBook Pro combines powerful performance with advanced graphics. Ideal for video editing, coding, and demanding workflows.', 1400.00, 5, 'new', false, true, 0.00, 0, '2026-03-23 19:53:57.410826', '2026-03-23 19:53:57.410826');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (29, 39, 1, 'Dell XPS 13', 'A premium ultra-portable laptop with a sleek design and stunning display. Perfect for professionals and students who want performance in a compact form.', 350.00, 5, 'refurbished', false, true, 0.00, 0, '2026-03-23 19:55:27.229036', '2026-03-23 19:55:27.229036');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (14, 29, 1, 'Onplus Nord', 'Used Phone', 65.00, 1, 'used', true, false, 0.00, 0, '2026-03-23 15:04:57.221031', '2026-03-23 15:15:40.67047');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (30, 39, 1, 'Sony WH-1000XM5 Wireless Headphones', 'Industry-leading noise cancellation meets premium sound quality. Perfect for travel, work, and uninterrupted listening.', 200.00, 4, 'used', false, true, 0.00, 0, '2026-03-23 20:07:34.163259', '2026-03-23 20:07:34.163259');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (11, 25, 4, 'Haul Armchair grey color', 'brand new and very sturdy, available for pickup', 119.99, 26, 'new', false, true, 0.00, 0, '2026-03-19 13:37:19.769652', '2026-03-19 13:37:19.769652');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (12, 25, 4, 'Brown and White Table Lamp', 'Lamp comes with its own charger and cable', 60.00, 0, 'new', false, false, 0.00, 0, '2026-03-19 13:40:34.958255', '2026-03-19 13:40:34.958255');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (33, 32, 1, 'Samsung Galaxy S24 Ultra', 'A flagship device with a stunning display, powerful processor, and pro-level camera system. Ideal for productivity and photography.', 850.00, 5, 'refurbished', false, true, 0.00, 0, '2026-03-23 20:12:17.078922', '2026-03-23 20:12:17.078922');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (7, 25, 1, 'Samsung s21 ultra', 'new just dont like no more', 400.00, 0, 'used', true, false, 0.00, 0, '2026-03-17 22:09:52.684654', '2026-03-17 22:09:52.684654');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (18, 39, 2, 'Luxe Glow Backless Maxi Dress', 'Make a statement with this stunning backless maxi dress. Featuring a flowing design and elegant finish, it’s perfect for upscale dinners and special nights out.', 60.00, 6, 'new', false, true, 0.00, 0, '2026-03-23 19:15:14.25843', '2026-03-23 19:15:14.25843');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (19, 39, 2, 'Midnight Charm Off-Shoulder Dress', 'This off-shoulder dress highlights your neckline with a touch of elegance. Its sleek fit and timeless design make it perfect for classy evening occasions.', 40.00, 15, 'new', false, true, 0.00, 0, '2026-03-23 19:22:27.785311', '2026-03-23 19:22:27.785311');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (20, 39, 2, 'Chic Desire Split Hem Dinner Dress', 'A stylish split hem adds a touch of allure to this elegant dress. Designed for both comfort and sophistication, it’s ideal for making a subtle yet striking impression.', 25.00, 6, 'used', false, true, 0.00, 0, '2026-03-23 19:23:35.395349', '2026-03-23 19:23:35.395349');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (34, 32, 1, 'Ipad Pro 8', 'Known for its exceptional camera and clean Android experience, this phone is perfect for photography and smooth everyday use.', 100.00, 3, 'refurbished', false, true, 0.00, 0, '2026-03-23 20:13:33.160372', '2026-03-23 20:13:33.160372');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (35, 32, 1, 'Washing Machine', 'Make laundry effortless with this powerful washing machine. Designed for efficient cleaning with multiple wash settings, it ensures fresh and clean clothes every time.', 900.00, 80, 'new', false, true, 0.00, 0, '2026-03-23 20:17:22.881649', '2026-03-23 20:17:22.881649');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (36, 32, 1, 'Samsung Medium sized Oven', 'Bake, roast, and grill with ease using this versatile oven. Designed for even heat distribution, it delivers perfect cooking results every time.', 45.00, 1, 'used', false, true, 0.00, 0, '2026-03-23 20:19:07.022134', '2026-03-23 20:19:07.022134');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (32, 39, 1, 'Samsung Galaxy Buds2 Pro', 'Compact and powerful earbuds with high-quality sound and noise cancellation. Perfect for on-the-go listening.', 40.00, 18, 'refurbished', false, true, 0.00, 0, '2026-03-23 20:09:55.648786', '2026-03-23 20:09:55.648786');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (31, 39, 1, 'Apple AirPods Pro (2nd Generation)', 'Experience immersive sound with active noise cancellation and transparency mode. Designed for comfort and seamless connectivity with Apple devices.', 89.00, 10, 'refurbished', false, true, 0.00, 0, '2026-03-23 20:08:31.623098', '2026-03-23 20:08:31.623098');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (26, 39, 2, 'Starlight Sequin Bodycon Dress', 'Shine bright in this eye-catching sequin bodycon dress. Designed to sparkle under the lights, it’s perfect for glamorous dinner events and parties.', 40.00, 20, 'used', true, true, 0.00, 0, '2026-03-23 19:33:35.604707', '2026-03-23 19:33:35.604707');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (27, 39, 1, 'MacBook Air 13-inch (M2)', 'Supercharged by the M2 chip, this ultra-thin laptop delivers incredible speed and efficiency. With a stunning Retina display and all-day battery life, it’s perfect for work, creativity, and everyday use', 600.00, 13, 'new', false, true, 0.00, 0, '2026-03-23 19:50:39.198522', '2026-03-23 19:50:39.198522');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (38, 32, 1, 'Electric Mouse', 'Affordable and stylish, this mouse offers solid performance, a vibrant display, and long battery life.', 90.00, 6, 'refurbished', false, true, 0.00, 0, '2026-03-23 20:24:08.60666', '2026-03-23 20:24:08.60666');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (39, 32, 1, 'Rice Cooker', 'Cook with precision and efficiency using this reliable rice cooker. Featuring multiple easy-to-use controls, it’s perfect for everyday meals and family cooking.', 35.00, 5, 'new', false, true, 0.00, 0, '2026-03-23 20:26:47.546949', '2026-03-23 20:26:47.546949');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (40, 29, 1, 'Mayn Mixer', 'Featured easy-to-use controls, it’s perfect for everyday meals and family cooking.', 40.00, 5, 'used', false, true, 0.00, 0, '2026-03-23 20:37:05.260386', '2026-03-23 20:37:05.260386');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (41, 29, 3, 'Asadora', 'A book of happiness, friendship and soul finding', 6.00, 3, 'new', false, true, 0.00, 0, '2026-03-23 20:48:09.716656', '2026-03-23 20:48:09.716656');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (42, 29, 3, 'One year of Ugly', 'A book about self discovery', 10.00, 10, 'used', false, true, 0.00, 0, '2026-03-23 20:54:34.716913', '2026-03-23 20:54:34.716913');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (43, 29, 3, 'Company of One - Paul Jarvis', 'Why staying small is the next big thing for business', 10.00, 3, 'new', false, true, 0.00, 0, '2026-03-23 20:57:33.359245', '2026-03-23 20:57:33.359245');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (44, 29, 3, 'ZERO TO ONE - PETER THEIL', 'International Bestseller notes on startups to build a future', 12.00, 5, 'used', false, true, 0.00, 0, '2026-03-23 21:01:48.772866', '2026-03-23 21:01:48.772866');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (46, 31, 4, 'White Garden chairs', 'I have no need for them anymore, neat, sturdy and in good conditions', 10.00, 4, 'used', false, true, 0.00, 0, '2026-03-24 08:41:34.705519', '2026-03-24 08:41:34.705519');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (4, 1, 3, 'Clean Code by Robert Martin', 'Classic programming book', 15.00, 2, 'new', false, true, 0.00, 0, '2026-03-17 22:07:28.297299', '2026-03-17 22:07:28.297299');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (37, 32, 1, 'Mayn Water Kettle 5L', 'Boil water quickly and safely with this electric kettle. Featuring fast heating and an easy-pour design, it’s ideal for tea, coffee, and everyday use.', 22.00, 2, 'new', false, true, 0.00, 0, '2026-03-23 20:21:17.166421', '2026-03-23 20:21:17.166421');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (45, 31, 4, 'BYTIU Yellow Reading Sofa', 'Comfortable chair that can be place in the living room, your room or the patio', 60.00, 11, 'new', false, true, 0.00, 0, '2026-03-24 08:40:17.147195', '2026-03-24 08:40:17.147195');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (50, 29, 1, 'Iphone', '', 400.00, 9, 'new', false, false, 0.00, 0, '2026-03-24 12:10:31.046816', '2026-03-24 12:18:05.541433');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (51, 41, 6, 'Electronic Appliance', 'I no longer need it....trying to declutter my apartment', 50.00, 10, 'used', false, false, 0.00, 0, '2026-04-02 14:21:03.153653', '2026-04-02 14:46:53.314899');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (47, 31, 4, 'Fake Cactus Plant Pot', 'Mini decors for you side table, shelves, work station', 5.00, 6, 'used', false, true, 0.00, 0, '2026-03-24 08:49:12.581735', '2026-03-24 08:49:12.581735');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (49, 31, 6, 'Kid''s building blocks', 'Imaginative and Cptivating toys for kids', 20.00, 78, 'new', false, true, 4.00, 1, '2026-03-24 08:55:05.535357', '2026-03-24 08:55:05.535357');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (52, 42, 6, 'Lego Car', 'Perfectly in mint condition....my child has outgrown it', 25.00, 20, 'new', false, true, 0.00, 0, '2026-04-22 09:50:33.392916', '2026-04-22 09:50:33.392916');
INSERT INTO public.listings (id, seller_id, category_id, title, description, price, quantity, condition, is_anonymous, is_active, average_rating, review_count, created_at, updated_at) VALUES (48, 31, 4, 'Fancy Watering Kettle', 'Classy watering kettle that could be used to decorate the home', 25.00, 0, 'new', false, false, 0.00, 0, '2026-03-24 08:51:28.528189', '2026-03-24 08:51:28.528189');


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.order_items (id, order_id, listing_id, seller_id, title_snapshot, price_snapshot, quantity, subtotal, created_at) VALUES (1, 1, 3, 1, 'Nike Air Max 90 Size 10', 95.00, 1, 95.00, '2026-03-18 18:11:41.472059');
INSERT INTO public.order_items (id, order_id, listing_id, seller_id, title_snapshot, price_snapshot, quantity, subtotal, created_at) VALUES (2, 1, 6, 1, 'iPad Pro 11" 2022 256GB', 620.00, 1, 620.00, '2026-03-18 18:11:41.472059');
INSERT INTO public.order_items (id, order_id, listing_id, seller_id, title_snapshot, price_snapshot, quantity, subtotal, created_at) VALUES (3, 1, 8, 25, 'Sealed nectar', 20.00, 1, 20.00, '2026-03-18 18:11:41.472059');
INSERT INTO public.order_items (id, order_id, listing_id, seller_id, title_snapshot, price_snapshot, quantity, subtotal, created_at) VALUES (4, 1, 10, 25, 'Marc Jacobs Tote Bag', 150.00, 1, 150.00, '2026-03-18 18:11:41.472059');
INSERT INTO public.order_items (id, order_id, listing_id, seller_id, title_snapshot, price_snapshot, quantity, subtotal, created_at) VALUES (5, 2, 9, 25, 'Bicycle', 345.00, 1, 345.00, '2026-03-18 18:37:55.712093');
INSERT INTO public.order_items (id, order_id, listing_id, seller_id, title_snapshot, price_snapshot, quantity, subtotal, created_at) VALUES (6, 3, 1, 1, 'iPhone 13 128GB', 450.00, 1, 450.00, '2026-03-19 13:43:27.371428');
INSERT INTO public.order_items (id, order_id, listing_id, seller_id, title_snapshot, price_snapshot, quantity, subtotal, created_at) VALUES (7, 3, 5, 1, 'IKEA KALLAX Shelf', 60.00, 1, 60.00, '2026-03-19 13:43:27.371428');
INSERT INTO public.order_items (id, order_id, listing_id, seller_id, title_snapshot, price_snapshot, quantity, subtotal, created_at) VALUES (8, 4, 12, 25, 'Brown and White Table Lamp', 60.00, 1, 60.00, '2026-03-21 11:09:36.643545');
INSERT INTO public.order_items (id, order_id, listing_id, seller_id, title_snapshot, price_snapshot, quantity, subtotal, created_at) VALUES (9, 5, 12, 25, 'Brown and White Table Lamp', 60.00, 2, 120.00, '2026-03-21 14:45:01.494038');
INSERT INTO public.order_items (id, order_id, listing_id, seller_id, title_snapshot, price_snapshot, quantity, subtotal, created_at) VALUES (10, 6, 11, 25, 'Haul Armchair grey color', 119.99, 1, 119.99, '2026-03-23 15:08:34.904194');
INSERT INTO public.order_items (id, order_id, listing_id, seller_id, title_snapshot, price_snapshot, quantity, subtotal, created_at) VALUES (11, 6, 12, 25, 'Brown and White Table Lamp', 60.00, 1, 60.00, '2026-03-23 15:08:34.904194');
INSERT INTO public.order_items (id, order_id, listing_id, seller_id, title_snapshot, price_snapshot, quantity, subtotal, created_at) VALUES (12, 7, 12, 25, 'Brown and White Table Lamp', 60.00, 3, 180.00, '2026-03-23 15:51:00.094483');
INSERT INTO public.order_items (id, order_id, listing_id, seller_id, title_snapshot, price_snapshot, quantity, subtotal, created_at) VALUES (13, 8, 11, 25, 'Haul Armchair grey color', 119.99, 3, 359.97, '2026-03-23 15:57:54.878849');
INSERT INTO public.order_items (id, order_id, listing_id, seller_id, title_snapshot, price_snapshot, quantity, subtotal, created_at) VALUES (14, 9, 12, 25, 'Brown and White Table Lamp', 60.00, 2, 120.00, '2026-03-23 18:22:23.898438');
INSERT INTO public.order_items (id, order_id, listing_id, seller_id, title_snapshot, price_snapshot, quantity, subtotal, created_at) VALUES (15, 10, 12, 25, 'Brown and White Table Lamp', 60.00, 1, 60.00, '2026-03-23 18:24:39.064459');
INSERT INTO public.order_items (id, order_id, listing_id, seller_id, title_snapshot, price_snapshot, quantity, subtotal, created_at) VALUES (16, 11, 7, 25, 'Samsung s21 ultra', 400.00, 1, 400.00, '2026-03-23 18:42:24.944466');
INSERT INTO public.order_items (id, order_id, listing_id, seller_id, title_snapshot, price_snapshot, quantity, subtotal, created_at) VALUES (17, 12, 48, 31, 'Fancy Watering Kettle', 25.00, 1, 25.00, '2026-03-24 10:44:13.2419');
INSERT INTO public.order_items (id, order_id, listing_id, seller_id, title_snapshot, price_snapshot, quantity, subtotal, created_at) VALUES (18, 13, 45, 31, 'BYTIU Yellow Reading Sofa', 60.00, 3, 180.00, '2026-03-24 10:45:25.709622');
INSERT INTO public.order_items (id, order_id, listing_id, seller_id, title_snapshot, price_snapshot, quantity, subtotal, created_at) VALUES (19, 14, 4, 1, 'Clean Code by Robert Martin', 15.00, 1, 15.00, '2026-03-24 11:46:56.337887');
INSERT INTO public.order_items (id, order_id, listing_id, seller_id, title_snapshot, price_snapshot, quantity, subtotal, created_at) VALUES (20, 14, 37, 32, 'Mayn Water Kettle 5L', 22.00, 1, 22.00, '2026-03-24 11:46:56.337887');
INSERT INTO public.order_items (id, order_id, listing_id, seller_id, title_snapshot, price_snapshot, quantity, subtotal, created_at) VALUES (21, 14, 47, 31, 'Fake Cactus Plant Pot', 5.00, 1, 5.00, '2026-03-24 11:46:56.337887');
INSERT INTO public.order_items (id, order_id, listing_id, seller_id, title_snapshot, price_snapshot, quantity, subtotal, created_at) VALUES (22, 14, 48, 31, 'Fancy Watering Kettle', 25.00, 1, 25.00, '2026-03-24 11:46:56.337887');
INSERT INTO public.order_items (id, order_id, listing_id, seller_id, title_snapshot, price_snapshot, quantity, subtotal, created_at) VALUES (23, 14, 45, 31, 'BYTIU Yellow Reading Sofa', 60.00, 1, 60.00, '2026-03-24 11:46:56.337887');
INSERT INTO public.order_items (id, order_id, listing_id, seller_id, title_snapshot, price_snapshot, quantity, subtotal, created_at) VALUES (24, 15, 36, 32, 'Samsung Medium sized Oven', 45.00, 2, 90.00, '2026-03-24 12:06:43.163344');
INSERT INTO public.order_items (id, order_id, listing_id, seller_id, title_snapshot, price_snapshot, quantity, subtotal, created_at) VALUES (25, 16, 47, 31, 'Fake Cactus Plant Pot', 5.00, 2, 10.00, '2026-04-17 09:13:56.272193');
INSERT INTO public.order_items (id, order_id, listing_id, seller_id, title_snapshot, price_snapshot, quantity, subtotal, created_at) VALUES (26, 16, 48, 31, 'Fancy Watering Kettle', 25.00, 2, 50.00, '2026-04-17 09:13:56.272193');
INSERT INTO public.order_items (id, order_id, listing_id, seller_id, title_snapshot, price_snapshot, quantity, subtotal, created_at) VALUES (27, 17, 49, 31, 'Kid''s building blocks', 20.00, 1, 20.00, '2026-04-17 09:14:56.822489');
INSERT INTO public.order_items (id, order_id, listing_id, seller_id, title_snapshot, price_snapshot, quantity, subtotal, created_at) VALUES (28, 18, 48, 31, 'Fancy Watering Kettle', 25.00, 1, 25.00, '2026-04-20 22:45:51.307034');
INSERT INTO public.order_items (id, order_id, listing_id, seller_id, title_snapshot, price_snapshot, quantity, subtotal, created_at) VALUES (29, 19, 49, 31, 'Kid''s building blocks', 20.00, 1, 20.00, '2026-04-21 14:20:24.019986');
INSERT INTO public.order_items (id, order_id, listing_id, seller_id, title_snapshot, price_snapshot, quantity, subtotal, created_at) VALUES (30, 20, 48, 31, 'Fancy Watering Kettle', 25.00, 1, 25.00, '2026-04-24 14:13:39.169434');


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.orders (id, buyer_id, shipping_address_id, item_cost, shipping_cost, discount_applied, discount_amount, total_price, stripe_payment_intent_id, stripe_charge_id, status, created_at, updated_at) VALUES (3, 25, NULL, 510.00, 0.00, false, 0.00, 510.00, 'pi_3TCgqyBk0USlXSra1gsFOpea', NULL, 'cancelled', '2026-03-19 13:43:27.371428', '2026-03-19 13:43:27.371428');
INSERT INTO public.orders (id, buyer_id, shipping_address_id, item_cost, shipping_cost, discount_applied, discount_amount, total_price, stripe_payment_intent_id, stripe_charge_id, status, created_at, updated_at) VALUES (2, 29, NULL, 345.00, 0.00, false, 0.00, 345.00, 'pi_3TCOySBk0USlXSra1ilFBFim', NULL, 'refunded', '2026-03-18 18:37:55.712093', '2026-03-18 18:37:55.712093');
INSERT INTO public.orders (id, buyer_id, shipping_address_id, item_cost, shipping_cost, discount_applied, discount_amount, total_price, stripe_payment_intent_id, stripe_charge_id, status, created_at, updated_at) VALUES (5, 29, NULL, 120.00, 0.00, false, 0.00, 120.00, 'pi_3TDQljBk0USlXSra1eiMBXGe', NULL, 'processing', '2026-03-21 14:45:01.494038', '2026-03-21 14:45:01.494038');
INSERT INTO public.orders (id, buyer_id, shipping_address_id, item_cost, shipping_cost, discount_applied, discount_amount, total_price, stripe_payment_intent_id, stripe_charge_id, status, created_at, updated_at) VALUES (1, 29, NULL, 885.00, 0.00, false, 0.00, 885.00, 'pi_3TCOZ1Bk0USlXSra1NfhC3Uz', NULL, 'shipped', '2026-03-18 18:11:41.472059', '2026-03-18 18:11:41.472059');
INSERT INTO public.orders (id, buyer_id, shipping_address_id, item_cost, shipping_cost, discount_applied, discount_amount, total_price, stripe_payment_intent_id, stripe_charge_id, status, created_at, updated_at) VALUES (4, 31, NULL, 60.00, 0.00, false, 0.00, 60.00, 'pi_3TDNOvBk0USlXSra0BaMcSUc', NULL, 'shipped', '2026-03-21 11:09:36.643545', '2026-03-21 11:09:36.643545');
INSERT INTO public.orders (id, buyer_id, shipping_address_id, item_cost, shipping_cost, discount_applied, discount_amount, total_price, stripe_payment_intent_id, stripe_charge_id, status, created_at, updated_at) VALUES (6, 29, NULL, 179.99, 0.00, false, 0.00, 179.99, 'pi_3TEA5fBk0USlXSra1GE9di5b', NULL, 'refunded', '2026-03-23 15:08:34.904194', '2026-03-23 15:08:34.904194');
INSERT INTO public.orders (id, buyer_id, shipping_address_id, item_cost, shipping_cost, discount_applied, discount_amount, total_price, stripe_payment_intent_id, stripe_charge_id, status, created_at, updated_at) VALUES (7, 37, NULL, 180.00, 0.00, false, 0.00, 180.00, 'pi_3TEAkfBk0USlXSra1CIVPRp3', NULL, 'processing', '2026-03-23 15:51:00.094483', '2026-03-23 15:51:00.094483');
INSERT INTO public.orders (id, buyer_id, shipping_address_id, item_cost, shipping_cost, discount_applied, discount_amount, total_price, stripe_payment_intent_id, stripe_charge_id, status, created_at, updated_at) VALUES (8, 37, NULL, 359.97, 0.00, false, 0.00, 359.97, 'pi_3TEArGBk0USlXSra1GBsSVcD', NULL, 'processing', '2026-03-23 15:57:54.878849', '2026-03-23 15:57:54.878849');
INSERT INTO public.orders (id, buyer_id, shipping_address_id, item_cost, shipping_cost, discount_applied, discount_amount, total_price, stripe_payment_intent_id, stripe_charge_id, status, created_at, updated_at) VALUES (9, 38, NULL, 120.00, 0.00, false, 0.00, 120.00, 'pi_3TED66Bk0USlXSra1Dg026cv', NULL, 'processing', '2026-03-23 18:22:23.898438', '2026-03-23 18:22:23.898438');
INSERT INTO public.orders (id, buyer_id, shipping_address_id, item_cost, shipping_cost, discount_applied, discount_amount, total_price, stripe_payment_intent_id, stripe_charge_id, status, created_at, updated_at) VALUES (10, 38, NULL, 60.00, 0.00, false, 0.00, 60.00, 'pi_3TED9MBk0USlXSra0WRNwzcO', NULL, 'processing', '2026-03-23 18:24:39.064459', '2026-03-23 18:24:39.064459');
INSERT INTO public.orders (id, buyer_id, shipping_address_id, item_cost, shipping_cost, discount_applied, discount_amount, total_price, stripe_payment_intent_id, stripe_charge_id, status, created_at, updated_at) VALUES (11, 39, NULL, 400.00, 0.00, false, 0.00, 400.00, 'pi_3TEDQYBk0USlXSra1Wb4N1wI', NULL, 'processing', '2026-03-23 18:42:24.944466', '2026-03-23 18:42:24.944466');
INSERT INTO public.orders (id, buyer_id, shipping_address_id, item_cost, shipping_cost, discount_applied, discount_amount, total_price, stripe_payment_intent_id, stripe_charge_id, status, created_at, updated_at) VALUES (12, 29, NULL, 25.00, 0.00, false, 0.00, 25.00, 'pi_3TESRMBk0USlXSra0fSEODJp', NULL, 'processing', '2026-03-24 10:44:13.2419', '2026-03-24 10:44:13.2419');
INSERT INTO public.orders (id, buyer_id, shipping_address_id, item_cost, shipping_cost, discount_applied, discount_amount, total_price, stripe_payment_intent_id, stripe_charge_id, status, created_at, updated_at) VALUES (13, 29, NULL, 180.00, 0.00, false, 0.00, 180.00, 'pi_3TESSYBk0USlXSra013Bn18S', NULL, 'processing', '2026-03-24 10:45:25.709622', '2026-03-24 10:45:25.709622');
INSERT INTO public.orders (id, buyer_id, shipping_address_id, item_cost, shipping_cost, discount_applied, discount_amount, total_price, stripe_payment_intent_id, stripe_charge_id, status, created_at, updated_at) VALUES (14, 29, NULL, 127.00, 0.00, false, 0.00, 127.00, 'pi_3TETQ1Bk0USlXSra1Dl9TmEk', NULL, 'processing', '2026-03-24 11:46:56.337887', '2026-03-24 11:46:56.337887');
INSERT INTO public.orders (id, buyer_id, shipping_address_id, item_cost, shipping_cost, discount_applied, discount_amount, total_price, stripe_payment_intent_id, stripe_charge_id, status, created_at, updated_at) VALUES (15, 29, NULL, 90.00, 0.00, false, 0.00, 90.00, 'pi_3TETivBk0USlXSra1p0TARQ1', NULL, 'processing', '2026-03-24 12:06:43.163344', '2026-03-24 12:06:43.163344');
INSERT INTO public.orders (id, buyer_id, shipping_address_id, item_cost, shipping_cost, discount_applied, discount_amount, total_price, stripe_payment_intent_id, stripe_charge_id, status, created_at, updated_at) VALUES (16, 39, NULL, 60.00, 0.00, false, 0.00, 60.00, 'pi_3TN7X0Bk0USlXSra0sgv6AjR', NULL, 'processing', '2026-04-17 09:13:56.272193', '2026-04-17 09:13:56.272193');
INSERT INTO public.orders (id, buyer_id, shipping_address_id, item_cost, shipping_cost, discount_applied, discount_amount, total_price, stripe_payment_intent_id, stripe_charge_id, status, created_at, updated_at) VALUES (17, 39, NULL, 20.00, 0.00, false, 0.00, 20.00, 'pi_3TN7XzBk0USlXSra1WZSFCqL', NULL, 'processing', '2026-04-17 09:14:56.822489', '2026-04-17 09:14:56.822489');
INSERT INTO public.orders (id, buyer_id, shipping_address_id, item_cost, shipping_cost, discount_applied, discount_amount, total_price, stripe_payment_intent_id, stripe_charge_id, status, created_at, updated_at) VALUES (18, 39, NULL, 25.00, 0.00, false, 0.00, 25.00, 'pi_3TOPdLBk0USlXSra1yfToIFd', NULL, 'processing', '2026-04-20 22:45:51.307034', '2026-04-20 22:45:51.307034');
INSERT INTO public.orders (id, buyer_id, shipping_address_id, item_cost, shipping_cost, discount_applied, discount_amount, total_price, stripe_payment_intent_id, stripe_charge_id, status, created_at, updated_at) VALUES (19, 42, NULL, 20.00, 0.00, false, 0.00, 20.00, 'pi_3TOeDVBk0USlXSra1RtozXV9', NULL, 'processing', '2026-04-21 14:20:24.019986', '2026-04-21 14:20:24.019986');
INSERT INTO public.orders (id, buyer_id, shipping_address_id, item_cost, shipping_cost, discount_applied, discount_amount, total_price, stripe_payment_intent_id, stripe_charge_id, status, created_at, updated_at) VALUES (20, 42, NULL, 25.00, 0.00, false, 0.00, 25.00, 'pi_3TPjXcBk0USlXSra0x3cZbqO', NULL, 'processing', '2026-04-24 14:13:39.169434', '2026-04-24 14:13:39.169434');


--
-- Data for Name: post_likes; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.reviews (id, listing_id, user_id, rating, content, created_at, updated_at) VALUES (1, 49, 42, 4.0, 'This review is new
', '2026-04-21 14:36:09.491807', '2026-04-21 14:36:09.491807');


--
-- Data for Name: shipping_addresses; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: user_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.user_profiles (user_id, profile_picture, bio, website_url, location, updated_at) VALUES (25, NULL, NULL, NULL, NULL, '2026-03-08 14:23:38.174656');
INSERT INTO public.user_profiles (user_id, profile_picture, bio, website_url, location, updated_at) VALUES (26, NULL, NULL, NULL, NULL, '2026-03-10 12:06:46.474243');
INSERT INTO public.user_profiles (user_id, profile_picture, bio, website_url, location, updated_at) VALUES (27, NULL, NULL, NULL, NULL, '2026-03-12 17:09:29.183299');
INSERT INTO public.user_profiles (user_id, profile_picture, bio, website_url, location, updated_at) VALUES (29, NULL, NULL, NULL, NULL, '2026-03-18 17:08:01.592314');
INSERT INTO public.user_profiles (user_id, profile_picture, bio, website_url, location, updated_at) VALUES (30, NULL, NULL, NULL, NULL, '2026-03-19 16:47:22.821169');
INSERT INTO public.user_profiles (user_id, profile_picture, bio, website_url, location, updated_at) VALUES (31, NULL, NULL, NULL, NULL, '2026-03-21 11:00:12.242424');
INSERT INTO public.user_profiles (user_id, profile_picture, bio, website_url, location, updated_at) VALUES (32, NULL, NULL, NULL, NULL, '2026-03-22 22:19:56.162869');
INSERT INTO public.user_profiles (user_id, profile_picture, bio, website_url, location, updated_at) VALUES (34, NULL, NULL, NULL, NULL, '2026-03-22 22:21:35.88566');
INSERT INTO public.user_profiles (user_id, profile_picture, bio, website_url, location, updated_at) VALUES (37, NULL, NULL, NULL, NULL, '2026-03-23 15:50:02.005364');
INSERT INTO public.user_profiles (user_id, profile_picture, bio, website_url, location, updated_at) VALUES (38, NULL, NULL, NULL, NULL, '2026-03-23 18:17:11.239191');
INSERT INTO public.user_profiles (user_id, profile_picture, bio, website_url, location, updated_at) VALUES (39, NULL, NULL, NULL, NULL, '2026-03-23 18:38:22.130474');
INSERT INTO public.user_profiles (user_id, profile_picture, bio, website_url, location, updated_at) VALUES (40, NULL, NULL, NULL, NULL, '2026-03-30 16:01:40.292033');
INSERT INTO public.user_profiles (user_id, profile_picture, bio, website_url, location, updated_at) VALUES (41, NULL, NULL, NULL, NULL, '2026-04-02 14:18:29.792032');
INSERT INTO public.user_profiles (user_id, profile_picture, bio, website_url, location, updated_at) VALUES (42, NULL, NULL, NULL, NULL, '2026-04-21 11:59:50.072444');


--
-- Data for Name: user_reputation; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.user_reputation (user_id, reputation_score, total_sales, is_verified_seller, verification_date, created_at) VALUES (25, 0, 0, false, NULL, '2026-03-17 22:09:52.688775');
INSERT INTO public.user_reputation (user_id, reputation_score, total_sales, is_verified_seller, verification_date, created_at) VALUES (32, 0, 0, false, NULL, '2026-03-22 22:31:36.271764');
INSERT INTO public.user_reputation (user_id, reputation_score, total_sales, is_verified_seller, verification_date, created_at) VALUES (29, 0, 0, false, NULL, '2026-03-23 15:04:57.22771');
INSERT INTO public.user_reputation (user_id, reputation_score, total_sales, is_verified_seller, verification_date, created_at) VALUES (38, 0, 0, false, NULL, '2026-03-23 18:26:34.150375');
INSERT INTO public.user_reputation (user_id, reputation_score, total_sales, is_verified_seller, verification_date, created_at) VALUES (39, 0, 0, false, NULL, '2026-03-23 18:41:39.906827');
INSERT INTO public.user_reputation (user_id, reputation_score, total_sales, is_verified_seller, verification_date, created_at) VALUES (31, 0, 0, false, NULL, '2026-03-24 08:40:17.158686');
INSERT INTO public.user_reputation (user_id, reputation_score, total_sales, is_verified_seller, verification_date, created_at) VALUES (41, 0, 0, false, NULL, '2026-04-02 14:21:03.165696');
INSERT INTO public.user_reputation (user_id, reputation_score, total_sales, is_verified_seller, verification_date, created_at) VALUES (42, 0, 0, false, NULL, '2026-04-22 09:50:33.415537');


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.users (id, email, password_hash, role, created_at, username, is_verified, is_banned) VALUES (1, 'maryam@test.com', '$2b$10$C3LjKQdW9PPZ8xf0A41uhOUDAndqtN7Pu8DlC3poMwTWlyR0ySjku', 'user', '2026-02-06 14:15:15.956312', 'user_1', false, false);
INSERT INTO public.users (id, email, password_hash, role, created_at, username, is_verified, is_banned) VALUES (42, 'newuser@gmail.com', '$2b$12$QJ6aST0stXTSjg2sQ8ZBme1NOAQ7SgvgHgN0Z3awo8IU0FEmsGka6', 'user', '2026-04-21 11:59:50.052624', 'newUser', false, false);
INSERT INTO public.users (id, email, password_hash, role, created_at, username, is_verified, is_banned) VALUES (3, 'maryam.test@example.com', '$2b$10$eXfnAEcYF1N0plWpxt2ix.DV8VjlMBMnvGhJPdSC0DwvQxacDzRRm', 'user', '2026-02-08 10:14:44.367552', 'maryam', false, false);
INSERT INTO public.users (id, email, password_hash, role, created_at, username, is_verified, is_banned) VALUES (6, 'matezbj@12345', '$2b$10$QtbyHbOiwXB1PqXVXrfm5uKwx1TZpyQgMaTjcgMosNpAMlU3VrFPm', 'user', '2026-02-08 10:16:13.434085', 'banjo', false, false);
INSERT INTO public.users (id, email, password_hash, role, created_at, username, is_verified, is_banned) VALUES (7, 'fathia@test.com', '$2b$10$PbGbwkE1D2IO3NpTcvUIROoVB8lEkbBK8FOsJAiAq30687vv7X7n6', 'user', '2026-02-08 10:17:06.814047', 'Asake', false, false);
INSERT INTO public.users (id, email, password_hash, role, created_at, username, is_verified, is_banned) VALUES (8, 'newuser@example.com', '$2b$10$pDgVQQyo6igmus2Taj8PYOBMQEMkr7XYJwdGDBeF3K1equYJ0GhyW', 'user', '2026-02-08 10:23:50.602299', 'newuser', false, false);
INSERT INTO public.users (id, email, password_hash, role, created_at, username, is_verified, is_banned) VALUES (10, 'admin@eventhub.com', '$2b$10$bnP0zMIPvzzG2p5nBQLfn.gimdKF.zoHkyaWPFRML.4n0zJsnRJLy', 'admin', '2026-02-08 11:15:20.858821', 'admin', false, false);
INSERT INTO public.users (id, email, password_hash, role, created_at, username, is_verified, is_banned) VALUES (11, 'maryama@eventhub.com', '$2b$10$scutImYyy3szhipISARlyOOpikkKUJfTCMaL5zri/G.ZiT2vxvnfa', 'user', '2026-02-09 08:05:41.215454', 'Maryamatez', false, false);
INSERT INTO public.users (id, email, password_hash, role, created_at, username, is_verified, is_banned) VALUES (13, 'michelle@m.com', '$2b$10$y0ybcaoT4vGnVNjsLc0C7efLcJB4Ff1137d4Hx.6fWRNCIN/V7ZKK', 'user', '2026-02-09 10:10:12.157743', 'michelle@m.com', false, false);
INSERT INTO public.users (id, email, password_hash, role, created_at, username, is_verified, is_banned) VALUES (14, 'maryam3.test@example.com', '$2b$10$EpKk/7rta1Liq2qJOgJ2A.YKirOPK500Chj04Op4Fon0arUVPuxP2', 'user', '2026-02-09 10:47:21.999403', 'newuser2', false, false);
INSERT INTO public.users (id, email, password_hash, role, created_at, username, is_verified, is_banned) VALUES (19, 'maryam8.testexample.com', '$2b$10$qlZcNnFuX4ryb499drO0suyKUadYT6ZmAr7hYMttpDSdT.Hj7CuxW', 'user', '2026-02-09 10:48:38.375514', 'newuser6', false, false);
INSERT INTO public.users (id, email, password_hash, role, created_at, username, is_verified, is_banned) VALUES (21, 'matezbj@gmail.com', '$2b$12$LGvDpRO4L6U.i28ZbbxnT.CkdyOJnJaKSoAqw0AXq4nnuvylBXcGO', 'user', '2026-03-08 13:47:06.462322', 'maryama', false, false);
INSERT INTO public.users (id, email, password_hash, role, created_at, username, is_verified, is_banned) VALUES (25, 'maryam@gmail.com', '$2b$12$9rPc9rSOsI6lBTMRkHCP.uzdKmwBOCxtxqO0TYznwQ6F1SivSqCFW', 'user', '2026-03-08 14:23:38.171341', 'asabi', false, false);
INSERT INTO public.users (id, email, password_hash, role, created_at, username, is_verified, is_banned) VALUES (26, 'john@gmail.com', '$2b$12$GUpftXXRfUL7R7j8VLXnveAbqCYvfO7SdXebP4UnHu3Id1crgA89e', 'user', '2026-03-10 12:06:46.463809', 'John', false, false);
INSERT INTO public.users (id, email, password_hash, role, created_at, username, is_verified, is_banned) VALUES (27, 'testuser@gmail.com', '$2b$12$.EshFKDXLC/ivj/cMn.ml.snVSRQTj.UqX5fGOL5HSuqxStAR7bFm', 'user', '2026-03-12 17:09:29.163626', 'testuser', false, false);
INSERT INTO public.users (id, email, password_hash, role, created_at, username, is_verified, is_banned) VALUES (29, 'buyer@test.com', '$2b$12$oAYn4s0j6N0laTAgl.KQWOX9wSqm5oEclvc2yQSBlEmqeFTkyTba6', 'user', '2026-03-18 17:08:01.587003', 'testbuyer', false, false);
INSERT INTO public.users (id, email, password_hash, role, created_at, username, is_verified, is_banned) VALUES (30, 'admin@haul.co', '$2b$12$DQZM83p39Bdva.c5yRKNmes7AHZ01vFaFaNjXGC68Xy6P4AuAAWF.', 'Admin', '2026-03-19 16:47:22.815267', 'Admin', false, false);
INSERT INTO public.users (id, email, password_hash, role, created_at, username, is_verified, is_banned) VALUES (31, 'admin2@haul.co', '$2b$12$ZiaBq/B9EJx90fEH91wupOhc3lmaM0mmSyMX04YqmHcn2M3b/3FP6', 'admin', '2026-03-21 11:00:12.23078', 'Admin2', false, false);
INSERT INTO public.users (id, email, password_hash, role, created_at, username, is_verified, is_banned) VALUES (32, 'soffy@haul.co', '$2b$12$Fk0WZXq6MIJvSS.dPXthgO3MZVteNAVSCZ.WXyQ.7GZR.zFrTKfjO', 'user', '2026-03-22 22:19:56.139245', 'soffy', false, false);
INSERT INTO public.users (id, email, password_hash, role, created_at, username, is_verified, is_banned) VALUES (34, 'soffy@haul.com', '$2b$12$Zns6w37pU6Yst5S6SgYn.u3sDlkvYhtSJzBin4FAfv13tpKEWELx2', 'user', '2026-03-22 22:21:35.882534', 'soffyv2', false, false);
INSERT INTO public.users (id, email, password_hash, role, created_at, username, is_verified, is_banned) VALUES (2, 'maryam@test1.com', '$2b$10$7npSUwP.9L7XYRmJhyrVu..X3wTPHWRvBUIOzqNkua2.ZX0srdisG', 'admin', '2026-02-06 23:07:33.391355', 'user_2', false, false);
INSERT INTO public.users (id, email, password_hash, role, created_at, username, is_verified, is_banned) VALUES (12, 'Elliot@gmail.com', '$2b$10$1KcMZORUF5bVCtBi5Xivd.MvHTm629qfkrMyx3gzV8vaUV8Yhye7K', 'user', '2026-02-09 09:54:21.515649', 'Elliot', false, false);
INSERT INTO public.users (id, email, password_hash, role, created_at, username, is_verified, is_banned) VALUES (37, 'demo2@haul.co', '$2b$12$xL8XE92xZnwnXgUtT5r/Ue6fR76geKcF2LgJvMWoaoCUWrUkodEN6', 'user', '2026-03-23 15:50:02.002667', 'demo2', false, false);
INSERT INTO public.users (id, email, password_hash, role, created_at, username, is_verified, is_banned) VALUES (38, 'oreadebiyi@gmail.com', '$2b$12$DQ1AqFdQpAawJ2hqgatooOBShKUpVhQKiIUa3Mezo/1MASUjU8IeO', 'user', '2026-03-23 18:17:11.235347', 'oreadebiyi', false, false);
INSERT INTO public.users (id, email, password_hash, role, created_at, username, is_verified, is_banned) VALUES (39, 'sharonoduwole@gmail.com', '$2b$12$ZwJCR5COjkaAwVNO2nV.V.JpY9H8tYuxbKQPudcg36UhnrnAXat.a', 'user', '2026-03-23 18:38:22.1247', 'Sharon', false, false);
INSERT INTO public.users (id, email, password_hash, role, created_at, username, is_verified, is_banned) VALUES (40, 'lahbey@haul.co', '$2b$12$HXUs1btrEPsnZqw95zuI8e45kvKLG21WlyMoBmICnRiJFu6wAtvH6', 'user', '2026-03-30 16:01:40.283477', 'Lahbey', false, false);
INSERT INTO public.users (id, email, password_hash, role, created_at, username, is_verified, is_banned) VALUES (41, 'duke@haul.co', '$2b$12$mDAS5ruODjWIuldtjG2kheuMCfy.ih1WYYue3GBzTMd00VTjElNVe', 'user', '2026-04-02 14:18:29.786485', 'Duke', false, false);


--
-- Data for Name: wishlist; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Name: carts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.carts_id_seq', 49, true);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 8, true);


--
-- Name: comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.comments_id_seq', 1, false);


--
-- Name: listing_images_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.listing_images_id_seq', 37, true);


--
-- Name: listings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.listings_id_seq', 52, true);


--
-- Name: order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_items_id_seq', 30, true);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orders_id_seq', 20, true);


--
-- Name: posts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.posts_id_seq', 1, false);


--
-- Name: reports_report_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reports_report_id_seq', 1, false);


--
-- Name: reviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reviews_id_seq', 1, true);


--
-- Name: shipping_addresses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.shipping_addresses_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 42, true);


--
-- Name: blocked_users blocked_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blocked_users
    ADD CONSTRAINT blocked_users_pkey PRIMARY KEY (blocker_id, blocked_id);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (cart_id, listing_id);


--
-- Name: carts carts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_pkey PRIMARY KEY (id);


--
-- Name: carts carts_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key UNIQUE (user_id);


--
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: followers followers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.followers
    ADD CONSTRAINT followers_pkey PRIMARY KEY (follower_id, following_id);


--
-- Name: listing_images listing_images_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.listing_images
    ADD CONSTRAINT listing_images_pkey PRIMARY KEY (id);


--
-- Name: listings listings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.listings
    ADD CONSTRAINT listings_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: post_likes post_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_pkey PRIMARY KEY (post_id, user_id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (report_id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: shipping_addresses shipping_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipping_addresses
    ADD CONSTRAINT shipping_addresses_pkey PRIMARY KEY (id);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (user_id);


--
-- Name: user_reputation user_reputation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_reputation
    ADD CONSTRAINT user_reputation_pkey PRIMARY KEY (user_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: wishlist wishlist_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wishlist
    ADD CONSTRAINT wishlist_pkey PRIMARY KEY (user_id, listing_id);


--
-- Name: idx_cart_items_listing; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cart_items_listing ON public.cart_items USING btree (listing_id);


--
-- Name: idx_listings_seller; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_listings_seller ON public.listings USING btree (seller_id);


--
-- Name: idx_order_items_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_items_order ON public.order_items USING btree (order_id);


--
-- Name: idx_orders_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_user ON public.orders USING btree (buyer_id);


--
-- Name: idx_wishlist_listing; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_wishlist_listing ON public.wishlist USING btree (listing_id);


--
-- Name: one_default_address_per_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX one_default_address_per_user ON public.shipping_addresses USING btree (user_id) WHERE (is_default = true);


--
-- Name: one_primary_image_per_listing; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX one_primary_image_per_listing ON public.listing_images USING btree (listing_id) WHERE (is_primary = true);


--
-- Name: one_review_per_user_per_listing; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX one_review_per_user_per_listing ON public.reviews USING btree (user_id, listing_id);


--
-- Name: reviews trigger_update_listing_rating; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_listing_rating AFTER INSERT OR DELETE OR UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_listing_rating();


--
-- Name: blocked_users blocked_users_blocked_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blocked_users
    ADD CONSTRAINT blocked_users_blocked_id_fkey FOREIGN KEY (blocked_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: blocked_users blocked_users_blocker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blocked_users
    ADD CONSTRAINT blocked_users_blocker_id_fkey FOREIGN KEY (blocker_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: cart_items cart_items_cart_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.carts(id) ON DELETE CASCADE;


--
-- Name: cart_items cart_items_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;


--
-- Name: carts carts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: categories categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: comments comments_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: comments comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: followers followers_follower_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.followers
    ADD CONSTRAINT followers_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: followers followers_following_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.followers
    ADD CONSTRAINT followers_following_id_fkey FOREIGN KEY (following_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: listing_images listing_images_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.listing_images
    ADD CONSTRAINT listing_images_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;


--
-- Name: listings listings_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.listings
    ADD CONSTRAINT listings_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE RESTRICT;


--
-- Name: listings listings_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.listings
    ADD CONSTRAINT listings_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id);


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id);


--
-- Name: orders orders_shipping_address_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_shipping_address_id_fkey FOREIGN KEY (shipping_address_id) REFERENCES public.shipping_addresses(id);


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: post_likes post_likes_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: post_likes post_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: posts posts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reports reports_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;


--
-- Name: reports reports_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: shipping_addresses shipping_addresses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipping_addresses
    ADD CONSTRAINT shipping_addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_profiles user_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_reputation user_reputation_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_reputation
    ADD CONSTRAINT user_reputation_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: wishlist wishlist_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wishlist
    ADD CONSTRAINT wishlist_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;


--
-- Name: wishlist wishlist_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wishlist
    ADD CONSTRAINT wishlist_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict oKoOEAipaTRvFedGIEa2KygmaWh5gmNpMdR2xN0Ua8PIA2R0NKiFm62ueNnRg3k

