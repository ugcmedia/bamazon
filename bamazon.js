var mysql = require('mysql');
var inquirer = require("inquirer");

var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "",
    database: "bamazon"
});
connection.connect(function(err) {
    if (err) throw err;
    console.log('connected as id ' + connection.threadId);
    connection.query(`
DROP DATABASE IF EXISTS bamazon;
CREATE DATABASE bamazon;
USE bamazon;
CREATE TABLE products(
item_id INT NOT NULL AUTO_INCREMENT,
product_name VARCHAR(45) NOT NULL,
department_name VARCHAR(45) NOT NULL,
price INT NOT NULL,
stock_quantity INT NOT NULL,
PRIMARY KEY(item_id)
);
INSERT INTO products (item_id,product_name,department_name,price,stock_quantity) VALUES (1,'cherry cup','home decor',4.00,49);
INSERT INTO products (item_id,product_name,department_name,price,stock_quantity) VALUES (2,'flowers','gardening',5.00,90);
INSERT INTO products (item_id,product_name,department_name,price,stock_quantity) VALUES (3,'test item 3 ','test department 3 ',6.00,40);
INSERT INTO products (item_id,product_name,department_name,price,stock_quantity) VALUES (4,'testItem4','test department 4',45.00,100);`, function(error, res) {

    });
    start();
});

function start() {
    connection.query('SELECT * FROM products', function(error, res) {
        res.forEach((item) => {
            console.log(" id: " + item.item_id + " name: " + item.product_name + " price: " + item.price + " department " + item.department_name + " total available: " + item.stock_quantity)
        })
        if (error) throw error;
        begin(res.length);
    });
}

function begin(length) {
    let currentId;
    let newQuantity;
    const second = {
        name: "quantityValue",
        message: `Enter number of units to buy`,
        type: "input",
        filter: function(input) {
            return new Promise(function(resolve, reject) {
                connection.query('SELECT * FROM products WHERE ?', [{
                    item_id: currentId
                }], function(error, res) {
                    if (error) throw error;
                    if (parseInt(input) > res[0].stock_quantity) {
                        reject(`Not enough inventory, please enter a quantity <= ${res[0].stock_quantity}`);
                    } else if (parseInt(input) <= 0) {
                        reject(`Please enter qty > 0`);
                    } else {
                        newQuantity = res[0].stock_quantity - parseInt(input);
                        resolve(input);
                    }
                });
            })
        }
    }
    inquirer.prompt([{
            name: "id",
            message: `Enter id for item (0 < id < ${length + 1})`,
            type: "input",
            validate: function(input) {
                currentId = parseInt(input);
                var done = this.async();
                if (parseInt(input) > length) {
                    done(`Please enter value < ${length + 1} and > 0`);
                    return;
                } else {
                    done(null, true)
                }
            }
        },
        second
    ]).then((input) => {
        updateQty(newQuantity, input.id);
        console.log(`Qty was: ${input.quantityValue}`);
        console.log(`New qty is: ${newQuantity}`);
        console.log(`ID was: ${input.id}`);
    });
}

function updateQty(qty, id) {
    connection.query('UPDATE products SET ? WHERE ?', [{
            stock_quantity: qty
        }, {
            item_id: id
        }],
        function(error, res) {
            if (error) throw error;
            start();
        });
}