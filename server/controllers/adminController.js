const Application = require('../models/Application');
const AuditLog = require('../models/AuditLog');

exports.getAllApplications = async (req, res) => {
  try {
    const applications = await Application.find()
      .populate('userId', 'mobile email')
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getApplicationById = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id).populate('userId', 'mobile email');
    if (!application) return res.status(404).json({ message: 'Application not found' });
    res.json(application);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.overrideDecision = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const applicationId = req.params.id;
    const adminUserId = req.user.userId;

    const application = await Application.findById(applicationId);
    if (!application) return res.status(404).json({ message: 'Application not found' });

    application.status = status;
    application.humanDecision = `Admin Override: ${status} - ${remarks}`;
    
    // Generate account details if approved via override and didn't have one
    if (status === 'APPROVED' && (!application.accountDetails || !application.accountDetails.accountNumber)) {
        application.accountDetails = {
            accountNumber: 'NDB' + Date.now(),
            ifscCode: 'NDB0001234',
            activatedAt: new Date()
        };
        application.markModified('accountDetails');
    }

    await application.save();

    await AuditLog.create({
        applicationId,
        action: 'ADMIN_OVERRIDE',
        details: { status, remarks },
        actor: 'HUMAN'
    });

    res.json({ message: 'Application updated', application });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
