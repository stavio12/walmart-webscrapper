const express = require("express");
const route = express.Router();
const puppeteer = require("puppeteer");
const cheerio = require("cheerio");

let browser;

//requring user model from dbs
// const User = require("../walmartdbs/userdbs");
const Product = require("../walmartdbs/product");

// check whether a user is authenticated
function verifyUser(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  req.flash("error_msg", "Please Login first to access this page");
  res.redirect("/");
}

//Writing function for scrapping page
async function scrapData(url, page) {
  try {
    await page.goto(url, { waitUntil: "load", timeout: 0 });

    const html = await page.evaluate(() => document.body.innerHTML);
    const $ = cheerio.load(html);

    let title = $("h1").attr("content");
    let price = $(".price-characteristic").attr("content");

    if (!price) {
      let dollars = $("#price > div > span.hide-content.display-inline-block-m > span > span.price-group.price-out-of-stock > span.price-characteristic").text();
      let cents = $("#price > div > span.hide-content.display-inline-block-m > span > span.price-group.price-out-of-stock > span.price-mantissa").text();
      price = dollars + "." + cents;
    }

    let seller = "";
    let checkSeller = $(".seller-name");
    if (checkSeller) {
      seller = checkSeller.text();
    }

    let outOfStock = "";
    let checkOutOfStock = $(".prod-ProductOffer-oosMsg");
    if (checkOutOfStock) {
      outOfStock = checkOutOfStock.text();
    }

    let deliveryNotAvaiable = "";
    let checkDeliveryNotAvailable = $(".fulfillment-shipping-text");
    if (checkDeliveryNotAvailable) {
      deliveryNotAvaiable = checkDeliveryNotAvailable.text();
    }

    let stock = "";

    if (!seller.includes("Walmart") || outOfStock.includes("Out of Stock") || deliveryNotAvaiable.includes("Delivery not available")) {
      stock = "Out of stock";
    } else {
      stock = "In stock";
    }

    return {
      title,
      price,
      stock,
      url,
    };
  } catch (error) {
    console.log(error);
  }
}

//All get routes
route.get("/", (req, res) => {
  res.render("./index");
});

route.get("/dashboard", verifyUser, (req, res) => {
  Product.find({})
    .then((products) => {
      res.render("admin/dashboard", { products: products });
    })
    .catch((err) => {
      req.flash("error_msg", "ERROR: " + err);
      res.redirect("/dashboard");
    });
});

route.get("/logout", verifyUser, (req, res) => {
  req.logOut();
  req.flash("success_msg", "You have been logged out");
  res.redirect("/");
});

// Product search and add routes
route.get("/new/product", verifyUser, async (req, res) => {
  try {
    let url = req.query.search;

    if (url) {
      browser = await puppeteer.launch({ headless: false });
      const page = await browser.newPage();
      let result = await scrapData(url, page);

      let productData = {
        title: result.title,
        price: "$" + result.price,
        stock: result.stock,
        productURL: result.url,
      };

      res.render("admin/product", { product: productData });
      browser.close();
    } else {
      let productData = {
        title: "",
        price: "",
        stock: "",
        productURL: "",
      };

      res.render("admin/product", { product: productData });
    }
  } catch (error) {
    req.flash("error_msg", "ERROR: " + err);
    res.redirect("/new/product");
  }
});

route.get("/product/search", verifyUser, (req, res) => {
  let searchQuery = req.query.search;
  if (searchQuery) {
    Product.findOne({ sku: searchQuery })
      .then((product) => {
        if (!product) {
          req.flash("error_msg", "No product found with this SKU");
          return res.redirect("/product/search");
        }

        res.render("admin/search", { product: product });
      })
      .catch((err) => {
        req.flash("error_msg", "ERROR" + err);
        res.redirect("/product/search");
      });
  } else {
    res.render("admin/search", { product: "" });
  }
});

// Stock ROutes
route.get("/products/instock", verifyUser, (req, res) => {
  Product.find({ newstock: "In stock" })
    .then((product) => {
      if (product) {
        res.render("admin/instock", { product: product });
      } else {
        res.render("admin/instock", { product: "" });
      }
    })
    .catch((err) => {
      req.flash("error_msg", "ERROR" + err);
      res.redirect("/dashboard");
    });
});

route.get("/products/outofstock", verifyUser, (req, res) => {
  Product.find({ newstock: "Out of stock" })
    .then((product) => {
      if (product) {
        res.render("admin/outofstock", { product: product });
      } else {
        res.render("admin/outofstock", { product: "" });
      }
    })
    .catch((err) => {
      req.flash("error_msg", "ERROR" + err);
      res.redirect("/dashboard");
    });
});

