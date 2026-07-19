const Parser = require('rss-parser');
const fs = require('fs');

const parser = new Parser({
    timeout: 10000,
    customFields: {
        item: [
            ['description', 'description'],
            ['summary', 'summary'],
            ['content', 'content'],
            ['content:encoded', 'contentEncoded']
        ]
    }
});

const RSS_FEEDS = {
    msrc: { name: 'MSRC Security Updates', url: 'https://api.msrc.microsoft.com/update-guide/rss', icon: 'ph-shield-warning', tags: ['Windows', 'Azure'] },
    o365: { name: 'Microsoft 365 Updates', url: 'https://techcommunity.microsoft.com/t5/s/gxcuf89792/rss/board?board.id=Microsoft365Blog', icon: 'ph-microsoft-excel-logo', tags: ['Microsoft 365 Apps'] },
    winrelease: { name: 'Windows Release Health', url: 'https://learn.microsoft.com/en-us/windows/release-health/windows-message-center.rss', icon: 'ph-windows-logo', tags: ['Windows'] },
    entramgmt: { name: 'Microsoft Entra', url: 'https://techcommunity.microsoft.com/t5/s/gxcuf89792/rss/board?board.id=MicrosoftEntraBlog', icon: 'ph-shield-check', tags: ['Azure'] },
    intunecust: { name: 'Intune Customer Success', url: 'https://techcommunity.microsoft.com/t5/s/gxcuf89792/rss/board?board.id=IntuneCustomerSuccess', icon: 'ph-devices', tags: ['Intune'] },
    skable: { name: 'Systems Center Dudes', url: 'https://www.systemcenterdudes.com/feed/', icon: 'ph-desktop', tags: ['Intune', 'Windows'] },
    anoop: { name: 'Anoop C Nair', url: 'https://www.anoopcnair.com/feed/', icon: 'ph-devices', tags: ['Intune'] },
    andrew: { name: 'Andrew Taylor', url: 'https://andrewstaylor.com/feed/', icon: 'ph-devices', tags: ['Intune'] },
    msendpoint: { name: 'MSEndpointMgr', url: 'https://msendpointmgr.com/feed/', icon: 'ph-devices', tags: ['Intune'] },
    prajwal: { name: 'Prajwal Desai', url: 'https://www.prajwaldesai.com/feed/', icon: 'ph-devices', tags: ['Intune'] },
    joymalya: { name: 'Joymalya Basu Roy', url: 'https://joymalya.com/feed/', icon: 'ph-devices', tags: ['Intune'] },
    patchmypc: { name: 'Patch My PC', url: 'https://patchmypc.com/feed', icon: 'ph-package', tags: ['Intune', 'Windows'] },
    peter: { name: 'Peter van der Woude', url: 'https://petervanderwoude.nl/feed/', icon: 'ph-devices', tags: ['Intune'] },
    onedrive: { name: 'OneDrive Blog (MS)', url: 'https://techcommunity.microsoft.com/t5/s/gxcuf89792/rss/board?board.id=OneDriveBlog', icon: 'ph-cloud-arrow-up', tags: ['OneDrive'] },
    sharepoint: { name: 'SharePoint Blog (MS)', url: 'https://techcommunity.microsoft.com/t5/s/gxcuf89792/rss/board?board.id=SharePointBlog', icon: 'ph-browsers', tags: ['SharePoint'] },
    defenderatp: { name: 'Defender ATP Blog (MS)', url: 'https://techcommunity.microsoft.com/t5/s/gxcuf89792/rss/board?board.id=MicrosoftDefenderATPBlog', icon: 'ph-shield-check', tags: ['Defender'] },
    appel: { name: 'Jeffrey Appel', url: 'https://jeffreyappel.nl/feed/', icon: 'ph-shield-check', tags: ['Defender'] },
    exchange: { name: 'Exchange Blog (MS)', url: 'https://techcommunity.microsoft.com/t5/s/gxcuf89792/rss/board?board.id=Exchange', icon: 'ph-envelope-simple', tags: ['Exchange'] },
    edgedev: { name: 'Edge Dev Blog', url: 'https://blogs.windows.com/msedgedev/feed/', icon: 'ph-app-window', tags: ['Edge'] },
    aks: { name: 'AKS Dev Blog', url: 'https://blog.aks.azure.com/feed/', icon: 'ph-cloud', tags: ['Azure'] },
    bacancy: { name: 'Bacancy Azure', url: 'https://www.bacancytechnology.com/blog/category/azure/feed/', icon: 'ph-cloud', tags: ['Azure'] },
    azureupdates: { name: 'Azure Updates', url: 'https://azurecomcdn.azureedge.net/en-us/updates/feed/', icon: 'ph-arrows-clockwise', tags: ['Azure'] },
    teams: { name: 'Teams Blog (MS)', url: 'https://techcommunity.microsoft.com/t5/s/gxcuf89792/rss/board?board.id=MicrosoftTeamsBlog', icon: 'ph-microsoft-teams', tags: ['Teams'] },
    tomtalks: { name: 'Tom Talks', url: 'https://tomtalks.blog/feed/', icon: 'ph-microsoft-teams', tags: ['Teams'] },
    sharegate: { name: 'ShareGate (Teams)', url: 'https://sharegate.com/blog/category/microsoft-teams/feed/', icon: 'ph-microsoft-teams', tags: ['Teams'] },
    practical365: { name: 'Practical 365 (Teams)', url: 'https://practical365.com/category/microsoft-teams/feed/', icon: 'ph-microsoft-teams', tags: ['Teams'] },
    teamsqueen: { name: 'Teams Queen', url: 'https://teamsqueen.com/feed/', icon: 'ph-microsoft-teams', tags: ['Teams'] }
};

