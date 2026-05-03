import { generateGalaxy } from './src/galaxy/generate.js';
try {
  const g = generateGalaxy(20260423);
  console.log("Galaxy generated with systems:", g.systems.length);
  const center = g.systemById["sys-center"];
  console.log("Center exists:", !!center);
} catch(e) {
  console.error(e);
}
