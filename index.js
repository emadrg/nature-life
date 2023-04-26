// const express = require ("express");
// const fs=require("fs");
// const path=require('path');
// const sharp= require('sharp');
// const sass= require('sass');


const {Client} = require('pg');

 
var client= new Client({database:"proiect_tehnici_web",
        user:"emilia",
        password:"parola_ema",
        host:"localhost",
        port:5432});
client.connect();
client.query("select * from lab8_14", function(err, rez){
    console.log("Eroare BD",err);
 
    console.log("Rezultat BD",rez.rows);
});

const express = require("express");
//includem toate modulele de care avem nevoie
const fs=require('fs');  //fs=filesystem
const path=require('path');
const sharp=require('sharp');
const sass=require('sass');
const ejs=require('ejs');



//const {client} = require('pg');


// var client= new Client({database:"ProiectWBBD",
//     user:"zmara",
//     password:"admin2002",
//     host:"localhost",
//     port:5432});
// client.connect();
// client.query("select * from lab8_14", function(err, rez){
//     console.log("Eroare BD",err);

//     console.log("Rezultat BD",rez.rows);
// });






obGlobal={
    obErorrs:null,
    obImages:null,
    folderScss:path.join(__dirname,"resurse/scss"),
    folderCss:path.join(__dirname,"resurse/css"),
    folderBackup:path.join(__dirname,"backup"),
    optiuniMeniu: []
}

client.query("select * from unnest(enum_range(null::tipuri_produse))", function (err,rezCategorie) {
    if(err){
        console.log(err);
    }
    else{
        obGlobal.optiuniMeniu=rezCategorie.rows;
        console.log(obGlobal.optiuniMeniu);
    }
});




app=express();
console.log("Folder proiect", __dirname);
console.log("Cale fisier", __filename);
console.log("Director de lucru", process.cwd);


vectorFoldere=["temp","temp1","backup"]
for(let folder of vectorFoldere){
    //let caleFolder=__dirname+"/"+folder;
    let caleFolder=path.join(__dirname,folder)
    //caleFolder="./"+folder
    if(!fs.existsSync(caleFolder)){
        fs.mkdirSync(caleFolder);
    }
}


function compileazaScss(caleScss,caleCss){
    if(!caleCss) {
        //let vectorCale = caleScss.split("\\")  //split transforma un sir intr un vector de subsiruri in functie de separatorul oferit
        //let numeFisExt = vectorCale[vectorCale.length - 1] //numele fisierului cu tot cu extensiw  fiindca e ultimul
        let numeFisExt=path.basename(caleScss);
        let numeFis = numeFisExt.split(".")[0]
        caleCss=numeFis+".css";
    }


    if(!path.isAbsolute(caleScss))
        caleScss=path.join(obGlobal.folderScss,caleScss)
    if(!path.isAbsolute(caleCss))
        caleCss=path.join(obGlobal.folderCss,caleCss)
    //la acest punct avem cai absolute in caleScss si caleCss

    let vectorCale=caleCss.split("\\");
    //numeFisCss=vectorCale[vectorCale.length-1];

    let caleBackup=path.join(obGlobal.folderBackup,"resurse/css");
    if(!fs.existsSync(caleBackup)){
        fs.mkdirSync(caleBackup,{recursive:true});
    }

    let numeFisCss=path.basename(caleCss);

    //copiem fis in backup
    if(fs.existsSync(caleCss)){
        fs.copyFileSync(caleCss,path.join(obGlobal.folderBackup,"resurse/css",numeFisCss))
    }

    //inainte de pauza
    rez=sass.compile(caleScss,{"sourceMap":true}); //rez este un obiect care va avea si o atributa
    //css in care se afla codul de css rezultat in urma compilarii
    fs.writeFileSync(caleCss,rez.css);
    console.log("Compilare SCSS",rez);
}

app.set("view engine","ejs");
//compileazaScss("a.scss")


//vFisiere va contine toate fisierele din folderScss
vFisiere=fs.readdirSync(obGlobal.folderScss)
//console.log(vFisiere)
for(let numeFis of vFisiere){
    if(path.extname(numeFis)==".scss"){
        compileazaScss(numeFis);
    }

}



