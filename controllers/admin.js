const Admin = require('../models/admin');
const Worker = require('../models/worker');
const Category = require('../models/category');
const Client = require('../models/client');
const jwt = require('jsonwebtoken');
const Task = require('../models/task');

// create json web token
const maxAge = 3 * 24 * 60 * 60;
const createAdminToken = (id) => {
	return jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
		expiresIn: maxAge,
	});
};

const addCategory_post = (req, res, next) => {
	Category.init().then(() => {
		// safe to create users now.
		var new_category = new Category({
			name: req.body.name,
		});
		new_category.save(function (err, result) {
			if (err) {
				console.log(err);
				// res.status(400).json({ message: err.message, status: 'fail' });
				res.render('admin/login', { errMsg: err.message });
			} else {
				// res.status(201).json({ status: 'success', data: result });
				res.redirect('/api/admin/categories');
			}
		});
	});
};

const removeCategory = async (req, res) => {
	const id = req.params.id;
	try {
		await Category.findByIdAndDelete(id);
		res.redirect('/api/admin/categories');
	} catch (err) {
		res.render('client/login', { errMsg: err.message });
	}
};

const updateCategory = async (req, res) => {
	const { id, name } = req.body;
	try {
		await Category.findByIdAndUpdate(id, { name });
		res.redirect('/api/admin/categories');
	} catch (err) {
		res.render('client/login', { errMsg: err.message });
	}
};

const register_post = (req, res, next) => {
	Admin.init().then(() => {
		// safe to create users now.
		var new_admin = new Admin({
			username: req.body.username,
			password: req.body.password,
		});
		new_admin.save(function (err, result) {
			if (err) {
				console.log(err);
				res.status(400).json({ message: err.message, status: 'fail' });
			} else {
				res.status(201).json({ status: 'success', data: result });
			}
		});
	});
};

const update_profile_post = async (req, res, next) => {
	// const adminID = req.adminID || '63e64569ac9e4267da000597';
	const adminID = req.adminID;
	var updatedAdmin = {
		username: req.body.username,
		password: req.body.password,
	};
	try {
		const result = await Admin.findByIdAndUpdate(adminID, updatedAdmin, { new: true });
		res.status(200).json({ status: 'success', data: result });
	} catch (err) {
		res.status(500).json({ status: 'fail', message: err.message });
	}
};

const login_post = async (req, res) => {
	const { username, password } = req.body;
	try {
		const admin = await Admin.login(username, password);
		if (admin == null) {
			res.render('admin/login', { errMsg: 'Invalid Crediential' });
		} else {
			const token = createAdminToken(admin._id);
			res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
			res.redirect('/api/admin/dashboard');
		}
	} catch (err) {
		console.log(err.message);
		res.render('admin/login', { errMsg: err.message });
	}
};

const logout = (req, res) => {
	res.cookie('jwt', '', { maxAge: 1 });
	res.redirect('/api/admin/login');
};

const verifyAccept = async (req, res) => {
	const workerID = req.params.id;
	try {
		const worker = await Worker.findById(workerID);
		if (worker === null) {
			// return res.status(400).json({ status: 'fail', message: 'Worker Not Found' });
			return res.redirect('/api/admin/dashboard');
		}
		// await worker.updateOne({ $set: { isVerify: true } });
		await worker.updateOne({
			$push: {
				notification: {
					message: 'Congratulations, Your Profile is now Verified, now you can apply for different jobs',
				},
			},
			$set: { isVerify: true },
		});
		res.redirect('/api/admin/dashboard');
		// res.status(200).json({ status: 'success', message: 'Worker Verification request is Accepted.' });
	} catch (err) {
		// res.status(500).json({ status: 'fail', message: err.message });
		res.redirect('api/admin/login');
	}
};

const verifyRejected = async (req, res) => {
	const workerID = req.params.id;
	try {
		const worker = await Worker.findById(workerID);
		if (worker === null) {
			// return res.status(400).json({ status: 'fail', message: 'Worker Not Found' });
			return res.redirect('/api/admin/dashboard');
		}
		// await worker.updateOne({ $set: { isVerify: false } });
		await worker.updateOne({
			$push: { notification: { message: 'Your Profile Verification is Rejected.' } },
			$set: { isVerify: false },
		});
		// res.status(200).json({ status: 'success', message: 'Worker Verification request is Rejected.' });
		res.redirect('/api/admin/dashboard');
	} catch (err) {
		// res.status(500).json({ status: 'fail', message: err.message });
		res.redirect('/api/admin/login');
	}
};

const renderDashboard = async (req, res) => {
	try {
		const workers = await Worker.find({});
		const notVerifyWorkers = workers.filter((w) => !w.isVerify);
		const clients = await Client.find({});
		res.render('admin/dashboard', { workers: notVerifyWorkers, clients, errMsg: '', totalWorkers: workers.length });
	} catch (err) {
		res.render('admin/dashboard', { workers: [], clients: [], errMsg: err.message, totalWorkers: 0 });
	}
};

const renderClients = async (req, res) => {
	try {
		const clients = await Client.find({});
		const tasks = await Task.find({});
		const taskCount = {};
		for (let i = 0; i < tasks.length; i++) {
			if (!taskCount[tasks[i].clientID]) {
				taskCount[tasks[i].clientID] = 1;
			} else {
				taskCount[tasks[i].clientID] += 1;
			}
		}
		for (let i = 0; i < clients.length; i++) {
			clients[i].tasks = taskCount[clients[i]._id] || 0;
		}
		res.render('admin/clients', { clients });
	} catch (err) {
		res.render('admin/login', { errMsg: err.message });
	}
};

const renderWorkers = async (req, res) => {
	try {
		const workers = await Worker.find({});
		res.render('admin/workers', { workers });
	} catch (err) {
		res.render('admin/login', { errMsg: err.message });
	}
};

const renderCategories = async (req, res) => {
	try {
		const categories = await Category.find({});
		res.render('admin/category', { categories });
	} catch (err) {
		res.render('admin/login', { errMsg: err.message });
	}
};

module.exports = {
	register_post,
	login_post,
	logout,
	update_profile_post,
	verifyAccept,
	verifyRejected,
	addCategory_post,
	renderDashboard,
	renderClients,
	renderWorkers,
	renderCategories,
	removeCategory,
	updateCategory,
};
