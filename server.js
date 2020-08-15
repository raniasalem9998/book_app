'use strict';


const express = require('express');
const app = express();
const superagent = require('superagent');
const cors = require('cors');
const pg = require('pg');
const methodOverride = require('method-override');
const { response } = require('express');
require('dotenv').config();


app.set('view engine','ejs');
app.use(methodOverride('_method'));
app.use(cors());
app.use(express.urlencoded({extended: true}));
app.use(express.static('./public'));


const PORT = process.env.PORT || 3000;
const client = new pg.Client(process.env.DATABASE_URL);

client.on('error', err => console.error(err));


// --------------------------------------------------------------------
app.get('/',homepage);                //-------------------------------
app.get('/searches/new',searchNew);   //-------------------------------
app.get('/books/:id',showSelected);   //-------------------------------
app.post('/searches',api);            //------------------------------- 
app.post('/books',save);              //-------------------------------
app.delete('/books/:id',deletion);    //-------------------------------
// --------------------------------------------------------------------



function homepage(req,res){
  return client.query('select * from books;').then(results =>{
    res.render('./pages/index.ejs',{books:results.rows,bookNum:results.rowCount});
  });
};

function searchNew(req,res){
  res.render('./pages/searches/new.ejs');
};


function showSelected(req,res){
client.query('SELECT * FROM books WHERE id=$1;',[req.params.id]).then(data =>{
  let SQL2 = 'SELECT DISTINCT bookshelf FROM books;';
  return client.query(SQL2).then(bookshelfData => {
    res.render('pages/books/show', {book:data.rows[0], bookshelfes : bookshelfData.rows});
    console.log( bookshelfData.rows)
  })
})
};


function api(req,res){
  let url = `https://www.googleapis.com/books/v1/volumes?q=${req.body.search}+${req.body.title ? 'intitle' : 'inauthor'}`;

  return superagent.get(url).then(data => {
    let arr = [];
      data.body.items.map(element => {
      let book = new Books(element);
      arr.push(book);
      return arr;
      });
      res.render('./pages/searches/show.ejs', {shelf:arr});
  });
};

function save (req,res){
let data = req.body;
let id = req.params.id;
let SQL = 'INSERT INTO books(title,author,ISBN,description,image_url,bookshelf) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id';
let array = [data.title,data.author,data.ISBN,data.description,data.image_url,data.bookshelf];
client.query(SQL,array).then(response=>{
  console.log([data])
  res.redirect(`/books/${response.rows[0].id}`)
})
};

function deletion(req,res){
let id = [req.params.id];
let SQL = `DELETE FROM books WHERE id=$1;`;
  return client.query(SQL,id).then(()=>{
    res.redirect('/');
  })
};


app.put('/books/:id',(req, res) =>{
let {updatedTitle, updatedAuthor,updatedisbn,updatedImage_url,updatedDescription,bookshelf} = req.body;
let sql = `UPDATE books SET title=$1,author=$2,ISBN=$3,image_url=$4,description=$5,bookshelf=$6 WHERE id =$7;`;
let newValues = [updatedTitle,updatedAuthor,updatedisbn,updatedImage_url,updatedDescription,bookshelf,req.params.id];
client.query(sql, newValues).then(() => {
    res.redirect('/');
})
});

function Books(data) {
  this.title = data.volumeInfo.title || 'not-available';
  this.image_url = (data.volumeInfo.imageLinks.thumbnail.replace(/^(http:\/\/)/g,'https:'))  || "https://i.imgur.com/J5LVHEL.jpg";
  this.author = data.volumeInfo.authors || 'not-available';
  this.ISBN = data.volumeInfo.industryIdentifiers[0].identifier || 'not-available';
  this.description = data.volumeInfo.description|| 'not-available';
}

client.connect().then(() => {
  app.listen(PORT, () => {
    console.log('Server is listening to port ', PORT);
  })
})  
.catch(()=>{
  console.log('error')
  });


app.all('*', (req, res) => {
  let error={'message':'not found','status':'404'}
  res.status(404).render('./pages/error.ejs',{error});
});


app.all('*', (req, res) => {
  let error={'message':'server error','status':'500'}
    res.status(500).render('./pages/error.ejs',{error});
});
