// reference: https://medium.com/@akashjha9041/how-to-represent-large-numbers-in-your-node-js-app-f0bccec01c75

const http = require('http');
const url = require('url');
const querystring = require('querystring');
const fs = require('fs');
const util = require('util');
const { createServer } = http;
const moment = require('moment')

req_count = 0;
err_count = 0;

const server = createServer((req, res) => {

    const parsedUrl = url.parse(req.url);
    const queryParams = querystring.parse(parsedUrl.query);
    req_count++;

    if (parsedUrl.pathname === '/ping') {
        res.writeHead(204);
        res.end();
    } else if (parsedUrl.pathname === '/anagram') {
        if (!queryParams.p || queryParams.p.length === 0) {
            res.writeHead(400);
            res.end();
            err_count++;
        } else {
            const p = queryParams.p;
            if (!isValidString(p)) {
                res.writeHead(400);
                res.end();
                err_count++;
            } else {
                const anagram_count = calculateAnagrams(p);
                const responseBody = JSON.stringify({
                    p: p,
                    //total: anagram_count.toString()
                    //reference: https://stackoverflow.com/questions/10943997/how-to-convert-a-string-containing-scientific-notation-to-correct-javascript-num
                    total: anagram_count.toLocaleString('fullwide', {useGrouping:false})
                    //https://stackoverflow.com/questions/1685680/how-to-avoid-scientific-notation-for-large-numbers-in-javascript/50978675#50978675
                    //total: fromExponential(anagram_count).toString()//eToNumber(anagram_count)
                });
                res.writeHead(200, {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(responseBody)
                });
                res.end(responseBody);
            }
        }
    } else if (parsedUrl.pathname === '/secret') {
        const secretPath = '/tmp/secret.key';
        if (fs.existsSync(secretPath)) {
            const secret = fs.readFileSync(secretPath, 'utf-8');
            res.writeHead(200, {
                'Content-Type': 'text/plain',
                'Content-Length': Buffer.byteLength(secret)
            });
            res.end(secret);
        } else {
            res.writeHead(404);
            res.end();
            err_count++;
        }
    } else if (parsedUrl.pathname === '/status') {
        const responseBody = JSON.stringify({
            //https://momentjs.com
            // YYYY-MM-DDTHH:mm:ssZ
            //time: moment(new Date()).format(YYYY-MM-DDTHH:mm:ssz),
            time: moment(new Date()).format(),
            req: req_count,
            err: err_count
        });
        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(responseBody)
        });
        res.end(responseBody);
    } else {
        res.writeHead(404);
        res.end();
        err_count++;
    }

    function isValidString(s) {
        return /^[a-zA-Z]+$/.test(s) && s.length > 0;
    }



    function calculateAnagrams(s) {
        s = s.toLowerCase();
        const hist = Array(26).fill(0);
        for (const letter of s) {
            const index = letter.charCodeAt(0) - 'a'.charCodeAt(0);
            hist[index]++;
        }
    
        let totalPermutations = BigInt(1) * factorial2(s.length);

        for (const count of hist) {
            totalPermutations /= factorial2(count);
        }
        return totalPermutations;
    }

    function factorial2(n) {
        let result = BigInt(1);
        for (let i = BigInt(1); i <= BigInt(n); i++) {
            result *= i;
        }
        return result;
    }
});

const serverPort = 8088;
server.listen(serverPort, 'localhost', () => {
    console.log(`Server listening on http://localhost:${serverPort}`);
});
