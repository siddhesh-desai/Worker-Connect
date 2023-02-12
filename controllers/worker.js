const Worker = require('../models/worker');
const Task = require('../models/task');
const Client = require('../models/client');
const Category = require('../models/category');
const jwt = require('jsonwebtoken');

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
				// console.log(err);
				// res.status(400).json({ message: err.message, status: 'fail' });
				res.render('worker/login', { errMsg: err.message });
				// if (err.code == 11000) {
				//     // res.render("admin_addEmployee", {msg : "Employee already exist with same Email"})

				// }
			} else {
				// console.log(result)
				// res.send(result)
				res.redirect('/api/worker/login');
				// res.status(201).json({ status: 'success', data: result });
			}
		});
	});
};

const update_profile_post = async (req, res, next) => {
	// const workerID = req.workerID || WORKER_ID;
	const { name, phone, highestQualification, address, bio} = req.body
	const workerID = req.workerID;
	// var updatedWorker = {
	// 	name: req.body.name,
	// 	phone: req.body.phone,
	// 	highestQualification: req.body.highestQualification,
	// 	address: req.body.address,
	// 	bio: req.body.bio,
	// };

	try {
		const result = await Worker.findByIdAndUpdate(workerID, { $set: {name, phone, highestQualification, address, bio} }, { new: true });
		// res.status(200).json({ status: 'success', data: result });
		res.redirect("/api/worker/profile")
	} catch (err) {
		// res.status(500).json({ status: 'fail', message: err.message });
		console.log(err)
		res.render("worker/login", {errMsg : err.message})
	}
};

const login_post = async (req, res) => {
	const { email, password } = req.body;
	try {
		const worker = await Worker.login(email, password);
		if (worker == null) {
			// return res.status(400).json({ status: 'fail', message: 'Invalid Crediential' });
			return res.render('worker/login', { errMsg: 'Invalid Crediential' });
		} else {
			const token = createWorkerToken(worker._id);
			res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
			// res.status(200).json({ data: { worker, token }, status: 'success' });
			return res.redirect('/api/worker/home');
		}
	} catch (err) {
		// res.status(400).json({ status: 'fail', message: err.message });
		res.render('worker/login', { errMsg: err.message });
	}
};

const logout = (req, res) => {
	res.cookie('jwt', '', { maxAge: 1 });
	res.redirect('/api/worker/login');
};

const addCategory = async (req, res) => {
	// const workerID = req.workerID || WORKER_ID;
	const workerID = req.workerID;
	const { categoryID, experience } = req.body;
	try {
		const categoryInsideDB = await Category.findById(categoryID);
		if (!categoryInsideDB) {
			return res.status(400).json({ status: 'fail', message: 'Category Not Found' });
		}
		const worker = await Worker.findById(workerID);
		const categoryPresent = worker.category.find((work) => work.categoryID.equals(categoryID));
		if (!categoryPresent) {
			await worker.updateOne({ $push: { category: { categoryID, experience } } });
			return res.status(200).json({ status: 'success', message: 'New Category Added' });
		} else {
			const updatedCategory = worker.category.filter((work) => !work.categoryID.equals(categoryID));
			updatedCategory.push({ categoryID, experience });
			await worker.updateOne({ $set: { category: updatedCategory } });
			return res.status(200).json({ status: 'success', message: 'Old Category Updated' });
		}
	} catch (err) {
		res.status(400).json({ status: 'fail', message: err.message });
	}
};

const showTaskInterest = async (req, res) => {
	// const workerID = req.workerID || WORKER_ID;
	const workerID = req.workerID;
	const taskID = req.params.id;
	try {
		const worker = await Worker.findById(workerID);
		if (!worker || !worker.isVerify) {
			// return res.status(400).json({ status: 'fail', message: 'Worker not Verified' });
			return res.render('worker/login', { errMsg: 'Worker is not Verified' });
		}
		const task = await Task.findById(taskID);
		if (!task) {
			// return res.status(400).json({ status: 'fail', message: 'Task not Found' });
			return res.render('worker/login', { errMsg: 'Task not Found' });
		}
		const isWorkerPresent = task.intrestedWorkers.find((worker) => worker.workerID.equals(workerID));
		if (isWorkerPresent) {
			if (isWorkerPresent.isRejected) {
				// return res.status(400).json({ status: 'fail', message: 'Worker is Rejected from this Task' });
				return res.render('worker/login', { errMsg: 'Worker is Rejected from this Task' });
			}
			// return res.status(400).json({ status: 'fail', message: 'Worker alredy Intrested' });
			return res.redirect('/api/worker/home');
		}
		await Promise.all([
			task.updateOne({
				$push: { intrestedWorkers: { workerID, workerPrice: { price: Number(req.body.price), time: Date.now() } } },
			}),
			Client.findByIdAndUpdate(task.clientID, {
				$push: {
					notification: {
						message: `Worker ${worker.name} Want to Do Task : ${task.title}, for a price of ${req.body.price}`,
					},
				},
			}),
		]);
		// res.status(200).json({ status: 'success', message: 'Worker is added in intrested Queue' });
		return res.redirect('/api/worker/home');
	} catch (err) {
		// res.status(500).json({ status: 'fail', message: err.message });
		res.render('worker/login', { errMsg: err.message });
	}
};

