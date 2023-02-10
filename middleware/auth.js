const Worker = require('../models/worker');
const Client = require('../models/client');
const Admin = require('../models/admin');

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

	// check json web token exists & is verified
	// console.log("Checking Token")
	if (token) {
		jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decodedToken) => {
			if (err) {
				//   console.log(err.message);
				return res.status(400).json({ status: 'fail', message: 'Access Denied' });
				//   res.render('login', {msg : "Access Denied"});
			} else {
				Admin.findById(decodedToken.id, (err, doc) => {
					if (err || doc == null) {
						//   res.render("login", {msg : "Access Denied"})
						return res.status(400).json({ message: 'Access Denied', status: 'fail' });
					} else {
						req.adminID = decodedToken.id;
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

module.exports = {
    requireWorkerAuth,
    requireClientAuth,
    requireAdminAuth
}