require('dotenv').config();
const dns = require('dns').promises;
const net = require('net');

async function testNetworkConnectivity() {
  console.log('🔍 Testing network connectivity to MongoDB Atlas...\n');

  // Extract host from MongoDB URI
  const mongoUri = process.env.MONGODB_URI;
  const match = mongoUri.match(/mongodb\+srv:\/\/[^@]+@([^\/]+)/);

  if (!match) {
    console.error('❌ Could not parse MongoDB URI');
    return;
  }

  const srvHost = match[1];
  console.log(`📍 MongoDB SRV Host: ${srvHost}\n`);

  // Test 1: DNS Resolution for SRV record
  console.log('Test 1: DNS SRV Record Resolution');
  try {
    const records = await dns.resolveSrv(`_mongodb._tcp.${srvHost}`);
    console.log(`✅ DNS SRV resolution successful! Found ${records.length} servers:`);
    records.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.name}:${r.port}`);
    });

    // Test 2: Try to connect to first MongoDB server
    if (records.length > 0) {
      const target = records[0];
      console.log(`\nTest 2: TCP Connection to ${target.name}:${target.port}`);

      await testTcpConnection(target.name, target.port);
    }
  } catch (error) {
    console.log(`❌ DNS SRV resolution failed: ${error.message}`);
    console.log('   This suggests DNS is blocked or MongoDB host is unreachable');
  }

  // Test 3: Basic internet connectivity (Google DNS)
  console.log('\nTest 3: Basic Internet Connectivity (Google DNS)');
  try {
    await dns.resolve4('google.com');
    console.log('✅ Internet connection working');
  } catch (error) {
    console.log(`❌ No internet connection: ${error.message}`);
  }

  // Test 4: HTTPS connectivity
  console.log('\nTest 4: HTTPS Connectivity (port 443)');
  await testTcpConnection('www.google.com', 443);
}

function testTcpConnection(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = 5000;

    socket.setTimeout(timeout);

    socket.on('connect', () => {
      console.log(`✅ TCP connection successful to ${host}:${port}`);
      socket.destroy();
      resolve(true);
    });

    socket.on('timeout', () => {
      console.log(`❌ Connection timeout to ${host}:${port} (WiFi may be blocking this port)`);
      socket.destroy();
      resolve(false);
    });

    socket.on('error', (error) => {
      console.log(`❌ Connection error to ${host}:${port}: ${error.message}`);
      socket.destroy();
      resolve(false);
    });

    socket.connect(port, host);
  });
}

testNetworkConnectivity()
  .then(() => {
    console.log('\n📊 Network diagnostic complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
