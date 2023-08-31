import express from 'express';
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const port = 3000;

const app = express();

app.listen(port, () => {
    if (process.send) {
      process.send(`Server running at http://localhost:${port}\n\n`);
    }
});

app.set( "views", path.join( __dirname, "public/views" ) );
app.set( "view engine", "ejs" );

app.use(express.static(path.join(__dirname,'public')));
app.use(express.json());

app.get('/', (req, res) => {
    res.render("index");
});

app.get('/conversion', (req, res) => {
    res.render("conversion");
});

app.post('/ip', (req, res) => {
    const regexExp = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/gi;
    //check if valid url
    if(regexExp.test(req.body.url)){
        setIP(req.body);
    }
});

async function setIP(ip){
    fs.writeFile('./public/data/ip.json', JSON.stringify(ip), (err) =>{
        if(err){
            console.log('Error Saving File:', err);
        }else{
            console.log('IP updated');
        }
    });
}