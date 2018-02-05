import m = require('mithril');
import Beacon = require('./Beacon');
import protocol = require('./protocol');

const seenCollectors = {};

const trackerAnalytics = (tracker, collector, pageUrl, appId) => {
    collector = collector.toLowerCase();
    pageUrl = (new URL(pageUrl)).host.toLowerCase();
    appId = (appId || '').toLowerCase();

    const appKey = pageUrl + ':' + appId;

    if (!(collector in seenCollectors)) {
        seenCollectors[collector] = [];
    }

    if (!seenCollectors[collector].includes(appKey)) {
        seenCollectors[collector].push(appKey);

        chrome.storage.sync.get({enableTracking: true}, (settings) => {
            if (settings.enableTracking && tracker) {
                tracker.trackStructEvent('New Tracker', collector, pageUrl, appId);
            }
        });
    }
};

const summariseBeacons = (entry, index, tracker) => {
    const reqs = Beacon.extractRequests(entry, index);
    const [[id, collector, method], requests] = reqs;

    const results = [];

    for (const [i, req] of Array.from(requests.entries())) {
        const result = {
            appId: req.get('aid'),
            collector,
            eventName: protocol.paramMap.e.values[req.get('e')] || req.get('e'),
            id: `#${id}-${i}`,
            method,
            page: req.get('url'),
            payload: new Map(req),
            time: (new Date(parseInt(req.get('stm') || req.get('dtm'), 10) || +new Date())).toJSON(),
        };

        trackerAnalytics(tracker, collector, result.page, result.appId);

        results.push(result);
    }

    return results;
};

const getPageUrl = (entries) => {
    const urls = entries.reduce((ac, cv) => {
        let page = cv.request.headers.filter((x) => /referr?er/i.test(x.name))[0];
        if (page) {
            page = page.value;
            ac[page] = (ac[page] || 0) + 1;
        }
        return ac;
    }, {});

    let url = '';
    let parsedUrl;
    let max = -1;
    for (const p in urls) {
        if (urls[p] >= max) {
            url = p, max = urls[p];
        }
    }

    if (url) {
        parsedUrl = new URL(url);
    }

    return parsedUrl || url;
};

export = {
    view: (vnode) => {
        const url = getPageUrl(vnode.attrs.request.entries);
        return m('ol.navigationview', {
            'data-url':  url ? url.pathname : 'New Page',
            'title': url && url.href || '',
        }, Array.prototype.concat.apply([], vnode.attrs.request.entries.map((x, i) => {
            const summary = summariseBeacons(x, i, vnode.attrs.tracker);
            return summary.map((y) => m('li', {title: `Collector: ${y.collector}\nApp ID: ${y.appId}`},
                         m('a', {
                             href: y.id,
                             onclick: vnode.attrs.setActive.bind(null, y),
                         }, [y.eventName,
                             m('time', {datetime: y.time, title: y.time}, 'T'),
                         ]),
                    ),
                );
        })));
    },
};