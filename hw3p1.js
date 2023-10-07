const express = require('express')
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const { result } = require('lodash');

const app = express();
const port = 3000;

const filePath = './data/player.json';

function readfile() {
    if (!fs.existsSync(filePath)) {

        newfile = {
            players: [],
            updated_at: moment().toISOString(),
            created_at: moment().toISOString(),
            version: "1.0",
        }
        
        return newfile;
    }

    try {
        const data = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(data);
        return jsonData;

    } catch (err) {
        console.error('Error reading the file:', err);
        return newfile;
    }
}

function writetoFile(data) {
    //console.log('into writing mode')
    if (!fs.existsSync(filePath)) {
        console.log('creating the lib')
        fs.mkdirSync('./data', { recursive: true });
    }
    try {
        data.updated_at = moment().toISOString()
        fs.writeFileSync(filePath, JSON.stringify(data), 'utf8');
        console.log('Data has been successfully written to the file.');
    } catch (err) {
        console.error('Error writing to the file:', err);
    }
}
// input a dollar, and change into format, return it
function dollar(input){
    // Remove any non-digit characters (except the decimal point)
    let cleanedInput = input.replace(/[^0-9.]/g, "");

    // Ensure there's only one decimal point
    const parts = cleanedInput.split(".");
    if (parts.length > 2) {
        parts.pop(); // Remove extra decimal points
    }
    cleanedInput = parts.join(".");

    // where is the point
    const decimalIndex = cleanedInput.indexOf(".");
    if (decimalIndex !== -1) {
        // find out the part after the point
        let decimalPart = cleanedInput.substring(decimalIndex + 1);

        while(decimalPart.length < 2) {
            decimalPart += "0";
            cleanedInput += "0";
        }
        if (decimalPart.length > 2) {
            cleanedInput = cleanedInput.substring(0, decimalIndex + 3);
        }
    }else {
        cleanedInput = cleanedInput + ".00";
    }

    //console.log(cleanedInput);
    return cleanedInput;
}
// return name
function combineName(fname, lname){
    if(!lname){
        return fname;
    }else{
        playername = fname + ' ' + lname;
    }
    return playername;
}
//checking the active, and return true or false
function checkingactive(obj){
    if(obj == 1 || obj == true || obj == 't' || obj == 'true' || obj == '1' || obj == 'TRUE' || obj == 'T' ){
        return true;
    }
    else{
        return false;
    }
}
//cheking the format of handed
function checkinghanded(obj){
    //handed = Enum("L", "R", "Ambi");
    if(obj == "Ambi" || obj == "A"){
        return "ambi";        
    }
    if(obj == "L"){
        return "left";        
    }
    if(obj == "R"){
        return "right";        
    }
    if(obj == "right"){
        return "R";        
    }
    if(obj == "left"){
        return "L";        
    }
    if(obj == "ambi"){
        return "Ambi";        
    }
    return obj;
}
function isValidCurrency(value) {
    if(/^\d+(\.\d{1,2})?$/.test(value) && value >= 0 && value != ''){
        // && value != null
        return true;
    }else{
        return false;
    }
}

function checkcurrency(value) {
    if (value.includes('.')) {
        decimalCount =  value.split('.')[1].length
    }
    if ((value == null) || (/^[a-zA-Z]+$/.test(value)) || (value == "") || decimalCount > 2) {
        return false
    }
    return true
}

function format(data){
    data.players = data.players.map((player) => ({
        pid: player.pid,
        name: combineName(player.fname,player.lname),
        handed: checkinghanded(player.handed),
        is_active: checkingactive(player.is_active),
        balance_usd: dollar(player.balance_usd)
    }));
    return data
}
app.get('/ping', (req, res) => {
    res.status(204).end();
})

app.get('/player', (req, res, next) => {
    players = format(readfile());
   //console.log(players);

    // Sort mapped players by name in ascending order (A to Z)
    const sortedPlayers = players.players.sort((a, b) => a.name.localeCompare(b.name));
    // Return the sorted array as JSON with a 200 response code
    //onsole.log(players)
    res.status(200).json(sortedPlayers)
    next();
})

app.get('/player/:pid', (req, res,next) => {
    const pid = parseInt(req.params.pid, 10); // Convert pid to an integer
    players = format(readfile());
    const player = players.players.find(p => p.pid === pid);
    //console.log(player);
    if (player) {
        // If player exists, respond with player data and a 200 status code
        res.status(200).json(player);
    } else {
        // If player does not exist, respond with a 404 status code
        res.status(404).send();
    }
    next();
});