const negotiateTaskPrice = async (req, res) => {
	// const workerID = req.workerID || WORKER_ID;
	const workerID = req.workerID;
	const taskID = req.params.id;
	try {
		const worker = await Worker.findById(workerID);
		if (!worker || !worker.isVerify) {
			// return res.status(400).json({ status: 'fail', message: 'Worker not Verified' });
			return res.render('worker/login', { errMsg: 'Worker not Verified' });
		}
		const task = await Task.findById(taskID);
		if (task === null) {
			// return res.status(400).json({ status: 'fail', message: 'Task Not found' });
			return res.render('worker/login', { errMsg: 'Task Not found' });
		}
		await Promise.all([
			await Task.findOneAndUpdate(
				{ _id: taskID, 'intrestedWorkers.workerID': workerID },
				{
					$set: {
						'intrestedWorkers.$.workerPrice.price': req.body.price,
						'intrestedWorkers.$.workerPrice.time': Date.now(),
					},
				}
			),
			await Client.findByIdAndUpdate(task.clientID, {
				$push: {
					notification: {
						message: `Worker ${worker.name} Want to negotiate on Task : ${task.title}, for a price of ${req.body.price}`,
					},
				},
			}),
		]);
		// res.status(200).json({ status: 'success', message: 'Worker Negotiating Price added' });
		res.redirect(`/api/worker/task/${taskID}`);
	} catch (err) {
		console.log(err);
		// res.status(500).json({ status: 'fail', message: err.message });
		res.render('worker/login', { errMsg: err.message });
	}
};

const renderHome = async (req, res) => {
	const workerID = req.workerID;
	try {
		const worker = await Worker.findById(workerID);
		let tasks = await Task.find({});
		for (let i = 0; i < tasks.length; i++) {
			const category = await Category.findById(tasks[i].categoryID);
			const clientName = await Client.findById(tasks[i].clientID);
			tasks[i].category = category.name;
			tasks[i].clientName = clientName.name;
		}
		const allCategory = await Category.find({});
		res.render('worker/home', { tasks, categories: allCategory, isVerify: worker.isVerify });
	} catch (err) {
		res.render('worker/login', { errMsg: err.message });
	}
};

const renderMyWorks = async (req, res) => {
	const workerID = req.workerID;
	try {
		const tasks = await Task.find({ 'intrestedWorkers.workerID': workerID });
		// console.log(tasks);
		for (let i = 0; i < tasks.length; i++) {
			const category = await Category.findById(tasks[i].categoryID);
			tasks[i].category = category.name;
		}
		res.render('worker/myWork', { tasks, workerID });
	} catch (err) {
		res.render('worker/login', { errMsg: err.message });
	}
};

const renderTaskWithID = async (req, res) => {
	const taskID = req.params.id;
	const workerID = req.workerID;
	try {
		const task = await Task.findById(taskID);
		res.render('worker/taskNego', { task, workerID });
	} catch (err) {
		res.render('client/login', { errMsg: err.message });
	}
};

const renderNotification = async (req, res) => {
	const workerID = req.workerID
	try {
		let notifications = await Worker.findById(workerID)
		notifications = notifications.notification
		notifications = notifications.sort((a, b) => b.date - a.date )
		res.render("worker/notification", {notifications})
	} catch (err) {
		console.log(err)
		res.render("worker/login", {errMsg : err.message})
	}
}

const renderProfile = async (req, res) => {
	const workerID = req.workerID
	try {
		const worker = await Worker.findById(workerID)
		res.render("worker/profile", {worker})
	} catch (err) {
		console.log(err)
		res.render("worker/login", {errMsg : err.message})
	}
}

module.exports = {
	renderProfile,
	renderNotification,
	renderMyWorks,
	register_post,
	login_post,
	logout,
	addCategory,
	update_profile_post,
	showTaskInterest,
	negotiateTaskPrice,
	renderHome,
	renderTaskWithID,
};
