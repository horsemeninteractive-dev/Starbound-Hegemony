
import { generateGalaxy } from "../src/galaxy/generate";
import { RICHNESS_VALUES } from "../src/galaxy/meta";

const UNIVERSAL_SEED = 20260423;
const galaxy = generateGalaxy(UNIVERSAL_SEED);

const sanctumSystems = galaxy.systems.filter(s => s.id.startsWith("sys-inner-"));

console.log("-- SEEDING SANCTUM NPC FACTORIES AND RESOURCES");
sanctumSystems.forEach(sys => {
    sys.bodies.forEach(body => {
        // Only planets (terrestrial and gas giants)
        if (body.type === "terrestrial" || body.type === "gas_giant") {
            // Seed ALL deposits for these bodies in body_resources
            body.deposits.forEach(d => {
                const richness = RICHNESS_VALUES[d.richness as keyof typeof RICHNESS_VALUES] || 1;
                const maxAmount = richness * 1000;
                console.log(`INSERT INTO body_resources (body_id, resource_type, current_amount, max_amount, richness_value, last_replenished_at)`);
                console.log(`VALUES ('${body.id}', '${d.resource}', ${maxAmount}, ${maxAmount}, ${richness}, now())`);
                console.log(`ON CONFLICT (body_id, resource_type) DO NOTHING;`);
            });

            // Seed the primary factory
            const firstDeposit = body.deposits[0];
            if (firstDeposit) {
                console.log(`INSERT INTO factories (system_id, body_id, type, resource_type, wage, jobs_available, is_npc_owned)`);
                console.log(`VALUES ('${sys.id}', '${body.id}', '${firstDeposit.resource} Processing Plant', '${firstDeposit.resource}', 25, 999, true)`);
                console.log(`ON CONFLICT (body_id, resource_type) DO NOTHING;`);
            }
        }
    });
});
