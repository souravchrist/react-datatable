var express = require('express');
var mysql   = require('mysql');
var Promise = require('bluebird');
var bodyParser = require('body-parser');
var app = express();

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'root',
  database : 'react-datatable'
});
var queryAsync = Promise.promisify(connection.query.bind(connection));
connection.connect();

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/api', function (req, res) {
  var numRows;
  var queryPagination = req.query.search != undefined ? req.query.search : '';
  var sorttype = req.query.sorttype != 'undefined' ? req.query.sorttype : 'first_name';
  var sortby = req.query.sortby != '' ? req.query.sortby : 'asc';
  var numPerPage = parseInt(req.query.npp, 10) || 10;
  var page = parseInt(req.query.page, 10) || 0;
  var numPages;
  var skip = page * numPerPage;
  var limit = skip + ',' + numPerPage;
  var q = req.query.search ? ' WHERE first_name LIKE "'+req.query.search +'%" OR  last_name LIKE "'+req.query.search +'%" OR company like "%'+req.query.search+'%" OR office like "%'+req.query.search+'%"' : '';
  var sort = sorttype != '' ? ' ORDER BY '+sorttype+' '+sortby+'' : ' ORDER BY first_name asc';
 
  queryAsync('SELECT count(*) as numRows FROM employee '+q)
  .then(function(results) {
    numRows = results[0].numRows;
    numPages = Math.ceil(numRows / numPerPage);
  })
  .then(() => queryAsync('SELECT * FROM employee '+ q +''+sort+' LIMIT ' + limit))
  .then(function(results) {
    var responsePayload = {
      results: results
    };
    if (page < numPages) {
      responsePayload.pagination = {
        current: page,
        perPage: numPerPage,
        previous: page > 0 ? page - 1 : undefined,
        next: page < numPages - 1 ? page + 1 : undefined,
        numPages: numPages,
        numRows: numRows,
      }
    }
    else responsePayload.pagination = {
      err: 'queried page ' + page + ' is >= to maximum page number ' + numPages
    }
    res.json(responsePayload);
  })
  .catch(function(err) {
    console.error(err);
    res.json({ err: err });
  });
});

app.listen(3001, function () {
  console.log('Example app listening on port 3001');
});