//se uitadupa modificari fs.watch()
fs.watch(obGlobal.folderScss,function (eveniment,numeFis){
    if(numeFis[numeFis.length-1]=='~' || path.extname(numeFis)!="scss")
        return;
    console.log(eveniment,numeFis);
    //daca fis a fost sters tot cu rename apare
    //daca exista il compilez
    if(eveniment=="change" || eveniment=="rename") {
        let caleCompleta=path.join(obGlobal.folderScss,numeFis);
        if(fs.existsSync(caleCompleta)) {
            compileazaScss(caleCompleta);
        }
    }

})


/*
Metoda use() este folosită pentru a adăuga un middleware pentru cererile de orice tip. Conform specificațiilor, formatul metodei este:
app.use([path,] callback [, callback...])
 */
app.use("/resurse",express.static(__dirname+"/resurse"));
app.use("/node_modules",express.static(__dirname+"/node_modules"));



app.use("/*", function(req,res,next){
    res.locals.optiuniMeniu=obGlobal.optiuniMeniu;
    next();
});




app.get("/favicon.ico", function (req,res){
    res.sendFile(__dirname+"/resurse/ico/favicon.ico")
})

//app use trebuie sa se potriveasca doar cu inceputul caii
//app get vrea calea exacta
// app.use("/resurse",function (req,res){
//     res.send("Ceva");
//     console.log(req.originalUrl)
//     console.log(req.url)
// })

//dupa resurse pot sa am oricate /sn8/9w8d/3rd adica oricate combinatii de litere si cifre  de asta am pus *
app.use(/^\/resurse(\/[a-zA-Z0-9]*)*$/,function (req,res) {
    // res.send("Ceva");
    // console.log(req.originalUrl)
    // console.log(req.url)

    afisareEroare(res,403)

})

app.get("/ceva", function(req,res) {
    console.log("cale:",req.url)
    res.send("altceva ip:"+req.ip)
})


app.get(["/index", "/","/home" ], function(req,res) {
    res.render("pagini/index",{ip:req.ip, a:10, b:20,imagini:obGlobal.obImages.imagini});
})

/*
app.get("/despre", function(req,res) {
    res.render("pagini/despre");  //ce am scris aici e locals
})
*/


//vreau fisierele cu expresia ejs
// in regex \w inseamana orice caracter alfanumeric (wildcard)
// ^\w+\.ejs$



app.get("/produse",function(req, res){


    //TO DO query pentru a selecta toate produsele
    //TO DO se adauaga filtrarea dupa tipul produsului
    //TO DO se selecteaza si toate valorile din enum-ul categ_prajitura

    //putem avea un singu res.render

    client.query("select * from unnest(enum_range(null::categ_prajitura))", function (err,rezCategorie) {
        if(err){
            console.log(err);
        }
        else {
            let conditieWhere="";
            if(req.query.tip)
                conditieWhere=`where tip_produs='${req.query.tip}'`;
            client.query("select * from prajituri "+conditieWhere , function( err, rez){  //fac al doilea query in callbackul primului
                console.log(300)
                if(err){
                    console.log(err);
                    afisareEroare(res, 2);
                }
                else
                    res.render("pagini/produse", {produse:rez.rows, optiuni:rezCategorie.rows});
                    console.log(rezCategorie.rows);
            });

        }
    })




});


// :id ->query parametrizat
app.get("/produs/:id",function(req, res){
    console.log(req.params);

    client.query(`select * from prajituri where id="${req.params}"`, function( err, rezultat){
        if(err){
            console.log(err);
            afisareEroare(res, 2);
        }
        else
            res.render("pagini/produs", {prod:rezultat.rows[0]});
    });

});





app.get("/*.ejs",function (req,res){
    afisareEroare(res,400);
})



app.get("/*",function(req,res){  //functia function data ca parametu e callback (fucntie asincrona)
    try {
        res.render("pagini" + req.url, function (err, rezRandare) {
            if (err) {
                console.log(err);
                if (err.message.startsWith("Failed to lookup view"))
                    //afisareEroare(res,{_identificator:404,_titlu:"ceva"});
                    afisareEroare(res, 404, "titlu custom");
                else afisareEroare(res);
            } else {
                console.log(rezRandare);
                res.send(rezRandare);
            }


        }); //cerere generala
    }catch(err) {
        if (err.message.startsWith("Cannot find module"))
            //afisareEroare(res,{_identificator:404,_titlu:"ceva"});
            afisareEroare(res, 404, "titlu custom");
        else afisareEroare(res);
    }
});




