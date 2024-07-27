const DOWNLOAD_URL = "https://processor-test.proisource.ru/api/requests/documents/{}/download"

String.prototype.format = function () {
    var i = 0, args = arguments;
    return this.replace(/{}/g, function () {
        return typeof args[i] != 'undefined' ? args[i++] : '';
    });
};

export default function downloadDocument(token, documentID, responseFn) {
    responseFn(chrome.downloads.download({
        url: DOWNLOAD_URL.format(documentID),
        headers: [
            { name: "Authorization", value: "Bearer " + token }
        ]
    }));
}