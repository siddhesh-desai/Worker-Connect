const Client = require('../models/client');
const Task = require('../models/task');
const Worker = require('../models/worker');
const Category = require('../models/category');
const jwt = require('jsonwebtoken');

const CLIENT_ID = '63e638b4b1c25109e8b8aff6';

// create json web token
const maxAge = 3 * 24 * 60 * 60;
const createClientToken = (id) => {
	return jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
		expiresIn: maxAge,
	});
};

const register_post = (req, res, next) => {
	Client.init().then(() => {
		// safe to create users now.
		var new_client = new Client({
			name: req.body.name,
			email: req.body.email,
			phone: req.body.phone,
			password: req.body.password,
			address: req.body.address,
		});
		new_client.save(function (err, result) {
			if (err) {
				console.log(err);
				res.render('client/register', { errMsg: err.message });
			} else {
				res.redirect('/api/client/login');
			}
		});
	});
};

const update_profile_post = async (req, res, next) => {
	// const clientID = req.clientID || CLIENT_ID;
	const { name, phone, address} = req.body

	const clientID = req.clientID;
	// var updatedClient = {
	// 	name: req.body.name,
	// 	phone: req.body.phone,
	// 	address: req.body.address,
	// };

	try {
		const result = await Client.findByIdAndUpdate(clientID,  { $set: {name, phone, address} }, { new: true });
		// res.status(200).json({ status: 'success', data: result });
		res.redirect("/api/client/profile")
	} catch (err) {
		// res.status(500).json({ status: 'fail', message: err.message });
		console.log(err)
		res.render("client/login", {errMsg : err.message})
	}
};

const login_post = async (req, res) => {
	const { email, password } = req.body;
	try {
		const client = await Client.login(email, password);
		if (client == null) {
			//   res.render("login",{msg : "Invalid Crediential"})
			// return res.status(400).json({ status: 'fail', message: 'Invalid Crediential' });
			return res.render('client/login', { errMsg: 'Invalid Crediential' });
		} else {
			const token = createClientToken(client._id);
			res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
			// res.status(200).json({ data: { client, token }, status: 'success' });
			res.redirect('/api/client/home');
		}
	} catch (err) {
		// const errors = handleErrors(err);
		// res.status(400).json({ status: 'fail', message: err.message });
		res.render('client/login', { errMsg: err.message });
	}
};

const logout = (req, res) => {
	res.cookie('jwt', '', { maxAge: 1 });
	// res.status(200).json({ status: 'success', message: 'Logout Successfully' });
	res.redirect('/api/client/login');
};

const addTask_post = (req, res, next) => {
	// const clientID = req.clientID || CLIENT_ID;
	const clientID = req.clientID;
	Task.init().then(() => {
		// safe to create users now.
		var new_task = new Task({
			title: req.body.title,
			description: req.body.description,
			categoryID: req.body.categoryID,
			clientID,
		});
		new_task.save(function (err, result) {
			if (err) {
				console.log(err.message);
				res.render('client/login', { errMsg: err.message });
			} else {
				res.redirect('/api/client/home');
			}
		});
	});
};

//  http://localhost:3000/user?name=Gourav&age=11
const negotiateTaskPrice = async (req, res) => {
	// const clientID = req.clientID || CLIENT_ID;
	const clientID = req.clientID;
	const taskID = req.query.taskID;
	const intrestedWorkerID = req.query.workerID;
	try {
		const task = await Task.findById(taskID);
		const client = await Client.findById(clientID);
		if (task === null || !task.clientID.equals(clientID)) {
			// return res.status(400).json({ status: 'fail', message: 'Access Denied(not Your Task)' });
			return res.render('client/login', { errMsg: 'Access Denied(not Your Task)' });
		}
		await Promise.all([
			await Task.findOneAndUpdate(
				{ _id: taskID, 'intrestedWorkers.workerID': intrestedWorkerID },
				{
					$set: {
						'intrestedWorkers.$.clientPrice.price': req.body.price,
						'intrestedWorkers.$.clientPrice.time': Date.now(),
					},
				}
			),
			await Worker.findByIdAndUpdate(intrestedWorkerID, {
				$push: {
					notification: {
						message: `Client ${client.name} Want to negotiate on Task : ${task.title}, for a price of ${req.body.price}`,
						// date : new Date()
					},
				},
			}),
		]);
		// res.status(200).json({ status: 'success', message: 'Client Price added' });
		res.redirect('/api/client/task/' + taskID);
	} catch (err) {
		// res.status(500).json({ status: 'fail', message: err.message });
		res.render('client/login', { errMsg: err.message });
	}
};

const renderNotification = async (req, res) => {
	const clientID = req.clientID;
	try {
		let notifications = await Client.findById(clientID);
		notifications = notifications.notification;
		notifications = notifications.sort((a, b) => b.date - a.date);
		res.render('client/notifications', { notifications });
	} catch (err) {
		console.log(err);
		res.render('client/login', { errMsg: err.message });
	}
};

