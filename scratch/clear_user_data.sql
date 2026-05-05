-- Clear child tables to avoid FK constraint errors
DELETE FROM party_members;
DELETE FROM party_invitations;
DELETE FROM party_applications;
DELETE FROM state_council_seats;
DELETE FROM state_votes;

DELETE FROM election_ballots;
DELETE FROM election_candidates;
DELETE FROM state_elections;

DELETE FROM state_formation_ballots;
UPDATE body_governance SET status = 'neutral', empire_id = NULL, formation_referendum_id = NULL, election_end_time = NULL, last_election_at = NULL;
DELETE FROM state_formation_votes;

DELETE FROM ministerial_assignments;
DELETE FROM player_empires;
DELETE FROM empires;

DELETE FROM parties;

DELETE FROM article_comments;
DELETE FROM article_votes;
DELETE FROM articles;

DELETE FROM market_listings;
DELETE FROM factory_input_storage;
DELETE FROM factory_workers;
DELETE FROM factories WHERE is_npc_owned = false;
UPDATE factories SET jobs_available = COALESCE(max_jobs, 5), treasury = 0 WHERE is_npc_owned = true;
DELETE FROM user_resources;

DELETE FROM xp_logs;
DELETE FROM player_skills;
DELETE FROM user_logs;
DELETE FROM exploration_logs;
DELETE FROM residencies;
DELETE FROM residency_applications;

DELETE FROM fleet_positions;
DELETE FROM vessels;

UPDATE profiles SET credits = 15000, level = 1, xp = 0, cargo_capacity = 5000, onboarding_completed = false;
