const Application = require('../models/Application');
const User = require('../models/User');

// --- Safe Merge: Only update fields with real values ---
function safeMerge(existing, incoming) {
    if (!incoming) return existing || {};

    const result = { ...(existing || {}) };

    Object.keys(incoming).forEach(key => {
        const value = incoming[key];

        if (value !== undefined && value !== null && value !== "") {
            // If value is an object (but not array/date), recursively merge
            if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
                result[key] = safeMerge(result[key], value);
            } else {
                result[key] = value;
            }
        }
    });

    return result;
}

// --- Create / Initialize Application ---
exports.createApplication = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    let application = await Application.findOne({ userId });
    
    if (!application) {
        application = new Application({
            userId,
            status: 'IN_PROGRESS',
            currentStep: 1
        });
        await application.save();
    }
    
    res.json({ success: true, application });

  } catch (error) {
    console.error("Create App Error:", error);
    res.status(500).json({ success: false, message: 'Server error creating application' });
  }
};

// --- Get Application (Resume) ---
exports.getApplication = async (req, res) => {
    try {
        const userId = req.user.userId;
        const application = await Application.findOne({ userId });

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        res.json({ success: true, application });

    } catch (error) {
        console.error("Get App Error:", error);
        res.status(500).json({ success: false, message: 'Server error fetching application' });
    }
};

// --- Update Step Data ---
exports.updateStep = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { stepName, data, currentStep } = req.body;

        if (!stepName || !data) {
            return res.status(400).json({ success: false, message: 'Step name and data are required' });
        }

        // Debug logging
        console.log("Updating step:", stepName);
        console.log("Incoming data:", JSON.stringify(data));

        // Skip if all values are empty/null/undefined
        const hasRealData = (obj) => {
            if (!obj || typeof obj !== 'object') return false;
            return Object.values(obj).some(v => {
                if (v === undefined || v === null || v === '' || v === false) return false;
                if (typeof v === 'object' && !Array.isArray(v)) return hasRealData(v);
                return true;
            });
        };

        if (!hasRealData(data)) {
            console.log("Skipping step", stepName, "- no real data");
            return res.json({ success: true, message: 'No data to update' });
        }

        let application = await Application.findOne({ userId });

        if (!application) {
            application = new Application({
                userId,
                status: 'IN_PROGRESS',
                currentStep: 1
            });
        }

        // Safety check: ensure stepName exists in schema
        const allowedSteps = [
            'eligibility', 'verification', 'personalInfo', 'address', 
            'kyc', 'employment', 'riskProfile', 'nominee', 'services', 'accountDetails', 'updateRequests'
        ];

        if (!allowedSteps.includes(stepName)) {
             return res.status(400).json({ success: false, message: 'Invalid step name' });
        }

        // Special Case: updateRequests — push to array
        if (stepName === 'updateRequests') {
            if (!application.updateRequests) application.updateRequests = [];
            application.updateRequests.push({
                field: data.field,
                reason: data.reason,
                newValue: data.newValue || '',
                requestedAt: data.requestedAt ? new Date(data.requestedAt) : new Date(),
                status: 'pending'
            });
            application.markModified('updateRequests');
        } else {
            // Normal safe merge for other steps
            application[stepName] = safeMerge(
                application[stepName] || {},
                data
            );
            application.markModified(stepName);
        }

        // Update current progress tracking
        if (currentStep) {
            application.currentStep = currentStep;
        }

        // Special Case: Account Creation (Final Step)
        if (stepName === 'accountDetails' && data.createAccount === true) {
             application.accountDetails = {
                 accountNumber: 'NDB' + Date.now(),
                 ifscCode: 'NDB0001234',
                 activatedAt: new Date()
             };
             application.markModified('accountDetails');
        }

        await application.save();

        console.log("Saved application for step:", stepName);

        res.json({ success: true, application });

    } catch (error) {
        console.error("Update Step Error:", error);
        res.status(500).json({ success: false, message: 'Server error updating step' });
    }
};
