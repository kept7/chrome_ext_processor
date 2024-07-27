import base64ToArrayBuffer from "./base64ToArrayBuffer.js";

const UPLOAD_ENDPOINT = "https://processor-test.proisource.ru/api/requests/backoffice/{}/positions/{}/documents/upload"

String.prototype.format = function () {
    var i = 0, args = arguments;
    return this.replace(/{}/g, function () {
        return typeof args[i] != 'undefined' ? args[i++] : '';
    });
};

export default function uploadDocument(token, positionID, backofficeID, fileArrayBuffer, filename, mime, responseFn) { 
    console.log(base64ToArrayBuffer(fileArrayBuffer, filename, mime))
    let data = new FormData()
    data.append("files[0]", base64ToArrayBuffer(fileArrayBuffer, filename, mime))
    fetch(UPLOAD_ENDPOINT.format(positionID, backofficeID), {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + token
        },
        body: data
    })
        .then(response => response.json())
        .then(response => {
            responseFn(response)
        })
        .catch(error => console.error(`Error applying file: ${error}`));
}