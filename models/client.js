const mongoose = require('mongoose');
const { isEmail } = require('validator');

const clientSchema = new mongoose.Schema({
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
    address: { type: String, required: true },
    password: {
        type: String,
        required : true
    },
    joiningDate: {
        type: Date,
        required: true,
        default : Date.now
    },
    notification: [
        {
            message: String,
            ts: {
                type: Date,
                default : Date.now()
            }
        }
    ]
})

clientSchema.statics.login = async function(email, password) {
    const client = await this.findOne({ email });
    if (client) {
      // const auth = await bcrypt.compare(password, user.password);
      const auth = password == client.password;
      if (auth) {
        return client;
      }
    //   throw Error('incorrect password');
        return null
    }
    // throw Error('incorrect email');
    return null
  };
  


const Client = mongoose.model('client', clientSchema);

module.exports = Client;