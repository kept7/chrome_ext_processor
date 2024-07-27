const AUTH_CODE_ENDPOINT = "https://passport-test.proisource.ru/auth/realms/master/protocol/openid-connect/auth?client_id=gpnmarket-test&redirect_uri=https%3A%2F%2Fprocessor-test.proisource.ru%2Fzxc&response_mode=fragment&response_type=code&scope=openid&prompt=none"

export default function fetchAuthCode() {
    fetch(AUTH_CODE_ENDPOINT, {
        method: "GET",
        redirect: "follow"
    })
        .then(response => {
            let headersStr = ""
            response.headers.forEach((value, key) => {
                headersStr += key + " = " + value + "\n"
            })
        })
        .catch(error => {
            console.log(error);
        })
}