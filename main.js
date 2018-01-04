const translate   = require('./lib/google-translate-api');
const express = require('express');
const bodyParser = require('body-parser');

let app = express();

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

const languages = ['de', 'ru', 'pt', 'nl', 'fr', 'it', 'es', 'pl'];

function translateAll(text, cb, i, result) {
    i = i || 0;
    result = result || {en: text};
    if (i >= languages.length) {
        cb(null, result);
        return;
    }
    const lang = languages[i];
    translate(text, {to: lang, from: 'en'}).then(_res => {
        result[lang] = _res.text;
        if (i + 1 >= languages.length) {
            cb(null, result);
        } else {
            setTimeout(translateAll, 100, text, cb, i + 1, result);
        }
        //=> nl
    }).catch(err => {
        console.error(err);
        setTimeout(translateAll, 100, text, cb, i + 1, result);
    });
}

app.post('/translate', function (req, res) {
    let text = req.param('text', '');
    let together = req.param('together', '');
    if (!text) {
        res.send('Please set text');
        return;
    }
    text = text.replace(/\n$|^\n/, '');
    translateAll(text, function (err, result) {
        if (err) {
            res.send(err);
        } else {
            if (together === 'true') {
                res.send(result);
            } else {
                let lines = text.split('\n');
                let commonResult = {};
                for (let lang in result) {
                    if (result.hasOwnProperty(lang)) {
                        let words = result[lang].split('\n');
                        for (let word = 0; word < lines.length; word++) {
                            commonResult[lines[word]] = commonResult[lines[word]] || {};
                            commonResult[lines[word]][lang] = words[word];
                        }
                    }
                }

                res.send(commonResult);
            }
        }
    });
});

app.listen(3000);
