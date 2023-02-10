const Client = require('../models/client');
const Task = require('../models/task');
const Worker = require('../models/worker');
const jwt = require('jsonwebtoken');

const CLIENT_ID = "63e638b4b1c25109e8b8aff6"

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
	const clientID = req.clientID || CLIENT_ID;
	var updatedClient = {
		name: req.body.name,
		email: req.body.email,
		phone: req.body.phone,
		password: req.body.password,
		address: req.body.address,
	};

	try {
		const result = await Client.findByIdAndUpdate(clientID, updatedClient, { new: true });
		res.status(200).json({ status: 'success', data: result });
	} catch (err) {
		res.status(500).json({ status: 'fail', message: err.message });
	}
};

const login_post = async (req, res) => {
	const { email, password } = req.body;
	try {
		const client = await Client.login(email, password);
		if (client == null) {
			//   res.render("login",{msg : "Invalid Crediential"})
			return res.status(400).json({ status: 'fail', message: 'Invalid Crediential' });
		} else {
			const token = createClientToken(client._id);
			res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
			res.status(200).json({ data: { client, token }, status: 'success' });
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

const addTask_post = (req, res, next) => {
	const clientID = req.clientID || CLIENT_ID;
	Task.init().then(() => {
		// safe to create users now.
		var new_task = new Task({
			title: req.body.title,
			description: req.body.description,
			category: req.body.category,
			clientID,
		});
		new_task.save(function (err, result) {
			if (err) {
				console.log(err);
				res.status(400).json({ message: err.message, status: 'fail' });
			} else {
				res.status(201).json({ status: 'success', data: result });
			}
		});
	});
};

//  http://localhost:3000/user?name=Gourav&age=11
const negotiateTaskPrice = async (req, res) => {
	const clientID = req.clientID || CLIENT_ID;
	const taskID = req.query.taskID;
	const intrestedWorkerID = req.query.workerID;
	try {
		const task = await Task.findById(taskID);
		const client = await Client.findById(clientID);
		if (task === null || !task.clientID.equals(clientID)) {
			return res.status(400).json({ status: 'fail', message: 'Access Denied(not Your Task)' });
		}
		await Promise.all([
			await Task.findOneAndUpdate(
				{ _id: taskID, 'intrestedWorkers.workerID': intrestedWorkerID },
				{ $set: { 'intrestedWorkers.$.clientPrice': req.body.price } }
			),
			await Worker.findByIdAndUpdate(intrestedWorkerID, {
				$push: {
					notification: {
						message: `Client ${client.name} Want to negotiate on Task : ${task.title}, for a price of ${req.body.price}`,
					},
				},
			}),
		]);
		res.status(200).json({ status: 'success', message: 'Client Price added' });
	} catch (err) {
		res.status(500).json({ status: 'fail', message: err.message });
	}
};

const acceptTaskPrice = async (req, res) => {
	const clientID = req.clientID || CLIENT_ID;
	const taskID = req.query.taskID;
	const intrestedWorkerID = req.query.workerID;
	try {
		const task = await Task.findById(taskID);
		const client = await Client.findById(clientID);
		if (task === null || !task.clientID.equals(clientID)) {
			return res.status(400).json({ status: 'fail', message: 'Access Denied(not Your Task)' });
		}
		const notSelectedWokerIDs = task.intrestedWorkers.filter((worker) => !worker.workerID.equals(intrestedWorkerID));
		const price = task.intrestedWorkers.find((worker) => worker.workerID.equals(intrestedWorkerID)).workerPrice;
		await Promise.all([
			await Task.findOneAndUpdate(
				{ _id: taskID, 'intrestedWorkers.workerID': intrestedWorkerID },
				{ $set: { 'intrestedWorkers.$.isBooked': true } }
            ),
            await Task.findOneAndUpdate(
				{ _id: taskID},
				{ $set: { 'isBooked': true, 'workerID' : intrestedWorkerID } }
			),
			await Worker.findByIdAndUpdate(intrestedWorkerID, {
				$push: {
					notification: {
						message: `Client ${client.name} has offer you a Task : ${task.title}, for a price of ${price}$`,
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
						},
					},
				})
			)
		);
		res.status(200).json({ status: 'success', message: 'Client Booked the Task' });
	} catch (err) {
		res.status(500).json({ status: 'fail', message: err.message });
	}
};

module.exports = {
	register_post,
	login_post,
	logout,
	update_profile_post,
	addTask_post,
    negotiateTaskPrice,
    acceptTaskPrice
};