const acceptTaskPrice = async (req, res) => {
	// const clientID = req.clientID || CLIENT_ID;
	const clientID = req.clientID;
	const taskID = req.query.taskID;
	const intrestedWorkerID = req.query.workerID;
	try {
		const task = await Task.findById(taskID);
		const client = await Client.findById(clientID);
		if (task === null || !task.clientID.equals(clientID)) {
			// return res.status(400).json({ status: 'fail', message: 'Access Denied(not Your Task)' });
			return res.render('client/login', { errMsg: 'Access Denied(not Your Task)' });
		}
		const notSelectedWokerIDs = task.intrestedWorkers.filter((worker) => !worker.workerID.equals(intrestedWorkerID));
		const price = task.intrestedWorkers.find((worker) => worker.workerID.equals(intrestedWorkerID)).workerPrice.price;
		const worker = await Worker.findById(intrestedWorkerID)
		await Promise.all([
			await Task.findOneAndUpdate(
				{ _id: taskID, 'intrestedWorkers.workerID': intrestedWorkerID },
				{ $set: { 'intrestedWorkers.$.isBooked': true } }
			),
			await Task.findOneAndUpdate({ _id: taskID }, { $set: { isBooked: true, workerID: intrestedWorkerID } }),
			await Worker.findByIdAndUpdate(intrestedWorkerID, {
				$push: {
					notification: {
						message: `Client ${client.name} has offer you a Task : ${task.title}, for a price of ${price}$. respective are the name, email, phone number and address of Client. "${client.name}", "${client.email}", "${client.phone}" and "${client.address}"`,
						// date : new Date()
					},
				},
			}),
			await Client.findByIdAndUpdate(clientID, {
				$push: {
					notification: {
						message: `Hello!, Congratulations you have found your perfect match. Respective are the name, email, phone number and address of Worker whose request you have accepted. "${worker.name}", "${worker.email}", "${worker.phone}" and "${worker.address}" `,
						// date : new Date()
					},
				},
			}),
		]);
		await Promise.all(
			notSelectedWokerIDs.map((worker) =>
				Worker.findByIdAndUpdate(worker.workerID, {
					$push: {
						notification: {
							message: `Client ${client.name} has book the Task : ${task.title}, So now the task is Closed.`,
							// date : new Date
						},
					},
				})
			)
		);
		// res.status(200).json({ status: 'success', message: 'Client Booked the Task' });
		res.redirect(`/api/client/task/${taskID}`);
	} catch (err) {
		console.log(err);
		// res.status(500).json({ status: 'fail', message: err.message });
		res.render('client/login', { errMsg: err.message });
	}
};

const rejectTaskWorker = async (req, res) => {
	// const clientID = req.clientID || CLIENT_ID;
	const clientID = req.clientID;
	const taskID = req.query.taskID;
	const intrestedWorkerID = req.query.workerID;
	try {
		const task = await Task.findById(taskID);
		const client = await Client.findById(clientID);
		if (task === null || !task.clientID.equals(clientID)) {
			// return res.status(400).json({ status: 'fail', message: 'Access Denied(not Your Task)' });
			return res.render('client/login', { errMsg: 'Access Denied(not Your Task)' });
		}
		await Promise.all([
			await Task.findOneAndUpdate(
				{ _id: taskID, 'intrestedWorkers.workerID': intrestedWorkerID },
				{ $set: { 'intrestedWorkers.$.isRejected': true } }
			),
			await Worker.findByIdAndUpdate(intrestedWorkerID, {
				$push: {
					notification: {
						message: `Client ${client.name} has rejected your Task : "${task.title}", now you cannot futher apply for this task.`,
						// date : new Date()
					},
				},
			}),
		]);
		// res.status(200).json({ status: 'success', message: 'Client Rejected the Worker Request' });
		res.redirect(`/api/client/task/${taskID}`);
	} catch (err) {
		// res.status(500).json({ status: 'fail', message: err.message });
		console.log(err);
		res.render('client/login', { errMsg: err.message });
	}
};

const renderHome = async (req, res) => {
	try {
		let tasks = await Task.find({});
		for (let i = 0; i < tasks.length; i++) {
			const category = await Category.findById(tasks[i].categoryID);
			const clientName = await Client.findById(tasks[i].clientID);
			tasks[i].category = category.name;
			tasks[i].clientName = clientName.name;
		}
		const allCategory = await Category.find({});
		res.render('client/home', { tasks, categories: allCategory });
	} catch (err) {
		res.render('client/login', { errMsg: err.message });
	}
};

const renderMyTasks = async (req, res) => {
	const clientID = req.clientID;
	try {
		let tasks = await Task.find({ clientID });
		// let category;
		for (let i = 0; i < tasks.length; i++) {
			const category = await Category.findById(tasks[i].categoryID);
			// console.log(category.name);
			tasks[i].category = category.name;
		}
		const allCategory = await Category.find({});
		res.render('client/myTask', { tasks, categories: allCategory });
	} catch (err) {
		res.render('client/login', { errMsg: err.message });
	}
};

const renderTaskWithID = async (req, res) => {
	const clientID = req.clientID;
	const taskID = req.params.id;
	try {
		const task = await Task.findById(taskID);
		if (!task || !task.clientID.equals(clientID)) {
			return res.render('client/login', { errMsg: 'Task not Belongs to Worker' });
		}
		for (let i = 0; i < task.intrestedWorkers.length; i++) {
			const worker = await Worker.findById(task.intrestedWorkers[i].workerID);
			task.intrestedWorkers[i].workerName = worker.name;
			let rating = 0;
			for (let j = 0; j < worker.reviews.length; j++) {
				rating += worker.reviews[i].rating;
			}
			rating = rating / (5 * worker.reviews.length);
			task.intrestedWorkers[i].workerRating = rating;
		}
		res.render('client/taskNego', { task });
	} catch (err) {
		res.render('client/login', { errMsg: err.message });
	}
};

const renderProfile = async (req, res) => {
	const clientID = req.clientID;
	try {
		const client = await Client.findById(clientID);
		res.render('client/profile', { client });
	} catch (err) {
		console.log(err);
		res.render('client/login', { errMsg: err.message });
	}
};

module.exports = {
	renderProfile,
	renderNotification,
	renderTaskWithID,
	register_post,
	login_post,
	logout,
	update_profile_post,
	addTask_post,
	negotiateTaskPrice,
	acceptTaskPrice,
	rejectTaskWorker,
	renderHome,
	renderMyTasks,
};
