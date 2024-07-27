const INFO_ENDPOINT = "https://processor-test.proisource.ru/api/requests/backoffice/{}/info"

String.prototype.format = function () {
    var i = 0, args = arguments;
    return this.replace(/{}/g, function () {
        return typeof args[i] != 'undefined' ? args[i++] : '';
    });
};

export default function fetchInfo(token, backofficeID, responseFn) {
    fetch(INFO_ENDPOINT.format(backofficeID), {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token
        }
    })
        .then(response => response.json())
        .then(response => responseFn(response))
}