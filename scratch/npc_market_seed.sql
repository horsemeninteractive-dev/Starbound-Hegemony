-- scratch/npc_market_seed.sql
CREATE TABLE IF NOT EXISTS npc_market_state (
    resource_type text PRIMARY KEY,
    base_price numeric NOT NULL,
    current_price numeric NOT NULL,
    last_updated timestamp with time zone DEFAULT now()
);

-- Seed data for all resources
INSERT INTO npc_market_state (resource_type, base_price, current_price) VALUES
('Ore', 10, 10),
('Helium-3', 25, 25),
('Silicate', 15, 15),
('Water', 8, 8),
('Alloys', 45, 45),
('Polymers', 35, 35),
('Coolant', 50, 50),
('Plasma', 85, 85),
('Superconductors', 150, 150),
('Quantum Components', 350, 350),
('Dark Matter', 1200, 1200)
ON CONFLICT (resource_type) DO NOTHING;

-- RPC for buying from NPC
CREATE OR REPLACE FUNCTION buy_from_npc(
    p_buyer_id uuid,
    p_resource_type text,
    p_amount int,
    p_price_per_unit numeric
) RETURNS void AS $$
DECLARE
    v_total_cost numeric;
    v_user_credits numeric;
BEGIN
    v_total_cost := p_amount * p_price_per_unit;

    -- Check user balance
    SELECT credits INTO v_user_credits FROM profiles WHERE id = p_buyer_id;
    IF v_user_credits < v_total_cost THEN
        RAISE EXCEPTION 'Insufficient credits.';
    END IF;

    -- Deduct credits
    UPDATE profiles
    SET credits = credits - v_total_cost
    WHERE id = p_buyer_id;

    -- Add to user resources
    INSERT INTO user_resources (user_id, resource_type, amount)
    VALUES (p_buyer_id, p_resource_type, p_amount)
    ON CONFLICT (user_id, resource_type)
    DO UPDATE SET amount = user_resources.amount + p_amount;

    -- Adjust market state (increase price slightly due to demand)
    UPDATE npc_market_state
    SET current_price = current_price + (base_price * 0.001 * p_amount),
        last_updated = now()
    WHERE resource_type = p_resource_type;
END;
$$ LANGUAGE plpgsql;

-- Also update sell_to_npc RPC to adjust market state down
CREATE OR REPLACE FUNCTION sell_to_npc(
    p_user_id uuid,
    p_resource_type text,
    p_amount int,
    p_price_per_unit numeric
) RETURNS void AS $$
DECLARE
    v_total_revenue numeric;
    v_inventory int;
BEGIN
    v_total_revenue := p_amount * p_price_per_unit;

    -- Check inventory
    SELECT amount INTO v_inventory FROM user_resources
    WHERE user_id = p_user_id AND resource_type = p_resource_type;

    IF v_inventory IS NULL OR v_inventory < p_amount THEN
        RAISE EXCEPTION 'Insufficient resources in cargo.';
    END IF;

    -- Deduct resources
    UPDATE user_resources
    SET amount = amount - p_amount
    WHERE user_id = p_user_id AND resource_type = p_resource_type;

    -- Add credits
    UPDATE profiles
    SET credits = credits + v_total_revenue
    WHERE id = p_user_id;

    -- Adjust market state (decrease price slightly due to supply)
    UPDATE npc_market_state
    SET current_price = GREATEST(base_price * 0.5, current_price - (base_price * 0.001 * p_amount)),
        last_updated = now()
    WHERE resource_type = p_resource_type;
END;
$$ LANGUAGE plpgsql;
