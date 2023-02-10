const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
	username: {
		type: String,
		required: true,
		unique: true,
	},
	password: {
		type: String,
		required: true,
	},
	joiningDate: {
		type: Date,
		required: true,
		default: Date.now,
	},
});

adminSchema.statics.login = async function (username, password) {
	const admin = await this.findOne({ username });
	if (admin) {
		// const auth = await bcrypt.compare(password, user.password);
		const auth = password == admin.password;
		if (auth) {
			return admin;
		}
		//   throw Error('incorrect password');
		return null;
	}
	// throw Error('incorrect email');
	return null;
};

const Admin = mongoose.model('admin', adminSchema);

module.exports = Admin;
