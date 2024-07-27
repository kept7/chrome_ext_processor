const INFO_ENDPOINT = "https://processor-test.proisource.ru/api/positions/{}/info"

String.prototype.format = function () {
    var i = 0, args = arguments;
    return this.replace(/{}/g, function () {
        return typeof args[i] != 'undefined' ? args[i++] : '';
    });
};

export default function fetchPositionInfo(token, firstPositionID, responseFn) {
    fetch(INFO_ENDPOINT.format(firstPositionID), {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token
        }
    })
        .then(response => response.json())
        .then(response => responseFn(response))
}