const escapeHtml = (str) => {
    if (!str) return '';
    return String(str)
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
};

// Lookback period (e.g., last 30 days to limit file size)
const LOOKBACK_DAYS = 30;

async function fetchAllFeeds() {
    let allItems = [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - LOOKBACK_DAYS);

    for (const [key, source] of Object.entries(RSS_FEEDS)) {
        console.log(`Fetching ${source.name}...`);
        try {
            const feed = await parser.parseURL(source.url);
            const items = feed.items.slice(0, 20).map(item => {
                let snippet = item.description || item.summary || item.content || item.contentEncoded || '';
                if (snippet) {
                    // Very basic strip HTML tags for JSON snippet
                    snippet = snippet.replace(/<[^>]*>?/gm, '');
                    snippet = snippet.trim().substring(0, 150);
                    if (snippet.length >= 150) snippet += '...';
                }

                let pubDate = item.pubDate || item.isoDate || new Date().toISOString();
                let dateObj = new Date(pubDate);

                let link = item.link || '#';
                // Fix MSRC broken routing
                if (link.includes('msrc.microsoft.com/update-guide/vulnerability/')) {
                    link = link.replace('update-guide/vulnerability/', 'update-guide/en-US/vulnerability/');
                }

                return {
                    source: source.name,
                    icon: source.icon,
                    title: escapeHtml(item.title || 'No Title'),
                    link: link,
                    date: dateObj.toISOString(),
                    snippet: escapeHtml(snippet || 'No description available.'),
                    tags: source.tags || []
                };
            });

            const validItems = items.filter(i => new Date(i.date) >= cutoffDate);
            allItems = allItems.concat(validItems);
            
            console.log(` => Success: added ${validItems.length} items`);
        } catch (err) {
            console.error(` => Failed to fetch ${source.name}:`, err.message);
        }
    }

    // Sort globally by date descending
    allItems.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Deduplicate by link
    const uniqueMap = new Map();
    allItems.forEach(i => uniqueMap.set(i.link, i));
    const finalItems = Array.from(uniqueMap.values());

    const output = {
        lastUpdated: new Date().toISOString(),
        count: finalItems.length,
        items: finalItems
    };

    fs.writeFileSync('news.json', JSON.stringify(output, null, 2));
    console.log(`\nSuccessfully wrote ${finalItems.length} items to news.json`);
}

fetchAllFeeds();
