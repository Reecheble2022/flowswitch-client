import React, { useState, useRef, useEffect } from 'react';
import { FloatingLabelInput } from "./floatingLabelInput"
import { useFileUploaderMutation, useItemRegistrerMutation, useItemsListReaderQuery } from "../backend/api/sharedCrud"
import { useSelector } from 'react-redux';
import { selectList } from '../backend/features/sharedMainState';
import ProfileImageInput from './profilePhotoInput';
import DocumentsInput from './documentsInput';

const MerchantsRegistrationForm = () => {
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState(null);
    const [photoLabel, setPhotoLabel] = useState('Profile Photo');
    const [documentPickerLabel, setDocumentPickerLabel] = useState('Attach document(s)');
    const [uploadedDocuments, setUploadedDocuments] = useState([]);
    const [photoUploadGuid, setPhotoUploadGuid] = useState(undefined);
    const [agentsAppliedFor, setAgentsAppliedFor] = useState([]);
    const [gender, setGender] = useState("");
    const [maritalStatus, setMaritalStatus] = useState("");
    const [allAgents, setAllAgents] = useState([{ guid: "ea324241315ac", agentName: "Database admin" }, { guid: "ea324774322", agentName: "Accounting" }]);
    // New state variables for form inputs
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        physicalAddress: '',
        nationality: '',
        nationalId: '',
        dateOfBirth: '',
        description: ''
    });

    const {
        isLoading: agentsProcessing,
        isSuccess: agentsSucceeded,
        isError: agentsFailed,
        error: agentsError,
    } = useItemsListReaderQuery({ entity: "agent" })

    const cachedAgents = useSelector(st => selectList(st, "agent"))
    const [reRender, setReRender] = useState(false);
    useEffect(() => {
        if (!cachedAgents) {
            setTimeout(() => {
                setReRender(!reRender)
            }, 1000)
        }
    }, [cachedAgents])

    //============= submit to Cloud Run ======================
    //---- profile image ----
    const [uploadNewImage, {
        data: fileUploadSuccessResponse,
        isLoading: fileUploadProcessing,
        isSuccess: fileUploadSucceeded,
        isError: fileUploadFailed,
        error: fileUploadError,
    }] = useFileUploaderMutation()
    const { Data: { url, guid } = {} } = fileUploadSuccessResponse || {}
    useEffect(() => {
        if (fileUploadSucceeded && (guid || url)) {
            setPhotoUploadGuid(guid);
            setStatus("✅ Photo uploaded");
        } else if (fileUploadFailed) {
            console.error("Upload error:", fileUploadError);
            setStatus("❌ Photo upload failed");
        }
    }, [fileUploadSucceeded, fileUploadFailed]);
    //------ documents --------
    const [uploadNewDocument, {
        data: docUploadSuccessResponse,
        isLoading: docUploadProcessing,
        isSuccess: docUploadSucceeded,
        isError: docUploadFailed,
        error: docUploadError,
    }] = useFileUploaderMutation()
    const { Data: { url: docUploadUrl, guid: docUploadGuid } = {} } = docUploadSuccessResponse || {}
    useEffect(() => {
        if (docUploadSucceeded && (docUploadGuid || docUploadUrl)) {
            if (!uploadedDocuments.includes(docUploadGuid)) {
                setUploadedDocuments([...uploadedDocuments, docUploadGuid]);
                setStatus("✅ Document uploaded");
            }
        } else if (docUploadFailed) {
            console.error("Upload error:", docUploadError);
            setStatus("❌ Document upload failed");
        }
    }, [docUploadSucceeded, docUploadFailed]);

    //------ merchant data -----
    const [submitNewMerchant, {
        data: merchantRegSuccessResponse,
        isLoading: merchantRegProcessing,
        isSuccess: merchantRegSucceeded,
        isError: merchantRegFailed,
        error: merchantRegError,
    }] = useItemRegistrerMutation()
    useEffect(() => {
        if (merchantRegSucceeded) {
            setStatus("✅ Merchant registered successfully!");
            setLoading(false);
            // Reset form fields after successful submission
            setFormData({
                firstName: '',
                lastName: '',
                phone: '',
                email: '',
                physicalAddress: '',
                nationality: '',
                nationalId: '',
                dateOfBirth: '',
                description: ''
            });
            setGender('');
            setMaritalStatus('');
            setAgentsAppliedFor([]);
            setPhotoUploadGuid(undefined);
            setUploadedDocuments([]);
            setPreview(null);
            setPhotoLabel('Profile Photo');
            setDocumentPickerLabel('Attach document(s)');
        } else if (merchantRegFailed) {
            setStatus("❌ Failed to register merchant. Please try again.");
            setLoading(false);
        }
    }, [merchantRegSucceeded, merchantRegFailed]);

    const handlePhotoChange = ({ file, formData }) => {
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            setPreview(previewUrl);
            setPhotoLabel("Change Photo");
            const fData = new FormData();
            fData.set('file', file);
            uploadNewImage({
                entity: "fileupload",
                data: fData,
            })
        } else {
            setPreview(null);
            setPhotoLabel("Profile Photo");
        }
    };

    const handleDocumentAttachment = ({ file, formData }) => {
        if (file) {
            setDocumentPickerLabel("Add another document");
            const fData = new FormData();
            fData.set('file', file);
            uploadNewDocument({
                entity: "fileupload",
                data: fData,
            })
        } else {
            setDocumentPickerLabel("Attach document(s)");
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    //============= submit to Cloud Run ======================
    const handleSubmitToCloudRun = async (e) => {
        e.preventDefault();
        setStatus('');
        setLoading(true);

        // Validate required fields
        if (!formData.firstName || !formData.lastName || !gender || !maritalStatus) {
            setStatus('Please fill out all required fields.');
            setLoading(false);
            return;
        }

        const payload = {
            agents: agentsAppliedFor,
            firstName: formData.firstName,
            lastName: formData.lastName,
            gender,
            phone: formData.phone,
            email: formData.email,
            physicalAddress: formData.physicalAddress,
            nationality: formData.nationality,
            nationalId: formData.nationalId,
            maritalStatus,
            dateOfBirth: formData.dateOfBirth,
            description: formData.description,
            photo: photoUploadGuid,
            documents: uploadedDocuments,
        }
        submitNewMerchant({ entity: "merchant", data: payload })
    }
    //============= /end submit to Cloud Run =================

    return (
        <div className="max-w-lg p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800"> Register new Merchant </h2>
            <div className="space-y-4">
                <div>
                    <FloatingLabelInput
                        label="First name"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div>
                    <FloatingLabelInput
                        label="Last name"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Gender</label>
                    <select
                        name="gender"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        required
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-lime-500 focus:border-lime-500 p-2 pl-1"
                    >
                        <option value="">--</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="dateOfBirth" className="block mb-2 text-sm font-medium text-gray-700">
                        Date of Birth
                    </label>
                    <input
                        type="date"
                        name="dateOfBirth"
                        id="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        required
                        className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-lime-500 focus:border-lime-500"
                    />
                </div>
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Marital status</label>
                    <select
                        name="maritalStatus"
                        value={maritalStatus}
                        onChange={(e) => setMaritalStatus(e.target.value)}
                        required
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-lime-500 focus:border-lime-500 p-2 pl-1"
                    >
                        <option value="">--</option>
                        <option value="Single">Single</option>
                        <option value="Dating">Dating</option>
                        <option value="Engaged">Engaged</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Lostspouse">Lost spouse</option>
                    </select>
                </div>
                <div>
                    <FloatingLabelInput
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                    />
                </div>
                <div>
                    <FloatingLabelInput
                        label="Phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                    />
                </div>
                <div>
                    <FloatingLabelInput
                        label="Physical address"
                        name="physicalAddress"
                        value={formData.physicalAddress}
                        onChange={handleInputChange}
                    />
                </div>
                <div>
                    <FloatingLabelInput
                        label="Nationality"
                        name="nationality"
                        value={formData.nationality}
                        onChange={handleInputChange}
                    />
                </div>
                <div>
                    <FloatingLabelInput
                        label="National ID"
                        name="nationalId"
                        value={formData.nationalId}
                        onChange={handleInputChange}
                    />
                </div>
                <div>
                    <FloatingLabelInput
                        label="Description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        multiline={true}
                    />
                </div>

                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700"> Agent(s) preferred </label>
                    <div className="space-y-2">
                        {(cachedAgents || allAgents).map((agent) => (
                            <label key={agent.guid} className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    value={agent.guid}
                                    checked={agentsAppliedFor.includes(agent.guid)}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setAgentsAppliedFor((prev) =>
                                            prev.includes(value)
                                                ? prev.filter((id) => id !== value)
                                                : [...prev, value]
                                        );
                                    }}
                                    className="rounded text-lime-600 focus:ring-lime-500"
                                />
                                <span>{agent.agentName || agent.guid}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <hr />

                {/* Preview Image */}
                {preview && (
                    <div>
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-full max-h-48 object-cover rounded-xl border border-lime-400"
                        />
                    </div>
                )}

                <div className="container mx-auto">
                    <ProfileImageInput
                        uploadImageFn={({ file, formData }) => handlePhotoChange({ file, formData })}
                        uploadButtonLabel={photoLabel}
                        maxFiles={1}
                        maxFileSize={10}
                        acceptedTypes={['image/*']}
                        uploadImmediately={true}
                    />
                </div>

                <div className="mx-auto">
                    <DocumentsInput
                        uploadDocumentFn={({ file, formData }) => handleDocumentAttachment({ file, formData })}
                        uploadButtonLabel={documentPickerLabel}
                        maxFiles={4}
                        maxFileSize={8}
                        acceptedDocTypes={['image/*', 'application/pdf', '.doc', '.docx', '.txt']}
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

            {status && (
                <div className={`mt-4 text-center text-sm font-medium px-4 py-2 rounded-md ${status.startsWith("✅") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {status}
                </div>
            )}
        </div>
    );
};

export default MerchantsRegistrationForm;