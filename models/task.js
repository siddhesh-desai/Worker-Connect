const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
	clientID: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
	},
	title: {
		type: String,
		required: true,
	},
	description: { type: String, required: true },
	createdAt: {
		type: Date,
		default: Date.now,
	},
	categoryID: {
		type: mongoose.Schema.Types.ObjectId,
		require: true,
	},
	isBooked: {
		type: Boolean,
		default: false,
	},
	workerID: {
		type: mongoose.Schema.Types.ObjectId,
	},
	intrestedWorkers: [
		{
			workerID: {
				type: mongoose.Schema.Types.ObjectId,
				required: true,
			},
			time: {
				type: Date,
				default: Date.now(),
			},
			workerPrice: {
				type: {
					price: Number,
					time: {
						type: Date,
						default: Date.now(),
					},
				},
			},
			clientPrice: {
				type: {
					price: Number,
					time: {
						type: Date,
						default: Date.now(),
					},
				},
			},
			isBooked: {
				type: Boolean,
				default: false,
			},
			isRejected: {
				type: Boolean,
				default: false,
			},
		},
	],
});

const Task = mongoose.model('task', taskSchema);

module.exports = Task;
