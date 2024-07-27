const TOKEN_ENDPOINT = "https://passport-test.proisource.ru/auth/realms/master/protocol/openid-connect/token"

export default function fetchToken(code, responseFn) {
    const details = {
        "code": code,
        "grant_type": "authorization_code",
        "client_id": "gpnmarket-test",
        "redirect_uri": "https://processor-test.proisource.ru/zxc"
    }
    var formBody = [] 
    for (var property in details) {
        var key = encodeURIComponent(property)
        var value = encodeURIComponent(details[property])
        formBody.push(key + "=" + value)
    }
    formBody = formBody.join("&")
    fetch(TOKEN_ENDPOINT, {
        method: "POST",
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formBody
    })
        .then(response => response.json())
        .then(response => {
            responseFn(response.access_token)
        })
        .catch(error => {
            console.log(error);
        })
}