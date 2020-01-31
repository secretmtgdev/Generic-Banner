var BannerModule = function() {
    /** @param {JSON<StorageKeys>} keys The keys to bind. */
    bindStorageKeys();
    
    /** @param {HTMLMouseEvent} event The event that occured. */
    noThanksClicked(event);

    /** @param {HTMLMouseEvent} event The event that occured. */   
    addClicked(event);
    
    /** @param {HTMLMouseEvent} event The event that occured. */
    alreadyInstalledClicked(event);

    /** @param {Number} oldTokenTime Time captured from token. */
    tokenExpired(oldTokenTime)
    
    /** @param {Number} time Milliseconds */
    convertToSeconds(time);

    /** @param {Event} eventOccurred The type of event to handle */
    handleDailyEvent(eventOccurred);

    /** @param {JSON<Array<HTMLElement>>} elments The properties to iterate through in order to construct the banner. */
    createBanner(elements);

    /** @param {Template.Properties} props Specific object to represent an element.*/
    constructElement(props);

    /** @description This function determines if a banner should should based off of previous user interaction with the banner. */
    handleBannerVisibility();

    /** @description Dictates viewability of the banner based off of browser type and device. */
    bannerViewability();

    /** @param {Function} callback The callback handler. */
    checkForExtension(callback);
}

export default BannerModule;