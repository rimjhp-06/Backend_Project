const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const { Pool } = require('pg');
const { Parser } = require('json2csv');
const csv = require('fast-csv');
const csvParser = require('csv-parser');
const await = require('await');

let cors = require("cors");


const app = express();
app.use(cors());

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'mydatabase',
    password: 'mypassword',
    port: 5432
  });
  
  // Multer configuration to handle CSV file upload
  const upload = multer({ dest: 'uploads/' });

// Mock users
const users = [
  {
    id: 1,
    email: 'user1@example.com',
    password: '$2b$10$31oKuHlaLb1ZtOFdMj9M7.6fJUDsN7V/CDvT8T37/1JQ.3x7qHXLu' // hashed version of 'password'
  },
  {
    id: 2,
    email: 'user2@example.com',
    password: '$2b$10$31oKuHlaLb1ZtOFdMj9M7.6fJUDsN7V/CDvT8T37/1JQ.3x7qHXLu' // hashed version of 'password'
  }
];


// Students endpoint
app.get('/students', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM students');
      const students = result.rows;
      res.json(students);
    } catch (err) {
      console.error(err);
      res.status(500).send('Error getting students');
    }
  });

  // Students CSV endpoint
app.get('/students.csv', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM students');
      const students = result.rows;
      // Convert students to CSV
      const parser = new Parser();
      const csv = parser.parse(students);
      // Set headers to force download
      res.setHeader('Content-disposition', 'attachment; filename=students.csv');
      res.set('Content-Type', 'text/csv');
      res.status(200).send(csv);
    } catch (err) {
      console.error(err);
      res.status(500).send('Error getting students');
    }
  });


// Authentication routes
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const user = users.find(user => user.email === email);

  if (!user) {
    return res.status(401).json({ message: 'Authentication failed' });
  }

  // Compare password
  bcrypt.compare(password, user.password, (err, result) => {
    if (err) {
      return res.status(401).json({ message: 'Authentication failed' });
    }

    if (result) {
      // Generate JWT token
      const token = jwt.sign({ email: user.email, id: user.id }, 'SECRET_KEY', { expiresIn: '2 days' });
      return res.status(200).json({ message: 'Authentication successful', token });
    }

    return res.status(401).json({ message: 'Authentication failed' });
  });
});

app.post('/signup', (req, res) => {
  const { email, password } = req.body;

  // Check if user already exists
  const userExists = users.some(user => user.email === email);

  if (userExists) {
    return res.status(409).json({ message: 'User already exists' });
  }

  // Hash password
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
      return res.status(500).json({ message: 'Internal server error' });
    }

    const newUser = {
      id: users.length + 1,
      email,
      password: hash
    };

    // Add new user to mock database
    users.push(newUser);

    // Generate JWT token
    const token = jwt.sign({ email: newUser.email, id: newUser.id }, 'SECRET_KEY', { expiresIn: '2 days' });

    return res.status(201).json({ message: 'User created', token });
  });
});


// Endpoint to handle CSV file upload and insertion into the database
app.post('/students/upload', upload.single('csv'), (req, res) => {
  // Read the CSV file and insert each row into the database
  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => {
      // Check if the email already exists in the database
      pool.query('SELECT COUNT(*) FROM students WHERE email = $1', [data.email], (err, result) => {
        if (err) {
          console.error(err);
          return;
        }

        // If the email already exists, skip this row
        if (result.rows[0].count > 0) {
          console.log(`Skipping duplicate email ${data.email}`);
          return;
        }

        // Insert the row into the database
        pool.query('INSERT INTO students (Name, Roll_No, Address, Institute, Course, Email) VALUES ($1, $2, $3, $4,$5,$6)', [data.name, data.roll_no, data.address, data.institue,data.course,data.email], (err, result) => {
          if (err) {
            console.error(err);
            return;
          }
          results.push(result.rows[0]);
        });
      });
    })
    .on('end', () => {
      // Delete the CSV file from the server
      fs.unlinkSync(req.file.path);
      console.log(`Inserted ${results.length} rows into the database`);
      res.send(`Inserted ${results.length} rows into the database`);
    });
});


  




// Students endpoint
app.post('/students', (req, res) => {
  const students = [];
  req.pipe(csvParser())
    .on('data', data => {
              // Create a student object from the CSV row
      const student = {
        name: data.Name,
        roll_no: data.Roll_No,
        address: data.Address,
        institute: data.Institute,
        course: data.Course,
        email:data.Email,
      };
      // Check if student with this email already exists in the database
      const result = async function start(){await pool.query('SELECT * FROM students WHERE email = $1', [student.email]);
    }
      if (result.rows.length === 0) {
        students.push(student);
      }
    })
    .on('end', async () => {
      // Insert the unique students into the database
      const insertQuery = 'INSERT INTO students (Name, Roll_No, Address, Institute, Course,Email) VALUES ($1, $2, $3, $4, $5,$6)';
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        for (const student of students) {
          await client.query(insertQuery, [student.name, student.roll_no, student.address, student.institute, student.course,student.email]);
        }
        await client.query('COMMIT');
        res.send('Students added successfully');
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).send('Error adding students');
      } finally {
        client.release();
      }
    });
});

     


// Start the server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});

