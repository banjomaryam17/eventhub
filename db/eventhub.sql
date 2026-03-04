CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    email           TEXT UNIQUE NOT NULL,
    username        TEXT UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    role            TEXT NOT NULL DEFAULT 'user'
                    CHECK (role IN ('user', 'admin')),
    is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE followers (
    follower_id     BIGINT NOT NULL,
    following_id    BIGINT NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, following_id),
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
    CHECK (follower_id <> following_id)
);
CREATE TABLE posts (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    content         TEXT,
    image_url       TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE comments (
    id              BIGSERIAL PRIMARY KEY,
    post_id         BIGINT NOT NULL,
    user_id         BIGINT NOT NULL,
    content         TEXT NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE post_likes (
    post_id         BIGINT NOT NULL,
    user_id         BIGINT NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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

CREATE TABLE reports (
    report_id       BIGSERIAL NOT NULL,
    post_id         BIGINT NOT NULL,
    user_id         BIGINT NOT NULL,
    resolved        BOOLEAN NOT NULL,
    PRIMARY KEY (report_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
    status              order_status_enum NOT NULL DEFAULT 'pending',
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shipping_address_id) REFERENCES shipping_addresses(id)
);
/* Calculate shipping in the backend, total_cost = item_cost + shipping_cost - discount_amount*/

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

CREATE TABLE listings (
    id              BIGSERIAL PRIMARY KEY,
    seller_id       BIGINT NOT NULL,
    title           TEXT NOT NULL,
    description     TEXT,
    price           NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    quantity        INTEGER NOT NULL CHECK (quantity >= 0),
    image_url       TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);

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

/* CREATE INDEX idx_listings_seller ON listings(seller_id);
CREATE INDEX idx_cart_items_listing ON cart_items(listing_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_orders_user ON orders(user_id); 

CREATE UNIQUE INDEX one_default_address_per_user
ON shipping_addresses(user_id)
WHERE is_default = TRUE;*/