import fs from 'fs';

const content = fs.readFileSync('constants.ts', 'utf8');
const regionsMatch = content.match(/export const REGIONS = (\[[\s\S]*?\]);/);
if (!regionsMatch) {
    console.log('Could not find REGIONS');
    process.exit(1);
}

// Simple eval-like parsing
const regions = eval(regionsMatch[1]);

async function checkAll() {
    console.log(`Checking ${regions.length} regions...`);
    for (const region of regions) {
        const url = `https://itunes.apple.com/search?term=pop&country=${region.code}&entity=song&limit=1`;
        const res = await fetch(url);
        if (res.status === 400) {
            console.log(`❌ 400: ${region.name} (${region.code})`);
        } else if (res.status !== 200) {
             console.log(`⚠️ ${res.status}: ${region.name} (${region.code})`);
        }
        // Sleep to avoid rate limit
        await new Promise(r => setTimeout(r, 100));
    }
}

checkAll();
