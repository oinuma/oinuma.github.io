(function(formInfo){

    var self = this;
    var queue = formInfo;
    var baseURI = 'https://app.sharpspring.com/webforms/receivePostback/';
    var endpoint = '';
    var forms = document.forms;
    var validation = null;
    var hasEventHandling = false;
    var useValidation = false;
    var formElement = null;
    var submitButton = null;
    var submitClick = null;
    var submitFormToSS = true;
    var manualSubmission = false;
    var Cookie_Session_Tracking = '__ss_tk';

    var submitForm = function(form) {
        if (form && form.submit && typeof form.submit === 'function') {
            form.submit();
        } else if (form && form.submit) {
            var tForm = document.createElement("form");
            tForm.submit.apply(form);
        }
    };

    var onRequest = function(event, form, submitEvent) {

        if (!manualSubmission) {

            if (typeof validation === 'function' && !useValidation) {

                try {
                    var result = validation(submitEvent);
                    if (result || result === undefined) {
                        submitForm(form);
                    }
                } catch (err) {
                    submitForm(form);
                }

            } else if (!manualSubmission) {
                submitForm(form);
            }
        }

    }


    var getInputValue = function(input) {
        var value = false;

        switch (input.type) {

            case 'radio':
            case 'checkbox':
                if (input.checked) {
                    value = input.value;
                }
                break;

            case 'text':
            case 'hidden':
            default:
                value = input.value;
                break;

        }

        return value;

    };


    var fieldNameExp = /\[([^\[]*)\]/g;
    var onSubmit = function(event, callback) {

        if (!submitFormToSS) {
            return true;
        }


        try {

            event && event.preventDefault && event.preventDefault();

            if (useValidation && typeof validation === 'function') {
                if (!validation(event)) { return false; }
            }

            var form = formElement || event.currentTarget;
            var params = [];
            var value = false;
            var values = [];
            var formField = null;
            var multiple = false;
            var elementsByName = {};
            var cleanName;
            var trackingID = getCookie(Cookie_Session_Tracking);

            for (var i=0; i < form.elements.length; i++) {

                formField = form.elements[i];
                multiple = false;

                if (formField.name) {

                    cleanName = formField.name.replace(fieldNameExp, "_$1");
                    if (!elementsByName[cleanName]) { elementsByName[cleanName] = []; }

                    switch (formField.nodeName) {

                        case 'INPUT':
                            value = getInputValue(formField);
                            if (value === false) { continue; }
                            break;

                        case 'SELECT':
                            if (formField.multiple) {
                                values = [];
                                multiple = true;

                                for (var j = 0; j < formField.length; j++) {
                                    if (formField[j].selected) {
                                        values.push(encodeURIComponent(formField[j].value));
                                    }
                                }

                            } else {
                                value = (formField.value);
                            }
                            break;

                        case 'TEXTAREA':
                            value = formField.value;
                            break;

                    }

                    if (value) {
                        elementsByName[cleanName].push(multiple ? values.join(',') : encodeURIComponent(value));
                    }

                }

            }

            for (var elementName in elementsByName) {
                params.push( elementName + '=' + elementsByName[elementName].join(',') );
            }

            if (trackingID && trackingID.length) {
                params.push('trackingid__sb=' + trackingID);
            }

            var loaded = false;
            var head = document.getElementsByTagName("head")[0] || document.documentElement;
            var script = document.createElement('script');

            script.src = (baseURI + endpoint + '/jsonp/?' + params.join('&'));
            script.onload = script.onreadystatechange = function(loadEvent){

                if (!loaded && (!this.readyState || this.readyState === "loaded" || this.readyState === "complete")) {
                    if (!manualSubmission){
                        onRequest(loadEvent, form, event);
                    }

                    if (typeof callback === 'function') {
                        callback(form);
                    }

                    loaded = true;

                    // Handle memory leak in IE
                    script.onload = script.onreadystatechange = null;
                    if ( head && script.parentNode ) {
                        head.removeChild( script );
                    }
                }

            };
            head.insertBefore( script, head.firstChild );

            return false;

        } catch (err) {

            if (console && console.warn) {
                console.warn(err);
            }

            return true; // don't prevent form from submitting
        }

    };

    var methods = {

        'baseURI': function(uri) {
            baseURI = uri;
        },

        'endpoint': function(uri) {
            endpoint = uri;
        },

        'validate': function(method) {
            validation = method;
            useValidation = true;
        },

        'submitType': function(type) {
            if (type === 'manual') {
                if (formElement) { formElement.onsubmit = null; }
                manualSubmission = true;
            } else {
                manualSubmission = false;
            }
        },

        'form': function(id) {
            formElement = document.getElementById(id);
            setForm(formElement);
        },

        'submit': function(callback) {
            if (formElement) {
                onSubmit({currentTarget: formElement}, callback);
            }
        },

        'submitButton': function(id) {
            submitButton = document.getElementById(id);
            setFormSubmitButton(submitButton);
        }

    };

    var getCookie = function(cookie_name) {

        if (cookie_name) {
            var results = document.cookie.match ( '(^|;) ?' + cookie_name + '=([^;]*)(;|$)' );

            if ( results ) {
                return ( unescape ( results[2] ) );
            }

            return null;

        }

        return document.cookie;
    };

    var run = function(queue) {

        var item;

        while (item = queue.pop()) {

            if (methods.hasOwnProperty(item[0]) && typeof methods[item[0]] === 'function') {
                methods[item[0]](item[1]);
            }

        }

    }

    var onSubmitClick = function(event) {
        submitClick = event;
    }

    var setFormSubmitButton = function(button) {
        button.onclick = onSubmitClick;
    }

    var setForm = function(form) {
        var fields;

        fields = form.getElementsByTagName('input');
        for (var j = 0; j < fields.length; j++) {
            if (fields[j].type === 'submit' && fields[j].onclick) {
                validation = fields[j].onclick;
                fields[j].onclick = null;
                hasEventHandling = true;
            }

            if (fields[j].type === 'submit' && fields[j].name) {
                var inputBtnHidden = document.createElement("input");
                inputBtnHidden.setAttribute("type", "hidden");
                inputBtnHidden.setAttribute("name", fields[j].name);
                inputBtnHidden.setAttribute("value", fields[j].value);
                form.appendChild(inputBtnHidden);
            }
        }

        fields = form.getElementsByTagName('button');
        for (var j = 0; j < fields.length; j++) {
            if (fields[j].type === 'submit' && fields[j].onclick) {
                validation = fields[j].onclick;
                fields[j].onclick = null;
                hasEventHandling = true;
            }
        }

        if (typeof form.onsubmit === 'function') {
            validation = form.onsubmit;
            form.onsubmit = null;
            hasEventHandling = true;
        }

        form.onsubmit = onSubmit;


        formElement = form;
    };


    var init = function() {

        run(formInfo);

        var form, fields;

        if (!formElement) {
            for (var i = 0; i < forms.length; i++) {
                form = forms[i];

                if (form.method === 'post') {

                    setForm(form);
                    break;
                }
            }
        }

        window.__ss_noform = this;
    };

    this.push = function(args) {
        run([args]);
    };

    init();

})(__ss_noform);