function initErrors(){
    var continut = fs.readFileSync(__dirname+"/resurse/json/erori.json").toString("utf-8"); //daca nu are var sau let e globala
    //console.log(continut);
    obGlobal.obErrors=JSON.parse(continut);
    let vErrors=obGlobal.obErrors.info_erori;
    //for(let i=0; i<vErrors.length;i++)
    for(let eroare of vErrors){
        eroare.imagine="/"+obGlobal.obErrors.cale_baza+"/"+eroare.imagine;


    }
}

initErrors();


function initImages(){
    var continut = fs.readFileSync(__dirname+"/resurse/json/galerie.json").toString("utf-8"); //daca nu are var sau let e globala
    obGlobal.obImages=JSON.parse(continut); //transformam intr un obiect cu ajutorul lui parse. va avea 2 proprieteati imagini si cale
    let vImages=obGlobal.obImages.imagini;
    let caleAbs=path.join(__dirname, obGlobal.obImages.cale_galerie);
    let caleAbsMediu=path.join(caleAbs,"mediu");
    if(!fs.existsSync(caleAbsMediu))
        fs.mkdirSync(caleAbsMediu);
    //for(let i=0; i<vErrors.length;i++)
    for(let imag of vImages){
        //eroare.imagine="/"+obGlobal.obErrors.cale_baza+"/"+eroare.imagine;
        [numeFis,ext]=imag.fisier.split(".");
        let caleFisAbs=path.join(caleAbs,imag.fisier);
        let caleFisMediuAbs=path.join(caleAbsMediu,numeFis+".webp"); //webp are factor de compresie mai bun
        sharp(caleFisAbs).resize(400).toFile(caleFisMediuAbs);
        imag.fisier_mediu="/"+path.join(obGlobal.obImages.cale_galerie,"mediu",numeFis+".webp");
        imag.fisier="/"+path.join(obGlobal.obImages.cale_galerie,imag.fisier);
    }
}

initImages();


// const resizeImage = () => {
//     const resize = sharp('./images/robo.jpg')
//         .resize(350, 260)
//         .toFile(__dirname + '/processed_images/resize_robo.jpg')
//
//     console.log(resize)
// }
//
// resizeImage()





//daca prgramatorul seteaza titlul, se ia titlul din argument
//daca nu e setat se ia cel din json
//daca nu ave, titlul nici in json se ia titlul de la valoare default
//idem pt celelalte

//function afisareEroare(res,{_identificator, _titlu, _text, _imagine} ={} )
function afisareEroare(res,_identificator, _titlu="titlu default", _text,_imagine){
    let vErrors=obGlobal.obErrors.info_erori;
    let eroare=vErrors.find(function (elem) {return elem.identificator===_identificator; })
    if(eroare) {
        let titlu1= _titlu==="titlu default" ?( eroare.titlu || _titlu): _titlu;
        let text1= _text || eroare.text;
        let imagine1= _imagine || eroare.imagine;
        if(eroare.status)
            res.status(eroare.identificator).render("/pagini/eroare",{titlu:titlu1, text:text1, imagine:imagine1});
        else
            res.render("/pagini/eroare",{titlu:titlu1, text:text1, imagine:imagine1});

    }
    else
    {
        let errDef=obGlobal.obErrors.eroare_default;
        res.render("/pagini/eroare",{titlu:errDef.titlu, text:errDef.text, imagine:errDef.imagine});
    }

}


app.listen(8080);

console.log("Server ON");

//galeria animata o fac cu for in scss

// obGlobal={
//     obErori:null, 
//     obImagini:null,
//     folderScss: path.join(__dirname, "resurse/scss"),
//     folderCss: path.join(__dirname, "resurse/css"),
//     folderBackup: path.join(__dirname, "backup"),
//     optiuniMeniu : []
// }
//     client.query("select * from unnest(enum_range(null::tiputi_produse))", function (err, rezCategorie){
//         if (err){
//             console.log(err);
//         }
//         else{
//             obGlobal.optiuniMeniu=rezCategorie.rows;
//         }
// });

