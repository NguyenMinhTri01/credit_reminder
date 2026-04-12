-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR,
    google_id VARCHAR UNIQUE,
    zalo_id VARCHAR,
    full_name VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Credit Cards
CREATE TABLE credit_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    bank_name VARCHAR NOT NULL,
    card_name VARCHAR NOT NULL,
    card_number_masked VARCHAR(20),        -- chỉ lưu 4 số cuối
    credit_limit DECIMAL(15,2),
    current_balance DECIMAL(15,2) DEFAULT 0,
    statement_day INT,                     -- ngày chốt sao kê (1-31)
    due_day INT,                           -- ngày đến hạn thanh toán
    encrypted_data JSONB,                  -- lưu dữ liệu nhạy cảm đã mã hóa
    created_at TIMESTAMP DEFAULT NOW()
);

-- Transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID REFERENCES credit_cards(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    transaction_date DATE NOT NULL,
    description TEXT,
    merchant VARCHAR,
    source VARCHAR(20) DEFAULT 'manual',   -- manual | gmail
    raw_email_id VARCHAR,                  -- để trace
    created_at TIMESTAMP DEFAULT NOW()
);

-- Reminders
CREATE TABLE reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    title VARCHAR NOT NULL,
    amount DECIMAL(15,2),
    frequency VARCHAR(20),                 -- monthly, quarterly, one_time
    next_trigger_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    zalo_message_template TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Notification Logs
CREATE TABLE notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    type VARCHAR(30),                      -- card_due | reminder | system
    channel VARCHAR(20) DEFAULT 'zalo',
    message TEXT,
    sent_at TIMESTAMP,
    status VARCHAR(20)                     -- sent | failed | pending
);

-- Gmail Connections
CREATE TABLE gmail_connections (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP,
    last_sync_at TIMESTAMP
);
