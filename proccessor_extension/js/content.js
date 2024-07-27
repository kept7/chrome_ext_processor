window.addEventListener('load', (event) => {
    setTimeout(() => { main() }, 450);
})

let COOKIE_VALUES = {}

String.prototype.format = function () {
    var i = 0, args = arguments;
    return this.replace(/{}/g, function () {
        return typeof args[i] != 'undefined' ? args[i++] : '';
    });
};

const creatingBtn = async () => {
    const uploadBtnExists = document.getElementsByClassName("upload-button")[0];
    const presentActiveTab = document.querySelector(".app-tabs-item-active").textContent.split(" ")[1];

    if (!uploadBtnExists && presentActiveTab == "Позиции") {
        const uploadBtn = document.createElement("button");
        
        uploadBtn.className = "extension-btn " + "upload-button";
        uploadBtn.innerHTML = "Перенести файлы";

        processorLeftControls = document.getElementsByClassName("app-justify-content-end")[0];

        processorLeftControls.prepend(uploadBtn);
        return true
    } else if (presentActiveTab != "Позиции") {
        return false
    } else {
        return true
    } 
}

function btnAccess() {
    const positionsQuantityAmount = document.querySelectorAll("span.app-ghost-color")[0].textContent.split("(")[1].split(")")[0]
    const requestFilesQuantityAmount = document.querySelectorAll("span.app-ghost-color")[1].textContent.split("(")[1].split(")")[0]

    uploadBtn = document.getElementsByClassName("upload-button")[0]
    if(positionsQuantityAmount <= 0) {
        uploadBtn.classList.add("disabled");
        uploadBtn.title = "Позиции в заявке отсутствуют";
    } else if(parseInt(requestFilesQuantityAmount) <= 0) {
        uploadBtn.classList.add("disabled");
        uploadBtn.title = "В заявке отсутствуют файлы для загрузки";
    } else if(positionsQuantityAmount <= 0 || parseInt(requestFilesQuantityAmount) <= 0) {
        uploadBtn.classList.add("disabled");
        uploadBtn.title = "Позиции в заявке отсутствуют и в заявке отсутствуют файлы для загрузки";
    } else {
        return true
    }
}

// function creatingBtn() {
//     const uploadBtnExists = document.getElementsByClassName("upload-button")[0];

//     if (!uploadBtnExists) {
//         const uploadBtn = document.createElement("img");

//         // uploadBtn.src = chrome.runtime.getURL("icons/logo.png");
//         uploadBtn.className = "extension-btn " + "upload-button";
//         uploadBtn.title = "Click to upload files";

//         processorLeftControls = document.getElementsByClassName("app-justify-content-end")[0];

//         processorLeftControls.prepend(uploadBtn);
//     }
// }

const uploadFiles = () => {
    console.log("Button clicked");
    procedureBtnClick();

    // const positionsQuantity = document.getElementsByClassName("request-table-first-column").length
    // if (positionsQuantity <= 0) {
    //     alert("Позиции в заявке отсутствуют.")
    // } else {
    //     const requestFilesQuantity = document.getElementsByClassName("list-unstyled gridable").length
    //     if (requestFilesQuantity == 0) {
    //         alert("В заявке отсутствуют файлы для загрузки.")
    //     } else {
    //         procedureBtnClick
    //     }
    // };
}

