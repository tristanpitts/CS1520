from flask import Flask, request, session, url_for, redirect, render_template, abort, g, flash
from app import *
from models import db, User, Book

#########################################################################################
# Utilities
#########################################################################################

# Given a username, gives
def get_user_id(username):
	rv = User.query.filter_by(username=username).first()
	return rv.user_id if rv else None

# This decorator will cause this function to run at the beginning of each request,
# before any of the route functions run. We're using this to check if the user is
# logged in, so that we don't have to do that on every page.
@app.before_request
def before_request():
	# 'g' is a general-purpose global variable thing that Flask gives you.
	# it's a "magic global" like session, request etc. so it's useful
	# for storing globals that you only want to exist for one request.
	g.user = None
	if 'user_id' in session:
		g.user = User.query.filter_by(user_id=session['user_id']).first()

#########################################################################################
# User account management page routes
#########################################################################################

# This stuff is taken pretty much directly from the "minitwit" example.
# It's pretty standard stuff, so... I'm not gonna make you reimplement it.

@app.route('/login', methods=['GET', 'POST'])
def login():
	"""Logs the user in."""
	if g.user:
		return redirect(url_for('home'))
	error = None
	if request.method == 'POST':

		user = User.query.filter_by(username=request.form['username']).first()
		if user is None:
			error = 'Invalid username'
		elif user.password != request.form['password']:
			error = 'Invalid password'
		else:
			flash('You were logged in')
			session['user_id'] = user.user_id
			return redirect(url_for('home'))

	return render_template('login.html', error=error)

@app.route('/register', methods=['GET', 'POST'])
def register():
	"""Registers the user."""
	if g.user:
		return redirect(url_for('home'))

	error = None
	if request.method == 'POST':
		if not request.form['username']:
			error = 'You have to enter a username'
		elif not request.form['email'] or '@' not in request.form['email']:
			error = 'You have to enter a valid email address'
		elif not request.form['password']:
			error = 'You have to enter a password'
		elif request.form['password'] != request.form['password2']:
			error = 'The two passwords do not match'
		elif get_user_id(request.form['username']) is not None:
			error = 'The username is already taken'
		else:
			db.session.add(User(
				username = request.form['username'],
				email = request.form['email'],
				password = request.form['password'],
				librarian = False))
			db.session.commit()
			flash('You were successfully registered! Please log in.')
			return redirect(url_for('login'))

	return render_template('register.html', error=error)

@app.route('/logout')
def logout():
	"""Logs the user out."""
	flash('You were logged out. Thanks!')
	session.pop('user_id', None)
	return redirect(url_for('home'))

#########################################################################################
# Other page routes
#########################################################################################

# The home page shows a listing of books.
@app.route('/', methods=['GET', 'POST'])
def home():
	if request.method == 'POST':
		book = Book.query.filter_by(book_id = request.form.get("book_id")).first()
		#print(book.title, book.author, book.book_id)
		print(g.user.borrows.all(), book)
		if book in g.user.borrows:
			print("return")
			g.user.borrows.remove(book)
		else:
			print("borrow")
			g.user.borrows.append(book)
		db.session.commit()

	return render_template("home.html", books = Book.query.order_by(Book.title).all(), user=g.user, borrows=borrowsArray())

@app.route('/books/<book_id>', methods=['GET', 'POST'])
def books(book_id):
	if book_id == 'None':
		if request.method == 'POST':
			if not request.form['author'] or '  ' in request.form['author']:
				error = 'You have to enter an Author'
				return render_template('newBook.html', error=error)
			elif not request.form['title']:
				error = 'You have to enter a Title'
				return render_template('newBook.html', error=error)
			else:
				db.session.add(Book(
					author = request.form['author'],
					title = request.form['title']))
				db.session.commit()
				flash("Book added successfully")

		return render_template('newBook.html')
	else:
		if request.method == 'POST':
			book = Book.query.filter_by(book_id = request.form.get("delete")).first()
			db.session.delete(book)
			db.session.commit()
			flash("Book Removed Successfully")
			return redirect(url_for("home"))

		book = Book.query.filter_by(book_id = book_id).first()
		if book == None:
			print("Abort")
			abort(404)
		return render_template('bookinfo.html', numUsers = numUsers(book_id), book = Book.query.filter_by(book_id = book_id).first(), users = User.query.order_by(User.username).all())

@app.route('/accounts/<account_id>', methods=['GET', 'POST'])
def accounts(account_id):
	if account_id == 'None':
		error = None
		if request.method == 'POST':
			if not request.form['username']:
				error = 'You have to enter a username'
			elif not request.form['email'] or '@' not in request.form['email']:
				error = 'You have to enter a valid email address'
			elif not request.form['password']:
				error = 'You have to enter a password'
			elif request.form['password'] != request.form['password2']:
				error = 'The two passwords do not match'
			elif get_user_id(request.form['username']) is not None:
				error = 'The username is already taken'
			else:
				db.session.add(User(
					username = request.form['username'],
					email = request.form['email'],
					password = request.form['password'],
					librarian = True))
				db.session.commit()
				flash('New Librarian Successfully Registered')
		return render_template("accounts.html", users = User.query.order_by(User.username).all())
	else:
		if request.method == 'POST':
			user = User.query.filter_by(user_id = request.form.get("delete")).first()
			db.session.delete(user)
			db.session.commit()
			flash("User Removed Successfully")
			return redirect(url_for("home"))
		return render_template("accountInfo.html", user = User.query.filter_by(user_id = account_id).first(), numBooks = numBooks(account_id), isOwner = User.query.filter_by(user_id = account_id).first().username == 'owner')

def numUsers(book):
	x = 0
	for u in User.query.order_by(User.username).all():
		for b in u.borrows:
			print(u.username, b.title, b.book_id, book)
			if int(b.book_id) == int(book):
				x+=1

	print(x)
	return x

def numBooks(user):
	x=0;
	user = User.query.filter_by(user_id = user).first()
	for b in user.borrows:
		x+=1
	return x

def borrowsArray():
	a=[0] * (totalBooks()+1)
	for u in User.query.order_by(User.username).all():
		for b in u.borrows:
			a[b.book_id] = a[b.book_id] + 1

	print(a)
	return a

def totalBooks():
	x = 0
	for b in Book.query.order_by(Book.title).all():
		if b.book_id > x:
			x=b.book_id
	return x
