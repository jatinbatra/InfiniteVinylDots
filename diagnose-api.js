import { REGIONS, REGIONAL_GENRES } from './constants.js';

async function checkRegions() {
    console.log(`Checking ${REGIONS.length} regions...`);
    const results = [];

    for (const region of REGIONS) {
        const genres = REGIONAL_GENRES[region.code] || ['pop'];
        const term = genres[0];
        const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&country=${region.code}&entity=song&limit=1`;
        
        try {
            const res = await fetch(url);
            if (!res.ok) {
                results.push({ name: region.name, code: region.code, status: res.status, url });
            }
        } catch (e) {
            results.push({ name: region.name, code: region.code, error: e.message, url });
        }
    }

    if (results.length > 0) {
        console.log('Found issues:');
        console.table(results);
    } else {
        console.log('All regions responded successfully!');
    }
}

checkRegions();
