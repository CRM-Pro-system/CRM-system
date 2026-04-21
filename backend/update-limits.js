import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Tenant from './models/Tenant.js';
import Subscription from './models/Subscription.js';

dotenv.config();

await mongoose.connect(process.env.MONGODB_URI);

// Update the default tenant's feature limits
const tenant = await Tenant.findOneAndUpdate(
  { slug: 'default-company' },
  {
    'settings.features.maxUsers': 100,
    'settings.features.maxClients': 1000,
    'settings.features.maxDeals': 500,
    'settings.features.advancedReports': true,
    'settings.features.apiAccess': true,
    'settings.features.customBranding': true,
    'settings.features.bulkOperations': true
  },
  { new: true }
);

console.log('✅ Updated tenant limits:');
console.log(`- Max Users: ${tenant.settings.features.maxUsers}`);
console.log(`- Max Clients: ${tenant.settings.features.maxClients}`);
console.log(`- Max Deals: ${tenant.settings.features.maxDeals}`);
console.log(`- Current Users: ${tenant.usage.totalUsers}`);

// Also update the default subscription plan limits
const subscription = await Subscription.findOneAndUpdate(
  { planName: 'starter' },
  {
    'features.maxUsers': 100,
    'features.maxClients': 1000,
    'features.maxDeals': 500,
    'features.advancedReports': true,
    'features.apiAccess': true,
    'features.customBranding': true,
    'features.bulkOperations': true
  },
  { new: true }
);

if (subscription) {
  console.log('\n✅ Updated subscription limits:');
  console.log(`- Max Users: ${subscription.features.maxUsers}`);
  console.log(`- Max Clients: ${subscription.features.maxClients}`);
  console.log(`- Max Deals: ${subscription.features.maxDeals}`);
}

console.log('\n🎉 You can now register up to 100 users!');

await mongoose.connection.close();
