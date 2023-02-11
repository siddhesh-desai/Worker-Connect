const Worker = require('../models/worker');
const Client = require('../models/client');
const Admin = require('../models/admin');
const jwt = require('jsonwebtoken');

const requireWorkerAuth = (req, res, next) => {
	const token = req.cookies.jwt;

	if (token) {
		jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decodedToken) => {
			if (err) {
				return res.render('worker/login', { errMsg: 'Access Denied' });
			} else {
				Worker.findById(decodedToken.id, (err, doc) => {
					if (err || doc == null) {
						return res.render('worker/login', { errMsg: 'Access Denied' });
					} else {
						req.workerID = decodedToken.id;
						next();
					}
				});
			}
		});
	} else {
		res.render('worker/login', { errMsg: 'Access Denied' });
	}
};

const requireClientAuth = (req, res, next) => {
	const token = req.cookies.jwt;
	if (token) {
		jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decodedToken) => {
			if (err) {
				return res.render('client/login', { errMsg: 'Access Denied' });
			} else {
				Client.findById(decodedToken.id, (err, doc) => {
					if (err || doc == null) {
						return res.render('client/login', { errMsg: 'Access Denied' });
					} else {
						req.clientID = decodedToken.id;
						next();
					}
				});
			}
		});
	} else {
		return res.render('client/login', { errMsg: 'Access Denied' });
	}
};

const requireAdminAuth = (req, res, next) => {
	const token = req.cookies.jwt;
	if (token) {
		jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decodedToken) => {
			if (err) {
				return res.render('admin/login', { errMsg: 'Access Denied' });
			} else {
				Admin.findById(decodedToken.id, (err, doc) => {
					if (err || doc == null) {
						return res.render('admin/login', { errMsg: 'Access Denied' });
					} else {
						req.adminID = decodedToken.id;
						next();
					}
				});
			}
		});
	} else {
		return res.render('admin/login', { errMsg: 'Access Denied' });
	}
};

module.exports = {
	requireWorkerAuth,
	requireClientAuth,
	requireAdminAuth,
};
