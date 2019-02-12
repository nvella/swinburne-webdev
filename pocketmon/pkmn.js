const API = "https://parseapi.back4app.com/classes/Pocketmon";
const HEADERS = {
    'X-Parse-Application-Id': 'sndrZ8SAfycAadxEdZySp7Z8CY1sypOVAxNczJye',
    'X-Parse-REST-API-Key': 'f1RgPr2fuaLq6Qo44DtHo662tgLNFik0x6Xeeuir',
    'Content-Type': 'application/json'
};

const createPocketmon = pocketmon => fetch(API, {
    method: 'POST', 
    headers: HEADERS, 
    body: JSON.stringify(pocketmon)
});

const listPocketmons = () => fetch(API, {headers: HEADERS})
    .then(res => res.json())
    .then(async json => json.results);