app.delete('/player/:pid', (req, res,next) => {
    const pid = parseInt(req.params.pid, 10);
    players = readfile();
    const index = players.players.findIndex(player => player.pid === pid);
    if (index !== -1) {
        console.log('deleting...')
        players.players.splice(index, 1);
        writetoFile(players);
        res.redirect(303, '/player');
    } else {
        // Player not found, respond with a 404 status code
        res.status(404).send();
        res.end();
    }
    next();
});

app.post('/player', (req, res) => {
    try{
    players = readfile();
    const fname = req.query.fname || '';
    const lname = req.query.lname || '';
    const handed = req.query.handed || '';
    const balance_usd = req.query.initial_balance_usd || '';
    // Define a function to validate the 'handed' parameter
    function isValidHanded(handed) {
        // 'L', 'R', 'Ambi', 'A', 
        const validHandedValues = ['left', 'right', 'ambi'];
        if(validHandedValues.includes(handed) && handed != null){
            return true
        }
        return false
        //return validHandedValues.includes(handed); // Case-insensitive check
    }
    function checkingstring(input){
        return  /^[a-zA-Z]+$/.test(input);
    }
    //console.log(fname, lname, handed, balance_usd)
    // Validate parameters and build a list of invalid field names
    const invalidFields = [];
    if (!fname || !checkingstring(fname)) {
        invalidFields.push('fname');
    }
    if (!lname || !checkingstring(lname)) {
        invalidFields.push('lname');
    }
    if (!isValidHanded(handed)) {
        invalidFields.push('handed');
    }
    if (!checkcurrency(balance_usd)) {
        invalidFields.push('balance_usd');
    }

    if (invalidFields.length > 0) {
        // Invalid parameters, respond with a 422 status code and a string listing the invalid fields
        const errorMessage = `Invalid fields: ${invalidFields.join(', ')}`
        
        res.status(422).json(errorMessage).send();
        res.end()
    
    } else {
        // Your code for handling valid input
        const newPlayer = {
            pid: parseInt(uuidv4().replace(/\D/g, "").slice(0, 6), 10),
            fname: fname,
            lname: lname,
            handed: checkinghanded(handed),
            is_active: true,
            balance_usd: dollar(balance_usd)
        };

        //console.log('New player:', newPlayer);
        players.players.push(newPlayer);
        writetoFile(players);
        // Respond with a 303 status code and redirect to "GET /player/[pid]"
        // res.status(303).json()
        // res.writeHead({"Content-Type": "application/json"});
        // console.log(players)
        res.redirect(303, `/player/${newPlayer.pid}`)
    }
}catch(error){
    console.log(error);
}
});

app.post('/player/:pid', (req, res) => {
    const pid = parseInt(req.params.pid, 10);
    players = readfile();
    const player = players.players.find(p => p.pid === pid);
    const index = players.players.findIndex(player => player.pid === pid);

    if (!player) {
        res.status(404).send();
        res.end();
    }else{
        const active = req.query.active; // This will be a string
        const lname = req.query.lname;
        // if (active === undefined && lname === undefined) {
        //     res.status(422).send();
        //     res.end();
        // }
        if(active !== undefined){
            players.players[index].is_active = checkingactive(active); // Convert to a boolean
        }
        if (lname !== undefined) {
            players.players[index].lname = lname;
        }
        writetoFile(players);
        // console.log(readfile();
        res.redirect(303, `/player/${pid}`)
    }
    res.status(422).send();
    res.end();
});

app.post('/deposit/player/:pid', (req, res) => {
    const pid = parseInt(req.params.pid, 10);
    const amountUsd = req.query['amount_usd'];
    console.log(amountUsd)
    players = readfile();
    let player = players.players.find(p => p.pid === pid);
    let index = players.players.findIndex(player => player.pid === pid);
    
    if (!player) {
        // Player not found, respond with a 404 status code
        res.status(404).send();
        res.end();
    }
    console.log('chekcing the amout: ')
    if (!isValidCurrency(amountUsd)) {
        // Invalid amount or negative amount, respond with a 400 status code
        res.status(400).send();
        res.end();
    }
    newDollar = dollar((parseFloat(amountUsd) + parseFloat(player.balance_usd)).toString());

    PlayerBalance = {
        old_balance_usd: player.balance_usd,
        new_balance_usd: newDollar
    }
    players.players[index].balance_usd = newDollar;
    writetoFile(players);
    // Respond with the updated player's balance and a 200 status code
    res.status(200).json(PlayerBalance);
});


app.listen(port, () => {
    //console.log(`Example app listening on port ${port}`)
})