// app=express();
// console.log(123);
// console.log("Folder proiect", __dirname);
// console.log("Nume fisier", __filename);
// console.log("Director de lucru", process.cwd());

// vectorFoldere=["temp", "temp1", "backup"]
// for (let folder of vectorFoldere){
//     // let caleFolder=__dirname+"/"+folder
//     let caleFolder=path.join(__dirname+folder)
//     if(! fs.existsSync(caleFolder)){
//         fs.mkdirSync(caleFolder);
//     }

// }

// function compileazaScss(caleScss, caleCss){

//     if (!path.isAbsolute(caleScss))
//         caleScss=path.join(obGlobal.folderScss,caleScss)
//     if (!path.isAbsolute(caleCss))
//         caleCss=path.join(obGlobal.folderCss,caleCss)

//     let caleBackup=path.join(obGlobal.folderBackup, "resurse/css");
//     if(!fs.existsSync(caleBackup)){
//         fs.mkdirSync(caleBackup, {recursive:true})
//     }
//     let numeFisCss=path.basename(caleCss);
// if(fs.existsSync(caleCss)){
//     fs.copyFileSync(caleCss, path.join(obGlolbal.folderBackup, "resurse/css", numeFisCss))
// }
    
// }


// vFisiere = fs.readdirSync(obGlobal.folderScss);
// for (let numeFis of vFisiere){
//     if (path.extname(numeFis)==".scss"){
//         compileazaScss(numeFis);
//     }
// }

// fs.watch(obGlobal.folderScss,function (eveniment,numeFis){
//     console.log(eveniment,numeFis);
//     //daca fis a fost sters tot cu rename apare
//     //daca exista il compilez
//     if(eveniment=="change" || eveniment=="rename") {
//         let caleCompleta=path.join(obGlobal.folderScss,numeFis);
//         if(fs.existsSync(caleCompleta)) {
//             compileazaScss(caleCompleta);
//         }
//     }

// })


// app.set("view engine", "ejs");

// app.use("/resurse", express.static(__dirname+"/resurse"));
// app.use("/node_modules", express.static(__dirname+"/node_modules"));

// app.use("*/" , function(req, res,next){
//     res.locals.optiuniMeniu=obGlobal.optiuniMeniu;
//     next();

// });

// app.use(/^\/resurse(\/[a-zA-Z0-9]*(?!\.)[a-zA-Z0-9]*)*$/, function(req,res){

//      afisareEroare(res,403);
    
//     });

// app.get("/ceva", function(req, res){
//     console.log("cale: ", req.url)
//     res.send("<h1> altceva </h1> ip:"+req.ip);
// }
// )

// app.get(["/index", "/", "/home"], function(req, res){
//     res.render("pagini/index", {ip: req.ip, imagini:obGlobal.obImagini.imagini});
// }
// )

// app.get("/produse",function(req, res){


//     //TO DO query pentru a selecta toate produsele
//     //TO DO se adauaga filtrarea dupa tipul produsului
//     //TO DO se selecteaza si toate valorile din enum-ul categ_prajitura

//     client.query("select * from unnest(enum_range(null::categ_prajitura))", function (err, rezCategorie){
//         if (err){
//             console.log(err);
//         }
//         else {
//             let conditieWhere="";
//             if(req.query.tip)
//             conditieWhere=` where tip ='${req.query.tip}'`
     
//             client.query("select * from prajituri" , function( err, rez){
//                 console.log(300)
//                 if(err){
//                     console.log(err);
//                     afisareEroare(res, 2);
//                 }
//                 else
//                     res.render("pagini/produse", {produse:rez.rows, optiuni:rezCategorie.rows});
//             });
    
//         }
//     })

   

// });

// app.get("/produs/:id", function (req, res) {
//     client.query(`select * from prajituri where id="${req.params}"`, function (err, rezultat) {
//         if (err) {
//             console.log(err);
//             afisareEroare(res, 2);
//         } else
//             res.render("pagini/produs", {prod: rezultat.rows[0]});
//     });
// });

