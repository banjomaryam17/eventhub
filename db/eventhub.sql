CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    email           TEXT UNIQUE NOT NULL,
    username        TEXT UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    role            TEXT NOT NULL DEFAULT 'user'
                    CHECK (role IN ('user', 'admin')),
    is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
    is_banned       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
    id              BIGSERIAL PRIMARY KEY,
    name            TEXT NOT NULL UNIQUE,
    slug            TEXT NOT NULL UNIQUE,
    parent_id       BIGINT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE listings (
    id              BIGSERIAL PRIMARY KEY,
    seller_id       BIGINT NOT NULL,
    category_id     BIGINT NOT NULL,
    title           TEXT NOT NULL,
    description     TEXT,
    price           NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    quantity        INTEGER NOT NULL CHECK (quantity >= 0),
    condition       TEXT NOT NULL DEFAULT 'used'
                    CHECK (condition IN ('new','used','refurbished')),
    is_anonymous    BOOLEAN NOT NULL DEFAULT FALSE,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    average_rating  NUMERIC(3,2) NOT NULL DEFAULT 0,
    review_count    INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

CREATE TABLE listing_images (
    id              BIGSERIAL PRIMARY KEY,
    listing_id      BIGINT NOT NULL,
    image_url       TEXT NOT NULL,
    is_primary      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
);

CREATE TABLE reviews (
    id              BIGSERIAL PRIMARY KEY,
    listing_id      BIGINT NOT NULL,
    user_id         BIGINT NOT NULL,
    rating          NUMERIC(2,1) NOT NULL,
    content         TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CHECK (
        rating >= 0 
        AND rating <= 5 
        AND rating * 2 = FLOOR(rating * 2)
    )
);


CREATE TABLE reports (
    report_id       BIGSERIAL PRIMARY KEY,
    listing_id      BIGINT NOT NULL,
    user_id         BIGINT NOT NULL,
    resolved        BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE shipping_addresses (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    full_name       TEXT NOT NULL,
    address_line1   TEXT NOT NULL,
    address_line2   TEXT,
    city            TEXT NOT NULL,
    state           TEXT NOT NULL,
    postal_code     TEXT NOT NULL,
    country         TEXT NOT NULL,
    is_default      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TYPE order_status_enum AS ENUM (
    'pending',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded'
);

CREATE TABLE orders (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL,
    shipping_address_id BIGINT NOT NULL,
    item_cost           NUMERIC(10,2) NOT NULL CHECK (item_cost >= 0),
    shipping_cost       NUMERIC(10,2) NOT NULL CHECK (shipping_cost >= 0),
    discount_applied    BOOLEAN NOT NULL DEFAULT FALSE,
    discount_amount     NUMERIC(10,2) DEFAULT 0 CHECK (discount_amount >= 0),
    total_cost          NUMERIC(10,2) NOT NULL CHECK (total_cost >= 0),
    stripe_payment_intent_id TEXT,
    stripe_charge_id         TEXT,
    status              order_status_enum NOT NULL DEFAULT 'pending',
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shipping_address_id) REFERENCES shipping_addresses(id)
);
/* Calculate shipping in the backend, total_cost = item_cost + shipping_cost - discount_amount*/

CREATE TABLE carts (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL UNIQUE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE cart_items (
    cart_id     BIGINT NOT NULL,
    listing_id  BIGINT NOT NULL,
    quantity    INTEGER NOT NULL CHECK (quantity > 0),
    added_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (cart_id, listing_id),
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
);

CREATE TABLE wishlist (
    user_id     BIGINT NOT NULL,
    listing_id  BIGINT NOT NULL,
    added_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, listing_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
);

CREATE TABLE order_items (
    id              BIGSERIAL PRIMARY KEY,
    order_id        BIGINT NOT NULL,
    listing_id      BIGINT NOT NULL,
    seller_id       BIGINT NOT NULL,
    title_snapshot  TEXT NOT NULL,
    price_snapshot  NUMERIC(10,2) NOT NULL CHECK (price_snapshot >= 0),
    quantity        INTEGER NOT NULL CHECK (quantity > 0),
    subtotal        NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (listing_id) REFERENCES listings(id),
    FOREIGN KEY (seller_id) REFERENCES users(id)
);


CREATE TABLE blocked_users (
    blocker_id   BIGINT NOT NULL,
    blocked_id   BIGINT NOT NULL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (blocker_id, blocked_id),
    FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE,
    CHECK (blocker_id <> blocked_id)
);

CREATE TABLE user_profiles (
    user_id         BIGINT PRIMARY KEY,
    profile_picture TEXT,
    bio             TEXT,
    website_url     TEXT,
    location        TEXT,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE user_reputation (
    user_id             BIGINT PRIMARY KEY,
    reputation_score    INTEGER NOT NULL DEFAULT 0 CHECK (reputation_score >= 0),
    total_sales         INTEGER NOT NULL DEFAULT 0 CHECK (total_sales >= 0),
    is_verified_seller  BOOLEAN NOT NULL DEFAULT FALSE,
    verification_date   TIMESTAMP,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
/* Calculate reputation score using average among sales, by default their score will be 100% if they have one good sale, any negative sale
removes from this precentage. Having 100 sales, 160 good and 40 bad will give you a score of 80% for example. Just calculate average in backend*/

CREATE INDEX idx_listings_seller ON listings(seller_id);
CREATE INDEX idx_cart_items_listing ON cart_items(listing_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_orders_user ON orders(user_id); 
CREATE INDEX idx_wishlist_listing ON wishlist(listing_id);

CREATE UNIQUE INDEX one_default_address_per_user
ON shipping_addresses(user_id)
WHERE is_default = TRUE;

CREATE UNIQUE INDEX one_review_per_user_per_listing
ON reviews(user_id, listing_id);

CREATE UNIQUE INDEX one_primary_image_per_listing
ON listing_images(listing_id)
WHERE is_primary = TRUE;

CREATE INDEX id_listings_category ON listings(category_id);

CREATE OR REPLACE FUNCTION update_listing_rating()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_listing_rating
AFTER INSERT OR UPDATE OR DELETE
ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_listing_rating();

/* Automatically update listings and orders */
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_listings_updated_at
BEFORE UPDATE ON listings
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trigger_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

/*Seed Data for category*/
INSERT INTO categories (name, slug) VALUES
    ('Electronics',   'electronics'),
    ('Clothing',      'clothing'),
    ('Books',         'books'),
    ('Home & Garden', 'home-garden'),
    ('Sports',        'sports'),
    ('Toys & Games',  'toys-games'),
    ('Vehicles',      'vehicles'),
    ('Other',         'other');