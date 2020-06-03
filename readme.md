### What is `piconav`?

`piconav` is a tiny library that keeps the browser URL in sync with your JS state for Single Page Applications.

It also syncs the `document` title, canonical URL and meta description.

It aims to allow Google indexing of SPA's to prevent the need for server side rendering / hydrating.
 

### Why did you make `piconav`?

- As a fast way to add SPA URL navigation to my prototypes.
    - React Router seems complicated and the API changes often.
    - I do not like the idea of using non-display JSX elements to add meta data to nodes (as React Router does with `Route`).

- Clear API.
    - The standard browser APIs around single page navigation are not very clear so I created `piconav` to document their usage.
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

### How does `piconav` work?

There are four broad variables in JS and the DOM that need to be kept in sync:

1. JS state
    - E.g. Your React store.
2. JSX DOM.
    - Your state converted into DOM elements via JSX.
3. URL
    - The browser address bar that the user types into, and which is changed on forward/back browser button presses.
4. Document.
    - E.g the title, `<link>` meta and canonical URL values.
      
There are two sources of navigation:
1. Browser.
    - Any navigation caused by the browser chrome UI (including swipe gestures for forward and back).
2. JS.
    - Any navigation triggered by handling of a click event or other JS event.

`piconav` observes a navigation from one of the sources, and makes sure each of the four variables are in sync.

You need to integrate `piconav` into your app by passing it function callbacks - code examples below.

Generally, this is what happens when a navigation happens from each of the two sources:

Note: Indentation roughly shows the function call stack, although with observables it might not be exact as there will be some Mobx functions in the stack also.

---
- JS Event (e.g click)
    - (1) Update state
        - (2) Update JSX DOM
        - `nav(navEvent)`
            - (3) Update URL
            - (4) Update Document
---
- Browser event (e.g. pasting a new URL into the address bar)
    - (3) Update URL
        - `events.browser.after(url, params)`
            - (1) Update state
                - (2) Update JSX DOM
                - (4) Update Document.
---

### How to add `piconav` to your JS project.

<details>
  <summary>How to add `piconav` to your JS project.</summary>

Install: `yarn add piconav` or `npm install piconav`.

#### 1. Create a `nav.js` to add configuration and event handlers to `piconav`.

```js
import {on, off} from "piconav";
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

// This is a public method on an observable store that your app uses to navigate.
// Use `curUrl` state to render the correct page in JSX.
// `src` should equal `browser` when `nav` is called from the `events.browser.after` callback. 
nav(appSpecificData, src = "js") {
    this.curUrl = {
        url: "/a/b/c",
        title: "A Title",
        metaDesc: "A page description",
        data: appSpecificData,
        src // equals "js" or "browser"
    };
}
```

 

Calling `piconav` functions after your app navigates to a new URL: 
```js
// Using `observe` on `curUrl` allows calling `nav` and `updateDoc` in a single place (instead of many call sites).
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

####  3. Run `navByBrowser` on initial page load.

```js
// Will call the `events.browser.after` callback which should set your JS state to match that of the current browser URL.
// Note: this is best done before mounting your JSX as the first JSX render will be the correct page and not empty containers.
// - This ensures Googlebot snapshots the correct HTML.
navByBrowser();
```

</details>


