let time = Date.now();

const printTimeElapsed = (message = '') => {
    const timeElapsed = "" + (Date.now() - time)
    time = Date.now()
    console.log(`Time elapsed since last call: ${timeElapsed}ms ${message ? `(${message})` : ''}`)
}

// printTimeElapsed()

const config = {
    domain: "coders51.eu.auth0.com",
    clientId: "kAadazt98UyBLW8NrYtvxUIBoIhAKiOG"
}

const attachListeners = () => {
    const loginButton = document.querySelector('[auth0-login]')
    if (loginButton) {
        loginButton.addEventListener('click', () => login())
    }

    const logoutButton = document.querySelector('[auth0-logout]')
    if (logoutButton) {
        logoutButton.addEventListener('click', () => logout())
    }
}

const login = async () => {
    await auth0.loginWithRedirect({
        redirect_uri: window.location.origin + '/coders51-b'
    })
}

const isLoggedOut = () => {
    const invalidLogoutPaths = [
        '/coders51-b',
    ];

    const currentLocation = window.location.pathname
    return invalidLogoutPaths.indexOf(currentLocation) == -1
}

const logout = (logoutPath = '/coders51-a') => {
    if (!isLoggedOut()) {
        auth0.logout({
            returnTo: window.location.origin + logoutPath
        });
    }
}

const populateAuth0Element = (data, key, domAttribute = 'innerText') => {
    const elements = getElementsByAttributeValue('data-auth0', key)
    elements.map(element => {
        if (element) {
            element[domAttribute] = data[key]
        }
    })
}

const injectAuth0Metadata = (user, domain) => {
    const metadata = user[domain];
    const user_metadata = metadata.user;
    const app_metadata = metadata.app;
    Object.keys(user_metadata).forEach(k => {
        populateAuth0Element(user_metadata, k);
    });
    Object.keys(app_metadata).forEach(k => {
        populateAuth0Element(app_metadata, k);
    });
}

const updateUI = () => {
    handleElementsVisibility(isAuthenticated);
    if (user) {
        populateAuth0Element(user, 'picture', 'srcset');
        injectAuth0Metadata(user, 'https://uhubs.co.uk/metadata');
        populateAuth0Element(user, 'name');
    }
    return;
}

const getElementsByAttribute = (attribute) => {
    const nodes = document.body.querySelectorAll(`[${attribute}]`);
    return Array.from(nodes);
}

const getElementsByAttributeValue = (attribute, value) => {
    const nodes = document.body.querySelectorAll(`[${attribute}="${value}"]`);
    return Array.from(nodes);
}


const handleElementsVisibility = (isAuthenticated) => {
    const visibilityAttribute = 'data-ms-content'
    const elements = getElementsByAttribute(visibilityAttribute)
    elements.forEach(el => {
        let attributeVal = el.getAttribute(visibilityAttribute).trim();
        if (!isElementVisible(attributeVal, isAuthenticated)) {
            printTimeElapsed('login button removed')
            el.style.display = "none"
        }
    })
}

const isElementVisible = (attributeVal, isAuthenticated) => {
    if (attributeVal) {
        const isNegation = attributeVal.charAt(0) === "!"
        if (isNegation) {
            attributeVal = attributeVal.substring(1)
        }
        if (isLoggedInCondition(attributeVal)) {
            return isNegation ? !isAuthenticated : isAuthenticated
        }
    }
    return true
}

const isLoggedInCondition = (attributeVal) => {
    const potentialValues = [
        // "members",
        "loggedIn"
    ]
    return potentialValues.includes(attributeVal)
}

let auth0Init = false;
let domInit = false;
let domManipulated = false;
let auth0 = null;
let token = null;
let user = null;
let isAuthenticated = null;
const configureClient = async () => {
    printTimeElapsed('configure client')
    auth0 = await createAuth0Client({
        domain: config.domain,
        client_id: config.clientId
    });
    printTimeElapsed('configure client end')
}

triggerDOMManipulation = () => {
    if (auth0Init && domInit && !domManipulated) {
        attachListeners()
        updateUI();
        domManipulated = true;
    }
}

const handleAuth0 = async () => {
    if (auth0) {
        return
    }
    await configureClient();

    // check for the code and state parameters
    const query = window.location.search;
    if (query.includes('code=') && query.includes('state=')) {

        // Process the login state
        await auth0.handleRedirectCallback();

        // Use replaceState to redirect the user away and remove the querystring parameters
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    isAuthenticated = await auth0.isAuthenticated();
    if (!isAuthenticated) {
        logout();
    } else {
        user = await auth0.getUser();
    }
    auth0Init = true;
    triggerDOMManipulation()
}

const bootstrapIntegration = () => {
    handleAuth0()
    window.onload = () => {
        triggerDOMManipulation()
    }
}

bootstrapIntegration()