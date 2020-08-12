'use strict';

require('dotenv').config();
const express = require('express');
const app = express();
const superagent = require('superagent');
const cors = require('cors');
const pg = require('pg');
const methodOverride = require('method-override')


app.set('view engine','ejs');

app.use(cors());
app.use(express.urlencoded({extended: true}));
app.use(express.static('./public'));


const PORT = process.env.PORT || 3000;
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error(err));

app.get('/', (req,res)=>{
  return client.query('select * from books;').then(results =>{
    res.render('./pages/index.ejs',{books:results.rows,bookNum:results.rowCount});
  });
});

app.get('/books/:id',(req,res)=>{
client.query('SELECT * FROM books WHERE id=$1;',[req.params.id]).then(data =>{
  res.render('pages/books/show.ejs', {book:data.rows[0]});
})
})

app.get('/searches/new', (req,res)=>{
  res.render('./pages/searches/new.ejs');
});

app.post('/searches',(req,res)=>{
  let url = `https://www.googleapis.com/books/v1/volumes?q=${req.body.search}+${req.body.title ? 'intitle' : 'inauthor'}`;

  return superagent.get(url).then(data => {
    let arr = [];

      data.body.items.map(element => {
      let book = new Books(element);
      arr.push(book);
      return arr;
      });
      // res.send(arr);
      res.render('./pages/searches/show.ejs', {shelf:arr});
  });
})

app.post('/books',(req,res)=>{
let data = req.body;
let SQL = 'INSERT INTO books(title,author,ISBN,description,img_url,bookshelf) VALUES ($1,$2,$3,$4,$5,$6);';
let array = [data.title,data.author,data.ISBN,data.description,data.img_url,data.bookshelf];
client.query(SQL,array).then(res=>{
  res.redirect('/books/:id')
})
})

app.delete('/books/:id',(req,res)=>{
let id = req.params.id;
let SQL = 'DELETE FROM books(title,author,ISBN,description,img_url,bookshelf) VALUES ($1,$2,$3,$4,$5,$6);';
  return client.query(SQL,id).then(()=>{
    res.redirect('/');
  })
})

function Books(data) {
  this.title = data.volumeInfo.title || 'not available';
  this.img_url = data.volumeInfo.imageLinks.thumbnail.replace(/^(http:)/g,'https:')  || 'https://i.imgur.com/J5LVHEL.jpg';
  this.author = (data.volumeInfo.authors).join(',') || 'not available';
  this.ISBN = data.volumeInfo.industryIdentifiers[0].identifier || 'not available';
  this.description = data.volumeInfo.description || 'not available';
}
 

app.listen(PORT, ()=>{
  console.log(`Listening to Port ${PORT}`);
});

app.all('*', (req, res) => {
  let error={'message':'not found','status':'404'}
  res.status(404).render('./pages/error.ejs',{error});
});

app.all('*', (req, res) => {
  let error={'message':'server error','status':'500'}
    res.status(500).render('./pages/error.ejs',{error});
});
