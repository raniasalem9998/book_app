'use strict';

const express = require('express');
const app = express();
const superagent = require('superagent');
const cors = require('cors');
require('dotenv').config();

app.set('view engine','ejs');

app.use(cors());
app.use(express.static('./public'));
app.use(express.urlencoded({extended: true}));

const PORT = process.env.PORT || 3000;

app.get('/', (req,res)=>{
  res.render('./pages/index.ejs');
});


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

function Books(data) {
  this.title = data.volumeInfo.title || 'not available';
  this.img_url = data.volumeInfo.imageLinks.thumbnail || 'https://i.imgur.com/J5LVHEL.jpg';
  this.author = data.volumeInfo.authors || 'not available';
  this.discription = data.volumeInfo.description || 'not available';
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
