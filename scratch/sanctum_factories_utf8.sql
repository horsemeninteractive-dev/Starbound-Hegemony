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
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-2-b4', 'Radiogenic Elements', 2000, 2000, 2, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-2-b4', 'Solar Energy', 5000, 5000, 5, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-2-b4', 'Exotic Matter', 3000, 3000, 3, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-2', 'sys-inner-2-b4', 'Radiogenic Elements Processing Plant', 'Radiogenic Elements', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-2-b5', 'Radiogenic Elements', 4000, 4000, 4, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-2', 'sys-inner-2-b5', 'Radiogenic Elements Processing Plant', 'Radiogenic Elements', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-3-b0', 'Silicates', 1000, 1000, 1, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-3-b0', 'Exotic Technology', 5000, 5000, 5, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-3', 'sys-inner-3-b0', 'Silicates Processing Plant', 'Silicates', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-3-b1', 'Rare Earths', 5000, 5000, 5, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-3', 'sys-inner-3-b1', 'Rare Earths Processing Plant', 'Rare Earths', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-3-b2', 'Ore', 2000, 2000, 2, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-3-b2', 'Radiogenic Elements', 5000, 5000, 5, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-3', 'sys-inner-3-b2', 'Ore Processing Plant', 'Ore', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-3-b3', 'Radiogenic Elements', 3000, 3000, 3, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-3', 'sys-inner-3-b3', 'Radiogenic Elements Processing Plant', 'Radiogenic Elements', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-3-b4', 'Energy Crystals', 2000, 2000, 2, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-3', 'sys-inner-3-b4', 'Energy Crystals Processing Plant', 'Energy Crystals', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-3-b5', 'Exotic Technology', 2000, 2000, 2, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-3', 'sys-inner-3-b5', 'Exotic Technology Processing Plant', 'Exotic Technology', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-4-b0', 'Ore', 4000, 4000, 4, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-4-b0', 'Exotic Technology', 3000, 3000, 3, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-4-b0', 'Radiogenic Elements', 3000, 3000, 3, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-4', 'sys-inner-4-b0', 'Ore Processing Plant', 'Ore', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-4-b1', 'Exotic Technology', 1000, 1000, 1, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-4-b1', 'Radiogenic Elements', 2000, 2000, 2, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-4', 'sys-inner-4-b1', 'Exotic Technology Processing Plant', 'Exotic Technology', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-4-b2', 'Rare Earths', 1000, 1000, 1, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-4', 'sys-inner-4-b2', 'Rare Earths Processing Plant', 'Rare Earths', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-4-b3', 'Helium-3', 2000, 2000, 2, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-4', 'sys-inner-4-b3', 'Helium-3 Processing Plant', 'Helium-3', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-4-b4', 'Exotic Matter', 5000, 5000, 5, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-4', 'sys-inner-4-b4', 'Exotic Matter Processing Plant', 'Exotic Matter', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-4-b5', 'Rare Earths', 1000, 1000, 1, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-4', 'sys-inner-4-b5', 'Rare Earths Processing Plant', 'Rare Earths', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-4-b6', 'Organics', 2000, 2000, 2, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-4', 'sys-inner-4-b6', 'Organics Processing Plant', 'Organics', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-5-b0', 'Energy Crystals', 3000, 3000, 3, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-5-b0', 'Rare Earths', 2000, 2000, 2, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-5-b0', 'Ore', 3000, 3000, 3, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-5', 'sys-inner-5-b0', 'Energy Crystals Processing Plant', 'Energy Crystals', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-5-b1', 'Exotic Technology', 2000, 2000, 2, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-5-b1', 'Radiogenic Elements', 4000, 4000, 4, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-5', 'sys-inner-5-b1', 'Exotic Technology Processing Plant', 'Exotic Technology', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-5-b2', 'Silicates', 4000, 4000, 4, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-5', 'sys-inner-5-b2', 'Silicates Processing Plant', 'Silicates', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-5-b3', 'Exotic Matter', 4000, 4000, 4, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-5', 'sys-inner-5-b3', 'Exotic Matter Processing Plant', 'Exotic Matter', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-5-b4', 'Ore', 4000, 4000, 4, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-5-b4', 'Water Ice', 1000, 1000, 1, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-5', 'sys-inner-5-b4', 'Ore Processing Plant', 'Ore', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-5-b5', 'Hydrogen', 2000, 2000, 2, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-5', 'sys-inner-5-b5', 'Hydrogen Processing Plant', 'Hydrogen', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-5-b6', 'Silicates', 5000, 5000, 5, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-5-b6', 'Exotic Technology', 3000, 3000, 3, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-5', 'sys-inner-5-b6', 'Silicates Processing Plant', 'Silicates', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-6-b0', 'Exotic Technology', 1000, 1000, 1, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-6-b0', 'Silicates', 5000, 5000, 5, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-6', 'sys-inner-6-b0', 'Exotic Technology Processing Plant', 'Exotic Technology', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-6-b1', 'Ore', 2000, 2000, 2, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-6-b1', 'Rare Earths', 4000, 4000, 4, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-6-b1', 'Radiogenic Elements', 2000, 2000, 2, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-6', 'sys-inner-6-b1', 'Ore Processing Plant', 'Ore', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-6-b2', 'Energy Crystals', 4000, 4000, 4, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-6', 'sys-inner-6-b2', 'Energy Crystals Processing Plant', 'Energy Crystals', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-6-b3', 'Exotic Matter', 1000, 1000, 1, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-6', 'sys-inner-6-b3', 'Exotic Matter Processing Plant', 'Exotic Matter', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-6-b4', 'Silicates', 1000, 1000, 1, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-6-b4', 'Energy Crystals', 4000, 4000, 4, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-6-b4', 'Rare Earths', 4000, 4000, 4, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-6', 'sys-inner-6-b4', 'Silicates Processing Plant', 'Silicates', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-6-b5', 'Solar Energy', 2000, 2000, 2, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-6-b5', 'Radiogenic Elements', 1000, 1000, 1, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-6-b5', 'Helium-3', 3000, 3000, 3, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-6', 'sys-inner-6-b5', 'Solar Energy Processing Plant', 'Solar Energy', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-6-b6', 'Solar Energy', 2000, 2000, 2, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-6-b6', 'Hydrogen', 3000, 3000, 3, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-6', 'sys-inner-6-b6', 'Solar Energy Processing Plant', 'Solar Energy', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-6-b7', 'Solar Energy', 4000, 4000, 4, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-6-b7', 'Radiogenic Elements', 5000, 5000, 5, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-6-b7', 'Hydrogen', 1000, 1000, 1, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-6', 'sys-inner-6-b7', 'Solar Energy Processing Plant', 'Solar Energy', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-7-b0', 'Radiogenic Elements', 2000, 2000, 2, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-7-b0', 'Ore', 3000, 3000, 3, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-7', 'sys-inner-7-b0', 'Radiogenic Elements Processing Plant', 'Radiogenic Elements', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-7-b1', 'Organics', 1000, 1000, 1, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-7-b1', 'Rare Earths', 1000, 1000, 1, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-7-b1', 'Silicates', 2000, 2000, 2, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-7', 'sys-inner-7-b1', 'Organics Processing Plant', 'Organics', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-7-b2', 'Water Ice', 2000, 2000, 2, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-7-b2', 'Ore', 5000, 5000, 5, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-7', 'sys-inner-7-b2', 'Water Ice Processing Plant', 'Water Ice', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-7-b3', 'Rare Earths', 1000, 1000, 1, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-7', 'sys-inner-7-b3', 'Rare Earths Processing Plant', 'Rare Earths', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-7-b4', 'Radiogenic Elements', 1000, 1000, 1, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-7-b4', 'Exotic Matter', 3000, 3000, 3, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-7', 'sys-inner-7-b4', 'Radiogenic Elements Processing Plant', 'Radiogenic Elements', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-7-b5', 'Exotic Technology', 4000, 4000, 4, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-7', 'sys-inner-7-b5', 'Exotic Technology Processing Plant', 'Exotic Technology', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-7-b6', 'Rare Earths', 4000, 4000, 4, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-7', 'sys-inner-7-b6', 'Rare Earths Processing Plant', 'Rare Earths', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-7-b7', 'Exotic Matter', 2000, 2000, 2, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-7-b7', 'Energy Crystals', 3000, 3000, 3, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-7', 'sys-inner-7-b7', 'Exotic Matter Processing Plant', 'Exotic Matter', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-7-b8', 'Hydrogen', 5000, 5000, 5, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-7', 'sys-inner-7-b8', 'Hydrogen Processing Plant', 'Hydrogen', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-7-b9', 'Hydrogen', 2000, 2000, 2, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-7', 'sys-inner-7-b9', 'Hydrogen Processing Plant', 'Hydrogen', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-8-b0', 'Organics', 3000, 3000, 3, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-8', 'sys-inner-8-b0', 'Organics Processing Plant', 'Organics', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-8-b1', 'Energy Crystals', 1000, 1000, 1, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-8-b1', 'Exotic Technology', 2000, 2000, 2, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-8-b1', 'Silicates', 4000, 4000, 4, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-8', 'sys-inner-8-b1', 'Energy Crystals Processing Plant', 'Energy Crystals', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-8-b2', 'Organics', 3000, 3000, 3, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-8', 'sys-inner-8-b2', 'Organics Processing Plant', 'Organics', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-8-b3', 'Radiogenic Elements', 1000, 1000, 1, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-8-b3', 'Ore', 1000, 1000, 1, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-8', 'sys-inner-8-b3', 'Radiogenic Elements Processing Plant', 'Radiogenic Elements', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-8-b4', 'Rare Earths', 2000, 2000, 2, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-8', 'sys-inner-8-b4', 'Rare Earths Processing Plant', 'Rare Earths', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-8-b5', 'Silicates', 4000, 4000, 4, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-8-b5', 'Organics', 2000, 2000, 2, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-8', 'sys-inner-8-b5', 'Silicates Processing Plant', 'Silicates', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-8-b6', 'Radiogenic Elements', 1000, 1000, 1, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-8-b6', 'Helium-3', 3000, 3000, 3, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-8', 'sys-inner-8-b6', 'Radiogenic Elements Processing Plant', 'Radiogenic Elements', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-8-b7', 'Energy Crystals', 5000, 5000, 5, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-8-b7', 'Hydrogen', 2000, 2000, 2, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-8', 'sys-inner-8-b7', 'Energy Crystals Processing Plant', 'Energy Crystals', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-9-b0', 'Exotic Matter', 3000, 3000, 3, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-9-b0', 'Radiogenic Elements', 2000, 2000, 2, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-9', 'sys-inner-9-b0', 'Exotic Matter Processing Plant', 'Exotic Matter', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-9-b1', 'Organics', 1000, 1000, 1, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-9', 'sys-inner-9-b1', 'Organics Processing Plant', 'Organics', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-9-b2', 'Organics', 3000, 3000, 3, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-9', 'sys-inner-9-b2', 'Organics Processing Plant', 'Organics', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-9-b3', 'Helium-3', 2000, 2000, 2, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-9-b3', 'Energy Crystals', 4000, 4000, 4, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-9-b3', 'Hydrogen', 1000, 1000, 1, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-9', 'sys-inner-9-b3', 'Helium-3 Processing Plant', 'Helium-3', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-9-b4', 'Energy Crystals', 5000, 5000, 5, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-9', 'sys-inner-9-b4', 'Energy Crystals Processing Plant', 'Energy Crystals', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-9-b5', 'Helium-3', 5000, 5000, 5, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-9', 'sys-inner-9-b5', 'Helium-3 Processing Plant', 'Helium-3', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-9-b6', 'Helium-3', 4000, 4000, 4, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-9-b6', 'Energy Crystals', 4000, 4000, 4, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-9-b6', 'Exotic Matter', 5000, 5000, 5, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-9', 'sys-inner-9-b6', 'Helium-3 Processing Plant', 'Helium-3', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-9-b7', 'Energy Crystals', 4000, 4000, 4, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-9', 'sys-inner-9-b7', 'Energy Crystals Processing Plant', 'Energy Crystals', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-9-b8', 'Rare Earths', 5000, 5000, 5, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-9', 'sys-inner-9-b8', 'Rare Earths Processing Plant', 'Rare Earths', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-10-b0', 'Rare Earths', 1000, 1000, 1, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-10-b0', 'Water Ice', 5000, 5000, 5, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-10', 'sys-inner-10-b0', 'Rare Earths Processing Plant', 'Rare Earths', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-10-b1', 'Rare Earths', 2000, 2000, 2, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-10', 'sys-inner-10-b1', 'Rare Earths Processing Plant', 'Rare Earths', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-10-b2', 'Water Ice', 4000, 4000, 4, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-10-b2', 'Rare Earths', 5000, 5000, 5, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-10', 'sys-inner-10-b2', 'Water Ice Processing Plant', 'Water Ice', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-10-b3', 'Organics', 3000, 3000, 3, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-10-b3', 'Energy Crystals', 2000, 2000, 2, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-10', 'sys-inner-10-b3', 'Organics Processing Plant', 'Organics', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-10-b4', 'Radiogenic Elements', 1000, 1000, 1, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-10', 'sys-inner-10-b4', 'Radiogenic Elements Processing Plant', 'Radiogenic Elements', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-11-b0', 'Hydrogen', 2000, 2000, 2, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-11', 'sys-inner-11-b0', 'Hydrogen Processing Plant', 'Hydrogen', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-11-b1', 'Solar Energy', 4000, 4000, 4, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-11', 'sys-inner-11-b1', 'Solar Energy Processing Plant', 'Solar Energy', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-11-b2', 'Rare Earths', 1000, 1000, 1, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-11-b2', 'Exotic Technology', 1000, 1000, 1, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-11', 'sys-inner-11-b2', 'Rare Earths Processing Plant', 'Rare Earths', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-11-b3', 'Water Ice', 3000, 3000, 3, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-11-b3', 'Rare Earths', 5000, 5000, 5, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-11', 'sys-inner-11-b3', 'Water Ice Processing Plant', 'Water Ice', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-11-b4', 'Ore', 4000, 4000, 4, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-11', 'sys-inner-11-b4', 'Ore Processing Plant', 'Ore', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-11-b5', 'Water Ice', 3000, 3000, 3, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-11-b5', 'Silicates', 3000, 3000, 3, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-11', 'sys-inner-11-b5', 'Water Ice Processing Plant', 'Water Ice', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-11-b6', 'Hydrogen', 1000, 1000, 1, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-11-b6', 'Radiogenic Elements', 3000, 3000, 3, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-11', 'sys-inner-11-b6', 'Hydrogen Processing Plant', 'Hydrogen', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-11-b7', 'Radiogenic Elements', 5000, 5000, 5, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-11-b7', 'Helium-3', 4000, 4000, 4, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-11-b7', 'Solar Energy', 2000, 2000, 2, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-11', 'sys-inner-11-b7', 'Radiogenic Elements Processing Plant', 'Radiogenic Elements', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-11-b8', 'Helium-3', 4000, 4000, 4, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-11-b8', 'Solar Energy', 4000, 4000, 4, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-11', 'sys-inner-11-b8', 'Helium-3 Processing Plant', 'Helium-3', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-11-b9', 'Ore', 3000, 3000, 3, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-11-b9', 'Energy Crystals', 5000, 5000, 5, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-11', 'sys-inner-11-b9', 'Ore Processing Plant', 'Ore', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)
VALUES ('sys-inner-11-b10', 'Water Ice', 3000, 3000, 3, now())
ON CONFLICT (body_id, resource_type) DO NOTHING;
INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)
VALUES ('sys-inner-11', 'sys-inner-11-b10', 'Water Ice Processing Plant', 'Water Ice', 25, 999, true)
ON CONFLICT (body_id, resource_type) DO NOTHING;
