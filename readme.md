### What is `piconav`?

`piconav` is a tiny library that keeps the browser URL in sync with your JS state for Single Page Applications.

It also syncs the `document` title, canonical URL and meta description.

It aims to allow Google indexing of SPA's to prevent the need for server side rendering / hydrating.
 

### Why did you make `piconav`?

- As a fast way to add SPA URL navigation to my prototypes.
    - React Router seems complicated and the API changes often.
    - I do not like the idea of using non-display JSX elements to add meta data to nodes (as React Router does with `Route`).

- Clear API.
    - The standard browser APIs around single page navigation are not very clear so I created `picnoav` to document their usage.
    - The `document` title, canonical URL and meta description are outside the control of the JSX DOM so have to updated directly with the DOM API.

- SEO.
    - To document my experiments with Googlebot's indexing of SPA apps. 
    - From experience I have found Google will index your JS pages if you load the data in a blocking `script` tag so there is no `fetch` latency after your initial JS loads.

### Why should I use `piconav`?

- Easy to use.
    - Use `piconav` if you want to get something up and running quickly.
        
- Easy to replace.
    - Minimal API.
    - `piconav` is very simple.
    - You can copy or customize the functionality quickly.


### How to add `piconav` to your JS project.

Install: `yarn add piconav` or `npm install piconav`.

#### 1. Create a `nav.js` to add configuration and event handlers to `piconav`.

```js
import {on, off} from "./../lib/piconav";
import {storeIns} from "./../stores/store";

const resetPrimaryScroll = () => {
    document.querySelector("html").scrollTo(0, 0);
};

const {nav, navByBrowser, updateDoc} = on({
    site: {
        canonicalDomain: `https://example.com`
    },
    events: {
        js: {
            after: ({data}) => {
                if (data !== null && "type" in data && data.type !== "home") {
                    resetPrimaryScroll();
                }
            }
        },
        browser: {
            after: (url, params) => {
                // You should update your store state to match the incoming `url` and `params`.
                return storeIns.onBrowserNav(url, params);
            }
        }
    }
});

export {
    nav,
    navByBrowser,
    updateDoc
}
```

#### 2.  Import `nav.js` to your store, map JS state to `document` state.

When the user navigates via browser:
- `events.browser.after(url, params)` is called.
    - Your code is expected to call `updateDoc(navEvent)` soon after. 

When the user navigates via JS click:
- Call `nav(navEvent)`

Example using a MobX store:

```js
@observable curUrl = null;

nav(appSpecificData, src = "js") {
    this.curUrl = {
        url: "/a/b/c",
        title: "A Title",
        metaDesc: "A page description",
        data: appSpecificData,
        src
    };
}
```
Note: `src` is either `js` or `browser`.

E.g If `curUrl` is set via the `events.browser.after` function, `src` will be `"browser"`.

Using an observable to store `curUrl` property allows updating both the JSX DOM and `document` when state changes. 

Updating `document` when `curUrl` changes:
```js
const disposer = observe(storeIns, "curUrl", ({oldValue, newValue}) => {
    const {url, title, metaDesc, data, src} = newValue;

    const navEvent = {
        url,
        doc: {
            title,
            metaDesc
        },
        
        // This can be any object, and will be passed to `events.js.after` to allow custom logic.
        data
    };

    if (src === "js") {
        nav(navEvent);
        return;
    }

    if (src === "browser") {
        updateDoc(navEvent);
        return;
    }
});
```
Using `observe` on `curUrl` allows calling `nav` and `updateDoc` in a single place (instead of many call sites).


####  3. Run `navByBrowser` on initial page load.

This will call `events.browser.after` which will set your JS state to match the current URL.

This should be done preferably before you mount your JSX components so the first JSX render is your page content and not empty components.

This is important so the Googlebot snapshots and indexes the correct HTML. 

```js
navByBrowser();
```

