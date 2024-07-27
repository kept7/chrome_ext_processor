const FILE_ENDPOINT = "file://{}"

String.prototype.format = function () {
    var i = 0, args = arguments;
    return this.replace(/{}/g, function () {
        return typeof args[i] != 'undefined' ? args[i++] : '';
    });
};

function arrayBufferToBase64(buffer) {
    var binary = '';
    var bytes = new Uint8Array(buffer);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export default function getFile(filePath, responseFn) { 
    fetch(FILE_ENDPOINT.format(filePath))
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => {
            return responseFn({
                data: arrayBufferToBase64(arrayBuffer)
            })
        })
        .catch(error => console.error(`Error applying file: ${error}`));
}