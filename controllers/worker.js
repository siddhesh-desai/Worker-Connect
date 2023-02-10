const Worker = require('../models/worker');
const Task = require('../models/task');
const jwt = require('jsonwebtoken');
const Client = require('../models/client');

const WORKER_ID = '63e69b24592703c92e187c8a';
// create json web token
const maxAge = 3 * 24 * 60 * 60;
const createWorkerToken = (id) => {
	return jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
		expiresIn: maxAge,
	});
};

const register_post = (req, res, next) => {
	Worker.init().then(() => {
		// safe to create users now.
		var new_worker = new Worker({
			name: req.body.name,
			email: req.body.email,
			phone: req.body.phone,
			password: req.body.password,
			dob: new Date(req.body.dob),
			highestQualification: req.body.highestQualification,
			address: req.body.address,
			bio: req.body.bio,
			addharCard: req.file.filename,
		});
		new_worker.save(function (err, result) {
			if (err) {
				console.log(err);
				res.status(400).json({ message: err.message, status: 'fail' });
				// if (err.code == 11000) {
				//     // res.render("admin_addEmployee", {msg : "Employee already exist with same Email"})

				// }
			} else {
				// console.log(result)
				// res.send(result)
				// res.redirect("/admin/add")
				res.status(201).json({ status: 'success', data: result });
			}
		});
	});
};

const update_profile_post = async (req, res, next) => {
	const workerID = req.workerID || WORKER_ID;
	var updatedWorker = {
		name: req.body.name,
		email: req.body.email,
		phone: req.body.phone,
		password: req.body.password,
		dob: new Date(req.body.dob),
		highestQualification: req.body.highestQualification,
		address: req.body.address,
		bio: req.body.bio,
	};

	try {
		const result = await Worker.findByIdAndUpdate(workerID, updatedWorker, { new: true });
		res.status(200).json({ status: 'success', data: result });
	} catch (err) {
		res.status(500).json({ status: 'fail', message: err.message });
	}
};

const login_post = async (req, res) => {
	const { email, password } = req.body;
	try {
		const worker = await Worker.login(email, password);
		if (worker == null) {
			//   res.render("login",{msg : "Invalid Crediential"})
			return res.status(400).json({ status: 'fail', message: 'Invalid Crediential' });
		} else {
			const token = createWorkerToken(worker._id);
			res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
			res.status(200).json({ data: { worker, token }, status: 'success' });
		}
	} catch (err) {
		res.status(400).json({ status: 'fail', message: err.message });
	}
};

const logout = (req, res) => {
	res.cookie('jwt', '', { maxAge: 1 });
	// res.redirect('/login');
	res.status(200).json({ status: 'success', message: 'Logout Successfully' });
};

const addCategory = async (req, res) => {
	const workerID = req.workerID || WORKER_ID;
	const worker = await Worker.findById(workerID);
	const { name, description, experience } = req.body;
	const categoryPresent = worker.category.find((work) => work.name === name);
	if (!categoryPresent) {
		await worker.updateOne({ $push: { category: { name, description, experience } } });
		return res.status(200).json({ status: 'success', message: 'New Category Added' });
	} else {
		const updatedCategory = worker.category.filter((work) => work.name !== name);
		updatedCategory.push({ name, description, experience });
		await worker.updateOne({ $set: { category: updatedCategory } });
		return res.status(200).json({ status: 'success', message: 'Old Category Updated' });
	}
};

const showTaskInterest = async (req, res) => {
	const workerID = req.workerID || WORKER_ID;
	const taskID = req.params.id;
	try {
		const task = await Task.findById(taskID);
		const worker = await Worker.findById(workerID);
		if (!task) {
			return res.status(400).json({ status: 'fail', message: 'Task not Found' });
		}
		const isWorkerPresent = task.intrestedWorkers.find((worker) => worker.workerID.equals(workerID));
		if (isWorkerPresent) {
			return res.status(400).json({ status: 'fail', message: 'Worker alredy Intrested' });
		}
		await Promise.all([
			task.updateOne({ $push: { intrestedWorkers: { workerID, workerPrice: Number(req.body.price) } } }),
			Client.findByIdAndUpdate(task.clientID, {
				$push: {
					notification: {
						message: `Worker ${worker.name} Want to Do Task : ${task.title}, for a price of ${req.body.price}`,
					},
				},
			}),
		]);
		res.status(200).json({ status: 'success', message: 'Worker is added in intrested Queue' });
	} catch (err) {
		res.status(500).json({ status: 'fail', message: err.message });
	}
};

const negotiateTaskPrice = async (req, res) => {
	const workerID = req.workerID || WORKER_ID;
	const taskID = req.params.id;
	try {
		const task = await Task.findById(taskID);
		const worker = await Worker.findById(workerID);
		if (task === null) {
			return res.status(400).json({ status: 'fail', message: 'Task Not found' });
		}
		await Promise.all([
			await Task.findOneAndUpdate(
				{ _id: taskID, 'intrestedWorkers.workerID': workerID },
				{ $set: { 'intrestedWorkers.$.workerPrice': req.body.price } }
			),
			await Client.findByIdAndUpdate(task.clientID, {
				$push: {
					notification: {
						message: `Worker ${worker.name} Want to negotiate on Task : ${task.title}, for a price of ${req.body.price}`,
					},
				},
			}),
		]);
		res.status(200).json({ status: 'success', message: 'Worker Negotiating Price added' });
	} catch (err) {
		res.status(500).json({ status: 'fail', message: err.message });
	}
};

module.exports = {
	register_post,
	login_post,
	logout,
	addCategory,
	update_profile_post,
	showTaskInterest,
	negotiateTaskPrice,
};
