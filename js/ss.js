(function() {

    var VERSION = '2.0.01';

    var logger = [];
    var installed = false;
    var onReady = function(callback) {

        var DOMContentLoaded = null;

        // Add getElementsByClassName
        if (typeof document.getElementsByClassName !== 'function') {
            document.getElementsByClassName = function(className, parentElement) {
                if (Prototype.BrowserFeatures.XPath) {
                    var q = ".//*[contains(concat(' ', @class, ' '), ' " + className + " ')]";
                    return document._getElementsByXPath(q, parentElement);
                } else {
                    var children = ($(parentElement) || document.body).getElementsByTagName('*');
                    var elements = [], child;
                    for (var i = 0, length = children.length; i < length; i++) {
                        child = children[i];
                        if (Element.hasClassName(child, className))
                            elements.push(Element.extend(child));
                    }
                    return elements;
                }
            };
        }

        if ( document.addEventListener ) {
            DOMContentLoaded = function() {
                document.removeEventListener( "DOMContentLoaded", DOMContentLoaded, false );
                callback();
            };

        } else if ( document.attachEvent ) {
            DOMContentLoaded = function() {
                // Make sure body exists, at least, in case IE gets a little overzealous
                if ( document.readyState === "complete" ) {
                    callback();
                }
            };
        }

        if ( document.readyState === "complete" ) {
            // Handle it asynchronously to allow scripts the opportunity to delay ready
            setTimeout( callback, 1 );
        }

        if ( document.addEventListener ) {

            document.addEventListener( "DOMContentLoaded", DOMContentLoaded, false );
            // A fallback to window.onload, that will always work
            //window.addEventListener( "load", jQuery.ready, false );
            window.addEventListener( "load", callback, false );

        } else if ( document.attachEvent ) {    // If IE event model is used
            // ensure firing before onload,
            document.attachEvent("onreadystatechange", DOMContentLoaded);

            // A fallback to window.onload, that will always work
            window.attachEvent( "onload", callback );
        }
    };

    var errReport = function(err, context) {
        var pxl = new Image();
        pxl.width = pxl.height = 1;
        pxl.style.position = 'absolute';
        pxl.style.visibility = 'hidden';
        document.body.appendChild(pxl);

        var report = [];
        if (typeof err === 'object') {
            for (var er in err) {
                report.push(er + '-' + err[er]);
            }
        } else {
            report.push(err);
        }

        pxl.src = 'http://koi.sharpspring.com/net/err/' + '?err=' + encodeURIComponent(report.join('--')) +
            '&log=' + encodeURIComponent(logger.join('--')) + '&context=' + encodeURIComponent(context) + '&ver=' + VERSION;
    };

    try {
        (function(client) {

            if (!client || installed) {
                return;
            }

            var ss_client = function(ss_queue) {

                var self = this,
                    account = null,
                    version = VERSION,
                    queue = ss_queue.concat(),
                    history = [],
                    params = {},
                    api = {},
                    session = null;

                var App_Hostname = 'app.sharpspring.com';

                var Cookie_Session_Name = '__ss';
                var Cookie_Session_Referrer = '__ss_referrer';
                var Cookie_Session_Campaign = '__ss_cp';
                var Cookie_Session_Tracking = '__ss_tk';

                var Session_Timeout = 24 * 60 * 60 * 1000;
                var Session_Page_Timeout = 60 * 60 * 1000;
                var Session_Tracking_Lifetime = 60 * 60 * 24 * 365 * 25 * 1000;
                var ENDPOINT_URL = 'https://koi.sharpspring.com/net';

                var url_parser = document.createElement('a');
                var documentHiddenVar = null;
                var responses = [];
                var lastPageResponse = null;
                var responseCallback = null;
                var trackingID = null;

                logger.push('Variables Initialized');

                function init() {

                    params.rf = document.referrer;
                    params.hn = location.hostname;
                    params.lg = (navigator.userLanguage || navigator.language);
                    params.sr = getScreenResolution();
                    params.cd = screen.colorDepth;
                    params.vr = version;

                    documentHiddenVar = setDocHiddenListeners(); // only run the queue if the screen is visible

                    logger.push('Running queue');
                    runQueue();
                    logger.push('Queue finished');
                }

                function isVisible() {
                    return (!documentHiddenVar || !document[documentHiddenVar]);
                }

                function runQueue() {
                    if (isVisible()) {
                        setSession();
                        while (queue.length > 0) {
                            run(queue.shift());
                        }
                    }
                }

                // Public
                this.push = function(args) {
                    if (isVisible()) {
                        run(args);
                    } else {
                        queue.push(args);
                    }
                };

                this.handleResponse = function(resp) {
                    responses.push(resp);

                    if (resp && resp.hasOwnProperty('type') && resp.type === 'page') {
                        lastPageResponse = resp;
                    }

                    if (resp && resp.hasOwnProperty('trackingID')) {

                        var tk = params.tk ? params.tk : resp.trackingID;
                        setCookie(Cookie_Session_Tracking, tk, {expires: Session_Tracking_Lifetime});
                    }

                    if (resp && resp.hasOwnProperty('phoneNumber')) {
                        insertPhoneNumbers(resp.phoneNumber);
                    }

                    if (typeof responseCallback === 'function') {
                        try { responseCallback(resp); } catch(err) {}
                    }

                };

                this.getVersion = function() {
                    return version;
                };

                this.getHistory = function() {
                    return history;
                };

                this.getResponseHistory = function () {
                    return responses;
                }

                this.getLastResponse = function () {
                    return lastPageResponse;
                }

                // Private
                function run(args) {

                    var copy = args.concat();
                    var func = copy.shift();

                    try {
                        if (api[func]) {
                            logger.push('Call ' + func);
                            (api[func]).apply(self, copy);
                            history.push(['CALL', args]);
                        } else {
                            history.push(['ERROR', args]);
                        }
                    } catch (err) {
                        errReport(err, func);
                        if (console && typeof console.warn == 'function') {
                            console.warn('tracking failed', func);
                        }
                    }
                }


                // Logging
                api._setDomain = function(domain) {
                    ENDPOINT_URL = domain;
                };

                api._setAccount = function(accountNumber) {
                    account = accountNumber;
                    params.ac = account;
                };

                api._setResponseCallback = function(callback) {
                    responseCallback = callback;
                };

                api._trackPageView = function() {
                    var extras = {'tp': 'page', 'ti': document.title};
                    var qstr = getParams(extras);
                    loadScript(qstr);
                };

                api._setTransaction = function(transaction) {
                    transaction['tp'] = 'setTransaction';
                    var qstr = getParams(transaction);
                    loadScript(qstr);
                };

                api._addTransactionItem = function(transactionItem) {
                    transactionItem['tp'] = 'addTransactionItem';
                    var qstr = getParams(transactionItem);
                    loadScript(qstr);
                };

                api._completeTransaction = function(transaction) {
                    transaction['tp'] = 'completeTransaction';
                    var qstr = getParams(transaction);
                    loadScript(qstr);
                };

                api._trackCampaign = function(campaignID) {

                    setCookie(Cookie_Session_Campaign, campaignID, {expires: (90 * 24 * 60 * 60 * 1000)});

                    var extras = {'tp': 'tags', 'cp': campaignID};
                    var qstr = getParams(extras);
                    loadScript(qstr);
                };

                api._trackEvent = function(eventName, note) {
                    var extras = {'tp': 'event', 'ev': eventName, 'nt': note};
                    var qstr = getParams(extras);
                    loadScript(qstr);
                };

                api._trackCustom = function(key, value) {
                    var extras = {'tp': 'custom', 'ck': key, 'cv': value};
                    var qstr = getParams(extras);
                    loadScript(qstr);
                };


                // Utils
                function loadScript(queryStr) {

                    var script = document.createElement('script');
                    var loaded = false;
                    script.src = (ENDPOINT_URL + '?' + queryStr);
                    script.onload = script.onreadystatechange = function(loadEvent){
                        if (!loaded && (!this.readyState || this.readyState === "loaded" || this.readyState === "complete")) {
                            script.parentNode.removeChild(script);
                            loaded = true;
                        }
                    };

                    document.getElementsByTagName('head')[0].appendChild(script);
                }

                function setCookie(key, value, options) {

                    if (value === null || value === undefined) {
                        options.expires = -1;
                    }

                    if (typeof options.expires === 'number') {
                        var millisecs = options.expires;
                        var now = (new Date()).getTime();
                        options.expires = (new Date(now + millisecs));
                    }

                    options.path = options.path || '/';

                    value = String(value);

                    return (document.cookie = [
                        encodeURIComponent(key), '=', options.raw ? value : encodeURIComponent(value),
                        options.expires > 0 ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
                        options.path    ? '; path=' + options.path : '',
                        options.domain  ? '; domain=' + options.domain : '',
                        options.secure  ? '; secure' : ''
                    ].join(''));
                }

                function getCookie(cookie_name) {

                    if (cookie_name) {
                        var results = document.cookie.match ( '(^|;) ?' + cookie_name + '=([^;]*)(;|$)' );

                        if ( results ) {
                            return ( unescape ( results[2] ) );
                        }

                        return null;

                    }

                    return document.cookie;
                }

                function setDocHiddenListeners() {

                    var hidden = "hidden";

                    // Standards:
                    if (hidden in document) {
                        document.addEventListener("visibilitychange", onVisibleChange);
                    } else if ((hidden = "mozHidden") in document) {
                        document.addEventListener("mozvisibilitychange", onVisibleChange);
                    } else if ((hidden = "webkitHidden") in document) {
                        document.addEventListener("webkitvisibilitychange", onVisibleChange);
                    } else if ((hidden = "msHidden") in document) {
                        document.addEventListener("msvisibilitychange", onVisibleChange);
                    } else {
                        hidden = null;
                    }

                    return hidden;
                }

                function onVisibleChange() {
                    runQueue();
                }


                function setSession() {

                    params.se = getCookie(Cookie_Session_Name);
                    params.tk = getCookie(Cookie_Session_Tracking);

                    var lastHost = null;
                    var lastPage = null;

                    if (!params.se) {

                        params.se = (new Date()).getTime();

                    } else if (!session) {

                        lastPage = getCookie(Cookie_Session_Referrer);
                        url_parser.href = document.referrer;

                        if (lastPage && lastPage.length) {

                            url_parser.href = lastPage;
                            if (url_parser.hostname == App_Hostname || location.hostname == url_parser.hostname) {
                                params.rf = lastPage;
                            } else {
                                params.se = (new Date()).getTime();
                            }

                        } else if (!document.referrer.length || url_parser.hostname != location.hostname) {
                            params.se = (new Date()).getTime();
                        }

                    }

                    session = params.se; // needs to be false the first time so that it doesn't get reset when grabbing the cookie

                    setCookie(Cookie_Session_Name, session, {expires: Session_Timeout});
                    setCookie(Cookie_Session_Referrer, location.href, {expires: Session_Page_Timeout});
                    return session;
                }


                function getParams(extras) {

                    setSession();
                    params.ts = (new Date().getTime()).toString();

                    var p, getVars = [];
                    params.ts = Math.round((new Date().getTime() / 1000));

                    for (p in params) {
                        if (params[p]) {
                            getVars.push(encodeURIComponent(p) +'='+ encodeURIComponent(params[p]));
                        }
                    }

                    for (p in extras) {
                        getVars.push(encodeURIComponent(p) +'='+ encodeURIComponent(extras[p]));
                    }

                    return getVars.join('&');
                }

                function getScreenResolution() {
                    return window.screen.width + 'x' + window.screen.height;
                }

                function insertPhoneNumbers(phoneNumber) {

                    var phoneElements = document.getElementsByClassName('ss-phone');
                    var el;

                    for (var i=0; i < phoneElements.length; i++) {
                        el = phoneElements[i];

                        el.innerHTML = phoneNumber['display'];
                        if (el.nodeName === 'A') {
                            el.href = 'tel: +' + phoneNumber['e164'];
                        }
                    }

                }

                init();
            }

            // Startup Client on Document Ready
            onReady(function() {
                logger.push('Page ready');
                if (!installed) {
                    _ss = (new ss_client(client));
                    logger.push('Installed');
                    installed = true;
                }
            });

        } )(_ss);

    } catch (err) {

        onReady(function() {
            errReport(err, 'catchall');
        });
    }

})();
