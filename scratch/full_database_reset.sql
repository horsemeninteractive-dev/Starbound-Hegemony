-- Comprehensive Database Reset Script
-- Purges all user data, articles, parties, and resets NPC infrastructure

-- 1. Clear Social & Governance Data
DELETE FROM party_members;
DELETE FROM party_invitations;
DELETE FROM party_applications;
DELETE FROM parties;

DELETE FROM state_council_seats;
DELETE FROM state_votes;
DELETE FROM election_ballots;
DELETE FROM election_candidates;
DELETE FROM state_elections;

DELETE FROM state_formation_ballots;
DELETE FROM state_formation_votes;
UPDATE body_governance SET status = 'neutral', empire_id = NULL, formation_referendum_id = NULL, election_end_time = NULL, last_election_at = NULL;

DELETE FROM ministerial_assignments;
DELETE FROM player_empires;
DELETE FROM empires;

DELETE FROM article_comments;
DELETE FROM article_votes;
DELETE FROM articles;

-- 2. Clear Economic Data
DELETE FROM market_listings;
DELETE FROM factory_input_storage;
DELETE FROM factory_workers;
DELETE FROM factories; -- Wiping all to ensure clean re-seeding
DELETE FROM user_resources;
DELETE FROM body_resources; -- Wiping to re-seed correctly

-- 3. Clear Player Progression & Logs
DELETE FROM xp_logs;
DELETE FROM player_skills;
DELETE FROM user_logs;
DELETE FROM exploration_logs;
DELETE FROM residencies;
DELETE FROM residency_applications;
DELETE FROM friendships;

-- 4. Clear Fleet Data
DELETE FROM fleet_positions;
DELETE FROM vessels;

-- 5. Purge Profiles
DELETE FROM profiles;

-- 6. Reset NPC Market Prices
UPDATE npc_market_state SET current_price = base_price, last_updated = now();
