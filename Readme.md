####Steps to develop this project:

1) Authentication (login & signup) with email & password + JWT token generation (expiry - 2 days):
   
   For authentication, I created a /login and /signup endpoint in your Node.js/Express.js application that accepts email and password as input and generates a JWT        token on successful authentication.This implementation uses the bcrypt library to hash and compare passwords, and the jsonwebtoken library to generate JWT tokens.      The POST /signup endpoint inserts a new user into the users table in the database with the hashed password. The POST /login endpoint queries the users table for the    user with the specified email, compares the password with the hashed password, and generates a JWT token on successful authentication.

2) I have created a /students endpoint in your Node.js/Express.js application that accepts a CSV file upload and inserts unique rows into the students table in the database using csv-parser and fast-csv libraries. 
   
3) This implementation queries the students table in the database for all the students and returns a JSON array of the students.

4) This implementation queries the students table in the database for all the students, converts them to a CSV file using the json2csv library, and returns the CSV file as a response. The Content-disposition header is set to force the browser to download the file instead of displaying it. The Content-Type header is set to text/csv.

####Steps to setup the project:

1) Clone this repository.
2) Install all the dependencies used in this project.
3) Run 'Node server.js' command to start the project.
4) Your project is running on localhost:3000.
5) You can verify this project API's with postman.
