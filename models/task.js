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
	category: {
		type: String,
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
			workerPrice: {
				type: Number,
				required: true,
			},
			clientPrice: {
				type: Number,
            },
            isBooked: {
                type: Boolean,
                default : false
            }
		},
	],
});

const Task = mongoose.model('task', taskSchema);

module.exports = Task;
