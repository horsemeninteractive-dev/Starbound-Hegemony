-- SEEDING SANCTUM NPC FACTORIES AND RESOURCES
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-0-b0', 'Energy Crystals', 4000, 4000, 4, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-0-b0', 'Rare Earths', 4000, 4000, 4, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-0', 'sys-inner-0-b0', 'Energy Crystals Processing Plant', 'Energy Crystals', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-0-b1', 'Radiogenic Elements', 1000, 1000, 1, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-0', 'sys-inner-0-b1', 'Radiogenic Elements Processing Plant', 'Radiogenic Elements', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-0-b2', 'Exotic Technology', 5000, 5000, 5, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-0-b2', 'Rare Earths', 3000, 3000, 3, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-0', 'sys-inner-0-b2', 'Exotic Technology Processing Plant', 'Exotic Technology', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-0-b3', 'Helium-3', 1000, 1000, 1, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-0', 'sys-inner-0-b3', 'Helium-3 Processing Plant', 'Helium-3', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-0-b4', 'Exotic Matter', 4000, 4000, 4, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-0', 'sys-inner-0-b4', 'Exotic Matter Processing Plant', 'Exotic Matter', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-1-b0', 'Exotic Technology', 5000, 5000, 5, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-1-b0', 'Energy Crystals', 3000, 3000, 3, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-1', 'sys-inner-1-b0', 'Exotic Technology Processing Plant', 'Exotic Technology', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-1-b1', 'Ore', 4000, 4000, 4, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-1', 'sys-inner-1-b1', 'Ore Processing Plant', 'Ore', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-1-b2', 'Exotic Technology', 3000, 3000, 3, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-1', 'sys-inner-1-b2', 'Exotic Technology Processing Plant', 'Exotic Technology', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-1-b3', 'Ore', 5000, 5000, 5, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-1-b3', 'Silicates', 3000, 3000, 3, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-1', 'sys-inner-1-b3', 'Ore Processing Plant', 'Ore', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-1-b4', 'Exotic Matter', 4000, 4000, 4, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-1-b4', 'Hydrogen', 2000, 2000, 2, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-1-b4', 'Helium-3', 1000, 1000, 1, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-1', 'sys-inner-1-b4', 'Exotic Matter Processing Plant', 'Exotic Matter', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-1-b5', 'Helium-3', 2000, 2000, 2, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-1-b5', 'Radiogenic Elements', 2000, 2000, 2, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-1-b5', 'Solar Energy', 2000, 2000, 2, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-1', 'sys-inner-1-b5', 'Helium-3 Processing Plant', 'Helium-3', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-1-b6', 'Radiogenic Elements', 4000, 4000, 4, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-1-b6', 'Silicates', 3000, 3000, 3, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-1', 'sys-inner-1-b6', 'Radiogenic Elements Processing Plant', 'Radiogenic Elements', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-1-b7', 'Radiogenic Elements', 2000, 2000, 2, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-1', 'sys-inner-1-b7', 'Radiogenic Elements Processing Plant', 'Radiogenic Elements', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-1-b8', 'Energy Crystals', 1000, 1000, 1, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-1-b8', 'Rare Earths', 5000, 5000, 5, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-1', 'sys-inner-1-b8', 'Energy Crystals Processing Plant', 'Energy Crystals', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-2-b0', 'Exotic Technology', 4000, 4000, 4, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-2-b0', 'Organics', 3000, 3000, 3, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-2', 'sys-inner-2-b0', 'Exotic Technology Processing Plant', 'Exotic Technology', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-2-b1', 'Helium-3', 4000, 4000, 4, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-2-b1', 'Radiogenic Elements', 5000, 5000, 5, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-2', 'sys-inner-2-b1', 'Helium-3 Processing Plant', 'Helium-3', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-2-b2', 'Water Ice', 5000, 5000, 5, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-2-b2', 'Energy Crystals', 1000, 1000, 1, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-2-b2', 'Radiogenic Elements', 2000, 2000, 2, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-2', 'sys-inner-2-b2', 'Water Ice Processing Plant', 'Water Ice', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-2-b3', 'Solar Energy', 4000, 4000, 4, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-2', 'sys-inner-2-b3', 'Solar Energy Processing Plant', 'Solar Energy', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;