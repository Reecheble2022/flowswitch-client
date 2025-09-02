import React, { useState, useEffect } from 'react';
import { FloatingLabelInput } from "./floatingLabelInput";
import { useItemRegistrerMutation } from "../backend/api/sharedCrud";

const MerchantRegistrationForm = ({ formLabel }) => {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    udid: '',
    name: '',
    industry: '',
    companyRegistrationNumber: '',
    website: '',
    email: '',
    fiatBankAccountNumber: '',
    cryptoWalletAddress: '',
    cryptoWalletBlockchainNetwork: '',
    stripeAccountPublicKey: '',
    stripeAccountPrivateKey: '',
    phone: '',
    password: ''
  });

  const industries = [
    'Agriculture',
    'Aerospace',
    'Automotive',
    'Banking/Finance',
    'Biotechnology',
    'Chemical Manufacturing',
    'Construction',
    'Education',
    'Energy/Utilities',
    'Entertainment/Media',
    'Fashion/Apparel',
    'Food and Beverage',
    'Healthcare',
    'Hospitality/Tourism',
    'Information Technology',
    'Insurance',
    'Logistics/Transportation',
    'Manufacturing',
    'Marketing/Advertising',
    'Mining',
    'Non-Profit',
    'Pharmaceuticals',
    'Professional Services',
    'Real Estate',
    'Retail',
    'Telecommunications',
    'Textiles',
    'Tobacco',
    'Wholesale',
    'E-commerce'
  ];

  const [submitNewMerchant, {
    data: merchantRegSuccessResponse,
    isLoading: merchantRegProcessing,
    isSuccess: merchantRegSucceeded,
    isError: merchantRegFailed,
    error: merchantRegError,
  }] = useItemRegistrerMutation();

  useEffect(() => {
    if (merchantRegSucceeded) {
      setStatus('✅ Merchant registered successfully!');
      setLoading(false);
      // Reset form fields after successful submission
      setFormData({
        udid: '',
        name: '',
        industry: '',
        companyRegistrationNumber: '',
        website: '',
        email: '',
        fiatBankAccountNumber: 'dummy_placeholder',
        cryptoWalletAddress: 'dummy_placeholder',
        cryptoWalletBlockchainNetwork: 'Tron_TR20',
        stripeAccountPublicKey: 'dummy_placeholder',
        stripeAccountPrivateKey: 'dummy_placeholder',
        phone: '',
        password: ''
      });
    } else if (merchantRegFailed) {
      setStatus(`❌ Failed to register merchant: ${merchantRegError?.data?.message || 'Please try again.'}`);
      setLoading(false);
    }
  }, [merchantRegSucceeded, merchantRegFailed, merchantRegError]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitToCloudRun = async (e) => {
    e.preventDefault();
    setStatus('');
    setLoading(true);

    // Validate required fields
    if (!formData.udid || !formData.name || !formData.industry || !formData.email || !formData.phone || !formData.password) {
      setStatus('Please fill out all required fields.');
      setLoading(false);
      return;
    }

    const payload = {
      udid: formData.udid,
      name: formData.name,
      industry: formData.industry,
      companyRegistrationNumber: formData.companyRegistrationNumber,
      website: formData.website,
      email: formData.email,
      fiatBankAccountNumber: formData.fiatBankAccountNumber,
      cryptoWalletAddress: formData.cryptoWalletAddress,
      cryptoWalletBlockchainNetwork: formData.cryptoWalletBlockchainNetwork,
      stripeAccountPublicKey: formData.stripeAccountPublicKey,
      stripeAccountPrivateKey: formData.stripeAccountPrivateKey,
      phone: formData.phone,
      password: formData.password
    };

    submitNewMerchant({ entity: 'merchant', data: payload });
  };

  return (
    <div className={`w-full ${formLabel ? 'xl:w-[70%]' : 'xl:max-w-full'} p-6 bg-white rounded-lg shadow-lg`}>
      <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">{formLabel || ""}</h2>
      <div className="flex flex-col lg:flex-row gap-8 w-full">
        <div className={`flex-item w-full ${formLabel ? 'lg:w-[50%]' : ''} space-y-4`}>
          <div>
            <FloatingLabelInput
              label="Unique ID (UDID)"
              name="udid"
              value={formData.udid}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <FloatingLabelInput
              label="Merchant Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">Industry</label>
            <select
              name="industry"
              value={formData.industry}
              onChange={handleInputChange}
              required
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-lime-500 focus:border-lime-500 p-2 pl-1"
            >
              <option value="">---</option>
              {industries.map((industry) => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>
          </div>
          <div>
            <FloatingLabelInput
              label="Company Registration Number"
              name="companyRegistrationNumber"
              value={formData.companyRegistrationNumber}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <FloatingLabelInput
              label="Website"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <FloatingLabelInput
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          
        </div>


        <div className={`flex-item w-full ${formLabel ? 'lg:w-[50%]' : ''} space-y-4`}>
          <div>
            <FloatingLabelInput
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <FloatingLabelInput
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <FloatingLabelInput
              label="Fiat Bank Account Number"
              name="fiatBankAccountNumber"
              value={formData.fiatBankAccountNumber}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <FloatingLabelInput
              label="Crypto Wallet Address"
              name="cryptoWalletAddress"
              value={formData.cryptoWalletAddress}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <FloatingLabelInput
              label="Crypto Wallet Blockchain Network"
              name="cryptoWalletBlockchainNetwork"
              value={formData.cryptoWalletBlockchainNetwork}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <FloatingLabelInput
              label="Stripe Account Public Key"
              name="stripeAccountPublicKey"
              value={formData.stripeAccountPublicKey}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <button
              onClick={handleSubmitToCloudRun}
              type="submit"
              disabled={merchantRegProcessing || loading}
              className={`w-full mt-8 py-2 px-4 rounded-md text-white font-medium ${(merchantRegProcessing || loading)
                ? 'bg-blue-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
                }`}
            >
              {(merchantRegProcessing || loading) ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
      {status && (
        <div className={`mt-4 text-center text-sm font-medium px-4 py-2 rounded-md ${status.startsWith('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {status}
        </div>
      )}
    </div>
  );
};

export default MerchantRegistrationForm;