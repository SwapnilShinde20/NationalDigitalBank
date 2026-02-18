const mongoose = require('mongoose');
const User = require('./models/User');
const Application = require('./models/Application');
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected for seeding'))
  .catch(err => console.log(err));

const seedData = async () => {
    try {
        await User.deleteMany({});
        await Application.deleteMany({});

        // Create Users
        const user1 = await User.create({ mobile: '9999999990', email: 'lowrisk@example.com', mobileVerified: true, emailVerified: true });
        const user2 = await User.create({ mobile: '9999999991', email: 'highrisk@example.com', mobileVerified: true, emailVerified: true });
        const user3 = await User.create({ mobile: '9999999992', email: 'pending@example.com', mobileVerified: true, emailVerified: false });

        // Create Applications
        
        // 1. Low Risk - Approved
        await Application.create({
            userId: user1._id,
            personalDetails: { fullName: 'Amit Sharma', dob: new Date('1990-01-01'), gender: 'Male' },
            addressDetails: { city: 'Mumbai', state: 'Maharashtra', pincode: '400001', addressLine1: 'Flat 101' },
            employmentDetails: { annualIncome: 1200000, employmentType: 'Salaried' },
            kycDetails: { panVerified: true, aadhaarVerified: true },
            riskScore: 10,
            riskCategory: 'Low',
            status: 'APPROVED',
            complianceScore: 90,
            accountNumber: 'SBIN0001234567'
        });

        // 2. High Risk - Rejected
        await Application.create({
            userId: user2._id,
            personalDetails: { fullName: 'Rajesh Kumar', dob: new Date('1995-05-05'), gender: 'Male' },
            employmentDetails: { annualIncome: 200000, employmentType: 'Self-Employed' },
            kycDetails: { panVerified: false }, // Missing Verification
            riskScore: 85,
            riskCategory: 'High',
            riskReasons: ['Income below ₹3 lakh', 'PAN not verified'],
            status: 'REJECTED',
            complianceScore: 40
        });

        // 3. Draft
         await Application.create({
            userId: user3._id,
            personalDetails: { fullName: 'Sita Verma' },
            status: 'DRAFT',
            riskScore: 0,
            complianceScore: 20
        });

        console.log('Data Seeded Successfully');
        process.exit();
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
