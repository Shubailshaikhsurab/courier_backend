const http = require('http');
const mysql = require('mysql');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');


const app = express();

const PORT = 3000;
app.use(bodyParser.json());

app.use(cors());
//db  details 
const dbConnection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
     password: '',
    database: 'courierdb',
  });
//connecting to db
  dbConnection.connect((err) => {
    if (err) {
      console.error('Error connecting to MySQL:', err);
      process.exit(1);
    }
    console.log('Connected to MySQL database');
  });

  app.use(express.json());

  app.get('/api/Login', (req, res) => {
    const {UserName,Password} = req.query;
    const sql = `
      SELECT COUNT(UserName) AS userCount FROM login WHERE UserName = ? and Password=? 
    `;
  
    dbConnection.query(sql, [UserName,Password], (err, result) => {
      if (err) {
        console.error('Error executing MySQL query:', err);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }
  
      const userCount = result[0].userCount;
      res.status(200).json({ userCount });
    });
  });

  app.post('/api/register', (req, res) => {
    const {
      FIRSTNAME,
      LASTNAME,
      USERNAME,
      PASSWORD,
      MOBILE,
      EMAIL,
      ADDRESS,
    } = req.body;
  
    const sql = `
      INSERT INTO register (FIRSTNAME, LASTNAME, USERNAME, PASSWORD, MOBILE, EMAIL, ADDRESS)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
  
    const values = [FIRSTNAME, LASTNAME, USERNAME, PASSWORD, MOBILE, EMAIL, ADDRESS];
  
    
    dbConnection.query(sql, values, (err, result) => {
      if (err) {
        console.error('Error executing MySQL query:', err);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }  
      const sqlLogin = `
        INSERT INTO login (UserName, Password)
        VALUES (?, ?)
      `;      
  
      
      dbConnection.query(sqlLogin, [USERNAME, PASSWORD], (err, result) => {
        if (err) {
          console.error('Error executing MySQL query:', err);
          res.status(500).json({ error: 'Internal Server Error' });
          return;
        }
  
        console.log('Data inserted successfully');
        res.status(200).json({ message: 'Data inserted successfully' });
      });
    });
  });
  

app.get('/api/UserExist', (req, res) => {
    const username = req.query.username;
  
    const sql = `
      SELECT COUNT(USERNAME) AS userCount FROM register WHERE USERNAME = ?
    `;
  
    dbConnection.query(sql, [username], (err, result) => {
      if (err) {
        console.error('Error executing MySQL query:', err);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }
  
      const userCount = result[0].userCount;
      res.status(200).json({ userCount });
    });
  });
  app.get('/api/GetUsers', (req, res) => {
    const sql = 'SELECT * FROM register';

    dbConnection.query(sql, (err, result) => {
        if (err) {
            console.error('Error executing MySQL query:', err);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.status(200).json(result);
    });
});

app.get('/api/GetUser', (req, res) => {
  const username = req.query.username;
  
  const sql = `
    SELECT *  FROM register WHERE USERNAME = ? `;

  dbConnection.query(sql, [username], (err, result) => {
    if (err) {
      console.error('Error executing MySQL query:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    res.status(200).json({ result });
  });
});

app.delete('/api/DeleteUser/:username', (req, res) => {
  const userId = req.params.username;
  
  const sql = `
    DELETE FROM register 
    WHERE USERNAME = ?
  `;

  dbConnection.query(sql, [userId], (err, result) => {
    if (err) {
      console.error('Error deleting user:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    res.status(200).json({ message: 'User deleted successfully' });
  });
});

app.put('/api/UpdateUser/:userId', (req, res) => {
  const userId = req.params.userId;
  const updatedUserData = req.body; 

  const sql = `
      UPDATE register 
      SET FIRSTNAME = ?, LASTNAME = ?, USERNAME = ?, PASSWORD = ?, MOBILE = ?, EMAIL = ?, ADDRESS = ? 
      WHERE USERNAME = ?
  `;

  const values = [
      updatedUserData.FIRSTNAME,
      updatedUserData.LASTNAME,
      updatedUserData.USERNAME,
      updatedUserData.PASSWORD,
      updatedUserData.MOBILE,
      updatedUserData.EMAIL,
      updatedUserData.ADDRESS,
      userId
  ];

  dbConnection.query(sql, values, (err, result) => {
      if (err) {
          console.error('Error updating user:', err);
          res.status(500).json({ error: 'Internal Server Error' });
          return;
      }

      res.status(200).json({ message: 'User updated successfully' });
  });
});

app.post('/api/insertCourierAndCustomer', (req, res) => {
 
  const { COURIERID,CUSTOMERNAME, COURIERSTATUS, COURIERSTARTDATE, COURIERDELDATE, CUSTOMERID, CUSTOMERMOBILE, CUSTOMEREMAIL, CUSTOMERADDRESS,COURIERAMOUNT } = req.body;

  const courierInsertQuery = `
    INSERT INTO COURIER (COURIERID, COURIERSTATUS, COURIERSTARTDATE, COURIERDELDATE,COURIERAMOUNT)
    VALUES (?, ?, ?, ?, ?);
  `;

  dbConnection.query(courierInsertQuery, [COURIERID, COURIERSTATUS, COURIERSTARTDATE, COURIERDELDATE, parseInt(COURIERAMOUNT,10)], (err, results) => {
    if (err) {
      console.error('Error inserting data into COURIER table:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    const customerInsertQuery = `
      INSERT INTO CUSTOMER (CUSTOMERID,CUSTOMERNAME, CUSTOMERMOBILE, CUSTOMEREMAIL, CUSTOMERADDRESS, COURIERID)
      VALUES (?, ?, ?, ?, ?, ?);
    `;

    dbConnection.query(
      customerInsertQuery,
      [CUSTOMERID,CUSTOMERNAME, parseInt(CUSTOMERMOBILE, 10), CUSTOMEREMAIL, CUSTOMERADDRESS, COURIERID],
      (err, customerResults) => {
        if (err) {
          console.error('Error inserting data into CUSTOMER table:', err);
          res.status(500).json({ error: 'Internal Server Error' });
        } else {
          console.log('Data inserted successfully into both COURIER and CUSTOMER tables');
          res.status(200).json({ message: 'Data inserted successfully' });
        }
      }
    );
  });
});



app.get('/api/GetCustomerAndCourier', (req, res) => {
  const sql = 'SELECT cu.CUSTOMERID,cu.CUSTOMERNAME,cu.COURIERID,cu.CUSTOMERMOBILE,cu.CUSTOMEREMAIL,cu.CUSTOMERADDRESS,co.COURIERSTATUS,co.COURIERSTARTDATE,co.COURIERDELDATE,co.COURIERAMOUNT FROM customer cu join courier co on cu.COURIERID = co.COURIERID;';

  dbConnection.query(sql, (err, result) => {
      if (err) {
          console.error('Error executing MySQL query:', err);
          res.status(500).json({ error: 'Internal Server Error' });
          return;
      }

      // Send the entire result as JSON
      res.status(200).json(result);
  });
});
  
 
  
  app.post('/api/NewCourierCost', (req, res) => {
    const {
      CourierType,
      CourierCost,
    } = req.body;
    const sql = `
    INSERT INTO couriercost (CourierType, CourierCost)
    VALUES(?,?) 
  `;

  const values = [CourierType,CourierCost];

  dbConnection.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error executing MySQL query:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    console.log('Data inserted successfully');
    res.status(200).json({ message: 'Data inserted successfully' });
  });
});

app.delete('/api/DeleteCourierCost', (req, res) => {
  const userId = req.params.username;
  
  const sql = `
  DELETE FROM couriercost
  WHERE CourierCostID ='?'
  `;

  dbConnection.query(sql, [userId], (err, result) => {
    if (err) {
      console.error('Error deleting user:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    res.status(200).json({ message: 'User deleted successfully' });
  });
});

  app.get('/api/SearchCourier', (req, res) => {
    const courierId = req.query.courierId;
    const sql = `
      SELECT * FROM courier WHERE COURIERID= ?
    `;
  
    dbConnection.query(sql, [courierId], (err, result) => {
      if (err) {
        console.error('Error searching courierid:', err);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }
  
      res.status(200).json(result[0]);
    });
  });


  app.put('/api/UpdateCustomer/:customerId', (req, res) => {
    const customerId = req.params.customerId;
    const updatedCustomerIdData = req.body; 
  
    const sql = `
        UPDATE customer 
        SET CUSTOMERMOBILE = ?, CUSTOMEREMAIL = ?, CUSTOMERADDRESS = ? 
        WHERE CUSTOMERID = ?
    `;
  
    const values = [
        updatedCustomerIdData.CUSTOMERMOBILE,
        updatedCustomerIdData.CUSTOMEREMAIL,
        updatedCustomerIdData.CUSTOMERADDRESS,
        customerId
    ];
  
    dbConnection.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error updating customer:', err);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }
  
        res.status(200).json({ message: 'Customer updated successfully' });
    });
});

app.put('/api/UpdateCourier/:courierId', (req, res) => {
  const courierId = req.params.courierId;
  const updatedCourierIdData = req.body; 

  const sql = `
      UPDATE courier 
      SET COURIERSTATUS = ?, COURIERDELDATE = ? 
      WHERE COURIERID  = ?
  `;

  const values = [
    updatedCourierIdData.COURIERSTATUS,
    updatedCourierIdData.COURIERDELDATE,
    courierId
  ];

  dbConnection.query(sql, values, (err, result) => {
      if (err) {
          console.error('Error updating courier:', err);
          res.status(500).json({ error: 'Internal Server Error' });
          return;
      }

      res.status(200).json({ message: 'courier updated successfully' });
  });
});



app.get('/api/GetCourierCost', (req, res) => {
  const sql = 'SELECT * FROM couriercost;';

  dbConnection.query(sql, (err, result) => {
      if (err) {
          console.error('Error executing MySQL query:', err);
          res.status(500).json({ error: 'Internal Server Error' });
          return;
      }

      // Send the entire result as JSON
      res.status(200).json(result);
  });
});

app.put('/api/UpdateCourierCost/:CourierCostID', (req, res) => {
  const CourierCostID = req.params.CourierCostID;
  const updatedCourierCost = req.body; 

  const sql = `
      UPDATE couriercost 
      SET CourierCost = ?
      WHERE CourierCostID  = ?
  `;

  const values = [
    updatedCourierCost.CourierCost,
    CourierCostID
  ];

  dbConnection.query(sql, values, (err, result) => {
      if (err) {
          console.error('Error updating courier:', err);
          res.status(500).json({ error: 'Internal Server Error' });
          return;
      }

      res.status(200).json({ message: 'courier Cost updated successfully' });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
