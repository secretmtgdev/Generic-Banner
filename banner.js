(function(){
    'use strict';
    var browserType = inChrome() ? "Chrome" : inFirefox() ? "Firefox" : "";
    var promotionPath;
    var mobileDevice = '';

    // Data for application insights
    var properties = {
        referrer: document.referrer,
        url: window.location.href,
        userAgent: window.navigator.userAgent
    };

    // Data to be pulled from the appropriate json file
    var bannerProperties = null;

    // Bind handlers to specific onclick events
    var handlerFunctions = {
        addClicked, 
        alreadyInstalledClicked,
        noThanksClicked
    };

    // Each banner utilizes a different set of storage keys
    var storageKeys = {
        declineClick: null, 
        addClick: null, 
        installedClick: null,
        displayBanner: null,
        declinedPreviously: null,  
        declineTimeout: null,
        alreadyInstalled: null
    };

    if(document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setup);
    } else {
        setup();
    }

    function setup() {
        var userAgent = navigator.userAgent;
        var isMobile = userAgent.indexOf('Mobile') !== -1;
        var isiPhone = userAgent.indexOf('Mac OS') !== -1;
        var isAndroid = userAgent.indexOf('Android') !== -1;
        if(isMobile) {
            var promotion = prompt('extension-template or mobile-template');
            promotionPath = `./promotions/${promotion.toLocaleLowerCase()}-banner.json`;
            mobileDevice = isiPhone ? 'ios' : isAndroid ? 'android' : '';
            $.getJSON(promotionPath, function(data) {
                bannerProperties = data;
                bindStorageKeys(bannerProperties['storageKeys']);
                createBanner(bannerProperties['elements']);
                bannerViewability();
                let controls = document.querySelectorAll('.banner-controls > .banner-content-container');
                for(var i = 0; i < controls.length; i++) {
                    let control = controls[i];
                    control.addEventListener('mouseenter', toggleHighlightHover);
                    control.addEventListener('mouseleave', toggleHighlightHover)
                }
            });
        }
    }

    /** 
     * @method bindStorageKeys
     * @description Binds the storage keys based off of the information passed in.
     * @param {JSON<StorageKeys>} keys The keys to bind. */
    function bindStorageKeys(keys) {
        for(var prop in keys) {
            storageKeys[prop] = keys[prop];
        }
    }

    
    ///////////////////////////////////////////////////////////////////////////////////
    ///                                                                             ///
    ///                          HANDLER FUNCTIONS                                  ///
    ///                                                                             ///
    ///////////////////////////////////////////////////////////////////////////////////
    function noThanksClicked(event) {
        removeBanner();
        logBannerInsight(storageKeys['declineClick']);
    }

    function addClicked(event) {
        logBannerInsight(storageKeys['addClick']);
    }

    function alreadyInstalledClicked(event) {
        removeBanner();
        logBannerInsight(storageKeys['installedClick']);
    }


    ///////////////////////////////////////////////////////////////////////////////////
    ///                                                                             ///
    ///                          STORAGE FUNCTIONS                                  ///
    ///                                                                             ///
    ///////////////////////////////////////////////////////////////////////////////////
    function tokenExpired(oldTokenTime) {
        var decline_expiration_timeout = 2592000;
        var currSeconds = convertToSeconds(Date.now());
        return (currSeconds - oldTokenTime) > decline_expiration_timeout;
    }

    function convertToSeconds(milliseconds) {
        return milliseconds / 1000;
    }

    /** 
     * @method handleDailyEvent
     * @description The purpose of this function is to remove the banner token from 
     *              local storage after a day.
     * @param {Event} eventOccurred */
    function handleDailyEvent(eventOccurred) {
        var tokenTime = localStorage.getItem(eventOccurred);
        if (tokenTime === null) {
            logBannerInsight(eventOccurred);
        } else if ((convertToSeconds(Date.now()) - tokenTime) > (24 * 60 * 60)) {
            localStorage.removeItem(eventOccurred);
            logBannerInsight(eventOccurred);
        }
    }


    ///////////////////////////////////////////////////////////////////////////////////
    ///                                                                             ///
    ///                      BROWSER SNIFFING FUNCTIONS                             ///
    ///                                                                             ///
    ///////////////////////////////////////////////////////////////////////////////////
    function inChrome() {
        return (
            navigator.userAgent.indexOf("Chrome") > -1 &&                               
            navigator.vendor === "Google Inc."
        );
    }

    function inFirefox() {
        return navigator.userAgent.indexOf("Firefox") > -1;
    }


    ///////////////////////////////////////////////////////////////////////////////////
    ///                                                                             ///
    ///                     BANNER VIEWABILITY FUNCTIONS                            ///
    ///                                                                             ///
    ///////////////////////////////////////////////////////////////////////////////////
    /** 
     * @method createBanner
     * @description Creates a banner based off of JSON object passed.
     * @param {JSON<HTMLElements>} elments The properties to iterate through in order 
     * to construct the banner. */
    function createBanner(elements) {
        var sections = document.querySelector('#generic-banner').children;
        var count = 0;
        var fragment = document.createDocumentFragment();
        for(var section in elements) {
            var segment = elements[section];
            var container = document.createElement('div');
            container.className = 'banner-content-container';
            for(var prop in segment) {
                var innerProp = segment[prop];
                container.appendChild(constructElement(innerProp));
            }
            fragment.appendChild(container);
            sections[count++].appendChild(fragment);
        }
    }

    /** 
      * @method contstructElement
      * @description This function is used as a helper to construct and HTML element.
      * @note In the event that the JSON structure becomes complex, this should be part
      *       of a recursive call, DFS, to construct the banner.
      *
      * @param {object} props Specific object to represent an element.
      * @returns A constructed HTMLElement */
    function constructElement(props) {
        var element = document.createElement(props['type']);
        for(var prop in props) {
            // this is an onclick handler for each of the buttons on the banner 
            if(prop !== 'type') {
                if(prop === 'onclick') { 
                    element[prop] = handlerFunctions[props[prop]];
                } else if(prop === 'mobile') {
                    element['href'] = props[prop][mobileDevice];
                } else { 
                    element[prop] = props[prop];
                }
            }
        }
        return element;
    }
    
    function removeBanner() {
        event.preventDefault();
        $("#generic-banner").slideUp();
        setTimeout(function () {
            var banner = document.querySelector('#generic-banner');
            banner.parentNode.removeChild(banner);
        }, 1500);
    }

    /** 
     * @method handleBannerVisibility
     * @type function expression 
     * @description This function determines if a banner should should based off of 
     *              previous user interaction with the banner. */
    var handleBannerVisibility = function () {
        // get the decline key & installed keys
        var bannerLastShown = localStorage.getItem(storageKeys['declineClick']);
        var programInstalled = localStorage.getItem(storageKeys['installedClick']) !== null;
        if (programInstalled) {
            $('#generic-banner').hide();
        } else if (bannerLastShown === null) {
            $('#generic-banner').show();
            handleDailyEvent(storageKeys.displayBanner);
        } else if (tokenExpired(bannerLastShown)) {
            localStorage.removeItem(bannerLastShown);
            $('#generic-banner').show();
            handleDailyEvent(storageKeys.declineTimeout);
        } else {
            $('#generic-banner').hide();
            handleDailyEvent(storageKeys.declinedPreviously);
        }
    }

    /** 
     * @method bannerViewability
     * @description Dictates viewability of the banner based off of browser type and device. */
    function bannerViewability() {
        if(bannerProperties.type === 'extension') {
            checkForExtension(handleBannerVisibility);
        } else {
            handleBannerVisibility();
        }
        if (mobileDevice === '') {
            if (inFirefox()) {
                if (localStorage.getItem(storageKeys['addClick']) !== null && 
                    localStorage.getItem(storageKeys['installedClick']) === null) {
                    document.querySelector('#already-have-extension').style.display = 'inline-block';
                }
            }

            if (browserType !== 'Chrome' && browserType !== 'Firefox') { 
                document.querySelector('#generic-banner').style.display = 'none';
            }
        }
    }

    /** 
     * @method checkForExtension 
     * @description Specifically used for extensions on pages that are whitelisted.
     * @param {Function} callback The callback handler. */
    function checkForExtension(callback) {
        if (browserType === 'Chrome' && chrome && chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage(
                'acehchockcmgigjilbjhecnepiohkfld',
                {
                    message: 'version'
                },
                function (response) {
                    if (chrome.runtime.lastError || response === null || response === undefined) {
                        callback();
                    } else if (response && response.version) {
                        handleDailyEvent(storageKeys.alreadyInstalled);
                        $('#generic-banner').hide();
                    } else {
                        handleDailyEvent('ExtensionSolitaireUnexpectedAPIResponse');
                    }
                }
            );
        } else {
            callback();
        }
    }

    ///////////////////////////////////////////////////////////////////////////////////
    ///                                                                             ///
    ///                         MISCELLANEOUS FUNCTIONS                             ///
    ///                                                                             ///
    ///////////////////////////////////////////////////////////////////////////////////
    /** 
     * @method logBannerInsight
     * @description Logs a user action to application insights and stores the information into 
     *              local storage as to not show the user the banner again.
     * @param {Event} eventOccurred Typically a click event. */
    function logBannerInsight(eventOccurred) {
        if (localStorage.getItem(eventOccurred) === null) {
            localStorage.setItem(eventOccurred, convertToSeconds(Date.now()));
            console.log(`${eventOccurred} tracked`);
        }
        else if (eventOccurred === 'installedClick' ||
            eventOccurred === 'addClick' ||
            eventOccurred === 'declineClick') {
                console.log(`${{ name: eventOccurred }} tracked with browser info: ${properties}`);
        }
    }

    /** 
     * @method highlightOnHover
     * @description Utilizing event delegation to toggle classes of certain elements.
     */
    function toggleHighlightHover(event) {
        let target = event.target;
        if(target.tagName !== 'A') return;
        if(target.classList.contains('highlight')) {
            target.classList.remove('highlight');
        } else {
            target.classList.add('highlight')
        }
    }
})();


