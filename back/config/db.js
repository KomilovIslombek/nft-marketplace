const dns = require('node:dns/promises');
dns.setServers(['1.1.1.1', '1.0.0.1', '8.8.8.8']); // works around this network's broken SRV lookup
// console.log('dns', dns);


const mongoose = require('mongoose')

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDb connected successfully');
    }
    catch (error) {
        console.error('uri: ', process.env.MONGODB_URI)
        console.error('Mongodb connection failed: ', error.message)

        process.exit(1)
    }
} 

module.exports = connectDB;