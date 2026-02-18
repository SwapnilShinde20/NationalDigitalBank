export const validatePAN = (pan: string): { valid: boolean; message: string } => {
  if (!pan) return { valid: false, message: 'PAN number is required' };
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!panRegex.test(pan.toUpperCase())) {
    return { valid: false, message: 'Invalid PAN format. Expected: ABCDE1234F' };
  }
  return { valid: true, message: 'PAN format verified ✓' };
};

export const validateAadhaar = (aadhaar: string): { valid: boolean; message: string } => {
  if (!aadhaar) return { valid: false, message: 'Aadhaar number is required' };
  const cleaned = aadhaar.replace(/\s/g, '');
  if (!/^\d{12}$/.test(cleaned)) {
    return { valid: false, message: 'Aadhaar must be exactly 12 digits' };
  }
  return { valid: true, message: 'Aadhaar format verified ✓' };
};

export const validateMobile = (phone: string): { valid: boolean; message: string } => {
  if (!phone) return { valid: false, message: 'Mobile number is required' };
  if (!/^[6-9]\d{9}$/.test(phone)) {
    return { valid: false, message: 'Enter valid 10-digit Indian mobile number' };
  }
  return { valid: true, message: 'Valid mobile number ✓' };
};

export const validateEmail = (email: string): { valid: boolean; message: string } => {
  if (!email) return { valid: false, message: 'Email is required' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { valid: false, message: 'Enter a valid email address' };
  }
  return { valid: true, message: 'Valid email ✓' };
};

export const validatePincode = (pin: string): { valid: boolean; message: string; city?: string; state?: string } => {
  if (!pin) return { valid: false, message: 'Pincode is required' };
  if (!/^\d{6}$/.test(pin)) {
    return { valid: false, message: 'Pincode must be 6 digits' };
  }
  // Simulated pincode lookup
  const pincodeMap: Record<string, { city: string; state: string }> = {
    '110001': { city: 'New Delhi', state: 'Delhi' },
    '400001': { city: 'Mumbai', state: 'Maharashtra' },
    '560001': { city: 'Bangalore', state: 'Karnataka' },
    '600001': { city: 'Chennai', state: 'Tamil Nadu' },
    '700001': { city: 'Kolkata', state: 'West Bengal' },
    '500001': { city: 'Hyderabad', state: 'Telangana' },
    '380001': { city: 'Ahmedabad', state: 'Gujarat' },
    '411001': { city: 'Pune', state: 'Maharashtra' },
    '302001': { city: 'Jaipur', state: 'Rajasthan' },
    '226001': { city: 'Lucknow', state: 'Uttar Pradesh' },
  };
  const match = pincodeMap[pin];
  if (match) {
    return { valid: true, message: `Auto-filled: ${match.city}, ${match.state} ✓`, city: match.city, state: match.state };
  }
  return { valid: true, message: 'Pincode format valid ✓' };
};