// //vezi app.get dupa asta de sus

// function initErori(){
//     var continut= fs.readFileSync(__dirname+"/resurse/json/erori.json").toString("utf-8");
//     obGlobal.obErori=JSON.parse(continut);
//     let vErori=obGlobal.obErori.info_erori;
//     //for (let i=0; i< vErori.length; i++ ), sau scris asa:
//     for(let eroare of vErori){
//         eroare.imagine="/"+obGlobal.obErori.cale_baza+"/"+eroare.imagine;
//     }
// }

// initErori();

// function initImagini() {
//     var continut = fs.readFileSync(__dirname + "/resurse/json/galerie.json").toString("utf-8");
//     obGlobal.obImagini = JSON.parse(continut);
//     let vImagini = obGlobal.obImagini.imagini;
//     let caleAbs = path.join(__dirname, obGlobal.obImagini.cale_galerie);
//     let caleAbsMediu = path.join(caleAbs, "mediu");
//     if (!fs.existsSync(caleAbsMediu))
//         fs.mkdirSync(caleAbsMediu);
//     ///for (let i = 0; i < vErori.length; i++)
//     for (let imag of vImagini) {
//         [numeFis,ext]=imag.fisier.split(".")
//         let caleFisAbs = path.join(caleAbs, imag.fisier);
//         let caleFisMediuAbs = path.join(caleAbsMediu, numeFis + ".webp");
//         sharp(caleFisAbs).resize(400).toFile(caleFisMediuAbs);
//         imag.fisier_mediu="/" + path.join(obGlobal.obImagini.cale_galerie,"mediu", numeFis+ + ".webp");
//         imag.fisier="/" + path.join(obGlobal.obImagini.cale_galerie, imag.fisier);
//         ///imag.imagine = "/" + obiectGlobal.obErori.cale_baza + "/" + eroare.imagine;
//     }
// }


// initImagini();

// function afisareEroare(res, {_identificator, _titlu="titlu default", _text, _imagine}={}){
//     let vErori=obGlobal.obErori.info_erori;
//     let eroare=vErori.find(function(elem) {return elem.identificator==_identificator;})
//     if(eroare){

//         //daca programatorul seteaza titlul, se ia titlul din argument
//         //daca nu e setat, se ia cel din json
//         //daca nu avem titlu nici in json, se ia valoarea default
//         //idem pentru celelalte

//         let titlu1=_titlu="titlu default" ? (eroare.titlu || _titlu) : _titlu;
//         let text1=_text || eroare.text;
//         let imagine1=_imagine || eroare.imagine;
//         if(eroare.status)
//              res.status(eroare.identificator).render("pagini/eroare", {titlu:titlu1, text:text1, imagine:imagine1});
//         else
//             res.render("pagini/eroare", {titlu:titlu1, text:text1, imagine:imagine1});
//     }

//     else{
//         let errDef=obGlobal.obErori.eroare_default;
//         res.render("pagini/eroare", {titlu:errDef.titlu, text:errDef.text, imagine:obGlobal.obErori.cale_baza+"/"+errDef.imagine});
//     }

// }

// app.get("/favicon.ico", function(req, res){
//     res.sendFile(__dirname+"/resurse/imagini/favicon.ico");
// })

// //expresia regulata pt fisier cu extensia ejs ^\w+\.ejs$
// app.get("/*.ejs", function(req, res){
//     afisareEroare(res, 400);
// })

// app.get("/*", function (req, res) {
//     try{
//     res.render("pagini" + req.url, function (err, rezRandare) {
//         if (err) {
//             console.log(err);
//             if (err.message.startsWith("Failed to lookup view"))
//                 afisareEroare(res, 404, "ceva");
//             else
//                 afisareEroare(res);
//         }
//         else
//         {
//             rezRandare.send(rezRandare);
//         }
//     });
// } catch (err){
//     if (err.message.startsWith("Cannot find module"))
//                 afisareEroare(res, 404);
//             else
//                 afisareEroare(res);
// }
// })

// app.listen(8080);
// console.log("Serverul a pornit");
