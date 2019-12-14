from flask_sqlalchemy import SQLAlchemy
from app import app

db = SQLAlchemy()
db.init_app(app)

@app.cli.command('initdb')
def initdb_command():
	# wipeout
	db.drop_all()
	db.create_all()

	# add some default data: the 'owner' account and some sample books
	db.session.add(User(username='owner', email="a@b.com", password='pass', librarian=True))

	db.session.add(Book(title='Programming the World Wide Web', author='Sebesta, Robert'))
	db.session.add(Book(title='Jerry Plotter', author='Howling, K.J.'))
	db.session.add(Book(title='All About Bears', author='Totally, Notabear'))
	db.session.commit()

	print('Initialized the database.')

borrowsTable = db.Table('borrows',
    db.Column('user_id', db.Integer, db.ForeignKey('user.user_id')),
    db.Column('book_id', db.Integer, db.ForeignKey('book.book_id'))
)

class User(db.Model):
	user_id   = db.Column(db.Integer,    primary_key = True)
	username  = db.Column(db.String(24), nullable = False)
	email     = db.Column(db.String(80), nullable = False)
	password  = db.Column(db.String(64), nullable = False)
	librarian = db.Column(db.Boolean,    nullable = False)

	borrows = db.relationship('Book',
		secondary = borrowsTable,
		backref = db.backref('borrowed_by', lazy = 'dynamic'),
		lazy = 'dynamic')

	def __repr__(self):
		return '<User {}>'.format(self.username)

class Book(db.Model):
	book_id = db.Column(db.Integer, primary_key = True)
	title   = db.Column(db.Text, nullable = False, unique = True)
	author  = db.Column(db.Text, nullable = False)

	def __repr__(self):
		return '<Book {}: "{}">'.format(self.book_id, self.title)
