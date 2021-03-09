var Author = require('../models/author');
var Book = require('../models/book');
var async = require('async');

const {body, validationResult} = require('express-validator');

// Display list of all Authors.
exports.author_list = function(req, res, next) {
    Author.find()
    .sort([['last_name', 'ascending']])
    .exec(function(err, list_authors) {
    	if (err) {return next(err)}
    	res.render('author_list', { title: 'List of Authors on file', author_list: list_authors });
    })
};

// Display detail page for a specific Author.
exports.author_detail = function(req, res, next) {
    async.parallel({
        author: function(callback){
            Author.findById(req.params.id)
            .exec(callback);
        },
        authors_books: function(callback){
            Book.find({'author': req.params.id}, 'title summary')
            .exec(callback);
        },
    },
    function(err, results){
        if(err) {return next(err)}
        if (results.author == null) {
            var err = new Error('Author not found');
            err.status = 404
            return next(err);
        }
        res.render('author_detail', {title: 'Author Detail', author: results.author, author_books: results.authors_books});
    });
};

// Display Author create form on GET.
exports.author_create_get = function(req, res) {
    res.render('author_form', {title: 'Create new Author'});
};

// Handle Author create on POST.
exports.author_create_post = [
    body('first_name').trim().isLength({min: 1}).escape().withMessage('First name must be specified.')
        .isAlphanumeric().withMessage('First name cannot have non-numeric characters.'),
    body('last_name').trim().isLength({min: 1}).escape().withMessage('Last name must be specified.')
        .isAlphanumeric().withMessage('Last name cannot have non-numeric characters.'),
    body('date_of_birth', 'Invalid date of birth').optional({checkFalsy: true}).isISO8601().toDate(),
    body('date_of_death', 'Invalid date of death').optional({checkFalsy: true}).isISO8601().toDate(),

    (req, res, next) => {
        const errors = validationResult(req);

        if(!errors.isEmpty()) {
            res.render('author_form', {title: 'Create new Author', author: req.body, errors: errors.array()});
        } else {
            var author = new Author({
                first_name: req.body.first_name,
                last_name: req.body.last_name,
                date_of_birth: req.body.date_of_birth,
                date_of_death: req.body.date_of_death
            });
            author.save(function(err){
                if(err) {return next(err)}
                res.redirect(author.url);
            });
        }
    }
];
// Display Author delete form on GET.
exports.author_delete_get = function(req, res, next) {
    async.parallel({
        author: (callback) => {
            Author.findById(req.params.id).exec(callback)
        },
        authors_books: (callback) => {
            Book.find({'author': req.params.id}).exec(callback)
        },
    }, function(err, results) {
        if(err) {return next(err);}
        if(results.author == null) { //No author, can't delete
            res.redirect('/catalog/authors') //Send them back to the authors page
            return;
        } 
        res.render('author_delete', {title: 'Delete author', author: results.author, author_books: results.authors_books});
    });
};

// Handle Author delete on POST.
exports.author_delete_post = function(req, res, next) {
    async.parallel({
        author: (callback) => {
            Author.findById(req.body.author).exec(callback);
        },
        authors_books: (callback) => {
            Book.find({'author': req.body.author}).exec(callback);
        },

    }, function (err, results) {
        if (err) {return next(err);}
        if(results.authors_books.length > 0) { //Need to get rid of all author's books before author
            res.render('author_delete', { title: 'Delete Author', author: results.author, author_books: results.authors_books } );
            return;
        } else {
            Author.findByIdAndRemove(req.body.authorid, (err) => {
                if(err) {return next(err);}
                res.redirect('/catalog/authors');
            });
        }
    });
};

// Display Author update form on GET.
exports.author_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Author update GET');
};

// Handle Author update on POST.
exports.author_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Author update POST');
};