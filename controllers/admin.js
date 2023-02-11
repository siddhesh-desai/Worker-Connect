const Admin = require('../models/admin');
const Worker = require('../models/worker');
const jwt = require('jsonwebtoken');

// create json web token
const maxAge = 3 * 24 * 60 * 60;
const createAdminToken = (id) => {
	return jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
		expiresIn: maxAge,
	});
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
	const adminID = req.adminID || '63e64569ac9e4267da000597';
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
			//   res.render("login",{msg : "Invalid Crediential"})
			return res.status(400).json({ status: 'fail', message: 'Invalid Crediential' });
		} else {
			const token = createAdminToken(admin._id);
			res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
			res.status(200).json({ data: { admin, token }, status: 'success' });
		}
	} catch (err) {
		// const errors = handleErrors(err);
		res.status(400).json({ status: 'fail', message: err.message });
	}
};

const logout = (req, res) => {
	res.cookie('jwt', '', { maxAge: 1 });
	// res.redirect('/login');
	res.status(200).json({ status: 'success', message: 'Logout Successfully' });
};

const verifyAccept = async (req, res) => {
	const workerID = req.params.id;
	try {
		const worker = await Worker.findById(workerID);
		if (worker === null) {
			return res.status(400).json({ status: 'fail', message: 'Worker Not Found' });
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
		res.status(200).json({ status: 'success', message: 'Worker Verification request is Accepted.' });
	} catch (err) {
		res.status(500).json({ status: 'fail', message: err.message });
	}
};

const verifyRejected = async (req, res) => {
	const workerID = req.params.id;
	try {
		const worker = await Worker.findById(workerID);
		if (worker === null) {
			return res.status(400).json({ status: 'fail', message: 'Worker Not Found' });
		}
		// await worker.updateOne({ $set: { isVerify: false } });
		await worker.updateOne({
			$push: { notification: { message: 'Your Profile Verification is Rejected. ' + req.body.message } },
			$set: { isVerify: false },
		});
		res.status(200).json({ status: 'success', message: 'Worker Verification request is Rejected.' });
	} catch (err) {
		res.status(500).json({ status: 'fail', message: err.message });
	}
};

module.exports = {
	register_post,
	login_post,
	logout,
	update_profile_post,
	verifyAccept,
	verifyRejected,
};
