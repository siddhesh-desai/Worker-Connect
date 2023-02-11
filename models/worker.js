const mongoose = require('mongoose');
const { isEmail } = require('validator');

const workerSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	email: {
		type: String,
		required: [true, 'Please enter an email'],
		unique: true,
		validate: [isEmail, 'Please enter a valid email'],
	},
	phone: {
		type: String,
		required: true,
	},
	category: [
		{
			categoryID: mongoose.Schema.Types.ObjectId,
			experience: Number,
		},
	],
	notification: [
		{
			message: String,
			date: {
				type: Date,
				default: Date.now(),
			},
		},
	],
	dob: {
		type: Date,
		required: true,
	},
	highestQualification: { type: String, required: true },
	addharCard: { type: String },
	address: { type: String, required: true },
	bio: { type: String },
	password: {
		type: String,
		required: true,
	},
	joiningDate: {
		type: Date,
		required: true,
		default: Date.now,
	},
	isVerify: {
		type: Boolean,
		default: false,
	},
	reviews: [
		{
			taskID: {
				type: mongoose.Schema.Types.ObjectId,
				required: true,
			},
			rating: {
				type: Number,
				required: true,
			},
			review: {
				type: String,
				required: true,
			},
		},
	],
});

workerSchema.statics.login = async function (email, password) {
	const worker = await this.findOne({ email });
	if (worker) {
		// const auth = await bcrypt.compare(password, user.password);
		const auth = password == worker.password;
		if (auth) {
			return worker;
		}
		//   throw Error('incorrect password');
		return null;
	}
	// throw Error('incorrect email');
	return null;
};

const Worker = mongoose.model('worker', workerSchema);

module.exports = Worker;
