const Worker = require('../models/worker');
const Client = require('../models/client');
const Admin = require('../models/admin');
const jwt = require("jsonwebtoken")

const requireWorkerAuth = (req, res, next) => {
	const token = req.cookies.jwt;

	// check json web token exists & is verified
	// console.log("Checking Token")
	if (token) {
		jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decodedToken) => {
			if (err) {
				//   console.log(err.message);
				return res.status(400).json({ status: 'fail', message: 'Access Denied' });
				//   res.render('login', {msg : "Access Denied"});
			} else {
				Worker.findById(decodedToken.id, (err, doc) => {
					if (err || doc == null) {
						//   res.render("login", {msg : "Access Denied"})
						return res.status(400).json({ message: 'Access Denied', status: 'fail' });
					} else {
						req.workerID = decodedToken.id;
						next();
					}
				});
			}
		});
	} else {
		//   res.render('login', {msg : "Access Denied"});
		res.status(400).json({ message: 'Access Denied', status: 'fail' });
	}
};

const requireClientAuth = (req, res, next) => {
	const token = req.cookies.jwt;

	// check json web token exists & is verified
	// console.log("Checking Token")
	if (token) {
		jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decodedToken) => {
			if (err) {
				//   console.log(err.message);
				return res.status(400).json({ status: 'fail', message: 'Access Denied' });
				//   res.render('login', {msg : "Access Denied"});
			} else {
				Client.findById(decodedToken.id, (err, doc) => {
					if (err || doc == null) {
						//   res.render("login", {msg : "Access Denied"})
						return res.status(400).json({ message: 'Access Denied', status: 'fail' });
					} else {
						req.clientID = decodedToken.id;
						next();
					}
				});
			}
		});
	} else {
		//   res.render('login', {msg : "Access Denied"});
		res.status(400).json({ message: 'Access Denied', status: 'fail' });
	}
};

const requireAdminAuth = (req, res, next) => {
	const token = req.cookies.jwt;
	if (token) {
		jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decodedToken) => {
			if (err) {
				  return res.render('admin/login', {errMsg : "Access Denied"});
				} else {
					Admin.findById(decodedToken.id, (err, doc) => {
						if (err || doc == null) {
							return res.render('admin/login', {errMsg : "Access Denied"});
					} else {
						req.adminID = decodedToken.id;
						next();
					}
				});
			}
		});
	} else {
		return res.render('admin/login', {errMsg : "Access Denied"});
	}
};

module.exports = {
    requireWorkerAuth,
    requireClientAuth,
    requireAdminAuth
}