route.get("/products/backinstock", verifyUser, (req, res) => {
  Product.find({ $and: [{ oldstock: "Out of stock" }, { newstock: "In stock" }] })
    .then((product) => {
      if (product) {
        res.render("admin/backinstock", { product: product });
      }
    })
    .catch((err) => {
      req.flash("error_msg", "ERROR" + err);
      res.redirect("/dashboard");
    });
});

//Price routes
route.get("/products/pricechanged", verifyUser, (req, res) => {
  Product.find({})
    .then((product) => {
      if (product) {
        res.render("admin/pricechange", { product: product });
      }
    })
    .catch((err) => {
      req.flash("error_msg", "ERROR" + err);
      res.redirect("/dashboard");
    });
});

//Update routes
route.get("/products/updated", verifyUser, (req, res) => {
  Product.find({ updatestatus: "updated" })
    .then((product) => {
      if (product) {
        res.render("admin/updated", { product: product });
      } else {
        res.render("admin/updated", { product: "" });
      }
    })
    .catch((err) => {
      req.flash("error_msg", "ERROR" + err);
      res.redirect("/dashboard");
    });
});

route.get("/products/Notupdated", verifyUser, (req, res) => {
  Product.find({ updatestatus: "Not updated" })
    .then((product) => {
      if (product) {
        res.render("admin/updated", { product: product });
      } else {
        res.render("admin/updated", { product: "" });
      }
    })
    .catch((err) => {
      req.flash("error_msg", "ERROR" + err);
      res.redirect("/dashboard");
    });
});

route.get("/product/update", verifyUser, (req, res) => {
  res.render("admin/update", { message: "" });
});

//Post routes

route.post("/new/product", verifyUser, (req, res) => {
  //
  let { title, url, price, sku, stock } = req.body;

  let prod = {
    title: title,
    newprice: price,
    oldprice: price,
    newstock: stock,
    oldstock: stock,
    sku: sku,
    company: "walmart",
    url: url,
    updatestatus: "updated",
  };

  Product.findOne({ sku: sku })
    .then(async (product) => {
      if (product) {
        req.flash("error_msg", "Product already exist in database!");

        return res.redirect("/new/product");
      }

      await Product.create(prod).then((product) => {
        req.flash("success_msg", "Product saved successfully in database!");
        return res.redirect("/new/product");
      });
    })
    .catch((err) => {
      req.flash("error_msg", "ERROR" + err);
      res.redirect("/dashboard");
    });
});

route.post("/product/update", verifyUser, async (req, res) => {
  try {
    res.render("admin/update", { message: "update started" });

    Product.find({})
      .then(async (products) => {
        //Loop through products
        for (let i = 0; i < products.length; i++) {
          //set product old products details
          Product.updateOne({ url: products[i].url }, { $set: { oldprice: products[i].newprice, oldstock: products[i].newstock, updatestatus: "Not updated" } }).then((products) => {});
        }

        browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();

        for (let i = 0; i < products.length; i++) {
          //set new update if any to new details
          let result = await scrapData(products[i].url, page);
          Product.updateOne({ url: products[i].url }, { $set: { title: result.title, newprice: `$${result.price}`, newstock: result.newstock, updatestatus: "updated" } }).then((products) => {});
        }

        browser.close();
      })
      .catch((err) => {
        req.flash("error_msg", "ERROR" + err);
        res.redirect("/dashboard");
      });
  } catch (error) {
    req.flash("error_msg", "ERROR" + error);
    res.redirect("/dashboard");
  }
});

//Delete Routes
route.delete("/products/instock/delete/:id", verifyUser, (req, res) => {
  let id = { _id: req.params.id };

  Product.deleteOne(id)
    .then((product) => {
      req.flash("success_msg", "Product deleted Successfully");
      res.redirect("/products/instock");
    })
    .catch((err) => {
      req.flash("error_msg", "ERROR: " + err);
    });
});

route.delete("/products/outofstock/delete/:id", verifyUser, (req, res) => {
  let id = { _id: req.params.id };

  Product.deleteOne(id)
    .then((product) => {
      req.flash("success_msg", "Product deleted Successfully");
      res.redirect("/products/outofstock");
    })
    .catch((err) => {
      req.flash("error_msg", "ERROR: " + err);
    });
});

module.exports = route;