async function procedureBtnClick() {
    chrome.storage.local.clear()
    let token = await forwardRequest({action: "token"})
    const positionLink = document.getElementsByClassName("app-breadcrumbs-breadcrumb")[1].href
    const backofficeID = positionLink.split("/")[5]
    const positionIDs = getPositionIDs()
    let info = await forwardRequest({action: "info", token: token, backofficeID: backofficeID})
    let requestInfoSnapshot = info.data.documents
    console.log(requestInfoSnapshot)
    let initialFirstPositionInfo = await forwardRequest({action: "position_info", token: token, firstPositionID: positionIDs[0]})
    let initialFirstPositionInfoSnapshot = initialFirstPositionInfo.data.documents
    console.log(initialFirstPositionInfoSnapshot)

    let filenameArray = []
    let mimeArray = []
    info.data.documents.forEach((d) => {
        forwardRequest({action: "download", token: token, documentID: d.id})
        filenameArray.push(d.filename)
        mimeArray.push(d.mime)
    })

    let files = {}
    let fileNames = {}
    let filesMimes = {}
    const mimes = {
        "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "pdf": "application/pdf",
        "txt": "text/plain"
    }
    setTimeout(async () => {
        let result = await chrome.storage.local.get(null);
        console.log(result)
        for (var key in result) {
            const filePath = result[key];
            let file = await forwardRequest({ action: "get_file", filePath: filePath });
            files[key] = file;
            console.log(files);
            
            filesMimes[key] = mimes[result[key].split(".")[1]]
            console.log(filesMimes)

            fileNames[key] = result[key].split("\\")[4]
            console.log(fileNames)
        }
    }, 1000)

    var timeout = setInterval(async () => {
        console.log("checking files")
        if (Object.keys(files).length !== 0) {
            clearInterval(timeout)
            for (const positionID of positionIDs) {
                for (const [key, value] of Object.entries(files)) {
                    forwardRequest({
                        action: "upload",
                        token: token,
                        backofficeID: backofficeID,
                        positionID: positionID,
                        fileArrayBuffer: value.data,
                        filename: fileNames[key],
                        mime: filesMimes[key]
                    })
                }
            }
            uploadSuccess(token, positionIDs, requestInfoSnapshot, initialFirstPositionInfoSnapshot)
        }
    }, 100)
}

async function uploadSuccess(token, positionIDs, requestInfoSnapshot, initialPositionInfoSnapshot) {
    let finitePositionInfo = await forwardRequest({action: "position_info", token: token, firstPositionID: positionIDs[0]})
    let finitePositionInfoSnapshot = finitePositionInfo.data.documents

    console.log(requestInfoSnapshot.length)
    console.log(initialPositionInfoSnapshot.length)
    console.log(finitePositionInfoSnapshot.length)
    if ((initialPositionInfoSnapshot.length - finitePositionInfoSnapshot.length) === requestInfoSnapshot.length) {
        alert("Файлы успешно перенесены в первую по счёту позицию!")
    } else {
        alert("Перенос файлов не удался!")
    }
}

function appJustifyExists() {
    const appJustify = document.getElementsByClassName("app-justify-content-end").length;
    return appJustify
}

chrome.runtime.onMessage.addListener((obj, sender, response) => {
    COOKIE_VALUES[obj.key] = obj.value;
    response({
        key: obj.key,
        value: obj.value
    })
})

function forwardRequest(message) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(message, (response) => {
            console.log(response)
            if (!response) return reject(chrome.runtime.lastError)
            return resolve(response)
        })
    })
}

function getPositionIDs() {
    const IDs = []
    const positionsList = document.getElementsByClassName("position-link")
    Array.from(positionsList).forEach((i) => {
        if (i.hasAttribute("href")) {
            IDs.push(i.href.split("/")[5])
        }
    })
    console.log(IDs)
    return IDs
}

function deleteFile(id) {
    chrome.downloads.removeFile(Number(id), () => {
        chrome.storage.local.remove(id, () => {
            console.log(`File ${id} deleted`);
        });
    });
}


function main() {
    setInterval(() => {
        creatingBtn().then((result) => {
            if (result == true) {
                setInterval(() => { btnAccess() }, 350);
                if (btnAccess() == true) {
                    console.log("Buttonns Access Approve")
                    uploadBtn = document.getElementsByClassName("upload-button")[0];
                    uploadBtn.addEventListener("click", uploadFiles);
                    if (uploadBtn.addEventListener("click", uploadFiles) === true) {
                        uploadSuccess();
                    }
                }
            }
        })
    }, 500)

    


//     setInterval(() => { appJustifyExists() }, 250)
//     if(appJustifyExists() > 0) {
//         creatingBtn();
//         setInterval(() => { btnAccess() }, 350);
//         if (btnAccess() == true) {
//             uploadBtn = document.getElementsByClassName("upload-button")[0];
//             uploadBtn.addEventListener("click", uploadFiles);
//             if (uploadBtn.addEventListener("click", uploadFiles) === true) {
//                 uploadSuccess();
//             };
//         }
//     }
}


// надо перехватить код с ауф директион


