const dns = require('node:dns/promises');
const mongoose = require('mongoose');

// Local workaround: the development network's default DNS resolver fails
// the SRV lookup that a mongodb+srv:// URI needs, so in development we
// point Node at public resolvers instead. Production hosts (Render) have
// working DNS and keep their own resolver unless DNS_SERVERS is set.
const DEFAULT_DEV_DNS = '1.1.1.1,1.0.0.1,8.8.8.8';
const dnsServers =
  process.env.DNS_SERVERS ?? (process.env.NODE_ENV === 'production' ? '' : DEFAULT_DEV_DNS);

if (dnsServers) {
  dns.setServers(dnsServers.split(',').map((s) => s.trim()).filter(Boolean));
}

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDb connected successfully');
  } catch (error) {
    // Deliberately does not print the URI — it contains the database
    // password, and on a host like Render these logs are kept.
    console.error('Mongodb connection failed: ', error.message);

    process.exit(1);
  }
}

module.exports = connectDB;
