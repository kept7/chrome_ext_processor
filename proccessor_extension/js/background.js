import fetchAuthCode from "./api/fetchAuthCode.js";
import fetchToken from "./api/fetchToken.js";
import fetchInfo from "./api/fetchInfo.js";
import fetchPositionInfo from "./api/fetchPositionInfo.js";
import downloadDocument from "./api/downloadDocument.js";
import getFile from "./api/getFile.js";
import uploadDocument from "./api/uploadDocument.js";

(async () => {
    let authCode = ""
    const currentCookies = {}
    const newRules = getRules();
    const oldRules = await chrome.declarativeNetRequest.getDynamicRules();
    const oldRuleIds = oldRules.map(rule => rule.id);

    chrome.runtime.onInstalled.addListener(details => {
        console.log("ext installed")
    })
    // Use the arrays to update the dynamic rules
    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: oldRuleIds,
        addRules: newRules
    })

    chrome.webRequest.onHeadersReceived.addListener(
        responseListener,{urls: ["https://passport-test.proisource.ru/*", "https://processor-test.proisource.ru/*"]}, ["responseHeaders"]
    );

    chrome.downloads.onChanged.addListener(function (delta) {
        if (delta.state && delta.state.current === 'complete') {
            chrome.downloads.search({ id: delta.id }, function (results) {
                if (results.length && results[0].state === 'complete') {
                    const filePath = results[0].filename;

                    chrome.storage.local.set({ [delta.id]: filePath }, function () {
                        console.log(`File ${delta.id} saved temporarily at ${filePath}`);
                    });
                }
            });
        }
    });

    chrome.tabs.onUpdated.addListener(async (tabID, changeInfo, tab) => {
        if (tab.url && tab.url.includes("https://processor-test.proisource.ru")) {
            getCookies("https://passport-test.proisource.ru/auth/realms/master/", "AUTH_SESSION_ID", function (v) {
                if (changeInfo.status === "complete") {
                    chrome.tabs.sendMessage(tabID, {
                        "value": v,
                        "key": "AUTH_SESSION_ID",
                    }, handleCookieResponse)
                }
            })
            getCookies("https://passport-test.proisource.ru/auth/realms/master/", "KEYCLOAK_IDENTITY", function (v) {
                if (changeInfo.status === "complete") {
                    chrome.tabs.sendMessage(tabID, {
                        "value": v,
                        "key": "KEYCLOAK_IDENTITY",
                    }, handleCookieResponse)
                }
            })

            getCookies("https://passport-test.proisource.ru/auth/realms/master/", "KEYCLOAK_SESSION", function (v) {
                if (changeInfo.status === "complete") {
                    chrome.tabs.sendMessage(tabID, {
                        "value": v,
                        "key": "KEYCLOAK_SESSION",
                    }, handleCookieResponse)
                }
            })

            for (const [k, value] of Object.entries(currentCookies)) {
                chrome.cookies.set({url: "https://passport-test.proisource.ru/", name: k, value: value})
            }
        }
    })

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.action === "token") {
            fetchAuthCode()
            setTimeout(() => {
                fetchToken(authCode, sendResponse)
            }, 1000)
        }
        if (request.action === "info") {
            fetchInfo(
                request.token,
                request.backofficeID,
                sendResponse
            )
        }
        if (request.action === "position_info") {
            fetchPositionInfo(
                request.token,
                request.firstPositionID,
                sendResponse
            )
        }
        if (request.action === "download") {
            downloadDocument(
                request.token,
                request.documentID,
                sendResponse
            )
        }
        if (request.action === "get_file") {    
            getFile(
                request.filePath,
                sendResponse
            )
        }
        if (request.action === "upload") {
            uploadDocument(
                request.token,
                request.backofficeID,
                request.positionID,
                request.fileArrayBuffer,
                request.filename,
                request.mime,
                sendResponse
            )
        }
        return true
    })

    function getRules() {
        return [
            {
                "id": 1,
                "priority": 1,
                "action": {
                    "type": "modifyHeaders",
                    "requestHeaders": [
                        { "header": "Referer", "operation": "set", "value": "https://processor-test.proisource.ru/positions" }
                    ]
                },
                "condition": {
                    "urlFilter": "https://passport-test.proisource.ru/*",
                    "resourceTypes": ["xmlhttprequest"] 
                }
            },
            {
                "id": 2,
                "priority": 1,
                "action": {
                    "type": "modifyHeaders",
                    "requestHeaders": [
                        { "header": "Origin", "operation": "set", "value": "https://processor-test.proisource.ru" }
                    ]
                },
                "condition": {
                    "urlFilter": "https://processor-test.proisource.ru/*",
                    "resourceTypes": ["xmlhttprequest"] 
                }
            }
        ]
    }

    // chrome.declarativeNetRequest.updateDynamicRules({
    //     addRules: [{
    //         "id": 1,
    //         "priority": 1,
    //         "action": {
    //             "type": "modifyHeaders",
    //             "requestHeaders": [
    //                 { "header": "Referer", "operation": "set", "value": "https://processor-test.proisource.ru/positions" }
    //             ]
    //         },
    //         "condition": {
    //             "urlFilter": "https://passport-test.proisource.ru/*",
    //             "resourceTypes": ["xmlhttprequest"] // see available https://developer.chrome.com/docs/extensions/reference/declarativeNetRequest/#type-ResourceType
    //         }
    //     }],
    // })

    function getCookies(domain, name, callback) {
        chrome.cookies.get({ "url": domain, "name": name }, function (cookie) {
            if (callback) {
                callback(cookie.value)
            }
        })
    }

    function handleCookieResponse(response) {
        currentCookies[response.key] = response.value;
    }

    function responseListener(details) {
        const headers = details.responseHeaders;
        for (let i = 0; i < headers.length; i++) {
            if (headers[i].name.toLowerCase() == "location" && headers[i].value.includes("zxc")) {
                const urlParams = new URLSearchParams(headers[i].value.replace("#", "?"))
                authCode = urlParams.get("code")
                console.log("found zxc redirection")
            }
        }
    }
})();

// https://processor-test.proisource.ru/positions#session_state=c43e3f13-57ec-42fa-881f-5d1dfb9bfb02&code=64d4504c-79ff-4cb9-ae01-1990f3061165.c43e3f13-57ec-42fa-881f-5d1dfb9bfb02.96cef336-d00e-43c2-a97b-30325a56e893