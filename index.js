import merge from 'lodash.merge';

const searchToObj = (search) => {
    const o = {};
    const s = new URLSearchParams(search);

    for (const [k, v] of Array.from(s)) {
        o[k] = v;
    }

    return o;
};

const on = (opts) => {
    const defaults = {
        site: {
            canonicalDomain: null
        },
        events: {
            browser: {
                after: () => {

                }
            },
            js: {
                after: () => {

                }
            }
        }
    };

    const {
        site,
        events
    } = merge(defaults, opts);


    window.onpopstate = (e) => {
        navByBrowser();
    };

    const navByBrowser = () => {
        const params = searchToObj(window.location.search);
        const opts = events.browser.after(window.location.pathname, params);
        // updateDoc(opts);
    };


    const nav = (opts) => {
        const {
            url,
        } = opts;

        history.pushState(null, null, url);
        updateDoc(opts);

        if (!("data" in opts)) {
            // Should be `object | null`.
            opts.data = null;
        }

        events.js.after(opts);
    };

    const updateDoc = (opts) => {
        const {
            url,
            doc: {
                title,
                metaDesc = null
            }
        } = opts;

        document.title = title;

        if (site.canonicalDomain !== null) {
            setCanon(`${site.canonicalDomain}${url}`);
        }

        if (metaDesc !== null) {
            setDesc(metaDesc);
        }

    };


    return {
        nav,
        navByBrowser,
        updateDoc
    }

};

const off = () => {
    window.onpopstate = () => {
    };
};


/**
 * A canonical URL prevents duplicate content in Google's index by allowing you to point at the official URL from the duplicate pages.
 */
const setCanon = (href) => {
    let canon = document.querySelector(`link[rel="canonical"]`);
    if (canon === null) {
        canon = document.createElement("link");
        canon.rel = "canonical";
        document.head.appendChild(canon);
    }

    canon.href = href;
};

const setDesc = (content) => {
    let desc = document.querySelector(`meta[name="description"]`);
    if (desc === null) {
        desc = document.createElement("link");
        desc.name = "description";
        document.head.appendChild(desc);
    }

    desc.content = content;
};

export {
    on,
    off
}